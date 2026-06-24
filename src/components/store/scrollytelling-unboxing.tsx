'use client';

/**
 * GhestShop — Scroll-Linked Exploded Unboxing
 * ------------------------------------------------------------------
 * An Apple-grade hardware reveal locked inside a `h-[400vh]` track whose inner
 * stage is `sticky top-0 h-screen`. Scroll progress (driven by Lenis) maps to
 * four cinematic phases on a `perspective: 1200px` 3D field:
 *   1. Lid Lift        (0–25%)   — the box lid rises and tilts away.
 *   2. Levitation      (25–50%)  — the phone scales forward, the box fades.
 *   3. Gyro Rotation   (50–75%)  — the chassis spins 0→360° on its Y axis.
 *   4. Exploded View   (75–100%) — layers separate along Z; glowing spec nodes
 *                                  fade in with thin glass lines.
 * Real device imagery (Unsplash CDN). Reduced-motion users get a calm static
 * hero instead of the scroll lock.
 */

import { useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';
import { Layers, MousePointerClick } from 'lucide-react';
import { DEVICE_MEDIA } from '@/lib/store/media';
import { glassInset } from '@/lib/glass';
import { cn } from '@/lib/utils';

const PHASES = [
  { title: 'جعبه را باز کنید', hint: 'با اسکرول، درب جعبه‌ی لوکس را بردارید' },
  { title: 'دستگاه آزاد می‌شود', hint: 'گوشی از تری جدا و به جلو می‌آید' },
  { title: 'نمای ۳۶۰ درجه', hint: 'چرخش کامل بدنه‌ی لبه‌به‌لبه' },
  { title: 'کالبدشکافی سخت‌افزار', hint: 'لایه‌های دستگاه و مشخصات فنی' },
] as const;

const SPEC_LAYERS = [
  { label: 'نمایشگر OLED سوپررتینا', sub: '۶.۷ اینچ · ۱۲۰ هرتز' },
  { label: 'دوربین سه‌گانه', sub: '۴۸ مگاپیکسل اصلی' },
  { label: 'هسته‌ی باتری', sub: '۴۴۲۲ میلی‌آمپرساعت' },
  { label: 'بدنه‌ی تیتانیومی', sub: 'مقاوم و سبک' },
] as const;

export interface ScrollytellingUnboxingProps {
  className?: string;
}

export function ScrollytellingUnboxing({ className }: ScrollytellingUnboxingProps): ReactNode {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setPhase(p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3);
  });

  // Phase 1 — lid lift
  const lidY = useTransform(scrollYProgress, [0, 0.25], ['0%', '-130%']);
  const lidRotateX = useTransform(scrollYProgress, [0, 0.25], [0, -88]);
  const lidOpacity = useTransform(scrollYProgress, [0.16, 0.3], [1, 0]);
  // Phase 2 — levitation
  const phoneScale = useTransform(scrollYProgress, [0.25, 0.5], [0.72, 1]);
  const phoneLift = useTransform(scrollYProgress, [0.1, 0.5], ['10%', '0%']);
  const boxOpacity = useTransform(scrollYProgress, [0.3, 0.48], [1, 0]);
  const boxScale = useTransform(scrollYProgress, [0.3, 0.5], [1, 0.92]);
  // Phase 3 — gyro
  const phoneRotateY = useTransform(scrollYProgress, [0.5, 0.72], [0, 360]);
  // Phase 4 — exploded (Z + Y spread)
  const dispZ = useTransform(scrollYProgress, [0.75, 1], [0, 150]);
  const dispY = useTransform(scrollYProgress, [0.75, 1], [0, 120]);
  const camZ = useTransform(scrollYProgress, [0.75, 1], [0, 60]);
  const camY = useTransform(scrollYProgress, [0.75, 1], [0, 40]);
  const batZ = useTransform(scrollYProgress, [0.75, 1], [0, -70]);
  const batY = useTransform(scrollYProgress, [0.75, 1], [0, -40]);
  const backZ = useTransform(scrollYProgress, [0.75, 1], [0, -170]);
  const backY = useTransform(scrollYProgress, [0.75, 1], [0, -120]);
  const nodeOpacity = useTransform(scrollYProgress, [0.84, 1], [0, 1]);
  const layerOpacity = useTransform(scrollYProgress, [0.74, 0.82], [0, 1]);

  // Reduced motion: a calm static hero (no scroll lock).
  if (reduceMotion) {
    return (
      <section dir="rtl" className={cn('relative overflow-hidden rounded-3xl', className)}>
        <div className="flex flex-col items-center gap-6 px-4 py-16 text-center">
          <h2 className="text-3xl font-black text-foreground">کالبدشکافی سخت‌افزار</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DEVICE_MEDIA.phoneHero} alt="گوشی پرچم‌دار" className="h-72 w-auto rounded-3xl object-cover" />
          <p className="max-w-md text-sm text-foreground/60">
            هر دستگاه با دقت مهندسی شده است؛ از نمایشگر OLED تا بدنه‌ی تیتانیومی.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section dir="rtl" ref={ref} className={cn('relative h-[400vh]', className)}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* Ambient depth glows */}
        <div aria-hidden className="pointer-events-none absolute -right-32 top-1/4 h-72 w-72 rounded-full bg-[#F59E0B]/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-24 bottom-1/4 h-72 w-72 rounded-full bg-[#7C3AED]/15 blur-3xl" />

        {/* Caption */}
        <div className="absolute right-1/2 top-10 z-20 flex translate-x-1/2 flex-col items-center gap-1 text-center">
          <span className="flex items-center gap-1.5 text-xs font-bold text-gold">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            تجربه‌ی کشف محصول
          </span>
          <h2 className="text-2xl font-black text-foreground sm:text-3xl">{PHASES[phase].title}</h2>
          <p className="text-xs text-foreground/55">{PHASES[phase].hint}</p>
        </div>

        {/* 3D stage */}
        <div className="relative flex h-[28rem] w-full items-center justify-center" style={{ perspective: 1200 }}>
          <div className="relative h-[26rem] w-[13rem]" style={{ transformStyle: 'preserve-3d' }}>
            {/* Box base */}
            <motion.div
              aria-hidden
              style={{ opacity: boxOpacity, scale: boxScale }}
              className="absolute inset-x-[-8%] bottom-[-4%] top-[8%] rounded-[2rem] border border-foreground/15 bg-gradient-to-b from-[#1b2236] to-[#0c1120] shadow-2xl"
            />
            {/* Box lid */}
            <motion.div
              aria-hidden
              style={{ y: lidY, rotateX: lidRotateX, opacity: lidOpacity, transformOrigin: 'top center' }}
              className="absolute inset-x-[-8%] top-[6%] h-16 rounded-[2rem] border border-foreground/15 bg-gradient-to-b from-[#222b44] to-[#161c2e] shadow-xl"
            >
              <span className="absolute inset-x-0 top-1/2 mx-auto h-px w-1/3 -translate-y-1/2 bg-gradient-to-l from-[#F59E0B]/60 to-transparent" />
            </motion.div>

            {/* Phone group (levitates, rotates, then explodes) */}
            <motion.div
              style={{ scale: phoneScale, y: phoneLift, rotateY: phoneRotateY, transformStyle: 'preserve-3d' }}
              className="absolute inset-0"
            >
              <DeviceFrame z={backZ} y={backY} opacity={layerOpacity} tone="from-[#3a3f52] to-[#22262f]" />
              <DeviceFrame z={batZ} y={batY} opacity={layerOpacity} tone="from-emerald-700/70 to-emerald-900/60" />
              <DeviceFrame z={camZ} y={camY} opacity={layerOpacity} tone="from-[#2a2f45] to-[#14182a]" showCamera />
              {/* Display layer = the real device image */}
              <motion.div
                style={{ z: dispZ, y: dispY }}
                className="absolute inset-0 overflow-hidden rounded-[2rem] border border-foreground/20 shadow-2xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={DEVICE_MEDIA.phoneHero} alt="گوشی هوشمند" className="h-full w-full object-cover" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </motion.div>
            </motion.div>

            {/* Spec nodes (exploded phase) */}
            <motion.div style={{ opacity: nodeOpacity }} className="pointer-events-none absolute inset-0 z-10">
              {SPEC_LAYERS.map((spec, i) => (
                <div
                  key={spec.label}
                  className="absolute right-full mr-4 w-44"
                  style={{ top: `${10 + i * 26}%` }}
                >
                  <div className={cn('rounded-xl px-3 py-2 text-right', glassInset)}>
                    <p className="flex items-center justify-end gap-1.5 text-xs font-bold text-foreground">
                      {spec.label}
                      <span className="h-2 w-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_2px_rgba(245,158,11,0.6)]" />
                    </p>
                    <p className="text-[10px] text-foreground/55">{spec.sub}</p>
                  </div>
                  <span className="absolute left-0 top-1/2 h-px w-4 -translate-x-full bg-gradient-to-l from-[#F59E0B] to-transparent" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Phase progress + scroll hint */}
        <div className="absolute bottom-10 right-1/2 z-20 flex translate-x-1/2 flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            {PHASES.map((p, i) => (
              <span
                key={p.title}
                className={cn('h-1.5 rounded-full transition-all', i === phase ? 'w-6 bg-[#F59E0B]' : 'w-1.5 bg-foreground/25')}
              />
            ))}
          </div>
          {phase === 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-foreground/45">
              <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
              برای کاوش اسکرول کنید
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/** A device-shaped translucent layer used for the exploded internal components. */
function DeviceFrame({
  z,
  y,
  opacity,
  tone,
  showCamera = false,
}: {
  z: MotionValue<number>;
  y: MotionValue<number>;
  opacity: MotionValue<number>;
  tone: string;
  showCamera?: boolean;
}): ReactNode {
  return (
    <motion.div
      aria-hidden
      style={{ z, y, opacity }}
      className={cn('absolute inset-0 rounded-[2rem] border border-foreground/10 bg-gradient-to-b shadow-xl', tone)}
    >
      {showCamera && (
        <span className="absolute right-4 top-4 flex gap-1.5">
          <span className="h-5 w-5 rounded-full bg-black/60 ring-1 ring-foreground/20" />
          <span className="h-5 w-5 rounded-full bg-black/60 ring-1 ring-foreground/20" />
          <span className="h-5 w-5 rounded-full bg-black/60 ring-1 ring-foreground/20" />
        </span>
      )}
    </motion.div>
  );
}

export default ScrollytellingUnboxing;
