/**
 * GhestShop — Localization & Formatting Helpers (Persian / RTL)
 * ------------------------------------------------------------------
 * Toman currency formatting with Persian comma grouping and Persian digits,
 * plus a lightweight Jalali (Shamsi) date converter for payment matrices.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/** Convert ASCII digits in a string to Persian digits. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/**
 * Format a Toman amount with thousands separators.
 * @example formatToman(12500000) -> "۱۲٬۵۰۰٬۰۰۰ تومان"
 */
export function formatToman(amount: number, opts?: { withSuffix?: boolean; persian?: boolean }): string {
  const { withSuffix = true, persian = true } = opts ?? {};
  const grouped = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '٬'); // ٬ Arabic thousands separator
  const digits = persian ? toPersianDigits(grouped) : grouped;
  return withSuffix ? `${digits} تومان` : digits;
}

/** Compact Toman for tight UI (e.g. "۱۲٫۵ میلیون"). */
export function formatTomanCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${toPersianDigits((amount / 1_000_000_000).toFixed(1))} میلیارد تومان`;
  if (amount >= 1_000_000) return `${toPersianDigits((amount / 1_000_000).toFixed(1))} میلیون تومان`;
  if (amount >= 1_000) return `${toPersianDigits((amount / 1_000).toFixed(0))} هزار تومان`;
  return formatToman(amount);
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
] as const;

/** Gregorian → Jalali conversion (Khayyam algorithm). Returns 1-based month. */
export function toJalali(date: Date): { jy: number; jm: number; jd: number } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gDaysInMonth.slice(0, gm - 1).reduce((a, b) => a + b, 0);

  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  void jDaysInMonth;

  return { jy, jm, jd };
}

/** Render a Date as a Persian Jalali string, e.g. "۱۵ تیر ۱۴۰۵". */
export function formatJalali(date: Date, opts?: { numeric?: boolean }): string {
  const { jy, jm, jd } = toJalali(date);
  if (opts?.numeric) {
    const mm = String(jm).padStart(2, '0');
    const dd = String(jd).padStart(2, '0');
    return toPersianDigits(`${jy}/${mm}/${dd}`);
  }
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

/** Add `n` months to a date (used to build the payment timeline). */
export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}
