'use client';

/**
 * GhestShop — Solais-inspired 3D Inertia Hero Carousel
 * ------------------------------------------------------------------
 * Auto-playing mixed-slide carousel (premium products + editorial). The active
 * product hardware:
 *   • Breathes with a slow sine float loop (y: 0 → -12 → 0).
 *   • Reacts to the cursor with high-inertia 3D tilt (rotateX/rotateY on a
 *     perspective:1000 grid) — the Solais "alive header" feel.
 * Headlines rise out of a mask via synchronized EASE_EXPO reveals on each
 * slide change. Auto-advance pauses on hover. Fully reduced-motion aware.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Newspaper, Sparkles } from 'lucide-react';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass } from '@/lib/glass';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

export type HeroSlide =
  | {
      readonly kind: 'product';
      readonly id: string;
      readonly tag: string;
      readonly title: string;
      readonly subtitle: string;
      readonly image: string;
      readonly href: string;
      readonly priceFrom: number;
    }
  | {
      readonly kind: 'editorial';
      readonly id: string;
      readonly tag: string;
      readonly title: string;
      readonly subtitle: string;
      readonly image: string;
      readonly href: string;
    };

const AUTOPLAY_MS = 6000;

function RevealLine({ children, delay }: { children: ReactNode; delay: number }): ReactNode {
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

export interface HeroCarouselProps {
  slides: HeroSlide[];
  className?: string;
}

export function HeroCarousel({ slides, className }: HeroCarouselProps): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  // Cursor-tracked 3D tilt (high inertia via spring).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [14, -14]), { stiffness: 120, damping: 16 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 16 });

  // Dynamic lighting response (ui-ux-pro-max Spatial-UI guidance): a specular
  // glare that tracks the cursor so the hardware catches the "light source"
  // as it tilts.
  const glareX = useTransform(px, [-0.5, 0.5], [22, 78]);
  const glareY = useTransform(py, [-0.5, 0.5], [22, 78]);
  const glare = useMotionTemplate`radial-gradient(140px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.5), transparent 60%)`;

  const count = slides.length;
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      if (!pausedRef.current) setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reduceMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - rect.left) / rect.width - 0.5);
      py.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [px, py, reduceMotion],
  );

  const resetTilt = useCallback(() => {
    px.set(0);
    py.set(0);
  }, [px, py]);

  if (count === 0) return null;
  const slide = slides[index];

  return (
    <section
      dir="rtl"
      aria-roledescription="carousel"
      aria-label="اسلایدر اصلی فروشگاه"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
        resetTilt();
      }}
      onMouseMove={onMouseMove}
      className={cn(
        glassClass('hero', 'relative grid min-h-[24rem] grid-cols-1 overflow-hidden rounded-3xl md:min-h-[28rem] md:grid-cols-2'),
        className,
      )}
    >
      {/* Ambient depth glows */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F59E0B]/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#7C3AED]/15 blur-3xl" />

      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_EXPO }}
          className="relative z-10 contents"
        >
          {/* Text panel (right in RTL) */}
          <div className="flex flex-col justify-center gap-5 p-8 sm:p-10">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-foreground/10 px-3 py-1 text-xs font-semibold text-gold">
              {slide.kind === 'product' ? <Sparkles className="h-3.5 w-3.5" /> : <Newspaper className="h-3.5 w-3.5" />}
              {slide.tag}
            </span>

            <h2 className="text-3xl font-black leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {reduceMotion ? (
                slide.title
              ) : (
                <RevealLine delay={0.1}>{slide.title}</RevealLine>
              )}
            </h2>

            <p className="max-w-md text-sm text-foreground/65 sm:text-base">{slide.subtitle}</p>

            {slide.kind === 'product' && (
              <p className="text-sm text-foreground/55">
                اقساط از{' '}
                <span className="text-lg font-black tabular-nums text-gold">
                  {formatToman(slide.priceFrom, { withSuffix: false })}
                </span>{' '}
                تومان در ماه
              </p>
            )}

            <Link
              href={slide.href}
              className={cn(
                'inline-flex w-fit items-center gap-2 rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-bold text-[#1C1917]',
                'shadow-lg shadow-[#F59E0B]/25 transition-[filter] hover:brightness-110',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
              )}
            >
              {slide.kind === 'product' ? 'مشاهده و خرید اقساطی' : 'مطالعه بیشتر'}
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {/* Visual panel (left in RTL) */}
          <div className="relative flex items-center justify-center p-6 sm:p-10" style={{ perspective: 1000 }}>
            {slide.kind === 'product' ? (
              <motion.div
                style={reduceMotion ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
                className="relative aspect-square w-full max-w-sm"
              >
                <motion.img
                  src={slide.image}
                  alt={slide.title}
                  animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
                  transition={reduceMotion ? undefined : { duration: 5, ease: 'easeInOut', repeat: Infinity }}
                  className="h-full w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]"
                  style={{ transform: 'translateZ(40px)' }}
                />
                {!reduceMotion && (
                  <motion.span
                    aria-hidden
                    style={{ background: glare, transform: 'translateZ(60px)' }}
                    className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                  />
                )}
              </motion.div>
            ) : (
              <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border border-foreground/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="اسلاید بعدی"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-foreground/10 text-foreground/80 backdrop-blur-sm transition-colors hover:bg-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`اسلاید ${toPersianDigits(i + 1)}`}
              aria-current={i === index}
              className={cn(
                'h-1.5 cursor-pointer rounded-full transition-all',
                i === index ? 'w-6 bg-[#F59E0B]' : 'w-1.5 bg-foreground/30 hover:bg-foreground/50',
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="اسلاید قبلی"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-foreground/10 text-foreground/80 backdrop-blur-sm transition-colors hover:bg-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </section>
  );
}

export default HeroCarousel;
