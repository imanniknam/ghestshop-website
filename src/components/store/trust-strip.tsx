/**
 * GhestShop — Fintech Trust Strip
 * ------------------------------------------------------------------
 * High-density verification bar shown beneath the hero. Per the storefront
 * design research, social proof immediately under the hero is the #1
 * conversion lever for Iranian installment commerce. Server component — pure
 * presentation, no client JS.
 */

import type { ComponentType, ReactNode } from 'react';
import { BadgeCheck, Percent, ShieldCheck } from 'lucide-react';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

interface TrustItem {
  readonly icon: ComponentType<{ className?: string }>;
  readonly text: string;
}

const ITEMS: readonly TrustItem[] = [
  { icon: BadgeCheck, text: '۱۲٬۴۰۰+ خرید موفق' },
  { icon: ShieldCheck, text: 'نماد اعتماد الکترونیکی (اینماد)' },
  { icon: Percent, text: '۰٪ کارمزد ۳ ماه اول' },
];

export interface TrustStripProps {
  className?: string;
}

export function TrustStrip({ className }: TrustStripProps): ReactNode {
  return (
    <div
      dir="rtl"
      className={cn(
        'flex flex-wrap items-center justify-center gap-3 sm:gap-4',
        className,
      )}
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.text}
            className={cn(
              glassClass('card', 'flex items-center gap-2 rounded-2xl px-4 py-2.5'),
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F59E0B]/15 text-gold">
              <Icon className="h-4 w-4" />
            </span>
            <span className="whitespace-nowrap text-xs font-semibold text-foreground/85 sm:text-sm">
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default TrustStrip;
