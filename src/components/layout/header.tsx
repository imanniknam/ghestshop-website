'use client';

/**
 * GhestShop — Cinematic Navigation Toolbar & Global Search
 * ------------------------------------------------------------------
 * Sticky `glassHero` header with:
 *   • A mega-menu matrix — root categories that reveal a nested brand grid out
 *     of a hidden clip floor (EASE_EXPO).
 *   • A glass global search with a ⌘K anchor (focuses on Cmd/Ctrl+K) and an
 *     animated rotating placeholder.
 * Strict RTL, theme-aware, reduced-motion friendly.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import { AuthTrigger } from '@/components/layout/auth-trigger';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

interface MenuItem {
  readonly label: string;
  readonly href: string;
}
interface MenuGroup {
  readonly title: string;
  readonly items: readonly MenuItem[];
}
interface MenuCategory {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly groups: readonly MenuGroup[];
}

const MENU: readonly MenuCategory[] = [
  {
    key: 'phones',
    label: 'گوشی همراه',
    href: '/brand/apple',
    groups: [
      {
        title: 'برندها',
        items: [
          { label: 'اپل', href: '/brand/apple' },
          { label: 'سامسونگ', href: '/brand/samsung' },
          { label: 'شیائومی', href: '/brand/xiaomi' },
        ],
      },
      {
        title: 'دسته‌بندی',
        items: [
          { label: 'پرچم‌دارها', href: '/brand/apple' },
          { label: 'اقتصادی', href: '/brand/xiaomi' },
          { label: 'تاشو', href: '/brand/samsung' },
        ],
      },
    ],
  },
  {
    key: 'laptops',
    label: 'لپ‌تاپ',
    href: '#',
    groups: [
      {
        title: 'برندها',
        items: [
          { label: 'مک‌بوک', href: '#' },
          { label: 'ایسوس', href: '#' },
          { label: 'لنوو', href: '#' },
        ],
      },
      {
        title: 'کاربری',
        items: [
          { label: 'گیمینگ', href: '#' },
          { label: 'اداری', href: '#' },
          { label: 'فوق‌سبک', href: '#' },
        ],
      },
    ],
  },
  {
    key: 'gadgets',
    label: 'گجت‌ها',
    href: '#',
    groups: [
      {
        title: 'دسته‌ها',
        items: [
          { label: 'هدفون و ایرپاد', href: '#' },
          { label: 'ساعت هوشمند', href: '#' },
          { label: 'پاوربانک', href: '#' },
        ],
      },
    ],
  },
];

const SEARCH_PLACEHOLDERS = [
  'آیفون ۱۵ پرو مکس',
  'سامسونگ گلکسی S24',
  'لپ‌تاپ گیمینگ',
  'هدفون بی‌سیم',
];

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps): ReactNode {
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Scroll-reactive opacity/blur — crisper and more opaque once the user scrolls
  // past the hero so navigation text stays legible over rich content.
  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      dir="rtl"
      onMouseLeave={() => setActive(null)}
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,backdrop-filter,box-shadow,border-color] duration-300',
        // Adaptive frosted container — opaque + crisper on scroll for legibility,
        // with a crisp inner light-reflection border on the top edge.
        scrolled
          ? 'bg-white/70 dark:bg-[#0F172A]/75 backdrop-blur-xl backdrop-saturate-150 border-foreground/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18),inset_0_1px_0_0_rgba(255,255,255,0.5)] dark:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.06)]'
          : 'bg-white/40 dark:bg-[#0F172A]/45 backdrop-blur-md border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
        className,
      )}
    >
      {/* Dual-layer legibility mask — a top-weighted gradient keeps text crisp
          over rich background content in both themes. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/70 to-background/10"
      />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand (RTL start) */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] text-white">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-black text-foreground">قسط‌شاپ</span>
        </Link>

        {/* Mega-menu nav (center) */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="ناوبری اصلی">
          {MENU.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onMouseEnter={() => setActive(cat.key)}
              onFocus={() => setActive(cat.key)}
              aria-expanded={active === cat.key}
              className={cn(
                'flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold tracking-tight transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
                active === cat.key ? 'bg-foreground/10 text-foreground' : 'text-foreground/80 hover:text-foreground',
              )}
            >
              {cat.label}
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', active === cat.key && 'rotate-180')}
                aria-hidden
              />
            </button>
          ))}
        </nav>

        {/* Global search + auth (RTL end) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <GlobalSearch />
          <AuthTrigger />
        </div>
      </div>

      {/* Mega panel — reveals out of a hidden clip floor */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: -10, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, y: -10, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.45, ease: EASE_EXPO }}
            onMouseEnter={() => setActive(active)}
            className="absolute inset-x-0 top-full hidden md:block"
          >
            <div className={cn(glassClass('hero', 'mx-auto mt-2 max-w-5xl rounded-2xl p-6'))}>
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {MENU.find((c) => c.key === active)?.groups.map((group) => (
                  <div key={group.title} className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/45">{group.title}</h3>
                    <ul className="flex flex-col gap-1">
                      {group.items.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            onClick={() => setActive(null)}
                            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-foreground/75 transition-colors hover:bg-foreground/5 hover:text-gold focus-visible:outline-none focus-visible:bg-foreground/5"
                          >
                            {item.label}
                            <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-foreground/30" aria-hidden />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ---------------------------------------------------------------------------
//  Global search
// ---------------------------------------------------------------------------

function GlobalSearch(): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // ⌘K / Ctrl+K focuses the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Rotate the placeholder while idle.
  useEffect(() => {
    if (focused || value) return;
    const id = window.setInterval(
      () => setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length),
      2800,
    );
    return () => window.clearInterval(id);
  }, [focused, value]);

  const showFauxPlaceholder = !focused && value.length === 0;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-foreground/15 bg-foreground/[0.04] px-3 transition-colors',
        'focus-within:border-[#F59E0B]/50 focus-within:bg-foreground/[0.06]',
        'h-10 w-44 sm:w-64 lg:w-80',
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-foreground/45" aria-hidden />
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="جستجوی محصولات"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-transparent"
        />
        {/* Animated faux placeholder */}
        <AnimatePresence mode="wait">
          {showFauxPlaceholder && (
            <motion.span
              key={placeholderIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE_EXPO }}
              className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-sm text-foreground/40"
              aria-hidden
            >
              جستجو: {SEARCH_PLACEHOLDERS[placeholderIndex]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {/* ⌘K anchor */}
      <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-foreground/15 bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-foreground/45 sm:flex">
        ⌘K
      </kbd>
    </div>
  );
}

export default Header;
