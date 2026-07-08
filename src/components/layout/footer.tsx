/**
 * GhestShop — Global footer (aligned with live ghestshop.com).
 */

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { Headphones, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-logo';
import { glassClass } from '@/lib/glass';
import { toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

interface LinkGroup {
  readonly title: string;
  readonly links: ReadonlyArray<{ readonly label: string; readonly href: string }>;
}

const NAV_GROUPS: readonly LinkGroup[] = [
  {
    title: 'خرید گوشی قسطی',
    links: [
      { label: 'گوشی سامسونگ', href: '/brand/samsung' },
      { label: 'گوشی شیائومی', href: '/brand/xiaomi' },
      { label: 'گوشی اپل', href: '/brand/apple' },
      { label: 'محاسبه‌گر اقساط', href: '/apply' },
    ],
  },
  {
    title: 'حساب کاربری',
    links: [
      { label: 'داشبورد من', href: '/dashboard' },
      { label: 'سبد خرید', href: '/cart' },
      { label: 'اعتبارسنجی', href: '/apply' },
    ],
  },
  {
    title: 'قسط شاپ',
    links: [
      { label: 'درباره ما', href: '#installment-rules' },
      { label: 'قوانین خرید اقساطی', href: '#installment-rules' },
      { label: 'سوالات متداول', href: '#' },
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
  {
    icon: Phone,
    label: 'تماس مستقیم',
    value: toPersianDigits('۰۹۱۷۳۸۳۸۲۳۰'),
    href: 'tel:09173838230',
  },
  {
    icon: MapPin,
    label: 'آدرس فروشگاه',
    value: 'شیراز، چهارراه ریشمک — امیرکبیر',
    href: '#',
  },
  {
    icon: Headphones,
    label: 'پشتیبانی',
    value: 'پاسخگویی تلفنی',
    href: 'tel:07154228634',
  },
];

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps): ReactNode {
  return (
    <footer dir="rtl" className={cn('mt-16 px-4 pb-10 sm:px-6 lg:px-8', className)}>
      <div className={cn(glassClass('card', 'mx-auto max-w-7xl rounded-3xl p-8 sm:p-10'))}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <BrandMark size={26} />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">قسط شاپ</span>
            </div>
            <p className="max-w-sm text-body leading-relaxed text-foreground/70">
              مرجع خرید اقساطی گوشی موبایل در شیراز و جهرم. بیش از ۱۷ هزار مشتری در چهار سال
              فعالیت از قسط شاپ خرید کرده‌اند.
            </p>
            <div className="flex flex-wrap gap-3">
              <RegulatoryBadge title="نماد اعتماد الکترونیکی" subtitle="اینماد" />
              <RegulatoryBadge title="ساماندهی" subtitle="وزارت فرهنگ و ارشاد" />
            </div>
            <a
              href="mailto:support@ghestshop.com"
              className="inline-flex items-center gap-2 text-body text-foreground/65 transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4" aria-hidden />
              support@ghestshop.com
            </a>
          </div>

          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {NAV_GROUPS.map((group) => (
                <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3">
                  <h3 className="text-body font-bold text-foreground">{group.title}</h3>
                  <ul className="flex flex-col gap-2">
                    {group.links.map((link) => (
                      <li key={`${group.title}-${link.label}`}>
                        <Link
                          href={link.href}
                          className="text-body text-foreground/60 transition-colors hover:text-gold focus-visible:outline-none focus-visible:text-gold"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CONTACT_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <a
                    key={chip.label}
                    href={chip.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-3 transition-all',
                      'hover:border-[#407DC0]/40 hover:bg-[#407DC0]/[0.06]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]',
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#407DC0]/15 text-gold">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-caption text-foreground/50">{chip.label}</span>
                      <span className="truncate text-body font-bold text-foreground">{chip.value}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-foreground/10 pt-6 text-caption text-foreground/55 sm:flex-row">
          <span>© {toPersianDigits('۱۴۰۴')} قسط شاپ — تمامی حقوق محفوظ است.</span>
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
      className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-3 py-2 transition-colors hover:border-[#407DC0]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#407DC0]"
    >
      <ShieldCheck className="h-7 w-7 text-emerald-500" aria-hidden />
      <span className="flex flex-col leading-tight">
        <span className="text-caption font-bold text-foreground">{title}</span>
        <span className="text-caption text-foreground/50">{subtitle}</span>
      </span>
    </a>
  );
}

export default Footer;
