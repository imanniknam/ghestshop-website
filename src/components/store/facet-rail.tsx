'use client';

/**
 * GhestShop — Faceted Filter Rail (URL-state)
 * ------------------------------------------------------------------
 * Right-side (RTL) sticky filter panel. Every selection is encoded into the
 * URL query string (?ram=8,12&storage=256&maxPrice=40000000) via the App
 * Router, so filtered views are deep-linkable and shareable, and the server
 * page re-renders from the canonical URL state. Uses the `glassCard` tier (no
 * backdrop-filter) because a tall sticky panel is exactly the surface that
 * would tank scroll FPS if it blurred the moving content behind it.
 */

import { useCallback, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { glassClass, glassInset } from '@/lib/glass';
import { toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };

interface Option {
  readonly value: string;
  readonly label: string;
}

export const RAM_OPTIONS: readonly Option[] = [
  { value: '6', label: '۶ گیگ' },
  { value: '8', label: '۸ گیگ' },
  { value: '12', label: '۱۲ گیگ' },
  { value: '16', label: '۱۶ گیگ' },
];

export const STORAGE_OPTIONS: readonly Option[] = [
  { value: '128', label: '۱۲۸ گیگ' },
  { value: '256', label: '۲۵۶ گیگ' },
  { value: '512', label: '۵۱۲ گیگ' },
  { value: '1024', label: '۱ ترابایت' },
];

export const PRICE_BUCKETS: readonly Option[] = [
  { value: '20000000', label: 'تا ۲۰ میلیون' },
  { value: '40000000', label: 'تا ۴۰ میلیون' },
  { value: '60000000', label: 'تا ۶۰ میلیون' },
];

export interface FacetRailProps {
  className?: string;
}

export function FacetRail({ className }: FacetRailProps): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const readMulti = useCallback(
    (key: string): string[] => {
      const raw = searchParams.get(key);
      return raw ? raw.split(',').filter(Boolean) : [];
    },
    [searchParams],
  );

  const commit = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      const current = readMulti(key);
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length > 0) next.set(key, updated.join(','));
      else next.delete(key);
      commit(next);
    },
    [searchParams, readMulti, commit],
  );

  const setSingle = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === null || next.get(key) === value) next.delete(key);
      else next.set(key, value);
      commit(next);
    },
    [searchParams, commit],
  );

  const clearAll = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname]);

  const selectedRam = readMulti('ram');
  const selectedStorage = readMulti('storage');
  const selectedPrice = searchParams.get('maxPrice');

  // Build the active-chip list.
  const chips: Array<{ id: string; label: string; remove: () => void }> = [];
  for (const value of selectedRam) {
    const opt = RAM_OPTIONS.find((o) => o.value === value);
    chips.push({ id: `ram-${value}`, label: opt?.label ?? value, remove: () => toggleMulti('ram', value) });
  }
  for (const value of selectedStorage) {
    const opt = STORAGE_OPTIONS.find((o) => o.value === value);
    chips.push({ id: `storage-${value}`, label: opt?.label ?? value, remove: () => toggleMulti('storage', value) });
  }
  if (selectedPrice) {
    const opt = PRICE_BUCKETS.find((o) => o.value === selectedPrice);
    chips.push({ id: 'price', label: opt?.label ?? `تا ${toPersianDigits(selectedPrice)}`, remove: () => setSingle('maxPrice', null) });
  }

  return (
    <aside
      dir="rtl"
      aria-label="فیلتر محصولات"
      className={cn(
        glassClass('card', 'sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col gap-5 overflow-y-auto rounded-3xl p-5'),
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-gold" aria-hidden />
          فیلترها
        </h2>
        {chips.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="cursor-pointer text-xs text-foreground/50 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            پاک کردن همه
          </button>
        )}
      </header>

      {/* Active filter chips */}
      <AnimatePresence initial={false}>
        {chips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING}
            className="flex flex-wrap gap-2"
          >
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.remove}
                className={cn(
                  'flex items-center gap-1 rounded-full border border-[#F59E0B]/40 px-2.5 py-1 text-[11px] font-medium text-gold',
                  glassInset,
                  'cursor-pointer transition-colors hover:border-[#F59E0B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
                )}
              >
                {chip.label}
                <X className="h-3 w-3" aria-hidden />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <FacetGroup
        title="حافظه رم"
        options={RAM_OPTIONS}
        isActive={(v) => selectedRam.includes(v)}
        onToggle={(v) => toggleMulti('ram', v)}
      />
      <FacetGroup
        title="حافظه داخلی"
        options={STORAGE_OPTIONS}
        isActive={(v) => selectedStorage.includes(v)}
        onToggle={(v) => toggleMulti('storage', v)}
      />
      <FacetGroup
        title="حداکثر قیمت"
        options={PRICE_BUCKETS}
        isActive={(v) => selectedPrice === v}
        onToggle={(v) => setSingle('maxPrice', v)}
      />
    </aside>
  );
}

interface FacetGroupProps {
  title: string;
  options: readonly Option[];
  isActive: (value: string) => boolean;
  onToggle: (value: string) => void;
}

function FacetGroup({ title, options, isActive, onToggle }: FacetGroupProps): ReactNode {
  return (
    <section className="flex flex-col gap-2 border-t border-foreground/5 pt-4">
      <h3 className="text-xs font-semibold text-foreground/60">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = isActive(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              aria-pressed={active}
              className={cn(
                'min-h-[2.25rem] cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                active
                  ? 'bg-[#F59E0B] text-[#1C1917]'
                  : cn(glassInset, 'border border-foreground/5 hover:border-foreground/20'),
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default FacetRail;
