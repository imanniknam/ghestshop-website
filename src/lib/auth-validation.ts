/**
 * GhestShop — Auth field validation (pure, Persian messages).
 */

/** Convert Persian/Arabic digits to ASCII so validation works on any input. */
export function toAsciiDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/** Iranian mobile: 09xxxxxxxxx (11 digits). */
export function validatePhone(value: string): string | null {
  const v = toAsciiDigits(value).replace(/\s/g, '');
  if (!/^09\d{9}$/.test(v)) return 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.';
  return null;
}

/** Iranian national code (کد ملی) with checksum. */
export function validateNationalId(value: string): string | null {
  const v = toAsciiDigits(value).replace(/\s/g, '');
  if (!/^\d{10}$/.test(v)) return 'کد ملی باید ۱۰ رقم باشد.';
  if (/^(\d)\1{9}$/.test(v)) return 'کد ملی نامعتبر است.';
  const check = Number(v[9]);
  const sum = v
    .slice(0, 9)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0);
  const remainder = sum % 11;
  const valid = remainder < 2 ? check === remainder : check === 11 - remainder;
  return valid ? null : 'کد ملی وارد شده معتبر نیست.';
}

export function validatePassword(value: string): string | null {
  if (value.length < 6) return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  return null;
}

/** 6-digit OTP. */
export function validateCode(value: string): string | null {
  const v = toAsciiDigits(value).replace(/\s/g, '');
  if (!/^\d{6}$/.test(v)) return 'کد تأیید باید ۶ رقم باشد.';
  return null;
}
