'use client';

/**
 * GhestShop — Faux-Glass Product Card (Helix-bridge)
 * ------------------------------------------------------------------
 * Still GPU-cheap (glassCard tier, no backdrop-filter) but elevated:
 *   • SCROLL-BOUND PARALLAX — the phone image drifts counter to scroll, giving
 *     a layered, high-fashion-hardware depth as the grid moves.
 *   • Scroll-reveal entrance (expo-out settle, fires once in view).
 *   • Tighter typographic rhythm + a soft floor shadow under the device.
 *   • Hover lift + glide highlight + count-up retained (spring for interaction).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type Transition,
  type Variants,
} from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { ProductCardVM } from '@/lib/store/types';
import { swatchHex } from '@/lib/store/colors';
import { glassClass, glassInset, glassSheen } from '@/lib/glass';
import { EASE_EXPO, SPRING } from '@/lib/motion';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

const ENTER: Transition = { duration: 0.7, ease: EASE_EXPO };

const highlightVariants: Variants = {
  hidden: { x: '-150%', opacity: 0 },
  rest: { x: '-150%', opacity: 0 },
  hover: { x: '150%', opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } },
};

/** Springs a Toman figure from 0 → target on mount (spring {300,20}). */
function CountUpToman({ value, reduceMotion }: { value: number; reduceMotion: boolean }): ReactNode {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  useMotionValueEvent(count, 'change', (latest) => setDisplay(Math.round(latest)));
  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    count.set(0);
    const controls = animate(count, value, { type: 'spring', stiffness: 300, damping: 20, restDelta: 5000 });
    return () => controls.stop();
  }, [value, reduceMotion, count]);
  return <>{formatToman(display, { withSuffix: false })}</>;
}

export interface ProductCardProps {
  product: ProductCardVM;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const cardRef = useRef<HTMLElement>(null);
  const colors = product.colors.slice(0, 5);
  const extraColors = product.colors.length - colors.length;

  // Scroll-bound parallax: image drifts as the card travels through the viewport.
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['10%', '-10%']);

  const cardVariants: Variants = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26 },
    rest: { opacity: 1, y: 0, transition: ENTER },
    hover: { y: -6, transition: SPRING },
  };

  return (
    <motion.article
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      whileInView="rest"
      whileHover={reduceMotion ? undefined : 'hover'}
      whileFocus={reduceMotion ? undefined : 'hover'}
      viewport={{ once: true, amount: 0.2 }}
      className={cn(
        glassClass('card', 'group relative flex flex-col overflow-hidden rounded-3xl', glassSheen),
        className,
      )}
    >
      {/* Hover-glide highlight */}
      {!reduceMotion && (
        <motion.span
          aria-hidden
          variants={highlightVariants}
          className="pointer-events-none absolute inset-y-0 -left-1/3 z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      )}

      {/* Flash-sale ribbon */}
      {product.isFlashSale && (
        <span className="absolute right-3 top-3 z-20 rounded-full bg-[#F59E0B] px-2.5 py-1 text-[11px] font-black text-[#1C1917] shadow-lg shadow-[#F59E0B]/30">
          فروش ویژه
        </span>
      )}
      {product.discountPercent ? (
        <span className="absolute left-3 top-3 z-20 rounded-full bg-[#7C3AED] px-2.5 py-1 text-[11px] font-bold text-white">
          ٪{toPersianDigits(product.discountPercent)}−
        </span>
      ) : null}

      {/* Image — fixed aspect (CLS = 0), parallax drift + floor shadow */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-b from-white/[0.05] to-transparent">
        {/* soft hardware floor shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 bottom-5 h-6 rounded-[50%] bg-black/45 blur-md"
        />
        {product.image ? (
          <motion.img
            src={product.image}
            alt={product.title}
            loading="lazy"
            style={reduceMotion ? undefined : { y: imageY }}
            className="relative h-full w-full scale-[1.06] object-contain p-5 transition-transform duration-500 group-hover:scale-[1.12]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">بدون تصویر</div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-bold leading-snug tracking-tight text-foreground">
          {product.title}
        </h3>

        {/* Spec chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className={cn('rounded-lg px-2 py-1 text-[11px] font-medium', glassInset)}>
            {toPersianDigits(product.ram)} گیگ رم
          </span>
          <span className={cn('rounded-lg px-2 py-1 text-[11px] font-medium', glassInset)}>
            {formatStorage(product.storage)}
          </span>
        </div>

        {/* Colour swatches */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {colors.map((color) => (
              <span
                key={color}
                title={color}
                className="h-4 w-4 rounded-full border border-foreground/20 ring-1 ring-black/20"
                style={{ backgroundColor: swatchHex(color) }}
              />
            ))}
            {extraColors > 0 && (
              <span className="text-[11px] text-foreground/50">+{toPersianDigits(extraColors)}</span>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <div className={cn('flex items-baseline justify-between rounded-xl px-3 py-2', glassInset)}>
            <span className="text-[11px] text-foreground/60">از</span>
            <span className="text-sm font-black tabular-nums text-gold">
              <CountUpToman value={product.monthlyInstallmentFrom} reduceMotion={reduceMotion} />
              <span className="mr-1 text-[10px] font-normal text-gold/70">تومان / ماه</span>
            </span>
          </div>
          <p className="text-center text-[11px] text-foreground/45">
            قیمت نقدی: <span className="tabular-nums">{formatToman(product.cashPrice)}</span>
          </p>
        </div>

        {/* CTA */}
        <Link
          href={`/product/${product.id}`}
          className={cn(
            'mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#F59E0B] py-2.5 text-sm font-bold text-[#1C1917]',
            'shadow-lg shadow-[#F59E0B]/20 transition-[filter] hover:brightness-110',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          )}
        >
          مشاهده و خرید اقساطی
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </motion.article>
  );
}

/** "256" → "۲۵۶ گیگابایت"; "1024" → "۱ ترابایت". */
function formatStorage(storage: string): string {
  const gb = Number(storage);
  if (Number.isFinite(gb) && gb >= 1024 && gb % 1024 === 0) {
    return `${toPersianDigits(gb / 1024)} ترابایت`;
  }
  return `${toPersianDigits(storage)} گیگابایت`;
}

export default ProductCard;
