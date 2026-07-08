'use client';

/**
 * GhestShop — Cinematic Bento Hero (Helix-bridge)
 * ------------------------------------------------------------------
 * Upgrades over the static bento:
 *   • Per-line MASK REVEAL of the headline (text rises out of a clip floor).
 *   • Expo-out staggered entrance of every zone (cinematic settle, not bounce).
 *   • Pointer-tracked spotlight on Zone A + mouse-parallax ambient blobs.
 *   • Zone C live metric counter retained.
 * Spring is reserved for interaction; EASE_EXPO drives all entrance motion.
 * Fully reduced-motion aware (reveals collapse to a plain fade / no parallax).
 */

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { ArrowLeft, Calculator, Sparkles, TrendingUp } from 'lucide-react';
import { usePointerGlow } from '@/components/store/use-pointer-glow';
import { EASE_EXPO, reveal } from '@/lib/motion';
import { glassClass } from '@/lib/glass';
import { toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

/** A headline line that rises out of an invisible floor (Helix mask reveal). */
function RevealLine({
  children,
  delay,
  reduceMotion,
}: {
  children: ReactNode;
  delay: number;
  reduceMotion: boolean;
}): ReactNode {
  if (reduceMotion) return <span className="block">{children}</span>;
  return (
    <span className="block overflow-hidden pb-1">
      <motion.span
        className="block"
        initial={{ y: '110%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.9, delay, ease: EASE_EXPO }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function MetricCounter({ value, reduceMotion }: { value: number; reduceMotion: boolean }): ReactNode {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  useMotionValueEvent(count, 'change', (latest) => setDisplay(Math.round(latest)));
  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(count, value, { duration: 1.8, ease: EASE_EXPO });
    return () => controls.stop();
  }, [value, reduceMotion, count]);
  return <>{toPersianDigits(display.toLocaleString('en-US')).replace(/,/g, '٬')}</>;
}

export interface HeroBentoProps {
  capitalBillion?: number;
  className?: string;
}

export function HeroBento({ capitalBillion = 4_850, className }: HeroBentoProps): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const glow = usePointerGlow({ size: 460, color: 'rgba(64,125,192,0.16)' });

  // Mouse-parallax for the ambient blobs (subtle counter-drift for depth).
  const blobAX = useTransform(glow.mx, [0, 100], [16, -16]);
  const blobAY = useTransform(glow.my, [0, 100], [16, -16]);
  const blobBX = useTransform(glow.mx, [0, 100], [-12, 12]);
  const blobBY = useTransform(glow.my, [0, 100], [-12, 12]);

  const fade = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
      : {
          initial: { opacity: 0, y: 22, filter: 'blur(8px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: reveal(delay),
        };

  return (
    <section dir="rtl" className={cn('grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2', className)}>
      {/* Zone A — cinematic banner */}
      <motion.div
        {...fade(0)}
        onMouseMove={glow.onMouseMove}
        className={cn(
          glassClass('hero', 'group relative flex flex-col justify-between overflow-hidden rounded-3xl p-8 md:col-span-2 md:row-span-2'),
        )}
      >
        {/* Pointer-tracked spotlight */}
        <motion.div
          aria-hidden
          style={{ background: glow.background }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
        {/* Mouse-parallax ambient blobs */}
        <motion.div
          aria-hidden
          style={reduceMotion ? undefined : { x: blobAX, y: blobAY }}
          className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[#407DC0]/20 blur-3xl"
        />
        <motion.div
          aria-hidden
          style={reduceMotion ? undefined : { x: blobBX, y: blobBY }}
          className="pointer-events-none absolute -bottom-24 -right-10 h-60 w-60 rounded-full bg-[#38BDF8]/20 blur-3xl"
        />

        <div className="relative z-10">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reveal(0.15)}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-sm font-semibold text-gold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            خرید اقساطی هوشمند
          </motion.span>

          <h1 className="mt-5 text-3xl font-black leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            <RevealLine delay={0.25} reduceMotion={reduceMotion}>
              جدیدترین موبایل و کالای دیجیتال،
            </RevealLine>
            <RevealLine delay={0.36} reduceMotion={reduceMotion}>
              <span className="bg-gradient-to-l from-[#407DC0] to-[#38BDF8] bg-clip-text text-transparent">
                با اقساط بدون دغدغه
              </span>
            </RevealLine>
          </h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reveal(0.52)}
            className="mt-4 max-w-lg text-sm text-foreground/65 sm:text-base"
          >
            اعتبارسنجی آنی، پیش‌پرداخت دلخواه و بازپرداخت تا ۲۴ ماه. همین حالا اقساط خود را بسازید.
          </motion.p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reveal(0.62)}
          className="relative z-10 mt-8 flex flex-wrap gap-3"
        >
          <Link
            href="/brand/apple"
            className={cn(
              'inline-flex items-center gap-2 rounded-xl bg-[#407DC0] px-6 py-3 text-sm font-bold text-white',
              'shadow-lg shadow-[#407DC0]/25 transition-[filter] hover:brightness-110',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
            )}
          >
            شروع خرید اقساطی
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/apply"
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border border-foreground/15 px-6 py-3 text-sm font-bold text-foreground',
              'transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]',
            )}
          >
            اعتبارسنجی رایگان
          </Link>
        </motion.div>
      </motion.div>

      {/* Zone B — calculator shortcut */}
      <motion.div {...fade(0.18)} className="md:col-span-1">
        <Link
          href="/apply"
          className={cn(
            glassClass('card', 'group flex h-full flex-col justify-between gap-4 rounded-3xl p-6'),
            'transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]',
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#407DC0]/12 text-gold">
            <Calculator className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">محاسبه‌گر اقساط</h2>
            <p className="mt-1 text-sm text-foreground/55">مبلغ قسط ماهانه خود را پیش از خرید برآورد کنید.</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-gold">
            محاسبه کنید
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden />
          </span>
        </Link>
      </motion.div>

      {/* Zone C — live metric */}
      <motion.div
        {...fade(0.28)}
        className={cn(glassClass('card', 'flex flex-col justify-between gap-3 rounded-3xl p-6'), 'md:col-span-1')}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#407DC0]/15 text-gold">
          <TrendingUp className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="text-2xl font-black tabular-nums text-foreground">
            <MetricCounter value={capitalBillion} reduceMotion={reduceMotion} />
            <span className="mr-1 text-sm font-bold text-foreground/60">میلیارد تومان</span>
          </p>
          <p className="mt-1 text-sm text-foreground/55">سرمایه تأمین‌شده برای مشتریان</p>
        </div>
      </motion.div>
    </section>
  );
}

export default HeroBento;
