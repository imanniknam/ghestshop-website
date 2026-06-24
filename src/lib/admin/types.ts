/**
 * GhestShop — Admin (Overlord) View-Models & Mappers
 * ------------------------------------------------------------------
 * Client-safe projections of the back-office entities. Every shape here maps
 * directly onto the Prisma `User`, `LoanApplication`, `LoanDocument` and
 * `PaymentSlip` models — money is normalized from BigInt to number and dates
 * from Date|string to Date so the data can cross the Server→Client boundary.
 */

// Mirrors prisma `enum LoanStatus`.
export type LoanStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// Mirrors prisma `enum DocumentType`.
export type DocumentType =
  | 'NATIONAL_CARD_FRONT'
  | 'NATIONAL_CARD_BACK'
  | 'CHEQUE'
  | 'SAFTEH'
  | 'PAYSLIP'
  | 'BANK_STATEMENT'
  | 'OTHER';

// Mirrors prisma `enum SlipStatus`.
export type SlipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  NATIONAL_CARD_FRONT: 'کارت ملی (رو)',
  NATIONAL_CARD_BACK: 'کارت ملی (پشت)',
  CHEQUE: 'چک صیادی',
  SAFTEH: 'سفته',
  PAYSLIP: 'فیش حقوقی',
  BANK_STATEMENT: 'صورت‌حساب بانکی',
  OTHER: 'سایر',
};

// ---------------------------------------------------------------------------
//  Analytics
// ---------------------------------------------------------------------------

export interface AdminMetrics {
  /** Sum of all active financed principal, Toman. */
  readonly totalFinanced: number;
  /** Overdue plans ÷ active plans, as a fraction 0..1. */
  readonly overdueRatio: number;
  /** Number of payment slips awaiting audit. */
  readonly pendingSlips: number;
  /** Number of loan applications awaiting review. */
  readonly pendingApplications: number;
}

export interface MonthlyFlowDatum {
  /** Jalali month label, e.g. "فروردین". */
  readonly month: string;
  /** Confirmed inflow for the month, Toman. */
  readonly inflow: number;
  /** Value of delayed/overdue installments for the month, Toman. */
  readonly delayed: number;
}

// ---------------------------------------------------------------------------
//  Document review
// ---------------------------------------------------------------------------

export interface AdminDocument {
  readonly id: string;
  readonly type: DocumentType;
  readonly url: string;
  readonly fileName: string;
}

export interface AdminApplicant {
  readonly id: string;
  readonly fullName: string;
  readonly nationalId: string | null;
  readonly phone: string;
  /** Internal credit score 0..1000 (from User.creditScore). */
  readonly creditScore: number | null;
}

export interface AdminApplication {
  readonly id: string;
  readonly applicant: AdminApplicant;
  readonly productTitle: string;
  readonly requestedPrincipal: number; // Toman
  readonly downPayment: number; // Toman
  readonly months: number;
  readonly status: LoanStatus;
  readonly submittedAt: Date | null;
  readonly documents: AdminDocument[];
}

// ---------------------------------------------------------------------------
//  Slip audit
// ---------------------------------------------------------------------------

export interface AdminSlip {
  readonly id: string;
  readonly applicantName: string;
  readonly monthIndex: number;
  readonly monthId: string; // → InstallmentMonth.id (deep-link target)
  readonly planId: string; // → InstallmentPlan.id
  readonly trackingNumber: string;
  readonly amount: number; // Toman
  readonly paidAt: Date;
  readonly status: SlipStatus;
  readonly url: string; // screenshot
}

// ---------------------------------------------------------------------------
//  Raw row shapes + mappers
// ---------------------------------------------------------------------------

type Money = bigint | number;
const num = (v: Money): number => (typeof v === 'bigint' ? Number(v) : v);
const date = (v: Date | string): Date => (v instanceof Date ? v : new Date(v));
const optDate = (v: Date | string | null): Date | null => (v == null ? null : date(v));

export interface RawApplication {
  id: string;
  status: LoanStatus;
  requestedPrincipal: Money;
  downPayment: Money;
  requestedMonths: number;
  submittedAt: Date | string | null;
  product: { title: string };
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    nationalId: string | null;
    phone: string;
    creditScore: number | null;
  };
  documents: { id: string; type: DocumentType; url: string; fileName: string }[];
}

export function mapApplication(raw: RawApplication): AdminApplication {
  const fullName = [raw.user.firstName, raw.user.lastName].filter(Boolean).join(' ').trim();
  return {
    id: raw.id,
    applicant: {
      id: raw.user.id,
      fullName: fullName || 'کاربر بدون نام',
      nationalId: raw.user.nationalId,
      phone: raw.user.phone,
      creditScore: raw.user.creditScore,
    },
    productTitle: raw.product.title,
    requestedPrincipal: num(raw.requestedPrincipal),
    downPayment: num(raw.downPayment),
    months: raw.requestedMonths,
    status: raw.status,
    submittedAt: optDate(raw.submittedAt),
    documents: raw.documents.map((d) => ({ id: d.id, type: d.type, url: d.url, fileName: d.fileName })),
  };
}

export interface RawSlipRow {
  id: string;
  trackingNumber: string;
  paidAmount: Money;
  paidAt: Date | string;
  status: SlipStatus;
  url: string;
  installmentMonth: {
    id: string;
    monthIndex: number;
    plan: { id: string };
  };
  user: { firstName: string | null; lastName: string | null };
}

export function mapAdminSlip(raw: RawSlipRow): AdminSlip {
  const name = [raw.user.firstName, raw.user.lastName].filter(Boolean).join(' ').trim();
  return {
    id: raw.id,
    applicantName: name || 'کاربر بدون نام',
    monthIndex: raw.installmentMonth.monthIndex,
    monthId: raw.installmentMonth.id,
    planId: raw.installmentMonth.plan.id,
    trackingNumber: raw.trackingNumber,
    amount: num(raw.paidAmount),
    paidAt: date(raw.paidAt),
    status: raw.status,
    url: raw.url,
  };
}

// ---------------------------------------------------------------------------
//  Risk scoring — derives a 0..100 risk band from the internal credit score.
//  Lower credit score ⇒ higher risk. Pure + deterministic for UI sorting.
// ---------------------------------------------------------------------------

export type RiskBand = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskAssessment {
  readonly score: number; // 0..100, higher = riskier
  readonly band: RiskBand;
  readonly label: string;
}

export function assessRisk(creditScore: number | null): RiskAssessment {
  // Map credit 0..1000 → risk 100..0. Unknown score is treated as medium-high.
  const normalized = creditScore == null ? 550 : Math.max(0, Math.min(1000, creditScore));
  const score = Math.round(100 - (normalized / 1000) * 100);
  if (score <= 33) return { score, band: 'LOW', label: 'ریسک پایین' };
  if (score <= 66) return { score, band: 'MEDIUM', label: 'ریسک متوسط' };
  return { score, band: 'HIGH', label: 'ریسک بالا' };
}
