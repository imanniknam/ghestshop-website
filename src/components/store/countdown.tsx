'use client';

/**
 * GhestShop — Isolated High-Performance Countdown
 * ------------------------------------------------------------------
 * Counts down to a timestamp WITHOUT triggering a React render every second.
 * A single `setInterval` mutates the `textContent` of four `tabular-nums`
 * nodes directly via refs, so the parent (flash-sale card, with its rotating
 * conic border) never re-renders on tick — the animation stays jank-free.
 */

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { glassInset } from '@/lib/glass';
import { toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface CountdownProps {
  endsAt: Date | string;
  /** Smaller blocks for secondary/compact cards. */
  compact?: boolean;
  className?: string;
  onComplete?: () => void;
}

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function partsFrom(targetMs: number): Parts {
  const delta = Math.max(0, targetMs - Date.now());
  const totalSeconds = Math.floor(delta / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    done: delta <= 0,
  };
}

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));
const faPad = (n: number): string => toPersianDigits(pad2(n));

export function Countdown({ endsAt, compact = false, className, onComplete }: CountdownProps): ReactNode {
  const targetMs = useMemo(
    () => (endsAt instanceof Date ? endsAt.getTime() : new Date(endsAt).getTime()),
    [endsAt],
  );

  const daysRef = useRef<HTMLSpanElement>(null);
  const hoursRef = useRef<HTMLSpanElement>(null);
  const minutesRef = useRef<HTMLSpanElement>(null);
  const secondsRef = useRef<HTMLSpanElement>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;

    const tick = (): void => {
      const p = partsFrom(targetMs);
      if (daysRef.current) daysRef.current.textContent = faPad(p.days);
      if (hoursRef.current) hoursRef.current.textContent = faPad(p.hours);
      if (minutesRef.current) minutesRef.current.textContent = faPad(p.minutes);
      if (secondsRef.current) secondsRef.current.textContent = faPad(p.seconds);
      if (p.done && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };

    tick(); // paint immediately, don't wait 1s
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetMs, onComplete]);

  // Render a STATIC placeholder during SSR + initial client render so the two
  // are byte-identical (time-based values would differ by a tick and trip a
  // hydration mismatch). The mount effect's first `tick()` fills real values
  // within a frame.
  const blocks: Array<{ ref: React.RefObject<HTMLSpanElement>; label: string }> = [
    { ref: daysRef, label: 'روز' },
    { ref: hoursRef, label: 'ساعت' },
    { ref: minutesRef, label: 'دقیقه' },
    { ref: secondsRef, label: 'ثانیه' },
  ];

  return (
    <div
      dir="rtl"
      role="timer"
      aria-label="زمان باقی‌مانده تا پایان فروش ویژه"
      className={cn('flex items-center gap-1.5', className)}
    >
      {blocks.map((block, index) => (
        <div key={block.label} className="flex items-center gap-1.5">
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-xl',
              glassInset,
              compact ? 'min-w-[2.25rem] px-1.5 py-1' : 'min-w-[3rem] px-2 py-1.5',
            )}
          >
            <span
              ref={block.ref}
              suppressHydrationWarning
              className={cn('font-black tabular-nums text-foreground', compact ? 'text-sm' : 'text-lg')}
            >
              {faPad(0)}
            </span>
            <span className={cn('text-foreground/45', compact ? 'text-[9px]' : 'text-[10px]')}>
              {block.label}
            </span>
          </div>
          {index < blocks.length - 1 && (
            <span className={cn('font-black text-gold', compact ? 'text-xs' : 'text-base')} aria-hidden>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default Countdown;
