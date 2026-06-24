'use client';

/**
 * GhestShop — AI Smart Installment Planner
 * ------------------------------------------------------------------
 * The user enters target price, down payment, and monthly income; the planner
 * finds the SHORTEST affordable term (≤40% DTI → least interest, healthiest
 * credit) via the pure `planInstallment` utility, shows every option with its
 * income-share, and renders a personalized Persian advice note. Strict RTL,
 * theme-aware, reduced-motion safe.
 */

import { useId, useMemo, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, CircleAlert, Sparkles, Wallet } from 'lucide-react';
import { planInstallment } from '@/lib/store/ai';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass, glassInset } from '@/lib/glass';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface AiInstallmentPlannerProps {
  /** Pre-fill the target price (e.g. the current product). */
  defaultPrice?: number;
  /** Annual rate (bps) for the quote; defaults to the platform rate. */
  annualRateBps?: number;
  className?: string;
}

export function AiInstallmentPlanner({
  defaultPrice = 40_000_000,
  annualRateBps,
  className,
}: AiInstallmentPlannerProps): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const priceId = useId();
  const downId = useId();
  const incomeId = useId();

  const [price, setPrice] = useState(defaultPrice);
  const [downPayment, setDownPayment] = useState(Math.round(defaultPrice * 0.2));
  const [monthlyIncome, setMonthlyIncome] = useState(20_000_000);

  const maxDown = Math.max(0, Math.round(price * 0.9));
  const safeDown = Math.min(downPayment, maxDown);

  const plan = useMemo(
    () => planInstallment({ price, downPayment: safeDown, monthlyIncome, annualRateBps }),
    [price, safeDown, monthlyIncome, annualRateBps],
  );

  return (
    <section dir="rtl" className={cn('flex flex-col gap-4', className)}>
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold">
          <Wallet className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-lg font-black tracking-tight text-foreground">برنامه‌ریز هوشمند اقساط</h2>
      </header>

      <div className={cn(glassClass('card', 'grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-2'))}>
        {/* Inputs */}
        <div className="flex flex-col gap-5">
          <SliderField
            id={priceId}
            label="قیمت دستگاه"
            value={price}
            min={5_000_000}
            max={120_000_000}
            step={1_000_000}
            onChange={setPrice}
          />
          <SliderField
            id={downId}
            label="پیش‌پرداخت"
            value={safeDown}
            min={0}
            max={maxDown}
            step={500_000}
            onChange={setDownPayment}
          />
          <SliderField
            id={incomeId}
            label="درآمد ماهانه"
            value={monthlyIncome}
            min={5_000_000}
            max={120_000_000}
            step={1_000_000}
            onChange={setMonthlyIncome}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col gap-4">
          {plan.feasible && plan.optimal ? (
            <motion.div
              key={`opt-${plan.optimal.months}`}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE_EXPO }}
              className={cn('flex flex-col gap-2 rounded-2xl p-5', glassInset)}
            >
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                بهترین و امن‌ترین گزینه
              </span>
              <p className="text-3xl font-black tabular-nums text-foreground">
                {toPersianDigits(plan.optimal.months)}
                <span className="mr-1 text-base font-bold text-foreground/60">ماهه</span>
              </p>
              <p className="text-sm tabular-nums text-foreground/70">
                قسط ماهانه: <span className="font-black text-gold">{formatToman(plan.optimal.monthly)}</span>
              </p>
              <p className="text-xs text-foreground/50">
                معادل {toPersianDigits(plan.optimal.dtiPercent)}٪ از درآمد ماهانه شما (محدوده‌ی امن)
              </p>
            </motion.div>
          ) : (
            <div className={cn('flex items-start gap-2 rounded-2xl p-5', glassInset)}>
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-destructive)]" aria-hidden />
              <p className="text-sm text-foreground/75">
                با درآمد فعلی، هیچ بازه‌ای در محدوده‌ی امن مالی قرار نمی‌گیرد. راهنمایی هوشمند را در پایین ببینید.
              </p>
            </div>
          )}

          {/* All options */}
          <ul className="flex flex-col gap-2">
            {plan.options.map((opt) => {
              const isOptimal = plan.optimal?.months === opt.months;
              return (
                <li
                  key={opt.months}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm',
                    isOptimal ? 'bg-[#F59E0B]/15 ring-1 ring-[#F59E0B]/40' : 'bg-foreground/[0.04]',
                  )}
                >
                  <span className="font-bold text-foreground">{toPersianDigits(opt.months)} ماهه</span>
                  <span className="tabular-nums text-foreground/70">{formatToman(opt.monthly, { withSuffix: false })}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                      opt.affordable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]',
                    )}
                  >
                    ٪{toPersianDigits(opt.dtiPercent)} درآمد
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* AI advice */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_EXPO }}
        className={cn('flex flex-col gap-2 rounded-2xl p-5', glassInset)}
      >
        <span className="flex items-center gap-2 text-sm font-black text-gold">
          <Sparkles className="h-4 w-4" aria-hidden />
          توصیه‌ی مالی هوشمند
        </span>
        <p className="text-sm leading-relaxed text-foreground/75">{plan.advice}</p>
      </motion.div>
    </section>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground/80">
          {label}
        </label>
        <span className="text-sm font-black tabular-nums text-foreground">{formatToman(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={Math.max(min, max)}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-[#F59E0B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      />
    </div>
  );
}

export default AiInstallmentPlanner;
