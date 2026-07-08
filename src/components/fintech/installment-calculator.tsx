'use client';

/**
 * GhestShop — Interactive Installment Dynamic Calculator Widget
 * ------------------------------------------------------------------
 * A self-contained, fully responsive, RTL-first "Liquid Glass" card that lets a
 * customer dial in their down payment and term, and watch the amortized monthly
 * installment, total profit margin, and minimum required income recompute in
 * real time. All math is delegated to the shared `installment-engine` so the UI
 * number is byte-identical to the ledger number generated on the server.
 *
 * Stack: React 18 + Tailwind (CSS-variable design tokens) + Framer Motion
 *        (spring physics). Zero placeholders — every state is implemented.
 *
 * Accessibility: native range inputs (keyboard + screen-reader friendly),
 * aria-labels on every control, respects prefers-reduced-motion via Framer's
 * `useReducedMotion`, and a 4.5:1-contrast figure readout.
 */

import { useMemo, useState, useId, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'framer-motion';
import {
  ALLOWED_MONTHS,
  calculateInstallment,
  type AllowedMonth,
} from '@/lib/finance/installment-engine';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
//  Motion tokens — physics-based spring per the design brief.
// ---------------------------------------------------------------------------

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };
const SOFT_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26 };

// ---------------------------------------------------------------------------
//  Props
// ---------------------------------------------------------------------------

export interface InstallmentCalculatorProps {
  /** Absolute cash price of the product, in Toman. */
  cashPrice: number;
  /** Optional product title shown in the header. */
  productTitle?: string;
  /** Nominal annual interest rate in basis points (1800 = 18%). */
  annualRateBps?: number;
  /** Minimum down payment as a fraction of price (default 10%). */
  minDownRatio?: number;
  /** Maximum down payment as a fraction of price (default 90%). */
  maxDownRatio?: number;
  /** Fired whenever the customer commits the current quote (e.g. "ادامه خرید"). */
  onConfirm?: (quote: {
    months: AllowedMonth;
    downPayment: number;
    principal: number;
    monthlyPayment: number;
    totalPayable: number;
  }) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

export function InstallmentCalculator({
  cashPrice,
  productTitle,
  annualRateBps = 1800,
  minDownRatio = 0.1,
  maxDownRatio = 0.9,
  onConfirm,
  className,
}: InstallmentCalculatorProps): ReactNode {
  const reduceMotion = useReducedMotion();
  const downSliderId = useId();

  const minDown = Math.round(cashPrice * minDownRatio);
  const maxDown = Math.round(cashPrice * maxDownRatio);
  const downStep = Math.max(100_000, Math.round(cashPrice / 100));

  const [downPayment, setDownPayment] = useState<number>(minDown);
  const [months, setMonths] = useState<AllowedMonth>(12);

  // Recompute the full matrix on every input change. Memoized so unrelated
  // re-renders don't re-run the math.
  const result = useMemo(
    () =>
      calculateInstallment({
        cashPrice,
        downPayment,
        months,
        annualRateBps,
      }),
    [cashPrice, downPayment, months, annualRateBps],
  );

  // Validation state: down payment must sit inside the allowed band.
  const isInvalid = downPayment < minDown || downPayment > maxDown;
  const downRatioPct = Math.round((downPayment / cashPrice) * 100);

  const transition = reduceMotion ? { duration: 0 } : SPRING;

  return (
    <motion.section
      dir="rtl"
      lang="fa"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : SOFT_SPRING}
      aria-label="ماشین‌حساب خرید اقساطی"
      className={cn(
        'relative w-full max-w-md overflow-hidden rounded-3xl p-6 sm:p-8',
        // Liquid-glass surface
        'border border-foreground/15 bg-foreground/10 backdrop-blur-xl',
        'shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)]',
        // Border glow
        'ring-1 ring-inset ring-foreground/5',
        className,
      )}
    >
      {/* Decorative radial gradient glow (purposeful background, pointer-safe). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-primary/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-6">
        {/* ---- Header --------------------------------------------------- */}
        <header className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground/60">
            خرید اقساطی
          </span>
          <h2 className="text-lg font-bold text-foreground">
            {productTitle ?? 'محاسبه‌گر اقساط'}
          </h2>
          <p className="text-sm text-foreground/60">
            قیمت نقدی:{' '}
            <span className="font-semibold text-secondary">
              {formatToman(cashPrice)}
            </span>
          </p>
        </header>

        {/* ---- Down payment slider ------------------------------------- */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor={downSliderId}
              className="text-sm font-medium text-foreground/80"
            >
              پیش‌پرداخت
            </label>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-sm text-foreground/70">
                ٪{toPersianDigits(downRatioPct)}
              </span>
              <span className="text-sm font-bold text-foreground">
                {formatToman(downPayment, { withSuffix: false })}
              </span>
            </div>
          </div>

          <input
            id={downSliderId}
            type="range"
            min={minDown}
            max={maxDown}
            step={downStep}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            aria-label="مبلغ پیش‌پرداخت"
            aria-valuetext={formatToman(downPayment)}
            className={cn(
              'h-2 w-full cursor-pointer appearance-none rounded-full',
              'bg-foreground/15 accent-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
            )}
          />

          <div className="flex justify-between text-sm text-foreground/40 tabular-nums">
            <span>حداقل {formatToman(minDown, { withSuffix: false })}</span>
            <span>حداکثر {formatToman(maxDown, { withSuffix: false })}</span>
          </div>
        </div>

        {/* ---- Duration segmented control ------------------------------ */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-foreground/80">
            تعداد ماه
          </legend>
          <div
            role="radiogroup"
            aria-label="مدت بازپرداخت"
            className="relative grid grid-cols-4 gap-1 rounded-2xl bg-foreground/5 p-1"
          >
            {ALLOWED_MONTHS.map((m) => {
              const active = m === months;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMonths(m)}
                  className={cn(
                    'relative z-10 rounded-xl py-2.5 text-sm font-bold transition-colors',
                    'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'text-primary-foreground'
                      : 'text-foreground/60 hover:text-foreground',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="month-pill"
                      transition={transition}
                      className="absolute inset-0 -z-10 rounded-xl bg-primary shadow-lg shadow-primary/30"
                    />
                  )}
                  {toPersianDigits(m)}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ---- Hero figure: monthly payment ---------------------------- */}
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-foreground/10 bg-gradient-to-b from-white/10 to-transparent p-5 text-center">
          <span className="text-sm text-foreground/60">
            مبلغ هر قسط
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={result.monthlyPayment}
              initial={reduceMotion ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={transition}
              className="text-3xl font-black tabular-nums text-foreground sm:text-4xl"
            >
              {formatToman(result.monthlyPayment, { withSuffix: false })}
            </motion.div>
          </AnimatePresence>
          <span className="text-sm text-foreground/50">
            تومان در ماه ({toPersianDigits(months)} قسط)
          </span>
        </div>

        {/* ---- Secondary matrix readout -------------------------------- */}
        <dl className="grid grid-cols-3 gap-3 text-center">
          <Metric
            label="مبلغ تأمین مالی"
            value={formatToman(result.principal, { withSuffix: false })}
            transition={transition}
          />
          <Metric
            label="سود کل"
            value={formatToman(result.totalProfit, { withSuffix: false })}
            accent
            transition={transition}
          />
          <Metric
            label="حداقل درآمد لازم"
            value={formatToman(result.minRequiredIncome, { withSuffix: false })}
            transition={transition}
          />
        </dl>

        {/* ---- Validation / invalid state ------------------------------ */}
        <AnimatePresence>
          {isInvalid && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SOFT_SPRING}
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
            >
              مبلغ پیش‌پرداخت خارج از محدوده مجاز است.
            </motion.p>
          )}
        </AnimatePresence>

        {/* ---- CTA ------------------------------------------------------ */}
        <motion.button
          type="button"
          disabled={isInvalid}
          whileHover={reduceMotion || isInvalid ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion || isInvalid ? undefined : { scale: 0.98 }}
          transition={SPRING}
          onClick={() =>
            onConfirm?.({
              months,
              downPayment,
              principal: result.principal,
              monthlyPayment: result.monthlyPayment,
              totalPayable: result.totalPayable,
            })
          }
          className={cn(
            'w-full rounded-2xl py-3.5 text-sm font-bold transition-colors',
            'bg-primary text-primary-foreground',
            'shadow-lg shadow-primary/30',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
            !isInvalid && 'cursor-pointer hover:brightness-110',
          )}
        >
          ادامه و ثبت درخواست اقساط
        </motion.button>

        <p className="text-center text-sm text-foreground/40">
          مبلغ کل بازپرداخت:{' '}
          <span className="font-semibold tabular-nums text-foreground/70">
            {formatToman(result.totalPayable)}
          </span>
        </p>
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
//  Sub-component: a single animated metric cell.
// ---------------------------------------------------------------------------

interface MetricProps {
  label: string;
  value: string;
  accent?: boolean;
  transition: Transition;
}

function Metric({ label, value, accent = false, transition }: MetricProps): ReactNode {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-foreground/5 p-3">
      <dt className="text-sm leading-tight text-foreground/50">
        {label}
      </dt>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.dd
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={transition}
          className={cn(
            'text-sm font-bold tabular-nums',
            accent ? 'text-secondary' : 'text-foreground',
          )}
        >
          {value}
        </motion.dd>
      </AnimatePresence>
    </div>
  );
}

export default InstallmentCalculator;
