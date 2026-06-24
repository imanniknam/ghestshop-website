'use client';

/**
 * GhestShop — Flash Sale Panel (Helix-grade aura)
 * ------------------------------------------------------------------
 * The lightning card now reads as *alive*, layering four effects behind/over an
 * opaque inner panel:
 *   1. Breathing ambient HALO around the card (gold→purple, slow opacity pulse).
 *   2. A conic ring rotating clockwise (the energy border).
 *   3. A second, slower counter-rotating conic at low opacity for depth.
 *   4. A cursor-tracked spotlight over the content (the Awwwards "mouse effect").
 * All four collapse to a single static ring under prefers-reduced-motion.
 *
 * The embedded <Countdown /> mutates its own DOM nodes, so ticking never
 * re-renders this card or restarts the auras.
 */

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Transition } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import { Countdown } from '@/components/store/countdown';
import { usePointerGlow } from '@/components/store/use-pointer-glow';
import type { FlashOfferVM } from '@/lib/store/types';
import { glassClass, glassInset } from '@/lib/glass';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

const ROTATE: Transition = { duration: 8, ease: 'linear', repeat: Infinity };
const ROTATE_SLOW: Transition = { duration: 16, ease: 'linear', repeat: Infinity };
const BREATHE: Transition = { duration: 5, ease: 'easeInOut', repeat: Infinity };
const CONIC = 'conic-gradient(from 0deg, #F59E0B, #7C3AED, #F59E0B)';
const CONIC_ALT = 'conic-gradient(from 180deg, #7C3AED, #F59E0B, #7C3AED)';

export interface OfferProduct {
  readonly title: string;
  readonly image: string;
}

export interface FlashSalePanelProps {
  offers: FlashOfferVM[];
  lookup: Record<string, OfferProduct>;
  className?: string;
}

function discountPercent(original: number, current: number): number {
  if (original <= 0 || current >= original) return 0;
  return Math.round((1 - current / original) * 100);
}

export function FlashSalePanel({ offers, lookup, className }: FlashSalePanelProps): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const glow = usePointerGlow({ size: 420, color: 'rgba(245,158,11,0.20)' });

  const [main, ...rest] = offers;
  if (!main) return null;

  return (
    <section dir="rtl" className={cn('flex flex-col gap-4', className)}>
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold">
          <Zap className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-lg font-black tracking-tight text-foreground">فروش‌های ویژه و رعد و برقی</h2>
      </header>

      {/* ---- Main lightning card (outer wrapper allows the halo to bleed) ---- */}
      <div className="relative">
        {/* 1 · Breathing ambient halo */}
        {!reduceMotion && (
          <motion.span
            aria-hidden
            className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] opacity-40 blur-3xl will-change-[opacity,transform]"
            animate={{ opacity: [0.3, 0.55, 0.3], scale: [0.98, 1.02, 0.98] }}
            transition={BREATHE}
          />
        )}

        <div
          onMouseMove={glow.onMouseMove}
          className="group relative overflow-hidden rounded-3xl p-[2px]"
        >
          {reduceMotion ? (
            <span aria-hidden className="absolute inset-[-50%]" style={{ background: CONIC }} />
          ) : (
            <>
              {/* 3 · Counter-rotating depth layer (behind) */}
              <motion.span
                aria-hidden
                className="absolute inset-[-60%] opacity-40 blur-[2px] will-change-transform"
                style={{ background: CONIC_ALT }}
                animate={{ rotate: -360 }}
                transition={ROTATE_SLOW}
              />
              {/* 2 · Primary energy ring */}
              <motion.span
                aria-hidden
                className="absolute inset-[-50%] will-change-transform"
                style={{ background: CONIC }}
                animate={{ rotate: 360 }}
                transition={ROTATE}
              />
            </>
          )}

          {/* Opaque inner panel masks the centre, leaving only the ring */}
          <div className="relative z-10 overflow-hidden rounded-[1.4rem] bg-background">
            {/* 4 · Cursor-tracked spotlight over content */}
            <motion.div
              aria-hidden
              style={{ background: glow.background }}
              className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
            <MainOffer offer={main} product={lookup[main.productId]} reduceMotion={reduceMotion} />
          </div>
        </div>
      </div>

      {/* ---- Secondary offers ---- */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rest.map((offer) => (
            <SecondaryOffer key={offer.id} offer={offer} product={lookup[offer.productId]} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
//  Main offer
// ---------------------------------------------------------------------------

function MainOffer({
  offer,
  product,
  reduceMotion,
}: {
  offer: FlashOfferVM;
  product?: OfferProduct;
  reduceMotion: boolean;
}): ReactNode {
  const off = useMemo(
    () => discountPercent(offer.originalPrice, offer.currentPrice),
    [offer.originalPrice, offer.currentPrice],
  );
  const title = product?.title ?? 'محصول ویژه';

  return (
    <div className="relative grid grid-cols-1 gap-6 p-6 sm:grid-cols-[1fr_1.2fr] sm:items-center">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.05] to-transparent p-4">
        {product?.image ? (
          <motion.img
            src={product.image}
            alt={title}
            initial={reduceMotion ? false : { scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">بدون تصویر</div>
        )}
        {off > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-[#7C3AED] px-3 py-1 text-xs font-black text-white">
            ٪{toPersianDigits(off)}− تخفیف
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-black tracking-tight text-foreground">{title}</h3>

        <div className="flex items-baseline gap-3">
          {offer.originalPrice > offer.currentPrice && (
            <span className="text-sm text-foreground/40 line-through tabular-nums">
              {formatToman(offer.originalPrice, { withSuffix: false })}
            </span>
          )}
          <span className="text-2xl font-black tabular-nums text-foreground">
            {formatToman(offer.currentPrice)}
          </span>
        </div>

        <div className={cn('flex items-baseline justify-between rounded-xl px-4 py-2.5', glassInset)}>
          <span className="text-xs text-foreground/60">اقساط از</span>
          <span className="text-base font-black tabular-nums text-gold">
            {formatToman(offer.monthlyInstallment, { withSuffix: false })}
            <span className="mr-1 text-[11px] font-normal text-gold/70">تومان / ماه</span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-foreground/55">پایان فروش ویژه:</span>
          <Countdown endsAt={offer.countdownEndsAt} />
        </div>

        <Link
          href={`/product/${offer.productId}`}
          className={cn(
            'mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] py-3 text-sm font-bold text-[#1C1917]',
            'shadow-lg shadow-[#F59E0B]/25 transition-[filter] hover:brightness-110',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          )}
        >
          {reduceMotion ? null : <Zap className="h-4 w-4" aria-hidden />}
          خرید اقساطی فوری
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Secondary offer (compact)
// ---------------------------------------------------------------------------

function SecondaryOffer({ offer, product }: { offer: FlashOfferVM; product?: OfferProduct }): ReactNode {
  const off = discountPercent(offer.originalPrice, offer.currentPrice);
  const title = product?.title ?? 'محصول ویژه';

  return (
    <Link
      href={`/product/${offer.productId}`}
      className={cn(
        glassClass('card', 'group flex items-center gap-4 rounded-2xl p-4'),
        'transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
      )}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-foreground/5 p-2">
        {product?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={title} className="h-full w-full object-contain" />
        ) : null}
        {off > 0 && (
          <span className="absolute right-1 top-1 rounded-full bg-[#7C3AED] px-1.5 py-0.5 text-[9px] font-bold text-white">
            ٪{toPersianDigits(off)}−
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h4 className="truncate text-sm font-bold text-foreground">{title}</h4>
        <span className="text-sm font-black tabular-nums text-gold">{formatToman(offer.currentPrice)}</span>
        <Countdown endsAt={offer.countdownEndsAt} compact />
      </div>
    </Link>
  );
}

export default FlashSalePanel;
