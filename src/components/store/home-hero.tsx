/**
 * GhestShop — Homepage hero (static, matches live ghestshop.com structure).
 * No entrance animations — clean and accessible.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-logo';
import { glassClass } from '@/lib/glass';
import { toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface HomeHeroProps {
  className?: string;
}

export function HomeHero({ className }: HomeHeroProps): ReactNode {
  return (
    <section
      dir="rtl"
      className={cn(
        glassClass('hero', 'relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12'),
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-caption font-medium text-gold">
            <BrandMark size={18} className="text-primary" />
            فروش اقساطی موبایل در شیراز و جهرم
          </span>

          <h1 className="text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-[1.65rem]">
            خرید گوشی قسطی در شیراز بدون ضامن
          </h1>

          <p className="text-body leading-relaxed text-foreground/75">
            فروشگاه قسط شاپ فروش اقساطی خود را به همشهریان عزیز شیراز و جهرم ارائه می‌کند.
            گوشی‌های موجود را بررسی کنید، روی دکمه خرید اقساطی کلیک کنید و فرم‌های مرتبط را پر کنید.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/brand/samsung"
              className={cn(
                'inline-flex items-center gap-2 rounded-xl bg-[#407DC0] px-5 py-2.5 text-body font-bold text-white',
                'shadow-lg shadow-[#407DC0]/25 transition-[filter] hover:brightness-110',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0] focus-visible:ring-offset-2',
              )}
            >
              مشاهده گوشی‌ها
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/apply"
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-body font-bold text-foreground',
                'transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]',
              )}
            >
              محاسبه‌گر اقساط
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/80 p-5 sm:min-w-[17rem]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-body font-bold text-foreground">آدرس فروشگاه</span>
              <span className="text-body leading-relaxed text-foreground/70">
                شیراز، چهارراه ریشمک — ساختمان امیرکبیر — طبقه سوم
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Phone className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-body font-bold text-foreground">تماس با ما</span>
              <a
                href="tel:09173838230"
                dir="ltr"
                className="text-right text-body font-bold text-primary hover:underline"
              >
                {toPersianDigits('۰۹۱۷۳۸۳۸۲۳۰')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
