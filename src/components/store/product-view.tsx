'use client';

/**
 * GhestShop — Product View (conversion wrapper)
 * ------------------------------------------------------------------
 * Holds the single source of truth for the selected colour and feeds it to BOTH
 * the gallery (image) and the conversion island (cart payload). The embedded
 * InstallmentCalculator is pre-locked to this product's cash price; on confirm
 * we push the fully-configured selection into the Zustand cart store and run a
 * "lightning morph" overlay before routing into the credit wizard (/apply).
 */

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Cpu, HardDrive, Loader2, Signal } from 'lucide-react';
import { ProductGallery } from '@/components/store/gallery';
import type { ColorVariant } from '@/components/store/gallery-carousel';
import { InstallmentCalculator } from '@/components/fintech/installment-calculator';
import { swatchHex } from '@/lib/store/colors';
import { useCartStore } from '@/stores/cart-store';
import type { ProductCardVM } from '@/lib/store/types';
import { glassClass, glassInset } from '@/lib/glass';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface ProductDetail {
  readonly product: ProductCardVM;
  readonly brandName: string;
  readonly network: string;
  readonly variants: ColorVariant[];
  /** Annual rate (bps) used to pre-lock the calculator. */
  readonly annualRateBps: number;
}

function formatStorage(storage: string): string {
  const gb = Number(storage);
  if (Number.isFinite(gb) && gb >= 1024 && gb % 1024 === 0) {
    return `${toPersianDigits(gb / 1024)} ترابایت`;
  }
  return `${toPersianDigits(storage)} گیگابایت`;
}

interface PendingQuote {
  monthlyPayment: number;
  months: number;
}

export function ProductView({ detail }: { detail: ProductDetail }): ReactNode {
  const { product, brandName, network, variants, annualRateBps } = detail;
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [color, setColor] = useState<string>(variants[0]?.color ?? product.colors[0] ?? '');
  const [pending, setPending] = useState<PendingQuote | null>(null);

  const handleConfirm = useCallback(
    (quote: { months: number; downPayment: number; monthlyPayment: number }) => {
      // Seamlessly hand the configured selection to the cart store…
      addItem(product, color, product.storage, quote.months, quote.downPayment, annualRateBps);
      // …then run the morph overlay and route into the wizard.
      setPending({ monthlyPayment: quote.monthlyPayment, months: quote.months });
      window.setTimeout(() => router.push('/apply'), reduceMotion ? 0 : 680);
    },
    [addItem, product, color, annualRateBps, router, reduceMotion],
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Right side (RTL-first): gallery + specs */}
        <div className="flex flex-col gap-6">
          <ProductGallery images={product.images} title={product.title} />

          {variants.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-foreground/55">رنگ:</span>
              {variants.map((v) => (
                <button
                  key={v.color}
                  type="button"
                  onClick={() => setColor(v.color)}
                  aria-pressed={color === v.color}
                  aria-label={v.color}
                  title={v.color}
                  className={cn(
                    'h-7 w-7 cursor-pointer rounded-full border transition-transform',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    color === v.color
                      ? 'scale-110 border-[#F59E0B] ring-2 ring-[#F59E0B]/40'
                      : 'border-foreground/20 hover:scale-105',
                  )}
                  style={{ backgroundColor: swatchHex(v.color) }}
                />
              ))}
              <span className="mr-1 text-xs text-foreground/70">{color}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-foreground/55">{brandName}</p>
              <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">{product.title}</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <SpecChip icon={HardDrive} label="حافظه" value={formatStorage(product.storage)} />
              <SpecChip icon={Cpu} label="رم" value={`${toPersianDigits(product.ram)} گیگابایت`} />
              <SpecChip icon={Signal} label="شبکه" value={network} />
            </div>

            <p className="text-sm text-foreground/60">
              قیمت نقدی:{' '}
              <span className="font-bold tabular-nums text-foreground">{formatToman(product.cashPrice)}</span>
            </p>
          </div>
        </div>

        {/* Left side: locked conversion island */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <InstallmentCalculator
            cashPrice={product.cashPrice}
            productTitle={product.title}
            annualRateBps={annualRateBps}
            onConfirm={handleConfirm}
            className="max-w-none"
          />
        </div>
      </div>

      {/* Lightning morph overlay → wizard */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              layoutId={`product-cta-${product.id}`}
              initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                glassClass('hero', 'flex w-[min(22rem,90vw)] flex-col items-center gap-4 rounded-3xl p-8 text-center'),
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F59E0B]/15 text-gold">
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-foreground/60">در حال انتقال به اعتبارسنجی…</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                  {formatToman(pending.monthlyPayment, { withSuffix: false })}
                  <span className="mr-1 text-sm font-bold text-foreground/60">تومان / ماه</span>
                </p>
                <p className="mt-1 text-xs text-foreground/50">
                  {toPersianDigits(pending.months)} قسط · {product.title}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface SpecChipProps {
  icon: typeof HardDrive;
  label: string;
  value: string;
}

function SpecChip({ icon: Icon, label, value }: SpecChipProps): ReactNode {
  return (
    <span className={cn('flex items-center gap-2 rounded-xl px-3 py-2', glassInset)}>
      <Icon className="h-4 w-4 text-gold" aria-hidden />
      <span className="text-[11px] text-foreground/50">{label}:</span>
      <span className="text-xs font-bold text-foreground">{value}</span>
    </span>
  );
}

export default ProductView;
