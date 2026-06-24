'use client';

/**
 * GhestShop — Financial Admin Control Tower
 * ------------------------------------------------------------------
 *   A. Order & Risk Underwriting — dual-pane KYC/cheque review (reused).
 *   B. Weekly Collection Schedule — payments due in the next 7 days.
 *   C. AI No-Code CMS Creator     — product form with one-click AI Persian
 *      copy + spec generation (`generateProductContent`).
 * Strict RTL, Liquid-Glass, reduced-motion aware.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarRange,
  PlusCircle,
  ShieldQuestion,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { DocumentReviewStation } from '@/components/admin/document-review-station';
import { mapApplication, type RawApplication } from '@/lib/admin/types';
import { generateProductContent, type GeneratedContent } from '@/lib/store/ai';
import { EASE_EXPO } from '@/lib/motion';
import { glassClass, glassInset } from '@/lib/glass';
import { formatJalali, formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
//  Mock underwriting queue
// ---------------------------------------------------------------------------

const ID_DOC = 'https://placehold.co/640x480/0f172a/f8fafc?text=National+Card';
const CHEQUE_DOC = 'https://placehold.co/640x480/1e293b/f8fafc?text=Cheque+Sayadi';

const RAW_APPLICATIONS: RawApplication[] = [
  {
    id: 'app_1', status: 'PENDING', requestedPrincipal: 54_000_000, downPayment: 8_000_000, requestedMonths: 12,
    submittedAt: new Date(), product: { title: 'آیفون ۱۵ پرو مکس' },
    user: { id: 'u1', firstName: 'سارا', lastName: 'محمدی', nationalId: '0012345678', phone: '+989121110011', creditScore: 820 },
    documents: [
      { id: 'd1', type: 'NATIONAL_CARD_FRONT', url: ID_DOC, fileName: 'card.jpg' },
      { id: 'd2', type: 'CHEQUE', url: CHEQUE_DOC, fileName: 'cheque.jpg' },
    ],
  },
  {
    id: 'app_2', status: 'PENDING', requestedPrincipal: 38_500_000, downPayment: 6_500_000, requestedMonths: 18,
    submittedAt: new Date(), product: { title: 'سامسونگ گلکسی S24 اولترا' },
    user: { id: 'u2', firstName: 'امیر', lastName: 'رضایی', nationalId: '0023456789', phone: '+989351230022', creditScore: 540 },
    documents: [
      { id: 'd3', type: 'NATIONAL_CARD_FRONT', url: ID_DOC, fileName: 'card.jpg' },
      { id: 'd4', type: 'SAFTEH', url: CHEQUE_DOC, fileName: 'safteh.jpg' },
    ],
  },
  {
    id: 'app_3', status: 'PENDING', requestedPrincipal: 71_000_000, downPayment: 12_000_000, requestedMonths: 24,
    submittedAt: new Date(), product: { title: 'مک‌بوک ایر M3' },
    user: { id: 'u3', firstName: 'نگار', lastName: 'کریمی', nationalId: '0034567890', phone: '+989901240033', creditScore: 290 },
    documents: [
      { id: 'd5', type: 'NATIONAL_CARD_FRONT', url: ID_DOC, fileName: 'card.jpg' },
      { id: 'd6', type: 'CHEQUE', url: CHEQUE_DOC, fileName: 'cheque.jpg' },
    ],
  },
];

// ---------------------------------------------------------------------------
//  Weekly collection schedule
// ---------------------------------------------------------------------------

type DueStatus = 'پرداخت شده' | 'معوقه' | 'در انتظار';

interface DueRow {
  readonly client: string;
  readonly device: string;
  readonly dueInDays: number;
  readonly installmentNo: number;
  readonly totalInstallments: number;
  readonly amount: number;
  readonly status: DueStatus;
}

const DUE_ROWS: DueRow[] = [
  { client: 'سارا محمدی', device: 'آیفون ۱۵ پرو مکس', dueInDays: 1, installmentNo: 3, totalInstallments: 12, amount: 5_200_000, status: 'پرداخت شده' },
  { client: 'امیر رضایی', device: 'گلکسی S24 اولترا', dueInDays: 2, installmentNo: 5, totalInstallments: 18, amount: 3_800_000, status: 'در انتظار' },
  { client: 'نگار کریمی', device: 'شیائومی ۱۴', dueInDays: 3, installmentNo: 2, totalInstallments: 24, amount: 2_100_000, status: 'معوقه' },
  { client: 'حسین اکبری', device: 'ردمی نوت ۱۳ پرو', dueInDays: 5, installmentNo: 7, totalInstallments: 12, amount: 1_450_000, status: 'در انتظار' },
  { client: 'مریم رستمی', device: 'گلکسی Z Flip6', dueInDays: 6, installmentNo: 1, totalInstallments: 24, amount: 4_650_000, status: 'پرداخت شده' },
];

const STATUS_STYLE: Record<DueStatus, string> = {
  'پرداخت شده': 'bg-emerald-500/15 text-emerald-400',
  معوقه: 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]',
  'در انتظار': 'bg-amber-400/15 text-amber-300',
};

export default function AdminPage(): ReactNode {
  const applications = useMemo(() => RAW_APPLICATIONS.map(mapApplication), []);

  return (
    <main dir="rtl" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#7C3AED] text-white">
          <ShieldQuestion className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">برج کنترل مدیریت مالی</h1>
          <p className="text-sm text-foreground/55">اعتبارسنجی، وصول اقساط و مدیریت محصولات</p>
        </div>
      </header>

      {/* A — Underwriting */}
      <section className="flex flex-col gap-4">
        <SectionTitle icon={ShieldQuestion} title="اعتبارسنجی و بررسی ریسک سفارش‌ها" />
        <DocumentReviewStation applications={applications} />
      </section>

      {/* B — Weekly collection */}
      <WeeklyCollection />

      {/* C — AI CMS creator */}
      <CmsCreator />
    </main>
  );
}

function WeeklyCollection(): ReactNode {
  const now = new Date();
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle icon={CalendarRange} title="برنامه‌ی وصول هفتگی (۷ روز آینده)" />
      <div className={cn(glassClass('card', 'overflow-hidden rounded-3xl'))}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-right text-sm">
            <thead>
              <tr className="border-b border-foreground/10 text-[11px] text-foreground/45">
                <th className="px-5 py-3 font-medium">نام مشتری</th>
                <th className="px-5 py-3 font-medium">دستگاه</th>
                <th className="px-5 py-3 font-medium">سررسید (شمسی)</th>
                <th className="px-5 py-3 font-medium">قسط</th>
                <th className="px-5 py-3 font-medium">مبلغ خالص</th>
                <th className="px-5 py-3 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {DUE_ROWS.map((row, i) => (
                <tr key={i} className="transition-colors hover:bg-foreground/[0.03]">
                  <td className="px-5 py-3 font-bold text-foreground">{row.client}</td>
                  <td className="px-5 py-3 text-foreground/70">{row.device}</td>
                  <td className="px-5 py-3 text-foreground/70">{formatJalali(new Date(now.getTime() + row.dueInDays * 86_400_000))}</td>
                  <td className="px-5 py-3 text-foreground/70">
                    قسط {toPersianDigits(row.installmentNo)} از {toPersianDigits(row.totalInstallments)}
                  </td>
                  <td className="px-5 py-3 font-bold tabular-nums text-foreground">{formatToman(row.amount, { withSuffix: false })}</td>
                  <td className="px-5 py-3">
                    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold', STATUS_STYLE[row.status])}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function CmsCreator(): ReactNode {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [added, setAdded] = useState(false);

  const generate = (): void => {
    if (name.trim().length < 2) return;
    setGenerating(true);
    setAdded(false);
    // Simulated async AI generation.
    window.setTimeout(() => {
      setContent(generateProductContent(name));
      setGenerating(false);
    }, 650);
  };

  return (
    <section className="flex flex-col gap-4">
      <SectionTitle icon={Wand2} title="ساخت محصول با هوش مصنوعی (بدون کدنویسی)" />
      <div className={cn(glassClass('card', 'grid grid-cols-1 gap-6 rounded-3xl p-6 lg:grid-cols-2'))}>
        {/* Form */}
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-foreground/55">نام / مدل محصول</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: آیفون ۱۶ پرو مکس"
              className="h-11 rounded-xl border border-foreground/15 bg-foreground/[0.04] px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:border-[#F59E0B]/50"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-foreground/55">قیمت نقدی (تومان)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              dir="ltr"
              placeholder="78000000"
              className="h-11 rounded-xl border border-foreground/15 bg-foreground/[0.04] px-3 text-left text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:border-[#F59E0B]/50"
            />
          </label>

          <button
            type="button"
            onClick={generate}
            disabled={name.trim().length < 2 || generating}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#F59E0B] to-[#7C3AED] py-3 text-sm font-bold text-white',
              'shadow-lg shadow-[#7C3AED]/25 transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
            )}
          >
            <Sparkles className={cn('h-4 w-4', generating && 'animate-pulse')} aria-hidden />
            {generating ? 'در حال تولید محتوا…' : 'تولید محتوا با هوش مصنوعی'}
          </button>

          <button
            type="button"
            onClick={() => content && setAdded(true)}
            disabled={!content}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/15 py-2.5 text-sm font-bold text-foreground transition-colors',
              'hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]',
            )}
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            {added ? 'محصول افزوده شد' : 'افزودن به فروشگاه'}
          </button>
        </div>

        {/* AI preview */}
        <div className={cn('flex flex-col gap-3 rounded-2xl p-4', glassInset)}>
          {content ? (
            <motion.div
              key={content.tagline}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_EXPO }}
              className="flex flex-col gap-3"
            >
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#7C3AED]/15 px-2.5 py-1 text-[11px] font-bold text-[#a78bfa]">
                <Sparkles className="h-3 w-3" aria-hidden />
                خروجی هوش مصنوعی
              </span>
              <p className="text-sm font-black text-foreground">{content.tagline}</p>
              <p className="text-xs leading-relaxed text-foreground/70">{content.description}</p>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-foreground/50">دسته‌بندی: {content.category}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {content.specs.map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between rounded-lg bg-foreground/[0.04] px-2.5 py-1.5">
                      <span className="text-[10px] text-foreground/50">{spec.label}</span>
                      <span className="text-[11px] font-bold text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-foreground/40">
              <Wand2 className="h-8 w-8" aria-hidden />
              <p className="text-xs">نام محصول را وارد کنید و دکمه‌ی تولید محتوا را بزنید تا توضیحات و مشخصات به‌صورت خودکار ساخته شوند.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof CalendarRange; title: string }): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
    </div>
  );
}
