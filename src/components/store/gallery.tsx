'use client';

/**
 * GhestShop — Product Gallery (multi-image, 3D tilt)
 * ------------------------------------------------------------------
 * A large active viewport whose hardware tilts toward the cursor on a
 * perspective grid (Solais-inspired, high-inertia spring) with a floating
 * idle drift, paired with a row of animated, clickable thumbnails. Active image
 * crossfades. Strict RTL, reduced-motion safe.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProductGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toFa = (n: number): string => String(n).replace(/\d/g, (d) => FA[Number(d)]);

export function ProductGallery({ images, title, className }: ProductGalleryProps): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const [index, setIndex] = useState(0);
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  // Cursor-tracked 3D tilt (high inertia) + specular glare.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [12, -12]), { stiffness: 120, damping: 16 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 16 });
  const glareX = useTransform(px, [-0.5, 0.5], [25, 75]);
  const glareY = useTransform(py, [-0.5, 0.5], [25, 75]);
  const glare = useMotionTemplate`radial-gradient(150px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.45), transparent 60%)`;

  const list = images.length > 0 ? images : [''];
  const active = list[Math.min(index, list.length - 1)] ?? '';

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
  }, [index]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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

  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + list.length) % list.length),
    [list.length],
  );

  return (
    <div
      dir="rtl"
      role="group"
      aria-label={`گالری تصاویر ${title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          step(1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          step(-1);
        }
      }}
      className={cn('flex flex-col gap-4 outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] rounded-3xl', className)}
    >
      {/* Active viewport */}
      <div
        onMouseMove={onMouseMove}
        onMouseLeave={resetTilt}
        className="relative aspect-square w-full overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-b from-foreground/[0.05] to-transparent"
        style={{ perspective: 1000 }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={active}
            initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
            style={reduceMotion ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="absolute inset-0"
          >
            {active ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active}
                alt={`${title} — تصویر ${toFa(index + 1)}`}
                className="h-full w-full object-contain p-8 drop-shadow-[0_24px_36px_rgba(0,0,0,0.4)]"
                style={{ transform: 'translateZ(40px)' }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">بدون تصویر</div>
            )}
            {!reduceMotion && (
              <motion.span
                aria-hidden
                style={{ background: glare, transform: 'translateZ(60px)' }}
                className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white/80 backdrop-blur-sm tabular-nums">
          {toFa(index + 1)} / {toFa(list.length)}
        </div>
      </div>

      {/* Thumbnails */}
      {list.length > 1 && (
        <div
          dir="rtl"
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {list.map((src, i) => {
            const isActive = i === index;
            return (
              <button
                key={`${src}-${i}`}
                ref={isActive ? activeThumbRef : undefined}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`نمایش تصویر ${toFa(i + 1)}`}
                aria-current={isActive}
                style={{ scrollSnapAlign: 'end' }}
                className={cn(
                  'relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
                  isActive ? 'border-[#F59E0B]' : 'border-foreground/10 hover:border-foreground/30',
                )}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-contain p-1.5" />
                ) : null}
                {isActive && (
                  <motion.span
                    layoutId="product-gallery-active"
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute inset-0 rounded-xl ring-2 ring-inset ring-[#F59E0B]"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;
