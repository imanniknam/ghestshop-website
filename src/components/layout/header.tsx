'use client';

/**
 * GhestShop — Main navigation (aligned with live ghestshop.com IA).
 * Phone-brand dropdown, global search, auth, and «درخواست کالای جدید».
 */

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';
import { AuthTrigger } from '@/components/layout/auth-trigger';
import { BrandMark } from '@/components/layout/brand-logo';
import { RequestProductTrigger } from '@/components/layout/request-product-trigger';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

interface NavBrand {
  readonly label: string;
  readonly href: string;
}

const PHONE_BRANDS: readonly NavBrand[] = [
  { label: 'گوشی سامسونگ', href: '/brand/samsung' },
  { label: 'گوشی شیائومی', href: '/brand/xiaomi' },
  { label: 'گوشی اپل', href: '/brand/apple' },
];

const SEARCH_PLACEHOLDERS = [
  'آیفون ۱۵ پرو مکس',
  'سامسونگ گلکسی S24',
  'شیائومی پوکو',
  'گلکسی A55',
];

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps): ReactNode {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      dir="rtl"
      onMouseLeave={() => setMenuOpen(false)}
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300',
        scrolled
          ? 'border-border bg-surface/95 shadow-[0_8px_24px_-16px_rgba(15,29,48,0.25)] supports-[backdrop-filter]:bg-surface/80 backdrop-blur-sm'
          : 'border-transparent bg-surface/70 supports-[backdrop-filter]:bg-surface/55 backdrop-blur-sm',
        className,
      )}
    >
      <div className="relative mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="قسط شاپ — صفحه اصلی"
          className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <BrandMark size={28} />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">قسط شاپ</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="ناوبری اصلی">
          <button
            type="button"
            onMouseEnter={() => setMenuOpen(true)}
            onFocus={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3 py-2 text-nav font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              menuOpen ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:text-foreground',
            )}
          >
            خرید گوشی قسطی در شیراز
            <ChevronDown className={cn('h-5 w-5 transition-transform', menuOpen && 'rotate-180')} aria-hidden />
          </button>
          <Link
            href="/apply"
            className="rounded-xl px-3 py-2 text-nav font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            محاسبه‌گر اقساط
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <GlobalSearch />
          <RequestProductTrigger className="hidden sm:inline-flex" />
          <AuthTrigger />
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE_EXPO }}
            onMouseEnter={() => setMenuOpen(true)}
            className="absolute inset-x-0 top-full hidden md:block"
          >
            <div className={cn(glassClass('hero', 'mx-auto mt-2 max-w-md rounded-2xl p-4'))}>
              <p className="mb-2 px-2 text-caption font-medium text-foreground/50">برندهای موجود</p>
              <ul className="flex flex-col gap-1">
                {PHONE_BRANDS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-nav font-medium text-foreground/80 transition-colors hover:bg-primary/8 hover:text-primary"
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4 -rotate-90 text-foreground/30" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function GlobalSearch(): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (pathname !== '/search') {
      setValue('');
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setValue(params.get('q') ?? '');
  }, [pathname]);

  const submitSearch = (raw: string): void => {
    const query = raw.trim();
    if (query.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    inputRef.current?.blur();
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    submitSearch(value);
  };

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
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn(
        'flex h-10 w-40 items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 transition-colors sm:w-56 lg:w-64',
        'focus-within:border-primary/60 focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/15',
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-foreground/45" aria-hidden />
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="جستجوی محصولات"
          enterKeyHint="search"
          className="w-full bg-transparent text-nav text-foreground outline-none placeholder:text-transparent"
        />
        <AnimatePresence mode="wait">
          {showFauxPlaceholder && (
            <motion.span
              key={placeholderIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: EASE_EXPO }}
              className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-nav text-foreground/40"
              aria-hidden
            >
              {SEARCH_PLACEHOLDERS[placeholderIndex]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

export default Header;
