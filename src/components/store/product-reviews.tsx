'use client';

/**
 * GhestShop — Glass Underwriting Review System
 * ------------------------------------------------------------------
 * Summary block (average + animated horizontal distribution bars that grow on
 * scroll-into-view) plus a list of reviews inside translucent glassInset nodes,
 * each with a verified-purchase badge. Strict RTL, EASE_EXPO bar growth.
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, MessageSquare, Star } from 'lucide-react';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass, glassInset } from '@/lib/glass';
import { toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface ProductReview {
  readonly id: string;
  readonly name: string;
  readonly rating: number; // 1..5
  readonly dateLabel: string; // Jalali
  readonly body: string;
  readonly verified: boolean;
}

export interface ProductReviewSummary {
  readonly average: number; // 0..5
  readonly total: number;
  /** Counts for [5★, 4★, 3★, 2★, 1★]. */
  readonly distribution: readonly [number, number, number, number, number];
}

function Stars({ rating, size = 'h-4 w-4' }: { rating: number; size?: string }): ReactNode {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${toPersianDigits(rating)} از ۵`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(size, i < Math.round(rating) ? 'fill-[#F59E0B] text-gold' : 'fill-transparent text-foreground/25')}
          aria-hidden
        />
      ))}
    </span>
  );
}

export interface ProductReviewsProps {
  summary: ProductReviewSummary;
  reviews: ProductReview[];
  /** Suppress the internal heading when embedded inside a tabbed container. */
  hideHeader?: boolean;
  className?: string;
}

export function ProductReviews({ summary, reviews, hideHeader = false, className }: ProductReviewsProps): ReactNode {
  const total = summary.total || 1;

  return (
    <section dir="rtl" className={cn('flex flex-col gap-5', className)}>
      {!hideHeader && (
        <header className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold">
            <MessageSquare className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-lg font-black tracking-tight text-foreground">دیدگاه خریداران</h2>
        </header>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[16rem_1fr]">
        {/* Summary */}
        <div className={cn(glassClass('card', 'flex flex-col items-center gap-3 rounded-3xl p-6 text-center'))}>
          <span className="text-5xl font-black tabular-nums text-foreground">
            {toPersianDigits(summary.average.toFixed(1))}
          </span>
          <Stars rating={summary.average} size="h-5 w-5" />
          <span className="text-xs text-foreground/55">
            از مجموع {toPersianDigits(summary.total)} دیدگاه
          </span>

          <div className="mt-2 flex w-full flex-col gap-2">
            {summary.distribution.map((count, i) => {
              const starLevel = 5 - i;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={starLevel} className="flex items-center gap-2">
                  <span className="w-4 shrink-0 text-[11px] text-foreground/50 tabular-nums">
                    {toPersianDigits(starLevel)}
                  </span>
                  <Star className="h-3 w-3 shrink-0 fill-[#F59E0B]/60 text-gold/60" aria-hidden />
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10">
                    <motion.span
                      className="block h-full rounded-full bg-gradient-to-l from-[#F59E0B] to-[#7C3AED]"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.9, delay: i * 0.08, ease: EASE_EXPO }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-left text-[11px] text-foreground/45 tabular-nums">
                    ٪{toPersianDigits(pct)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review list */}
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className={cn('rounded-2xl p-4', glassInset)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] text-sm font-black text-white">
                    {review.name.trim().charAt(0)}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      {review.name}
                      {review.verified && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                          <BadgeCheck className="h-3 w-3" aria-hidden />
                          خرید تأییدشده
                        </span>
                      )}
                    </p>
                    <span className="text-[11px] text-foreground/45">{review.dateLabel}</span>
                  </div>
                </div>
                <Stars rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{review.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default ProductReviews;
