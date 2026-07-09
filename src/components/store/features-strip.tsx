/**
 * GhestShop — Installment benefits strip (matches live ghestshop.com features row).
 * Six key selling points in a clean horizontal layout with subtle dividers.
 */

import type { ComponentType, ReactNode } from 'react';
import {
  CreditCard,
  FileBadge,
  Globe,
  Headphones,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  readonly icon: ComponentType<{ className?: string }>;
  readonly label: string;
}

/** RTL order: right → left, matching the live site. */
const FEATURES: readonly FeatureItem[] = [
  { icon: Smartphone, label: 'تنوع گوشی' },
  { icon: CreditCard, label: 'اقساط ۱۸ ماهه' },
  { icon: Wallet, label: 'بدون پیش پرداخت' },
  { icon: FileBadge, label: 'حداقل کارمزد' },
  { icon: Headphones, label: 'بدون جریمه تاخیر' },
  { icon: Globe, label: 'پرداخت آنلاین اقساط' },
] as const;

export interface FeaturesStripProps {
  className?: string;
}

export function FeaturesStrip({ className }: FeaturesStripProps): ReactNode {
  return (
    <section
      dir="rtl"
      aria-label="مزایای خرید اقساطی"
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-border shadow-card',
        className,
      )}
    >
      <ul className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <li
              key={feature.label}
              className="flex min-h-[7.5rem] flex-col items-center justify-center gap-3 bg-surface px-3 py-5 text-center sm:px-4 sm:py-6"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-nav font-semibold leading-snug text-foreground">
                {feature.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default FeaturesStrip;
