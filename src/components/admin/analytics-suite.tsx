'use client';

/**
 * GhestShop — Admin Analytics Suite
 * ------------------------------------------------------------------
 * Fluid counter grid + a "Monthly Inflow vs. Delayed Installments" composed
 * chart (smooth Area + Bar) rendered with Recharts on the Liquid Glass theme.
 * RTL-aware (reversed X axis, right-oriented Y axis), Persian tooltips and
 * tick formatting, custom grid strokes, spring-physics counter reveal.
 */

import { useMemo, type ReactNode } from 'react';
import { motion, useReducedMotion, type Transition } from 'framer-motion';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { Banknote, FileClock, TrendingDown, Wallet } from 'lucide-react';
import type { AdminMetrics, MonthlyFlowDatum } from '@/lib/admin/types';
import { formatToman, formatTomanCompact, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };

export interface AnalyticsSuiteProps {
  metrics: AdminMetrics;
  monthlyFlow: MonthlyFlowDatum[];
  className?: string;
}

export function AnalyticsSuite({ metrics, monthlyFlow, className }: AnalyticsSuiteProps): ReactNode {
  const reduceMotion = useReducedMotion();

  const counters = useMemo(
    () => [
      {
        key: 'financed',
        label: 'سرمایه تأمین‌شده کل',
        value: formatTomanCompact(metrics.totalFinanced),
        icon: Wallet,
        accent: 'text-[var(--color-primary)]',
        glow: 'bg-[var(--color-primary)]/20',
      },
      {
        key: 'overdue',
        label: 'نسبت معوقات',
        value: `٪${toPersianDigits((metrics.overdueRatio * 100).toFixed(1))}`,
        icon: TrendingDown,
        accent: 'text-red-400',
        glow: 'bg-red-500/20',
      },
      {
        key: 'slips',
        label: 'رسیدهای در انتظار',
        value: toPersianDigits(metrics.pendingSlips),
        icon: FileClock,
        accent: 'text-amber-300',
        glow: 'bg-amber-400/20',
      },
      {
        key: 'apps',
        label: 'درخواست‌های بررسی‌نشده',
        value: toPersianDigits(metrics.pendingApplications),
        icon: Banknote,
        accent: 'text-[var(--color-accent)]',
        glow: 'bg-[var(--color-accent)]/20',
      },
    ],
    [metrics],
  );

  return (
    <div dir="rtl" className={cn('flex flex-col gap-5', className)}>
      {/* Counter grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counters.map((c, index) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: index * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-foreground/15 bg-foreground/10 p-4 backdrop-blur-xl ring-1 ring-inset ring-foreground/5"
            >
              <div aria-hidden className={cn('pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl', c.glow)} />
              <div className="relative z-10 flex flex-col gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/10', c.accent)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-foreground)]/55">{c.label}</p>
                  <p className="mt-1 text-xl font-black tabular-nums text-[var(--color-foreground)]">{c.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Composed chart */}
      <div className="rounded-3xl border border-foreground/15 bg-foreground/10 p-5 backdrop-blur-xl ring-1 ring-inset ring-foreground/5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-foreground)]">جریان نقدی ماهانه در برابر معوقات</h3>
            <p className="text-xs text-[var(--color-foreground)]/50">مقایسه وصولی تأییدشده و اقساط معوق (تومان)</p>
          </div>
        </div>

        <div className="h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyFlow} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="month"
                reversed
                tick={{ fill: 'rgba(248,250,252,0.55)', fontSize: 12 }}
                tickFormatter={(v: string) => v}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                orientation="right"
                tick={{ fill: 'rgba(248,250,252,0.45)', fontSize: 11 }}
                tickFormatter={(v: number) => toPersianDigits((v / 1_000_000).toFixed(0))}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<PersianTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend content={<PersianLegend />} />

              <Area
                type="monotone"
                dataKey="inflow"
                name="وصولی تأییدشده"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#inflowFill)"
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={reduceMotion ? 0 : 900}
              />
              <Bar
                dataKey="delayed"
                name="اقساط معوق"
                barSize={18}
                radius={[6, 6, 0, 0]}
                fill="rgba(239,68,68,0.65)"
                animationDuration={reduceMotion ? 0 : 900}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Custom Persian tooltip & legend
// ---------------------------------------------------------------------------

function PersianTooltip({ active, payload, label }: TooltipProps<number, string>): ReactNode {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      dir="rtl"
      className="rounded-xl border border-foreground/15 bg-[var(--color-background)]/90 p-3 shadow-xl backdrop-blur-md"
    >
      <p className="mb-2 text-xs font-bold text-[var(--color-foreground)]">{label}</p>
      <ul className="flex flex-col gap-1">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} aria-hidden />
            <span className="text-[var(--color-foreground)]/60">{entry.name}:</span>
            <span className="font-semibold tabular-nums text-[var(--color-foreground)]">
              {formatToman(Number(entry.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface LegendEntry {
  value: string;
  color?: string;
}

function PersianLegend({ payload }: { payload?: LegendEntry[] }): ReactNode {
  if (!payload) return null;
  return (
    <ul dir="rtl" className="mt-2 flex items-center justify-center gap-5">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-xs text-[var(--color-foreground)]/60">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export default AnalyticsSuite;
