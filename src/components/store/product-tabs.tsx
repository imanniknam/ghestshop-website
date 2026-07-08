'use client';

/**
 * GhestShop — Product Tabs (Specs & Reviews)
 * ------------------------------------------------------------------
 * Unifies the lower product-page blocks into one tabbed container:
 *   1. مشخصات فنی — a high-density technical-spec grid.
 *   2. نظرات کاربران — the glassInset review system (embedded headerless).
 * Animated layoutId tab indicator + EASE_EXPO content crossfade. Strict RTL.
 */

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ListChecks, MessageSquare } from 'lucide-react';
import {
  ProductReviews,
  type ProductReview,
  type ProductReviewSummary,
} from '@/components/store/product-reviews';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass, glassInset } from '@/lib/glass';
import { cn } from '@/lib/utils';

export interface SpecRow {
  readonly label: string;
  readonly value: string;
}

type TabKey = 'specs' | 'reviews';

const TABS: ReadonlyArray<{ key: TabKey; label: string; icon: typeof ListChecks }> = [
  { key: 'specs', label: 'مشخصات فنی', icon: ListChecks },
  { key: 'reviews', label: 'نظرات کاربران', icon: MessageSquare },
];

export interface ProductTabsProps {
  specs: SpecRow[];
  reviewsSummary: ProductReviewSummary;
  reviews: ProductReview[];
  className?: string;
}

export function ProductTabs({ specs, reviewsSummary, reviews, className }: ProductTabsProps): ReactNode {
  const [tab, setTab] = useState<TabKey>('specs');

  return (
    <section dir="rtl" className={cn('flex flex-col gap-5', className)}>
      {/* Tab rail */}
      <div
        role="tablist"
        aria-label="اطلاعات محصول"
        className="flex w-fit items-center gap-1 rounded-2xl border border-foreground/10 bg-foreground/5 p-1"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]',
                active ? 'text-white' : 'text-foreground/60 hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="product-tab-pill"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="absolute inset-0 -z-10 rounded-xl bg-[#407DC0] shadow-lg shadow-[#407DC0]/25"
                />
              )}
              <Icon className="h-4 w-4" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: EASE_EXPO }}
        >
          {tab === 'specs' ? <SpecsGrid specs={specs} /> : <ProductReviews summary={reviewsSummary} reviews={reviews} hideHeader />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function SpecsGrid({ specs }: { specs: SpecRow[] }): ReactNode {
  if (specs.length === 0) {
    return <p className="text-sm text-foreground/50">مشخصاتی برای این محصول ثبت نشده است.</p>;
  }
  return (
    <div className={cn(glassClass('card', 'overflow-hidden rounded-3xl'))}>
      <dl className="grid grid-cols-1 sm:grid-cols-2">
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className={cn(
              'flex items-center justify-between gap-3 px-5 py-3.5',
              i % 2 === 0 ? glassInset : 'bg-transparent',
            )}
          >
            <dt className="text-sm text-foreground/55">{spec.label}</dt>
            <dd className="text-sm font-bold text-foreground">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default ProductTabs;
