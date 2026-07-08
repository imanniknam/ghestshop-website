'use client';

/**
 * GhestShop — Mission-Control Financial Checkout Dashboard
 * ------------------------------------------------------------------
 * Right panel  — the Transparency Hub: a source-of-truth glass bill computed
 *                straight from the installment-engine (cash, down-payment
 *                deduction, registration fee, profit, net monthly).
 * Left panel   — the Jalali Schedule: the first 3 due dates from today, with
 *                scroll-reveals and a cursor-glow on the active node.
 * Conversion   — a glowing gold gate into the underwriting wizard (/apply).
 * Reads the configured selection from the Zustand cart store.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarClock, ReceiptText, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { usePointerGlow } from '@/components/store/use-pointer-glow';
import { calculateInstallment } from '@/lib/finance/installment-engine';
import { swatchHex } from '@/lib/store/colors';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass, glassInset } from '@/lib/glass';
import { addMonths, formatJalali, formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Registration / documentation fee policy: 0.5% of the cash price. */
const REGISTRATION_FEE_RATE = 0.005;

export default function CartPage(): ReactNode {
  const activeItem = useCartStore((s) => s.activeItem);
  const glow = usePointerGlow({ size: 260, color: 'rgba(64,125,192,0.18)' });

  if (!activeItem) {
    return (
      <main dir="rtl" className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <ShoppingBag className="h-14 w-14 text-foreground/30" aria-hidden />
        <h1 className="text-2xl font-black text-foreground">سبد خرید شما خالی است</h1>
        <p className="text-sm text-foreground/55">برای ثبت درخواست اقساطی، ابتدا یک محصول را انتخاب کنید.</p>
        <Link
          href="/"
          className="mt-2 rounded-xl bg-[#407DC0] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#407DC0]/25 transition-[filter] hover:brightness-110"
        >
          مشاهده محصولات
        </Link>
      </main>
    );
  }

  const { product, color, storage, months, downPayment, annualRateBps } = activeItem;
  const quote = calculateInstallment({ cashPrice: product.cashPrice, downPayment, months, annualRateBps });
  const registrationFee = Math.round(product.cashPrice * REGISTRATION_FEE_RATE);
  const grandTotal = downPayment + quote.totalPayable + registrationFee;

  const now = new Date();
  const schedule = Array.from({ length: 3 }, (_, i) => {
    const due = addMonths(now, i + 1);
    return { index: i + 1, jalali: formatJalali(due), amount: quote.monthlyPayment };
  });

  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#407DC0]/15 text-gold">
          <ReceiptText className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">فاکتور خرید اقساطی</h1>
          <p className="text-sm text-foreground/55">بررسی نهایی پیش از اعتبارسنجی</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* RIGHT (RTL-first): Transparency Hub */}
        <section className={cn(glassClass('card', 'flex flex-col gap-5 rounded-3xl p-6 sm:p-8'))}>
          {/* Device summary */}
          <div className="flex items-center gap-4 border-b border-foreground/10 pb-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-foreground/5 p-2">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt={product.title} className="h-full w-full object-contain" />
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-base font-bold text-foreground">{product.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-foreground/55">
                <span className="inline-flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full border border-foreground/20" style={{ backgroundColor: swatchHex(color) }} />
                  {color}
                </span>
                <span>·</span>
                <span>{toPersianDigits(storage)} گیگابایت</span>
                <span>·</span>
                <span>{toPersianDigits(months)} ماه</span>
              </div>
            </div>
          </div>

          {/* Bill */}
          <dl className="flex flex-col gap-1">
            <BillRow label="قیمت نقدی دستگاه" value={formatToman(product.cashPrice)} />
            <BillRow label="پیش‌پرداخت" value={`− ${formatToman(downPayment)}`} accent="minus" />
            <BillRow label="مبلغ تأمین مالی" value={formatToman(quote.principal)} />
            <BillRow label="کارمزد ثبت و مدارک" value={`+ ${formatToman(registrationFee)}`} />
            <BillRow label="سود کل اقساط" value={`+ ${formatToman(quote.totalProfit)}`} />

            <div className="my-3 border-t border-dashed border-foreground/15" />

            <div className={cn('flex items-center justify-between rounded-2xl p-4', glassInset)}>
              <span className="text-sm text-foreground/70">قسط ماهانه (خالص)</span>
              <span className="text-xl font-black tabular-nums text-gold">
                {formatToman(quote.monthlyPayment, { withSuffix: false })}
                <span className="mr-1 text-sm font-normal text-gold/70">تومان</span>
              </span>
            </div>

            <BillRow label="مبلغ کل قابل پرداخت" value={formatToman(grandTotal)} strong />
          </dl>

          <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            تمامی محاسبات بر اساس موتور مالی رسمی قسط شاپ و کاملاً شفاف است.
          </p>
        </section>

        {/* LEFT: Jalali Schedule */}
        <section
          onMouseMove={glow.onMouseMove}
          className={cn(glassClass('card', 'group relative flex flex-col gap-5 overflow-hidden rounded-3xl p-6'))}
        >
          <motion.div
            aria-hidden
            style={{ background: glow.background }}
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <header className="relative z-10 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-gold" aria-hidden />
            <h2 className="text-base font-black tracking-tight text-foreground">زمان‌بندی اقساط (شمسی)</h2>
          </header>

          <ol className="relative z-10 flex flex-col gap-3">
            <span aria-hidden className="absolute bottom-4 right-[1.15rem] top-4 w-px bg-gradient-to-b from-[#407DC0]/40 via-white/10 to-transparent" />
            {schedule.map((row, i) => {
              const isActive = i === 0;
              return (
                <motion.li
                  key={row.index}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_EXPO }}
                  className="relative flex items-center gap-4"
                >
                  <span
                    className={cn(
                      'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums',
                      isActive ? 'bg-[#407DC0] text-white' : 'bg-foreground/10 text-foreground/70',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-full ring-2 ring-[#407DC0]"
                        animate={{ boxShadow: ['0 0 0 0 rgba(64,125,192,0.0)', '0 0 0 6px rgba(64,125,192,0.18)', '0 0 0 0 rgba(64,125,192,0.0)'] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        aria-hidden
                      />
                    )}
                    {toPersianDigits(row.index)}
                  </span>
                  <div className={cn('flex flex-1 items-center justify-between rounded-2xl px-4 py-3', glassInset)}>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground/55">قسط {toPersianDigits(row.index)}</span>
                      <span className="text-sm font-bold text-foreground">{row.jalali}</span>
                    </div>
                    <span className="text-sm font-black tabular-nums text-foreground">
                      {formatToman(row.amount, { withSuffix: false })}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ol>

          <p className="relative z-10 text-sm text-foreground/40">
            مابقی اقساط پس از تأیید اعتبارسنجی در دفتر اقساط شما ثبت می‌شود.
          </p>
        </section>
      </div>

      {/* Conversion gate */}
      <div className="mt-8 flex justify-center">
        <Link
          href="/apply"
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#407DC0] px-10 py-4 text-base font-black text-white',
            'shadow-[0_0_40px_-6px_rgba(64,125,192,0.6)] transition-[filter,box-shadow] hover:brightness-110 hover:shadow-[0_0_56px_-4px_rgba(64,125,192,0.75)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          )}
        >
          <ShieldCheck className="h-5 w-5" aria-hidden />
          تایید فاکتور و شروع اعتبارسنجی
        </Link>
      </div>
    </main>
  );
}

interface BillRowProps {
  label: string;
  value: string;
  accent?: 'minus';
  strong?: boolean;
}

function BillRow({ label, value, accent, strong = false }: BillRowProps): ReactNode {
  return (
    <div className="flex items-center justify-between px-1 py-2">
      <dt className={cn('text-sm', strong ? 'font-bold text-foreground' : 'text-foreground/60')}>{label}</dt>
      <dd
        className={cn(
          'tabular-nums',
          strong ? 'text-base font-black text-foreground' : 'text-sm font-semibold text-foreground/85',
          accent === 'minus' && 'text-emerald-400',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
