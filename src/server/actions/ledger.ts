'use server';

/**
 * GhestShop — Ledger / Payment-Slip Server Actions
 * ------------------------------------------------------------------
 *   • uploadPaymentSlipAction — CUSTOMER uploads a slip for an UNPAID/OVERDUE
 *                               month; flips the month to PENDING_REVIEW.
 *   • auditPaymentSlipAction  — ACCOUNTANT/ADMIN approve/reject; on approval
 *                               settles the month and reduces the plan's
 *                               remaining balance.
 *
 * Security: RBAC + ownership checks, Zod validation, atomic $transaction,
 * BigInt-safe responses, Persian messages, revalidatePath on user + admin
 * surfaces.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ActionResult, fail, handleActionError, jsonSafe, ok } from '@/lib/action-result';

const PATHS = {
  ledger: '/dashboard/ledger',
  adminSlips: '/overlord',
} as const;

// ---------------------------------------------------------------------------
//  uploadPaymentSlipAction
// ---------------------------------------------------------------------------

const uploadSlipSchema = z.object({
  monthId: z.string().min(1),
  planId: z.string().min(1),
  trackingNumber: z
    .string()
    .trim()
    .regex(/^\d{6,18}$/, 'شماره پیگیری باید بین ۶ تا ۱۸ رقم باشد.'),
  imageUrl: z.string().url('آدرس تصویر رسید نامعتبر است.'),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

export type UploadPaymentSlipInput = z.infer<typeof uploadSlipSchema>;

export async function uploadPaymentSlipAction(
  rawInput: UploadPaymentSlipInput,
): Promise<ActionResult<{ slipId: string; monthId: string }>> {
  try {
    const user = await requireRole(['CUSTOMER']);

    const parsed = uploadSlipSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return fail('اطلاعات رسید نامعتبر است.', fieldErrors);
    }
    const input = parsed.data;

    const month = await prisma.installmentMonth.findUnique({
      where: { id: input.monthId },
      select: {
        id: true,
        planId: true,
        amount: true,
        status: true,
        paymentSlip: { select: { id: true } },
        plan: { select: { userId: true } },
      },
    });

    if (!month) return fail('قسط مورد نظر یافت نشد.');
    if (month.planId !== input.planId) return fail('قسط با طرح اقساطی مطابقت ندارد.');
    if (month.plan.userId !== user.id) return fail('شما به این قسط دسترسی ندارید.');
    if (month.paymentSlip) return fail('برای این قسط قبلاً رسیدی ثبت شده است.');
    if (month.status !== 'UNPAID' && month.status !== 'OVERDUE') {
      return fail('برای این قسط امکان ثبت رسید جدید وجود ندارد.');
    }

    // Atomic: create the slip and move the month into review together.
    const slip = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentSlip.create({
        data: {
          installmentMonthId: month.id,
          userId: user.id,
          url: input.imageUrl,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          trackingNumber: input.trackingNumber,
          paidAmount: month.amount,
          paidAt: new Date(),
          status: 'PENDING',
        },
        select: { id: true },
      });

      await tx.installmentMonth.update({
        where: { id: month.id },
        data: { status: 'PENDING_REVIEW' },
      });

      return created;
    });

    revalidatePath(PATHS.ledger);
    revalidatePath(PATHS.adminSlips);

    return ok('رسید شما ثبت شد و در انتظار بررسی حسابداری است.', jsonSafe({ slipId: slip.id, monthId: month.id }));
  } catch (error) {
    return handleActionError(error);
  }
}

// ---------------------------------------------------------------------------
//  auditPaymentSlipAction
// ---------------------------------------------------------------------------

const auditSlipSchema = z.object({
  slipId: z.string().min(1),
  decision: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().trim().optional(),
});

export type AuditPaymentSlipInput = z.infer<typeof auditSlipSchema>;

export async function auditPaymentSlipAction(
  rawInput: AuditPaymentSlipInput,
): Promise<ActionResult<{ slipId: string; planStatus: 'ACTIVE' | 'COMPLETED' | null }>> {
  try {
    const reviewer = await requireRole(['ACCOUNTANT', 'ADMIN']);

    const parsed = auditSlipSchema.safeParse(rawInput);
    if (!parsed.success) return fail('پارامترهای بررسی رسید نامعتبر است.');
    const { slipId, decision, remarks } = parsed.data;

    const slip = await prisma.paymentSlip.findUnique({
      where: { id: slipId },
      select: {
        id: true,
        status: true,
        paidAmount: true,
        installmentMonth: {
          select: {
            id: true,
            dueDate: true,
            plan: {
              select: { id: true, remainingBalance: true, paidMonthsCount: true, months: true },
            },
          },
        },
      },
    });

    if (!slip) return fail('رسید مورد نظر یافت نشد.');
    if (slip.status !== 'PENDING') return fail('این رسید قبلاً بررسی شده است.');

    const month = slip.installmentMonth;
    const plan = month.plan;

    // ---- Rejection path: revert the month to its real owed state -------
    if (decision === 'REJECTED') {
      const revertedStatus = month.dueDate.getTime() < Date.now() ? 'OVERDUE' : 'UNPAID';
      await prisma.$transaction([
        prisma.paymentSlip.update({
          where: { id: slip.id },
          data: {
            status: 'REJECTED',
            reviewedById: reviewer.id,
            reviewedAt: new Date(),
            accountantRemarks: remarks ?? null,
          },
        }),
        prisma.installmentMonth.update({
          where: { id: month.id },
          data: { status: revertedStatus, paidAt: null },
        }),
      ]);

      revalidatePath(PATHS.ledger);
      revalidatePath(PATHS.adminSlips);
      return ok('رسید رد شد و قسط مجدداً در وضعیت پرداخت‌نشده قرار گرفت.', jsonSafe({ slipId: slip.id, planStatus: null }));
    }

    // ---- Approval path: settle month + reduce remaining balance --------
    const newRemaining = plan.remainingBalance - slip.paidAmount;
    const clampedRemaining = newRemaining > 0n ? newRemaining : 0n;
    const newPaidCount = plan.paidMonthsCount + 1;
    const planStatus: 'ACTIVE' | 'COMPLETED' =
      clampedRemaining === 0n || newPaidCount >= plan.months ? 'COMPLETED' : 'ACTIVE';

    await prisma.$transaction([
      prisma.paymentSlip.update({
        where: { id: slip.id },
        data: {
          status: 'APPROVED',
          reviewedById: reviewer.id,
          reviewedAt: new Date(),
          accountantRemarks: remarks ?? null,
        },
      }),
      prisma.installmentMonth.update({
        where: { id: month.id },
        data: { status: 'PAID', paidAt: new Date() },
      }),
      prisma.installmentPlan.update({
        where: { id: plan.id },
        data: {
          remainingBalance: clampedRemaining,
          paidMonthsCount: newPaidCount,
          status: planStatus,
        },
      }),
    ]);

    revalidatePath(PATHS.ledger);
    revalidatePath(PATHS.adminSlips);

    const message =
      planStatus === 'COMPLETED'
        ? 'رسید تأیید شد و طرح اقساطی به‌طور کامل تسویه گردید.'
        : 'رسید تأیید شد و از مانده بدهی کسر گردید.';
    return ok(message, jsonSafe({ slipId: slip.id, planStatus }));
  } catch (error) {
    return handleActionError(error);
  }
}
