'use client';

/**
 * GhestShop — Translucent Slide-Over Cart Drawer
 * ------------------------------------------------------------------
 * Global quick-cart on the `glassHero` tier (real backdrop-blur — this is one
 * of the ≤3 surfaces that earns it). Slides in from the right (RTL), bound to
 * the Zustand cart store. Shows the configured device (model, colour chip,
 * terms) and routes to the full invoice at /cart. Esc / scrim / × all dismiss.
 */

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { swatchHex } from '@/lib/store/colors';
import { calculateInstallment } from '@/lib/finance/installment-engine';
import { glassClass } from '@/lib/glass';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

function formatStorage(storage: string): string {
  const gb = Number(storage);
  if (Number.isFinite(gb) && gb >= 1024 && gb % 1024 === 0) return `${toPersianDigits(gb / 1024)} ترابایت`;
  return `${toPersianDigits(storage)} گیگابایت`;
}

export function CartSheet(): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const isOpen = useCartStore((s) => s.isOpen);
  const activeItem = useCartStore((s) => s.activeItem);
  const toggleSheet = useCartStore((s) => s.toggleSheet);
  const removeItem = useCartStore((s) => s.removeItem);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') toggleSheet(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, toggleSheet]);

  const monthly = activeItem
    ? calculateInstallment({
        cashPrice: activeItem.product.cashPrice,
        downPayment: activeItem.downPayment,
        months: activeItem.months,
        annualRateBps: activeItem.annualRateBps,
      }).monthlyPayment
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex justify-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Scrim */}
          <button
            type="button"
            aria-label="بستن سبد خرید"
            onClick={() => toggleSheet(false)}
            className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer (enters from the right in RTL) */}
          <motion.aside
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="سبد خرید"
            initial={{ x: reduceMotion ? 0 : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: reduceMotion ? 0 : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className={cn(
              glassClass('hero', 'absolute right-0 top-0 flex h-full w-[min(24rem,92vw)] flex-col gap-5 p-6'),
            )}
          >
            <header className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-black text-foreground">
                <ShoppingBag className="h-5 w-5 text-gold" aria-hidden />
                سبد خرید
              </h2>
              <button
                type="button"
                onClick={() => toggleSheet(false)}
                aria-label="بستن"
                className="cursor-pointer rounded-lg p-2 text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            {activeItem ? (
              <>
                <div className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-foreground/5 p-2">
                    {activeItem.product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeItem.product.image} alt={activeItem.product.title} className="h-full w-full object-contain" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="truncate text-sm font-bold text-foreground">{activeItem.product.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm text-foreground/55">
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="h-3 w-3 rounded-full border border-foreground/20"
                          style={{ backgroundColor: swatchHex(activeItem.color) }}
                        />
                        {activeItem.color}
                      </span>
                      <span>·</span>
                      <span>{formatStorage(activeItem.storage)}</span>
                      <span>·</span>
                      <span>{toPersianDigits(activeItem.months)} ماه</span>
                    </div>
                    <p className="text-sm font-black tabular-nums text-gold">
                      {formatToman(monthly, { withSuffix: false })}
                      <span className="mr-1 text-sm font-normal text-gold/70">تومان / ماه</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeItem}
                  className="inline-flex w-fit items-center gap-1.5 text-sm text-foreground/50 transition-colors hover:text-destructive focus-visible:outline-none focus-visible:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  حذف از سبد
                </button>

                <div className="mt-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-xl bg-foreground/5 px-4 py-3 text-sm">
                    <span className="text-foreground/60">پیش‌پرداخت</span>
                    <span className="font-bold tabular-nums text-foreground">{formatToman(activeItem.downPayment)}</span>
                  </div>
                  <Link
                    href="/cart"
                    onClick={() => toggleSheet(false)}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#407DC0] py-3.5 text-sm font-bold text-white',
                      'shadow-lg shadow-[#407DC0]/25 transition-[filter] hover:brightness-110',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    )}
                  >
                    مشاهده فاکتور و ثبت نهایی
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-foreground/45">
                <ShoppingBag className="h-12 w-12" aria-hidden />
                <p className="text-sm">سبد خرید شما خالی است</p>
                <Link
                  href="/"
                  onClick={() => toggleSheet(false)}
                  className="rounded-xl border border-foreground/15 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5"
                >
                  مشاهده محصولات
                </Link>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CartSheet;
