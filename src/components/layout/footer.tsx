/**
 * GhestShop — Global Fintech Glass Footer
 * ------------------------------------------------------------------
 * High-density `glassCard` footer wrapping all root layouts. Brand matrix with
 * regulatory anchors (Enamad / Samandehi), a quick-navigation link matrix, and
 * an interactive contact zone whose chips glow gold on hover. Server component
 * (pure presentation, hover handled by CSS).
 */

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { Headphones, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { glassClass } from '@/lib/glass';
import { toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

interface LinkGroup {
  readonly title: string;
  readonly links: ReadonlyArray<{ readonly label: string; readonly href: string }>;
}

const NAV_GROUPS: readonly LinkGroup[] = [
  {
    title: 'فروشگاه',
    links: [
      { label: 'اپل', href: '/brand/apple' },
      { label: 'سامسونگ', href: '/brand/samsung' },
      { label: 'شیائومی', href: '/brand/xiaomi' },
      { label: 'فروش ویژه', href: '/' },
    ],
  },
  {
    title: 'خرید اقساطی',
    links: [
      { label: 'محاسبه‌گر اقساط', href: '/apply' },
      { label: 'اعتبارسنجی', href: '/apply' },
      { label: 'دفتر اقساط من', href: '/dashboard' },
      { label: 'سبد خرید', href: '/cart' },
    ],
  },
  {
    title: 'پشتیبانی',
    links: [
      { label: 'سوالات متداول', href: '#' },
      { label: 'راهنمای خرید', href: '#' },
      { label: 'قوانین و مقررات', href: '#' },
      { label: 'حریم خصوصی', href: '#' },
    ],
  },
];

interface ContactChip {
  readonly icon: ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
  readonly href: string;
}

const CONTACT_CHIPS: readonly ContactChip[] = [
  { icon: Phone, label: 'تلفن پشتیبانی', value: toPersianDigits('۰۲۱-۹۱۰۰۱۰۰۱'), href: 'tel:02191001001' },
  { icon: Mail, label: 'ایمیل', value: 'support@ghestshop.com', href: 'mailto:support@ghestshop.com' },
  { icon: Headphones, label: 'پشتیبانی ۲۴ ساعته', value: 'پاسخگویی آنی', href: '#' },
];

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps): ReactNode {
  return (
    <footer dir="rtl" className={cn('mt-16 px-4 pb-10 sm:px-6 lg:px-8', className)}>
      <div className={cn(glassClass('card', 'mx-auto max-w-7xl rounded-3xl p-8 sm:p-10'))}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_2fr]">
          {/* Brand matrix + regulatory */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] text-white">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-xl font-black text-foreground">قسط‌شاپ</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-foreground/55">
              مرجع خرید اقساطی موبایل و کالای دیجیتال با اعتبارسنجی هوشمند، شفافیت کامل مالی و
              بازپرداخت تا ۲۴ ماه.
            </p>
            <div className="flex flex-wrap gap-3">
              <RegulatoryBadge title="نماد اعتماد الکترونیکی" subtitle="اینماد" />
              <RegulatoryBadge title="ساماندهی" subtitle="وزارت فرهنگ و ارشاد" />
            </div>
          </div>

          {/* Navigation + contact */}
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {NAV_GROUPS.map((group) => (
                <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-foreground">{group.title}</h3>
                  <ul className="flex flex-col gap-2">
                    {group.links.map((link) => (
                      <li key={`${group.title}-${link.label}`}>
                        <Link
                          href={link.href}
                          className="text-xs text-foreground/55 transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            {/* Contact chips with hover glow */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CONTACT_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <a
                    key={chip.label}
                    href={chip.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-3 transition-all',
                      'hover:border-[#F59E0B]/40 hover:bg-[#F59E0B]/[0.06] hover:shadow-[0_0_24px_-6px_rgba(245,158,11,0.45)]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold transition-colors group-hover:bg-[#F59E0B]/25">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[10px] text-foreground/45">{chip.label}</span>
                      <span dir="ltr" className="truncate text-right text-xs font-bold text-foreground">
                        {chip.value}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-foreground/10 pt-6 text-xs text-foreground/45 sm:flex-row">
          <span>© {toPersianDigits('۱۴۰۴')} قسط‌شاپ — تمامی حقوق محفوظ است.</span>
          <span>طراحی و توسعه با ❤ برای تجربه خرید اقساطی</span>
        </div>
      </div>
    </footer>
  );
}

function RegulatoryBadge({ title, subtitle }: { title: string; subtitle: string }): ReactNode {
  return (
    <a
      href="#"
      rel="nofollow noopener"
      className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 transition-colors hover:border-[#F59E0B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
    >
      <ShieldCheck className="h-7 w-7 text-emerald-400" aria-hidden />
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-bold text-foreground">{title}</span>
        <span className="text-[9px] text-foreground/45">{subtitle}</span>
      </span>
    </a>
  );
}

export default Footer;
