'use client';

/**
 * GhestShop — Unified Auth Trigger (header right side)
 * ------------------------------------------------------------------
 * Unauthenticated → a glowing «ورود / ثبت‌نام» button that opens the auth modal.
 * Authenticated → an avatar dropdown routing to /dashboard (buyer) or /admin,
 * plus sign-out. Hydrates the persisted session on mount with a guard to avoid
 * SSR flash/mismatch.
 */

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { dashboardHref, useAuthStore } from '@/stores/auth-store';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

export function AuthTrigger(): ReactNode {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const openModal = useAuthStore((s) => s.openModal);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Reserve footprint until hydrated to avoid a flash of the wrong state.
  if (!hydrated) {
    return <div aria-hidden className="h-10 w-28 rounded-xl bg-foreground/5" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={openModal}
        className={cn(
          'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#F59E0B] px-4 text-sm font-bold text-[#1C1917]',
          'shadow-[0_0_24px_-4px_rgba(245,158,11,0.6)] transition-[filter,box-shadow] hover:brightness-110 hover:shadow-[0_0_32px_-2px_rgba(245,158,11,0.75)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        )}
      >
        <LogIn className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">ورود / ثبت‌نام</span>
      </button>
    );
  }

  const initial = user.name.trim().charAt(0) || 'ک';

  return (
    <div className="relative" onMouseLeave={() => setMenuOpen(false)}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        onMouseEnter={() => setMenuOpen(true)}
        aria-expanded={menuOpen}
        className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-2 pr-1 transition-colors hover:bg-foreground/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] text-sm font-black text-white">
          {initial}
        </span>
        <span className="hidden max-w-[7rem] truncate text-sm font-bold text-foreground sm:inline">{user.name}</span>
        <ChevronDown className={cn('h-4 w-4 text-foreground/50 transition-transform', menuOpen && 'rotate-180')} aria-hidden />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.3, ease: EASE_EXPO }}
            className={cn(glassClass('hero', 'absolute left-0 top-full z-50 mt-2 w-52 rounded-2xl p-1.5'))}
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-bold text-foreground">{user.name}</p>
              <p dir="ltr" className="text-right text-[11px] text-foreground/45">{user.phone}</p>
              <span className="mt-1 inline-block rounded-full bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                {user.role === 'admin' ? 'حساب مدیریت' : 'حساب خریدار'}
              </span>
            </div>
            <div className="my-1 h-px bg-foreground/10" />
            <Link
              href={dashboardHref(user.role)}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-gold focus-visible:outline-none focus-visible:bg-foreground/5"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              {user.role === 'admin' ? 'پنل مدیریت' : 'داشبورد من'}
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-destructive)] transition-colors hover:bg-[var(--color-destructive)]/10 focus-visible:outline-none focus-visible:bg-[var(--color-destructive)]/10"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              خروج از حساب
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AuthTrigger;
