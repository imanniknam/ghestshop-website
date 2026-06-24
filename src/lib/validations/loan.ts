/**
 * GhestShop — Loan / Credit-Validation Schemas (Zod)
 * ------------------------------------------------------------------
 * Shared by the client wizard AND the Server Action so the data committed to
 * Prisma is validated with the exact same rules the user saw at the field level.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
//  Iranian National ID (کد ملی) — real checksum, not a length regex.
//  Algorithm: 10 digits; the 10th is a control digit derived from a weighted
//  sum of the first 9 (weights 10..2).
// ---------------------------------------------------------------------------

export function isValidNationalId(input: string): boolean {
  if (!/^\d{10}$/.test(input)) return false;
  // Reject trivially-invalid repdigits (e.g. 0000000000, 1111111111).
  if (/^(\d)\1{9}$/.test(input)) return false;

  const digits = input.split('').map(Number);
  const check = digits[9];
  const sum = digits
    .slice(0, 9)
    .reduce((acc, digit, idx) => acc + digit * (10 - idx), 0);
  const remainder = sum % 11;

  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

// ---------------------------------------------------------------------------
//  Employment type
// ---------------------------------------------------------------------------

export const EMPLOYMENT_TYPES = [
  { value: 'SALARIED', label: 'کارمند (حقوق ثابت)' },
  { value: 'SELF_EMPLOYED', label: 'آزاد / خویش‌فرما' },
  { value: 'BUSINESS_OWNER', label: 'صاحب کسب‌وکار' },
  { value: 'RETIRED', label: 'بازنشسته' },
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]['value'];

const employmentValues = EMPLOYMENT_TYPES.map((e) => e.value) as [
  EmploymentType,
  ...EmploymentType[],
];

// ---------------------------------------------------------------------------
//  Step 1 — Basic info
// ---------------------------------------------------------------------------

export const basicInfoSchema = z.object({
  nationalId: z
    .string()
    .trim()
    .refine(isValidNationalId, { message: 'کد ملی وارد شده معتبر نیست.' }),
  monthlyIncome: z
    .number({ invalid_type_error: 'درآمد ماهانه را وارد کنید.' })
    .int('مبلغ باید عدد صحیح باشد.')
    .min(5_000_000, { message: 'حداقل درآمد ماهانه ۵٬۰۰۰٬۰۰۰ تومان است.' })
    .max(2_000_000_000, { message: 'مبلغ وارد شده بیش از حد مجاز است.' }),
  employmentType: z.enum(employmentValues, {
    errorMap: () => ({ message: 'نوع اشتغال را انتخاب کنید.' }),
  }),
});

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

// ---------------------------------------------------------------------------
//  Step 2 — Documents
// ---------------------------------------------------------------------------

export const DOCUMENT_SLOTS = [
  {
    key: 'NATIONAL_CARD',
    label: 'تصویر کارت ملی',
    hint: 'پشت و روی کارت ملی هوشمند',
    required: true,
  },
  {
    key: 'CHEQUE',
    label: 'چک صیادی',
    hint: 'تصویر واضح از چک صیادی ثبت‌شده',
    required: true,
  },
  {
    key: 'SAFTEH',
    label: 'سفته',
    hint: 'تصویر سفته (در صورت نیاز)',
    required: false,
  },
] as const;

export type DocumentSlotKey = (typeof DOCUMENT_SLOTS)[number]['key'];

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

export interface FileValidationError {
  readonly code: 'TYPE' | 'SIZE';
  readonly message: string;
}

/** Validate a single uploaded file; returns null when valid. */
export function validateDocumentFile(file: File): FileValidationError | null {
  if (!ACCEPTED_MIME.includes(file.type as (typeof ACCEPTED_MIME)[number])) {
    return { code: 'TYPE', message: 'فرمت فایل باید JPG، PNG، WEBP یا PDF باشد.' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { code: 'SIZE', message: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد.' };
  }
  return null;
}
