'use server';

/**
 * GhestShop — Loan Server Actions
 * ------------------------------------------------------------------
 *   • submitLoanApplicationAction — CUSTOMER multi-step KYC submission.
 *   • auditLoanApplicationAction  — ADMIN approve/reject; mints the official
 *                                   InstallmentPlan + month schedule on approval.
 *
 * Security: RBAC via requireRole, Zod payload validation, atomic $transaction,
 * BigInt-safe responses, Persian error messages, revalidatePath on every
 * surface the mutation touches.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ActionResult, fail, handleActionError, jsonSafe, ok } from '@/lib/action-result';
import { ALLOWED_MONTHS, buildSchedule, calculateInstallment } from '@/lib/finance/installment-engine';
import { addMonths, formatJalali } from '@/lib/format';
import { basicInfoSchema } from '@/lib/validations/loan';

// Default platform annual rate (basis points) when a product has no markup set.
const DEFAULT_ANNUAL_RATE_BPS = 1800;

// Surfaces that must refresh after a loan mutation.
const PATHS = {
  apply: '/dashboard/apply',
  ledger: '/dashboard/ledger',
  adminDocs: '/overlord',
} as const;

const DOCUMENT_TYPE_VALUES = [
  'NATIONAL_CARD_FRONT',
  'NATIONAL_CARD_BACK',
  'CHEQUE',
  'SAFTEH',
  'PAYSLIP',
  'BANK_STATEMENT',
  'OTHER',
] as const;

// ---------------------------------------------------------------------------
//  submitLoanApplicationAction
// ---------------------------------------------------------------------------

const submitSchema = z.object({
  productId: z.string().min(1, 'محصول نامعتبر است.'),
  basicInfo: basicInfoSchema,
  downPayment: z.number().int().nonnegative('مبلغ پیش‌پرداخت نامعتبر است.'),
  months: z
    .number()
    .int()
    .refine((m) => (ALLOWED_MONTHS as readonly number[]).includes(m), 'مدت بازپرداخت نامعتبر است.'),
  documents: z
    .array(
      z.object({
        type: z.enum(DOCUMENT_TYPE_VALUES),
        url: z.string().url('آدرس فایل نامعتبر است.'),
        fileName: z.string().min(1),
        fileSize: z.number().int().positive(),
        mimeType: z.string().min(1),
      }),
    )
    .min(1, 'حداقل یک مدرک باید بارگذاری شود.'),
});

export type SubmitLoanInput = z.infer<typeof submitSchema>;

export async function submitLoanApplicationAction(
  rawInput: SubmitLoanInput,
): Promise<ActionResult<{ applicationId: string }>> {
  try {
    const user = await requireRole(['CUSTOMER']);

    const parsed = submitSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return fail('اطلاعات ارسالی نامعتبر است.', fieldErrors);
    }
    const input = parsed.data;

    // Required documents gate: an identity doc + a financial guarantee.
    const hasIdentity = input.documents.some(
      (d) => d.type === 'NATIONAL_CARD_FRONT' || d.type === 'NATIONAL_CARD_BACK',
    );
    const hasGuarantee = input.documents.some((d) => d.type === 'CHEQUE' || d.type === 'SAFTEH');
    if (!hasIdentity || !hasGuarantee) {
      return fail('بارگذاری کارت ملی و چک صیادی (یا سفته) الزامی است.');
    }

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, cashPrice: true, installmentMarkupBps: true, isInstallmentEnabled: true, isActive: true },
    });
    if (!product || !product.isActive) return fail('محصول مورد نظر یافت نشد.');
    if (!product.isInstallmentEnabled) return fail('خرید اقساطی برای این محصول فعال نیست.');

    const downPayment = BigInt(input.downPayment);
    if (downPayment >= product.cashPrice) {
      return fail('مبلغ پیش‌پرداخت نمی‌تواند بیشتر یا برابر قیمت نقدی باشد.');
    }
    const requestedPrincipal = product.cashPrice - downPayment;
    const annualRateBps =
      product.installmentMarkupBps > 0 ? product.installmentMarkupBps : DEFAULT_ANNUAL_RATE_BPS;

    // Atomic: snapshot KYC fields onto the user + create the application and its
    // document rows together. Either the whole submission lands, or none of it.
    const application = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          nationalId: input.basicInfo.nationalId,
          monthlyIncome: BigInt(input.basicInfo.monthlyIncome),
          verificationStatus: 'PENDING',
        },
      });

      return tx.loanApplication.create({
        data: {
          userId: user.id,
          productId: product.id,
          currentStep: 'FINAL_REVIEW',
          status: 'PENDING',
          requestedPrincipal,
          downPayment,
          requestedMonths: input.months,
          annualRateBps,
          submittedAt: new Date(),
          documents: {
            create: input.documents.map((d) => ({
              type: d.type,
              url: d.url,
              fileName: d.fileName,
              fileSize: d.fileSize,
              mimeType: d.mimeType,
              status: 'PENDING',
            })),
          },
        },
        select: { id: true },
      });
    });

    revalidatePath(PATHS.apply);
    revalidatePath(PATHS.adminDocs);

    return ok('درخواست اعتبارسنجی شما با موفقیت ثبت شد.', jsonSafe({ applicationId: application.id }));
  } catch (error) {
    return handleActionError(error);
  }
}

// ---------------------------------------------------------------------------
//  auditLoanApplicationAction
// ---------------------------------------------------------------------------

const auditLoanSchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().trim().optional(),
});

export type AuditLoanInput = z.infer<typeof auditLoanSchema>;

export async function auditLoanApplicationAction(
  rawInput: AuditLoanInput,
): Promise<ActionResult<{ applicationId: string; planId: string | null }>> {
  try {
    const reviewer = await requireRole(['ADMIN']);

    const parsed = auditLoanSchema.safeParse(rawInput);
    if (!parsed.success) return fail('پارامترهای بررسی نامعتبر است.');
    const { applicationId, decision, remarks } = parsed.data;

    const application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
        userId: true,
        requestedPrincipal: true,
        requestedMonths: true,
        annualRateBps: true,
        installmentPlan: { select: { id: true } },
      },
    });
    if (!application) return fail('درخواست مورد نظر یافت نشد.');
    if (application.status !== 'PENDING') {
      return fail('این درخواست قبلاً بررسی شده است.');
    }

    // ---- Rejection path -------------------------------------------------
    if (decision === 'REJECTED') {
      if (!remarks || remarks.length < 3) {
        return fail('برای رد درخواست، ثبت علت رد مدارک الزامی است.', {
          remarks: 'علت رد مدارک را وارد کنید (حداقل ۳ کاراکتر).',
        });
      }
      await prisma.$transaction([
        prisma.loanApplication.update({
          where: { id: application.id },
          data: { status: 'REJECTED', rejectionReason: remarks, reviewedAt: new Date() },
        }),
        prisma.loanDocument.updateMany({
          where: { applicationId: application.id },
          data: { status: 'REJECTED', reviewedById: reviewer.id, remarks },
        }),
      ]);

      revalidatePath(PATHS.adminDocs);
      revalidatePath(PATHS.apply);
      return ok('درخواست رد شد و به کاربر اطلاع‌رسانی می‌شود.', jsonSafe({ applicationId: application.id, planId: null }));
    }

    // ---- Approval path: mint the official plan --------------------------
    if (application.installmentPlan) {
      return fail('برای این درخواست قبلاً طرح اقساطی ایجاد شده است.');
    }

    const principal = Number(application.requestedPrincipal);
    const months = application.requestedMonths;
    const annualRateBps = application.annualRateBps;

    const quote = calculateInstallment({ cashPrice: principal, downPayment: 0, months, annualRateBps });
    const schedule = buildSchedule({ cashPrice: principal, downPayment: 0, months, annualRateBps });
    const startDate = new Date();

    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.installmentPlan.create({
        data: {
          applicationId: application.id,
          userId: application.userId,
          financedAmount: BigInt(quote.principal),
          annualRateBps,
          months,
          monthlyPayment: BigInt(quote.monthlyPayment),
          totalPayable: BigInt(quote.totalPayable),
          totalProfit: BigInt(quote.totalProfit),
          remainingBalance: BigInt(quote.totalPayable),
          paidMonthsCount: 0,
          status: 'ACTIVE',
          startDate,
          months_schedule: {
            create: schedule.map((row) => {
              const dueDate = addMonths(startDate, row.monthIndex);
              return {
                monthIndex: row.monthIndex,
                dueDate,
                jalaliDue: formatJalali(dueDate, { numeric: true }),
                amount: BigInt(row.amount),
                // The nearest installment is immediately payable; the rest queue.
                status: row.monthIndex === 1 ? ('UNPAID' as const) : ('UPCOMING' as const),
              };
            }),
          },
        },
        select: { id: true },
      });

      await tx.loanApplication.update({
        where: { id: application.id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });
      await tx.loanDocument.updateMany({
        where: { applicationId: application.id },
        data: { status: 'APPROVED', reviewedById: reviewer.id },
      });
      await tx.user.update({
        where: { id: application.userId },
        data: { verificationStatus: 'VERIFIED' },
      });

      return created;
    });

    revalidatePath(PATHS.adminDocs);
    revalidatePath(PATHS.apply);
    revalidatePath(PATHS.ledger);

    return ok('درخواست تأیید و طرح اقساطی ایجاد شد.', jsonSafe({ applicationId: application.id, planId: plan.id }));
  } catch (error) {
    return handleActionError(error);
  }
}
