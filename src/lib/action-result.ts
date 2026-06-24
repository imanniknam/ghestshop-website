/**
 * GhestShop — Server Action result envelope & BigInt-safe serialization.
 * ------------------------------------------------------------------
 * Server Actions must return values that cross the RSC boundary. Prisma returns
 * `BigInt` for money columns, which `JSON`/React cannot serialize by default —
 * `jsonSafe` deep-converts BigInt to number (Toman amounts stay well within
 * Number.MAX_SAFE_INTEGER) so the payload is always transport-clean.
 */

import { Prisma } from '@prisma/client';
import { AuthError } from '@/lib/auth';

export type ActionResult<T = undefined> =
  | { readonly ok: true; readonly message: string; readonly data: T }
  | { readonly ok: false; readonly error: string; readonly fieldErrors?: Record<string, string> };

export function ok<T>(message: string, data: T): ActionResult<T> {
  return { ok: true, message, data };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/**
 * Recursively replace BigInt with Number so the value is JSON/RSC serializable.
 * Dates are preserved (React Server Components can serialize Date).
 */
export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? Number(val) : val)),
  ) as T;
}

/**
 * Single funnel for Server Action failures → Persian, transport-safe results.
 * Lives here (not in a 'use server' module) because it is a sync helper.
 */
export function handleActionError(error: unknown): ActionResult<never> {
  if (error instanceof AuthError) {
    return fail(error.message);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return fail('این رکورد قبلاً ثبت شده است.');
    if (error.code === 'P2025') return fail('رکورد مورد نظر یافت نشد.');
    return fail('خطای پایگاه داده رخ داد. لطفاً دوباره تلاش کنید.');
  }
  console.error('[GhestShop ActionError]', error);
  return fail('خطای غیرمنتظره‌ای رخ داد. لطفاً بعداً تلاش کنید.');
}
