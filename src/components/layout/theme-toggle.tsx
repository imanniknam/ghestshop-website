'use client';

/**
 * GhestShop — Theme Toggle (Light/Dark)
 * ------------------------------------------------------------------
 * Mutates the `.dark` class on <html> and persists the choice to localStorage.
 * The pre-paint inline script in the root layout sets the initial class, so
 * this component only needs to read/flip it. A `mounted` guard prevents the
 * hydration mismatch that a localStorage read would otherwise cause, and the
 * Sun/Moon swap is a spring rotate-flip via AnimatePresence.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { SPRING } from '@/lib/motion';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

export const THEME_STORAGE_KEY = 'ghestshop-theme';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps): ReactNode {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;
      root.classList.toggle('dark', next);
      root.style.colorScheme = next ? 'dark' : 'light';
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        /* storage unavailable — in-memory toggle still works for the session */
      }
      return next;
    });
  }, []);

  // Reserve the exact footprint pre-mount to avoid layout shift / flashing.
  if (!mounted) {
    return <div aria-hidden className={cn('h-11 w-11 rounded-full', className)} />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
      title={isDark ? 'حالت روشن' : 'حالت تاریک'}
      className={cn(
        glassClass('hero', 'relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full'),
        'cursor-pointer text-gold transition-[filter,transform] hover:scale-105 hover:brightness-110',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.4 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.4 }}
          transition={SPRING}
          className="flex items-center justify-center"
        >
          {isDark ? <Moon className="h-5 w-5" aria-hidden /> : <Sun className="h-5 w-5" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export default ThemeToggle;
