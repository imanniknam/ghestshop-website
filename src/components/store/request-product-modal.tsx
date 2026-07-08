'use client';

/**
 * GhestShop — «درخواست کالای جدید» modal (matches live site feature).
 * Portaled to document.body so it isn't clipped by the sticky header's
 * backdrop-filter stacking context.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PackagePlus, X } from 'lucide-react';
import { SPRING } from '@/lib/motion';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

export interface RequestProductModalProps {
  open: boolean;
  onClose: () => void;
}

export function RequestProductModal({ open, onClose }: RequestProductModalProps): ReactNode {
  const reduceMotion = Boolean(useReducedMotion());
  const [mounted, setMounted] = useState(false);
  const [brand, setBrand] = useState('');
  const [specs, setSpecs] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setBrand('');
      setSpecs('');
      setSubmitted(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSubmit = (): void => {
    if (brand.trim().length < 2) {
      setError('لطفاً برند گوشی را وارد کنید.');
      return;
    }
    if (specs.trim().length < 5) {
      setError('لطفاً مشخصات کامل گوشی را وارد کنید.');
      return;
    }
    setError(null);
    setSubmitted(true);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[75] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="بستن"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="درخواست کالای جدید"
            initial={reduceMotion ? false : { scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.98, opacity: 0, y: 8 }}
            transition={SPRING}
            onClick={(e) => e.stopPropagation()}
            className={cn(glassClass('hero', 'relative z-10 w-[min(28rem,94vw)] rounded-3xl p-6 sm:p-8'))}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="absolute left-4 top-4 rounded-lg p-2 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <header className="mb-5 flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <PackagePlus className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="text-xl font-bold text-foreground">درخواست کالای جدید</h2>
              <p className="text-body leading-relaxed text-foreground/65">
                اگر گوشی مورد نظرتان در قسط شاپ موجود نبود، برند و مشخصات کامل را وارد کنید.
              </p>
            </header>

            {submitted ? (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-body font-medium text-emerald-700 dark:text-emerald-300">
                درخواست شما ثبت شد. کارشناسان قسط شاپ به‌زودی با شما تماس می‌گیرند.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-body font-bold text-foreground">برند گوشی</span>
                  <input
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="مثلاً سامسونگ، اپل، شیائومی"
                    className="h-11 rounded-xl border border-border bg-surface px-3 text-body text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-body font-bold text-foreground">مشخصات کامل</span>
                  <textarea
                    value={specs}
                    onChange={(e) => {
                      setSpecs(e.target.value);
                      if (error) setError(null);
                    }}
                    rows={4}
                    placeholder="مدل، حافظه، رم و هر جزئیات دیگر"
                    className="resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-body text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                  />
                </label>
                {error && (
                  <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-body font-medium text-destructive">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="mt-1 rounded-xl bg-[#407DC0] py-3 text-body font-bold text-white shadow-lg shadow-[#407DC0]/25 transition-[filter] hover:brightness-110"
                >
                  ثبت درخواست
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default RequestProductModal;
