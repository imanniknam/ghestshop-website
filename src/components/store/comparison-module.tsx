'use client';

/**
 * GhestShop — Dynamic AI Comparison Matrix
 * ------------------------------------------------------------------
 * Product A is the active device; Product B is chosen by the user from a
 * translucent dropdown of the catalog. On selection a simulated AI utility
 * (`analyzeDevices`) recomputes the power metrics AND generates a contextual
 * Persian verdict explaining which device fits which workflow. Bars re-fill
 * (0 → target, EASE_EXPO) on every selection. Strict RTL, theme-aware.
 */

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BatteryFull,
  Camera,
  Check,
  ChevronDown,
  Cpu,
  MonitorSmartphone,
  Sparkles,
  Swords,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { analyzeDevices, type CompareMetric, type StoreDevice } from '@/lib/store/ai';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass, glassInset } from '@/lib/glass';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

const ICON_BY_KEY: Record<string, ComponentType<{ className?: string }>> = {
  cpu: Cpu,
  battery: BatteryFull,
  camera: Camera,
  display: MonitorSmartphone,
  value: Wallet,
};

export interface ComparisonModuleProps {
  current: StoreDevice;
  candidates: StoreDevice[];
  className?: string;
}

export function ComparisonModule({ current, candidates, className }: ComparisonModuleProps): ReactNode {
  const [competitor, setCompetitor] = useState<StoreDevice | null>(candidates[0] ?? null);
  const [open, setOpen] = useState(false);

  const analysis = useMemo(
    () => (competitor ? analyzeDevices(current, competitor) : null),
    [current, competitor],
  );

  return (
    <section dir="rtl" className={cn('flex flex-col gap-5', className)}>
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#407DC0]/15 text-gold">
          <Swords className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-lg font-black tracking-tight text-foreground">مقایسه هوشمند رو در رو</h2>
      </header>

      <div className={cn(glassClass('card', 'flex flex-col gap-5 rounded-3xl p-6'))}>
        {/* Contenders + Product B selector */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-foreground/10 pb-4">
          <Contender device={current} highlight />
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 text-sm font-black text-foreground/60">
            VS
          </span>

          {/* Product B dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-right transition-colors',
                glassInset,
                'cursor-pointer hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]',
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-foreground">
                  {competitor ? competitor.name : 'انتخاب رقیب'}
                </span>
                <span className="text-sm text-foreground/45">برای مقایسه انتخاب کنید</span>
              </span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-foreground/50 transition-transform', open && 'rotate-180')} aria-hidden />
            </button>

            <AnimatePresence>
              {open && (
                <motion.ul
                  initial={{ opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0)' }}
                  animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
                  exit={{ opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0)' }}
                  transition={{ duration: 0.35, ease: EASE_EXPO }}
                  className={cn(
                    glassClass('hero', 'absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl p-1.5'),
                  )}
                >
                  {candidates.map((device) => (
                    <li key={device.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCompetitor(device);
                          setOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-right transition-colors hover:bg-foreground/5',
                          'focus-visible:outline-none focus-visible:bg-foreground/5',
                          competitor?.id === device.id && 'bg-foreground/5',
                        )}
                      >
                        <span className="truncate text-sm font-medium text-foreground">{device.name}</span>
                        <span className="shrink-0 text-sm tabular-nums text-foreground/45">
                          {formatToman(device.cashPrice, { withSuffix: false })}
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Metric bars (re-fill on each selection via keyed remount) */}
        {analysis && competitor && (
          <div key={competitor.id} className="flex flex-col gap-4">
            {analysis.metrics.map((metric, index) => (
              <MetricRow
                key={metric.key}
                metric={metric}
                currentName={current.name}
                competitorName={competitor.name}
                delay={index * 0.06}
              />
            ))}
          </div>
        )}

        {/* AI verdict — «چرا بله؟» / «چرا خیر؟» */}
        {analysis && (
          <motion.div
            key={`verdict-${competitor?.id ?? 'none'}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_EXPO }}
            className="flex flex-col gap-3"
          >
            <span className="flex items-center gap-2 text-sm font-black text-gold">
              <Sparkles className="h-4 w-4" aria-hidden />
              ارزیابی هوشمند «{current.name}»
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={cn('flex flex-col gap-2.5 rounded-2xl p-4', glassInset)}>
                <span className="flex items-center gap-2 text-sm font-black text-emerald-400">
                  <ThumbsUp className="h-4 w-4" aria-hidden />
                  چرا بله؟
                </span>
                <ul className="flex flex-col gap-2">
                  {analysis.caseFor.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/75">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={cn('flex flex-col gap-2.5 rounded-2xl p-4', glassInset)}>
                <span className="flex items-center gap-2 text-sm font-black text-destructive">
                  <ThumbsDown className="h-4 w-4" aria-hidden />
                  چرا خیر؟
                </span>
                <ul className="flex flex-col gap-2">
                  {analysis.caseAgainst.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/75">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function Contender({ device, highlight = false }: { device: StoreDevice; highlight?: boolean }): ReactNode {
  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-foreground/5 p-1.5">
        {device.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={device.image} alt={device.name} className="h-full w-full object-contain" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">{device.name}</p>
        <p className={cn('text-sm', highlight ? 'text-gold' : 'text-foreground/45')}>
          {highlight ? 'انتخاب شما' : 'رقیب بازار'}
        </p>
      </div>
    </div>
  );
}

function MetricRow({
  metric,
  currentName,
  competitorName,
  delay,
}: {
  metric: CompareMetric;
  currentName: string;
  competitorName: string;
  delay: number;
}): ReactNode {
  const Icon = ICON_BY_KEY[metric.key] ?? Zap;
  const currentWins = metric.current >= metric.competitor;
  return (
    <div className={cn('rounded-2xl p-4', glassInset)}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gold" />
        <span className="text-sm font-bold text-foreground">{metric.label}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        <PowerBar name={currentName} value={metric.current} isWinner={currentWins} delay={delay} />
        <PowerBar name={competitorName} value={metric.competitor} isWinner={!currentWins} delay={delay + 0.08} />
      </div>
    </div>
  );
}

function PowerBar({
  name,
  value,
  isWinner,
  delay,
}: {
  name: string;
  value: number;
  isWinner: boolean;
  delay: number;
}): ReactNode {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 truncate text-sm text-foreground/60">{name}</span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
        <motion.span
          className={cn(
            'absolute inset-y-0 right-0 rounded-full',
            isWinner ? 'bg-gradient-to-l from-[#407DC0] to-[#38BDF8]' : 'bg-foreground/30',
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.9, delay, ease: EASE_EXPO }}
        />
      </div>
      <span className="flex w-12 shrink-0 items-center justify-end gap-1 text-sm font-bold tabular-nums text-foreground">
        ٪{toPersianDigits(value)}
        {isWinner && <Trophy className="h-3.5 w-3.5 text-gold" aria-label="برنده" />}
      </span>
    </div>
  );
}

export default ComparisonModule;
