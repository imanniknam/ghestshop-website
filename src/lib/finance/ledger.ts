/**
 * GhestShop — Ledger View-Models & Mappers
 * ------------------------------------------------------------------
 * Client-safe projections of the `InstallmentMonth` / `PaymentSlip` /
 * `InstallmentPlan` Prisma models. Prisma returns `BigInt` for money and
 * `Date`/enum objects that are not directly serializable to a Client
 * Component — these mappers normalize a row (as returned by Prisma) into a
 * plain, strongly-typed shape the UI consumes. This is the single source of
 * truth for the data contract between the database and the ledger UI.
 */

// Mirrors prisma `enum InstallmentStatus`.
export type InstallmentStatus =
  | 'UPCOMING'
  | 'UNPAID'
  | 'PENDING_REVIEW'
  | 'PAID'
  | 'OVERDUE';

// Mirrors prisma `enum SlipStatus`.
export type SlipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LedgerSlip {
  readonly id: string;
  readonly trackingNumber: string;
  readonly paidAmount: number; // Toman
  readonly paidAt: Date;
  readonly status: SlipStatus;
  readonly reviewedAt: Date | null;
  readonly accountantRemarks: string | null;
}

export interface LedgerMonth {
  readonly id: string;
  readonly monthIndex: number;
  readonly dueDate: Date;
  readonly amount: number; // Toman
  readonly status: InstallmentStatus;
  readonly paidAt: Date | null;
  readonly slip: LedgerSlip | null;
}

export interface LedgerPlan {
  readonly id: string;
  readonly monthlyPayment: number;
  readonly totalPayable: number;
  readonly remainingBalance: number;
  readonly paidMonthsCount: number;
  readonly months: LedgerMonth[];
}

// ---------------------------------------------------------------------------
//  Raw row shapes (the subset of Prisma fields the mappers need). Accepts
//  bigint | number so the mappers work with both Prisma client output and
//  already-serialized API payloads.
// ---------------------------------------------------------------------------

type Money = bigint | number;

export interface RawSlip {
  id: string;
  trackingNumber: string;
  paidAmount: Money;
  paidAt: Date | string;
  status: SlipStatus;
  reviewedAt: Date | string | null;
  accountantRemarks: string | null;
}

export interface RawMonth {
  id: string;
  monthIndex: number;
  dueDate: Date | string;
  amount: Money;
  status: InstallmentStatus;
  paidAt: Date | string | null;
  paymentSlip?: RawSlip | null;
}

const toNumber = (value: Money): number =>
  typeof value === 'bigint' ? Number(value) : value;

const toDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);

const toNullableDate = (value: Date | string | null): Date | null =>
  value == null ? null : toDate(value);

export function mapSlip(raw: RawSlip): LedgerSlip {
  return {
    id: raw.id,
    trackingNumber: raw.trackingNumber,
    paidAmount: toNumber(raw.paidAmount),
    paidAt: toDate(raw.paidAt),
    status: raw.status,
    reviewedAt: toNullableDate(raw.reviewedAt),
    accountantRemarks: raw.accountantRemarks,
  };
}

export function mapMonth(raw: RawMonth): LedgerMonth {
  return {
    id: raw.id,
    monthIndex: raw.monthIndex,
    dueDate: toDate(raw.dueDate),
    amount: toNumber(raw.amount),
    status: raw.status,
    paidAt: toNullableDate(raw.paidAt),
    slip: raw.paymentSlip ? mapSlip(raw.paymentSlip) : null,
  };
}

/** Whole days a month is overdue (0 if not past due). Time-zone agnostic. */
export function daysOverdue(dueDate: Date, now: Date = new Date()): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diff = now.getTime() - dueDate.getTime();
  return diff <= 0 ? 0 : Math.floor(diff / MS_PER_DAY);
}

/** A month the customer can act on (upload a slip for). */
export function isActionable(status: InstallmentStatus): boolean {
  return status === 'UNPAID' || status === 'OVERDUE';
}
