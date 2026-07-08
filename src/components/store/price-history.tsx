'use client';

/**
 * GhestShop — Cinematic SVG Price Ledger
 * ------------------------------------------------------------------
 * Six-month pricing trend: cash price (smooth line) vs cumulative installment
 * value (stepped gradient area). On scroll-into-view both paths self-draw
 * (pathLength 0→1, EASE_EXPO). A cursor-tracked vertical crosshair surfaces the
 * exact node values on hover. Responsive SVG (fixed viewBox, fluid width).
 */

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
import { EASE_EXPO } from '@/lib/motion';
import { formatToman, toPersianDigits } from '@/lib/format';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';
import type { PricePoint } from '@/lib/store/price-history';

export type { PricePoint };

// Chart geometry (viewBox units).
const VB_W = 600;
const VB_H = 260;
const PAD_X = 40;
const PAD_TOP = 24;
const PAD_BOTTOM = 40;
const INNER_W = VB_W - PAD_X * 2;
const INNER_H = VB_H - PAD_TOP - PAD_BOTTOM;

export interface PriceHistoryProps {
  points: PricePoint[];
  className?: string;
}

export function PriceHistory({ points, className }: PriceHistoryProps): ReactNode {
  const [hover, setHover] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const geometry = useMemo(() => {
    const values = points.flatMap((p) => [p.cash, p.installment]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const n = points.length;

    const x = (i: number): number => (n === 1 ? PAD_X + INNER_W / 2 : PAD_X + (i * INNER_W) / (n - 1));
    const y = (v: number): number => PAD_TOP + INNER_H * (1 - (v - min) / span);

    const cashLine = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.cash)}`).join(' ');

    // Stepped path for installment.
    let stepped = `M ${x(0)} ${y(points[0].installment)}`;
    for (let i = 1; i < n; i += 1) {
      stepped += ` L ${x(i)} ${y(points[i - 1].installment)} L ${x(i)} ${y(points[i].installment)}`;
    }
    const steppedArea = `${stepped} L ${x(n - 1)} ${PAD_TOP + INNER_H} L ${x(0)} ${PAD_TOP + INNER_H} Z`;

    return { x, y, cashLine, stepped, steppedArea, n };
  }, [points]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setHover(Math.round(frac * (points.length - 1)));
    },
    [points.length],
  );

  const active = hover != null ? points[hover] : null;

  return (
    <section dir="rtl" className={cn(glassClass('card', 'rounded-3xl p-6'), className)}>
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#407DC0]/15 text-gold">
            <TrendingDown className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-base font-black tracking-tight text-foreground">روند قیمت ۶ ماه اخیر</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-foreground/60">
            <span className="h-2.5 w-2.5 rounded-full bg-[#407DC0]" aria-hidden /> قیمت نقدی
          </span>
          <span className="flex items-center gap-1.5 text-foreground/60">
            <span className="h-2.5 w-2.5 rounded-full bg-[#38BDF8]" aria-hidden /> ارزش اقساطی
          </span>
        </div>
      </header>

      <div ref={trackRef} className="relative" onMouseMove={onMouseMove} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label="نمودار روند قیمت">
          <defs>
            <linearGradient id="ph-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Baseline grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={PAD_X}
              x2={VB_W - PAD_X}
              y1={PAD_TOP + INNER_H * t}
              y2={PAD_TOP + INNER_H * t}
              stroke="rgb(var(--color-foreground) / 0.10)"
              strokeWidth={1}
            />
          ))}

          {/* Installment stepped area (draw-in) */}
          <motion.path
            d={geometry.steppedArea}
            fill="url(#ph-area)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE_EXPO }}
          />
          <motion.path
            d={geometry.stepped}
            fill="none"
            stroke="#38BDF8"
            strokeWidth={2}
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.6, ease: EASE_EXPO }}
          />

          {/* Cash line (draw-in) */}
          <motion.path
            d={geometry.cashLine}
            fill="none"
            stroke="#407DC0"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.6, ease: EASE_EXPO }}
          />

          {/* Crosshair */}
          {active && hover != null && (
            <g>
              <line
                x1={geometry.x(hover)}
                x2={geometry.x(hover)}
                y1={PAD_TOP}
                y2={PAD_TOP + INNER_H}
                stroke="rgba(64,125,192,0.5)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <circle cx={geometry.x(hover)} cy={geometry.y(active.cash)} r={5} fill="#407DC0" />
              <circle cx={geometry.x(hover)} cy={geometry.y(active.installment)} r={5} fill="#38BDF8" />
            </g>
          )}

          {/* X labels */}
          {points.map((p, i) => (
            <text
              key={`${p.month}-${i}`}
              x={geometry.x(i)}
              y={VB_H - 14}
              textAnchor="middle"
              className="fill-foreground/50"
              fontSize={12}
            >
              {p.month}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {active && hover != null && (
          <div
            dir="rtl"
            className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-foreground/15 bg-background/90 p-2.5 text-sm shadow-xl backdrop-blur-md"
            style={{ left: `${(geometry.x(hover) / VB_W) * 100}%` }}
          >
            <p className="mb-1 font-bold text-foreground">{active.month}</p>
            <p className="flex items-center gap-1.5 text-foreground/70">
              <span className="h-2 w-2 rounded-full bg-[#407DC0]" /> {formatToman(active.cash)}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-foreground/70">
              <span className="h-2 w-2 rounded-full bg-[#38BDF8]" /> {formatToman(active.installment)}
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-sm text-foreground/40">
        قیمت‌ها بر اساس میانگین بازار طی {toPersianDigits(6)} ماه گذشته است.
      </p>
    </section>
  );
}

export default PriceHistory;
