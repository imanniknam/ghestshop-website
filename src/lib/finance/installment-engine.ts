/**
 * GhestShop — Installment Mathematics Engine
 * ------------------------------------------------------------------
 * Pure, dependency-free, fully typed financial functions. Shared by the
 * client calculator widget AND the server-side plan generator so the number
 * the customer sees is guaranteed identical to the number that is committed
 * to the ledger.
 *
 * Amortization (annuity) formula:
 *
 *        P · r · (1 + r)^n
 *   M = ───────────────────
 *         (1 + r)^n − 1
 *
 *   P = financed principal (Toman)
 *   r = monthly interest rate (annualRate / 12)
 *   n = number of months
 *
 * Edge case: when r === 0 the formula above is indeterminate (0/0); the
 * monthly payment collapses to the simple split P / n.
 */

export interface InstallmentInput {
  /** Absolute cash price of the goods, in Toman (integer). */
  readonly cashPrice: number;
  /** Down payment (پیش‌پرداخت) in Toman (integer). */
  readonly downPayment: number;
  /** Plan duration in months. Typically 6 | 12 | 18 | 24. */
  readonly months: number;
  /** Nominal ANNUAL interest rate in basis points (1800 = 18%). */
  readonly annualRateBps: number;
}

export interface InstallmentResult {
  /** Financed principal P = cashPrice − downPayment. */
  readonly principal: number;
  /** Monthly payment M, rounded to the nearest Toman. */
  readonly monthlyPayment: number;
  /** Total the customer pays back over the term = M · n. */
  readonly totalPayable: number;
  /** Lender profit margin = totalPayable − principal. */
  readonly totalProfit: number;
  /** Effective monthly rate r used in the calculation. */
  readonly monthlyRate: number;
  /**
   * Minimum monthly income the underwriting policy requires for this plan.
   * Policy: installment must not exceed 40% of declared monthly income
   * (debt-to-income ceiling), so minIncome = M / 0.40.
   */
  readonly minRequiredIncome: number;
}

/** Underwriting debt-to-income ceiling: an installment may consume at most 40% of income. */
export const DTI_CEILING = 0.4;

/** The plan durations GhestShop offers, in months. */
export const ALLOWED_MONTHS = [6, 12, 18, 24] as const;
export type AllowedMonth = (typeof ALLOWED_MONTHS)[number];

/**
 * Compute the full installment matrix for a single quote.
 * Defensive: clamps negatives to zero and never divides by zero.
 */
export function calculateInstallment(input: InstallmentInput): InstallmentResult {
  const principal = Math.max(0, Math.round(input.cashPrice - input.downPayment));
  const months = Math.max(1, Math.floor(input.months));
  const monthlyRate = input.annualRateBps / 10_000 / 12;

  let monthlyPayment: number;

  if (principal === 0) {
    monthlyPayment = 0;
  } else if (monthlyRate <= 0) {
    // Interest-free plan → straight division.
    monthlyPayment = principal / months;
  } else {
    const growth = Math.pow(1 + monthlyRate, months);
    monthlyPayment = (principal * monthlyRate * growth) / (growth - 1);
  }

  const roundedMonthly = Math.round(monthlyPayment);
  const totalPayable = roundedMonthly * months;
  const totalProfit = Math.max(0, totalPayable - principal);
  const minRequiredIncome = Math.round(roundedMonthly / DTI_CEILING);

  return {
    principal,
    monthlyPayment: roundedMonthly,
    totalPayable,
    totalProfit,
    monthlyRate,
    minRequiredIncome,
  };
}

export interface ScheduleRow {
  readonly monthIndex: number;
  readonly amount: number;
  readonly remainingAfter: number;
}

/**
 * Build the month-by-month amortization schedule. The final installment
 * absorbs any rounding drift so the sum of rows equals totalPayable exactly.
 */
export function buildSchedule(input: InstallmentInput): ScheduleRow[] {
  const { monthlyPayment, totalPayable } = calculateInstallment(input);
  const months = Math.max(1, Math.floor(input.months));
  const rows: ScheduleRow[] = [];
  let remaining = totalPayable;

  for (let i = 1; i <= months; i += 1) {
    const isLast = i === months;
    const amount = isLast ? remaining : monthlyPayment;
    remaining = Math.max(0, remaining - amount);
    rows.push({ monthIndex: i, amount, remainingAfter: remaining });
  }

  return rows;
}
