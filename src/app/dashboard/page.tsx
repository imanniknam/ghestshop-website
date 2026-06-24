'use client';

/**
 * GhestShop — Buyer Mission Control
 * ------------------------------------------------------------------
 *   A. Profile Ledger        — editable immutable user data.
 *   B. Order & Document Track — purchases, delivery + validation stage, docs.
 *   C. Installment Timeline   — the Jalali PaymentLedger (with "Pay Now").
 *   D. Loyalty Vault (خوش‌حسابی) — zero overdue ⇒ unlock an exclusive,
 *      neon-glowing, time-limited flash sale for this buyer.
 * Strict RTL, Liquid-Glass, reduced-motion aware.
 */

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  FileCheck2,
  Lock,
  PackageCheck,
  Save,
  Sparkles,
  Truck,
  UserRound,
} from 'lucide-react';
import { PaymentLedger } from '@/components/fintech/payment-ledger';
import { Countdown } from '@/components/store/countdown';
import { mapMonth, type LedgerPlan, type RawMonth } from '@/lib/finance/ledger';
import { productImage } from '@/lib/store/media';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass, glassInset } from '@/lib/glass';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

const NOW = Date.now();
const DAY = 86_400_000;
const ago = (n: number): Date => new Date(NOW - n * DAY);
const ahead = (n: number): Date => new Date(NOW + n * DAY);
const MONTHLY = 5_200_000;

// Mock plan with ZERO overdue → the loyalty vault unlocks.
const RAW_MONTHS: RawMonth[] = [
  { id: 'm1', monthIndex: 1, dueDate: ago(90), amount: MONTHLY, status: 'PAID', paidAt: ago(89), paymentSlip: { id: 's1', trackingNumber: '120558764401', paidAmount: MONTHLY, paidAt: ago(89), status: 'APPROVED', reviewedAt: ago(88), accountantRemarks: null } },
  { id: 'm2', monthIndex: 2, dueDate: ago(60), amount: MONTHLY, status: 'PAID', paidAt: ago(59), paymentSlip: { id: 's2', trackingNumber: '120558764402', paidAmount: MONTHLY, paidAt: ago(59), status: 'APPROVED', reviewedAt: ago(58), accountantRemarks: null } },
  { id: 'm3', monthIndex: 3, dueDate: ago(30), amount: MONTHLY, status: 'PAID', paidAt: ago(29), paymentSlip: { id: 's3', trackingNumber: '120558764403', paidAmount: MONTHLY, paidAt: ago(29), status: 'APPROVED', reviewedAt: ago(28), accountantRemarks: null } },
  { id: 'm4', monthIndex: 4, dueDate: ago(1), amount: MONTHLY, status: 'PENDING_REVIEW', paidAt: null, paymentSlip: { id: 's4', trackingNumber: '894512673021', paidAmount: MONTHLY, paidAt: ago(1), status: 'PENDING', reviewedAt: null, accountantRemarks: null } },
  { id: 'm5', monthIndex: 5, dueDate: ahead(15), amount: MONTHLY, status: 'UNPAID', paidAt: null, paymentSlip: null },
  { id: 'm6', monthIndex: 6, dueDate: ahead(45), amount: MONTHLY, status: 'UPCOMING', paidAt: null, paymentSlip: null },
  { id: 'm7', monthIndex: 7, dueDate: ahead(75), amount: MONTHLY, status: 'UPCOMING', paidAt: null, paymentSlip: null },
  { id: 'm8', monthIndex: 8, dueDate: ahead(105), amount: MONTHLY, status: 'UPCOMING', paidAt: null, paymentSlip: null },
];

const PLAN: LedgerPlan = {
  id: 'plan-1',
  monthlyPayment: MONTHLY,
  totalPayable: MONTHLY * RAW_MONTHS.length,
  remainingBalance: MONTHLY * (RAW_MONTHS.length - 3),
  paidMonthsCount: 3,
  months: RAW_MONTHS.map(mapMonth),
};

interface Order {
  readonly id: string;
  readonly device: string;
  readonly productId: string;
  readonly delivery: 'تحویل شده' | 'در حال ارسال' | 'در حال پردازش';
  readonly stage: string;
  readonly docs: 'تأیید شده' | 'در انتظار بررسی';
}

const ORDERS: Order[] = [
  { id: 'o1', device: 'آیفون ۱۵ پرو مکس', productId: 'p-ip15pm', delivery: 'تحویل شده', stage: 'تکمیل شده', docs: 'تأیید شده' },
  { id: 'o2', device: 'سامسونگ گلکسی S24 اولترا', productId: 'p-s24u', delivery: 'در حال ارسال', stage: 'بررسی نهایی', docs: 'تأیید شده' },
  { id: 'o3', device: 'شیائومی ۱۴', productId: 'p-mi14', delivery: 'در حال پردازش', stage: 'بارگذاری مدارک', docs: 'در انتظار بررسی' },
];

const VAULT_DEALS = [
  { id: 'p-ip15', name: 'آیفون ۱۵', original: 54_000_000, exclusive: 47_500_000, monthly: 2_350_000 },
  { id: 'p-redmi13', name: 'شیائومی ردمی نوت ۱۳ پرو', original: 16_500_000, exclusive: 13_900_000, monthly: 720_000 },
];

export default function DashboardPage(): ReactNode {
  const hasOverdue = useMemo(() => PLAN.months.some((m) => m.status === 'OVERDUE'), []);

  return (
    <main dir="rtl" className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] text-white">
          <UserRound className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">داشبورد من</h1>
          <p className="text-sm text-foreground/55">مدیریت حساب، سفارش‌ها و اقساط</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <ProfileLedger />
        <OrderTracking />
      </div>

      {/* C — Installment timeline */}
      <section className="flex flex-col gap-4">
        <SectionTitle icon={Clock} title="زمان‌بندی اقساط من" />
        <PaymentLedger plan={PLAN} className="max-w-none" />
      </section>

      {/* D — Loyalty vault */}
      <LoyaltyVault locked={hasOverdue} />
    </main>
  );
}

// ---------------------------------------------------------------------------
//  A — Profile Ledger
// ---------------------------------------------------------------------------

function ProfileLedger(): ReactNode {
  const [form, setForm] = useState({
    name: 'سارا محمدی',
    mobile: '۰۹۱۲۱۱۱۰۰۱۱',
    address: 'تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲',
    postal: '۱۴۳۳۸۹۴۵۶۷',
    emergency: '۰۹۳۵۱۲۳۴۵۶۷',
  });
  const [saved, setSaved] = useState(false);

  const update = (k: keyof typeof form, v: string): void => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  return (
    <section className={cn(glassClass('card', 'flex flex-col gap-4 rounded-3xl p-6'))}>
      <SectionTitle icon={UserRound} title="دفترچه‌ی پروفایل" />
      <div className="flex flex-col gap-3">
        <ProfileField label="نام و نام خانوادگی" value={form.name} onChange={(v) => update('name', v)} />
        <ProfileField label="موبایل تأییدشده" value={form.mobile} onChange={(v) => update('mobile', v)} ltr />
        <ProfileField label="نشانی دقیق پستی" value={form.address} onChange={(v) => update('address', v)} />
        <ProfileField label="کد پستی" value={form.postal} onChange={(v) => update('postal', v)} ltr />
        <ProfileField label="تماس اضطراری" value={form.emergency} onChange={(v) => update('emergency', v)} ltr />
      </div>
      <button
        type="button"
        onClick={() => setSaved(true)}
        className={cn(
          'mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] py-2.5 text-sm font-bold text-[#1C1917]',
          'shadow-lg shadow-[#F59E0B]/25 transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
        )}
      >
        {saved ? <BadgeCheck className="h-4 w-4" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        {saved ? 'ذخیره شد' : 'ذخیره‌ی تغییرات'}
      </button>
    </section>
  );
}

function ProfileField({ label, value, onChange, ltr = false }: { label: string; value: string; onChange: (v: string) => void; ltr?: boolean }): ReactNode {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-foreground/55">{label}</span>
      <input
        value={value}
        dir={ltr ? 'ltr' : 'rtl'}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-11 rounded-xl border border-foreground/15 bg-foreground/[0.04] px-3 text-sm text-foreground transition-colors',
          'focus-visible:outline-none focus-visible:border-[#F59E0B]/50',
          ltr && 'text-left',
        )}
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
//  B — Order & Document Tracking
// ---------------------------------------------------------------------------

function OrderTracking(): ReactNode {
  const deliveryIcon = (d: Order['delivery']): typeof Truck =>
    d === 'تحویل شده' ? PackageCheck : d === 'در حال ارسال' ? Truck : Clock;

  return (
    <section className={cn(glassClass('card', 'flex flex-col gap-4 rounded-3xl p-6'))}>
      <SectionTitle icon={PackageCheck} title="پیگیری سفارش‌ها و مدارک" />
      <ul className="flex flex-col gap-3">
        {ORDERS.map((order) => {
          const DIcon = deliveryIcon(order.delivery);
          const docOk = order.docs === 'تأیید شده';
          return (
            <li key={order.id} className={cn('flex items-center gap-4 rounded-2xl p-3', glassInset)}>
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productImage(order.productId)} alt={order.device} className="h-full w-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="truncate text-sm font-bold text-foreground">{order.device}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-foreground/60">
                    <DIcon className="h-3.5 w-3.5" aria-hidden />
                    {order.delivery}
                  </span>
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-foreground/60">مرحله: {order.stage}</span>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5', docOk ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-400/15 text-amber-300')}>
                    <FileCheck2 className="h-3 w-3" aria-hidden />
                    {order.docs}
                  </span>
                </div>
              </div>
              <Link
                href={`/product/${order.productId}`}
                className="shrink-0 rounded-lg p-2 text-foreground/40 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                aria-label="مشاهده محصول"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
//  D — Loyalty Vault (خوش‌حسابی)
// ---------------------------------------------------------------------------

function LoyaltyVault({ locked }: { locked: boolean }): ReactNode {
  if (locked) {
    return (
      <section className={cn(glassClass('card', 'flex flex-col items-center gap-3 rounded-3xl p-8 text-center'))}>
        <Lock className="h-10 w-10 text-foreground/30" aria-hidden />
        <h2 className="text-lg font-black text-foreground">گاوصندوق خوش‌حسابی قفل است</h2>
        <p className="max-w-md text-sm text-foreground/55">
          با تسویه‌ی به‌موقع اقساط معوقه، تخفیف‌های انحصاری خوش‌حسابی برای شما فعال می‌شود.
        </p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE_EXPO }}
      className="relative overflow-hidden rounded-3xl p-[2px]"
    >
      {/* Neon glowing border */}
      <span aria-hidden className="absolute inset-0 rounded-3xl bg-gradient-to-l from-[#22d3ee] via-[#F59E0B] to-[#7C3AED] opacity-80" />
      <div className="relative z-10 flex flex-col gap-5 rounded-[1.4rem] bg-background/90 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22d3ee]/20 text-[#22d3ee] shadow-[0_0_18px_rgba(34,211,238,0.5)]">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-black text-foreground">تخفیف‌های انحصاری خوش‌حسابی</h2>
              <p className="text-xs text-foreground/55">به‌خاطر پرداخت‌های به‌موقع، این پیشنهادها فقط برای شماست</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#22d3ee]" aria-hidden />
            <Countdown endsAt={new Date(NOW + DAY)} compact />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {VAULT_DEALS.map((deal) => {
            const off = Math.round((1 - deal.exclusive / deal.original) * 100);
            return (
              <Link
                key={deal.id}
                href={`/product/${deal.id}`}
                className={cn('group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-foreground/5', glassInset)}
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={productImage(deal.id)} alt={deal.name} className="h-full w-full object-cover" />
                  <span className="absolute right-1 top-1 rounded-full bg-[#22d3ee] px-1.5 py-0.5 text-[9px] font-black text-[#0F172A]">
                    ٪{toPersianDigits(off)}−
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-bold text-foreground">{deal.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-foreground/40 line-through tabular-nums">{formatToman(deal.original, { withSuffix: false })}</span>
                    <span className="text-sm font-black tabular-nums text-foreground">{formatToman(deal.exclusive)}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-gold">
                    اقساط از {formatToman(deal.monthly, { withSuffix: false })} تومان / ماه
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
//  Shared
// ---------------------------------------------------------------------------

function SectionTitle({ icon: Icon, title }: { icon: typeof Clock; title: string }): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
    </div>
  );
}
