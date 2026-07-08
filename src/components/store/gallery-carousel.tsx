'use client';

/**
 * GhestShop — Shared-Element Swatch Gallery
 * ------------------------------------------------------------------
 * RTL product gallery whose main image is bound to the selected colour. Tapping
 * a swatch (or thumbnail) crossfades the main image to that colour's variant.
 * The active colour is controlled by the parent so the same selection drives
 * the conversion island (cart payload). Keyboard arrows cycle variants; the
 * thumbnail track is scroll-snap + RTL with the active thumb aligned right.
 */

import { useCallback, useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { swatchHex } from '@/lib/store/colors';
import { cn } from '@/lib/utils';

export interface ColorVariant {
  readonly color: string;
  readonly image: string;
}

export interface GalleryCarouselProps {
  title: string;
  variants: ColorVariant[];
  activeColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

export function GalleryCarousel({
  title,
  variants,
  activeColor,
  onColorChange,
  className,
}: GalleryCarouselProps): ReactNode {
  const reduceMotion = useReducedMotion();
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  const activeIndex = Math.max(
    0,
    variants.findIndex((v) => v.color === activeColor),
  );
  const active = variants[activeIndex] ?? variants[0];

  // Keep the selected thumbnail in view, aligned to the right edge (RTL).
  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
  }, [activeIndex]);

  const step = useCallback(
    (delta: number) => {
      if (variants.length === 0) return;
      const next = (activeIndex + delta + variants.length) % variants.length;
      onColorChange(variants[next].color);
    },
    [variants, activeIndex, onColorChange],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // In RTL, ArrowLeft advances (content flows right→left), ArrowRight goes back.
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(-1);
      }
    },
    [step],
  );

  if (!active) return null;

  return (
    <div
      dir="rtl"
      role="group"
      aria-label={`گالری تصاویر ${title}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        'flex flex-col gap-4 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]',
        className,
      )}
    >
      {/* Main image with colour crossfade */}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-b from-white/[0.05] to-transparent">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={active.image}
            src={active.image}
            alt={`${title} — ${active.color}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            className="absolute inset-0 h-full w-full object-contain p-8"
          />
        </AnimatePresence>

        {/* Position indicator (aligned right in RTL) */}
        <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-sm font-bold text-white/80 backdrop-blur-sm tabular-nums">
          {toFa(activeIndex + 1)} / {toFa(variants.length)}
        </div>
      </div>

      {/* Swatch dots */}
      <div className="flex items-center gap-2" role="radiogroup" aria-label="انتخاب رنگ">
        {variants.map((variant) => {
          const isActive = variant.color === active.color;
          return (
            <button
              key={variant.color}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={variant.color}
              title={variant.color}
              onClick={() => onColorChange(variant.color)}
              className={cn(
                'h-7 w-7 cursor-pointer rounded-full border transition-transform',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                isActive
                  ? 'scale-110 border-[#407DC0] ring-2 ring-[#407DC0]/40'
                  : 'border-foreground/20 hover:scale-105',
              )}
              style={{ backgroundColor: swatchHex(variant.color) }}
            />
          );
        })}
        <span className="mr-1 text-sm text-foreground/55">{active.color}</span>
      </div>

      {/* Thumbnail track — scroll-snap, RTL */}
      <div
        dir="rtl"
        className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {variants.map((variant, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={variant.color}
              ref={isActive ? activeThumbRef : undefined}
              type="button"
              aria-label={`نمایش ${variant.color}`}
              aria-current={isActive}
              onClick={() => onColorChange(variant.color)}
              style={{ scrollSnapAlign: 'end' }}
              className={cn(
                'relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]',
                isActive ? 'border-[#407DC0]' : 'border-foreground/10 hover:border-foreground/30',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={variant.image} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" />
              {isActive && (
                <motion.span
                  layoutId="gallery-thumb-active"
                  className="absolute inset-0 rounded-xl ring-2 ring-inset ring-[#407DC0]"
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toFa = (n: number): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

export default GalleryCarousel;
