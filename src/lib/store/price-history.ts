/**
 * GhestShop — Price-history data (pure, server-importable).
 * ------------------------------------------------------------------
 * Lives in a NON-'use client' module so Server Components can call
 * `buildPriceHistory` directly. (Exporting a plain function from a 'use client'
 * file turns it into a client reference that throws when called on the server.)
 */

import { addMonths, formatJalali } from '@/lib/format';

export interface PricePoint {
  readonly month: string;
  readonly cash: number;
  readonly installment: number;
}

/** Synthesize a 6-month trend from a current cash price (→ real data in prod). */
export function buildPriceHistory(cashPrice: number): PricePoint[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const date = addMonths(now, i - 5);
    const drift = 1 + 0.08 * ((5 - i) / 5); // older months priced ~8% higher
    const cash = Math.round((cashPrice * drift) / 100_000) * 100_000;
    const monthLabel = formatJalali(date).split(' ')[1] ?? formatJalali(date);
    return { month: monthLabel, cash, installment: Math.round((cash * 1.13) / 100_000) * 100_000 };
  });
}
