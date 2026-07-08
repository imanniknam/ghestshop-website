'use client';

/**
 * GhestShop — User Payment Ledger & Interactive Timeline
 * ------------------------------------------------------------------
 * A vertical, color-coded installment tracker that maps 1:1 to the Prisma
 * `InstallmentPlan` → `InstallmentMonth` → `PaymentSlip` relation.
 *
 * Node states:
 *   • PAID (سبز)            — shows tracking number + Jalali approval date.
 *   • PENDING_REVIEW (زرد)  — blurs actions, runs an "accountant checking" loop.
 *   • OVERDUE (قرمز/کهربایی) — glowing border + days-overdue badge.
 *   • UNPAID                — actionable, ready to pay.
 *   • UPCOMING (خاکستری)    — clean minimal upcoming state.
 *
 * The morphing masterpiece: tapping an UNPAID/OVERDUE node promotes its card,
 * via a shared `layoutId`, into an expanding upload terminal (tracking number
 * field + drag-and-drop screenshot sub-zone). Strict RTL, tabular Persian
 * numerals, Jalali dates, spring physics, prefers-reduced-motion aware,
 * strict TS, zero placeholders.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from 'framer-motion';
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CloudUpload,
  Hourglass,
  Loader2,
  Lock,
  ReceiptText,
  TriangleAlert,
  X,
} from 'lucide-react';
import {
  daysOverdue,
  isActionable,
  type InstallmentStatus,
  type LedgerMonth,
  type LedgerPlan,
} from '@/lib/finance/ledger';
import { MAX_FILE_BYTES, validateDocumentFile } from '@/lib/validations/loan';
import { formatJalali, formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
//  Motion tokens
// ---------------------------------------------------------------------------

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };
const SOFT_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26 };

// ---------------------------------------------------------------------------
//  Status theming — one source of truth for color-coded nodes.
// ---------------------------------------------------------------------------

interface StatusTheme {
  readonly label: string;
  readonly dot: string;
  readonly ring: string;
  readonly card: string;
  readonly text: string;
}

const STATUS_THEME: Record<InstallmentStatus, StatusTheme> = {
  PAID: {
    label: 'پرداخت شده',
    dot: 'bg-emerald-500 text-white',
    ring: 'ring-emerald-500/30',
    card: 'border-emerald-500/30 bg-emerald-500/[0.06]',
    text: 'text-emerald-400',
  },
  PENDING_REVIEW: {
    label: 'در حال بررسی',
    dot: 'bg-amber-400 text-primary-foreground',
    ring: 'ring-amber-400/30',
    card: 'border-amber-400/30 bg-amber-400/[0.06]',
    text: 'text-amber-300',
  },
  OVERDUE: {
    label: 'دارای معوقه',
    dot: 'bg-red-500 text-white',
    ring: 'ring-red-500/40',
    card: 'border-red-500/50 bg-red-500/[0.07]',
    text: 'text-red-400',
  },
  UNPAID: {
    label: 'در انتظار پرداخت',
    dot: 'bg-primary text-primary-foreground',
    ring: 'ring-primary/30',
    card: 'border-primary/30 bg-primary/[0.06]',
    text: 'text-primary',
  },
  UPCOMING: {
    label: 'اقساط آتی',
    dot: 'bg-foreground/10 text-foreground/50',
    ring: 'ring-foreground/10',
    card: 'border-foreground/10 bg-foreground/[0.03]',
    text: 'text-foreground/45',
  },
};

// ---------------------------------------------------------------------------
//  Public props
// ---------------------------------------------------------------------------

export interface SlipSubmission {
  readonly monthId: string;
  readonly trackingNumber: string;
  readonly file: File;
}

export interface PaymentLedgerProps {
  plan: LedgerPlan;
  /**
   * Persists the slip (Server Action, Phase 5). On resolve the month flips to
   * PENDING_REVIEW locally. Reject to surface an inline error and keep the
   * upload terminal open.
   */
  onSubmitSlip?: (submission: SlipSubmission) => Promise<void> | void;
  className?: string;
}

// ===========================================================================
//  MAIN COMPONENT
// ===========================================================================

export function PaymentLedger({ plan, onSubmitSlip, className }: PaymentLedgerProps): ReactNode {
  const reduceMotion = useReducedMotion();

  // Local, optimistic copy of the months so an upload can flip status without a
  // round-trip. Re-synced whenever the server-provided plan changes.
  const [months, setMonths] = useState<LedgerMonth[]>(plan.months);
  useEffect(() => setMonths(plan.months), [plan.months]);

  const [openMonthId, setOpenMonthId] = useState<string | null>(null);

  const progress = useMemo(() => {
    const total = months.length || 1;
    const paid = months.filter((m) => m.status === 'PAID').length;
    return { paid, total, pct: Math.round((paid / total) * 100) };
  }, [months]);

  const handleSubmitted = useCallback((monthId: string, trackingNumber: string) => {
    setMonths((prev) =>
      prev.map((m) =>
        m.id === monthId
          ? {
              ...m,
              status: 'PENDING_REVIEW',
              slip: {
                id: `optimistic-${monthId}`,
                trackingNumber,
                paidAmount: m.amount,
                paidAt: new Date(),
                status: 'PENDING',
                reviewedAt: null,
                accountantRemarks: null,
              },
            }
          : m,
      ),
    );
    setOpenMonthId(null);
  }, []);

  return (
    <section
      dir="rtl"
      lang="fa"
      aria-label="دفتر اقساط و زمان‌بندی پرداخت"
      className={cn('mx-auto w-full max-w-2xl', className)}
    >
      <LedgerHeader plan={plan} progress={progress} />

      <LayoutGroup>
        <ol className="relative mt-6 flex flex-col">
          {/* The continuous spine of the timeline. */}
          <span
            aria-hidden
            className="absolute bottom-6 right-[1.4rem] top-6 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"
          />

          {months.map((month, index) => (
            <TimelineNode
              key={month.id}
              month={month}
              isLast={index === months.length - 1}
              isOpen={openMonthId === month.id}
              reduceMotion={Boolean(reduceMotion)}
              onOpen={() => setOpenMonthId(month.id)}
              onClose={() => setOpenMonthId(null)}
              onSubmitSlip={onSubmitSlip}
              onSubmitted={(tracking) => handleSubmitted(month.id, tracking)}
            />
          ))}
        </ol>
      </LayoutGroup>
    </section>
  );
}

// ===========================================================================
//  HEADER / PLAN SUMMARY
// ===========================================================================

function LedgerHeader({
  plan,
  progress,
}: {
  plan: LedgerPlan;
  progress: { paid: number; total: number; pct: number };
}): ReactNode {
  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-3xl border border-foreground/15 bg-foreground/10 p-6 backdrop-blur-xl',
        'shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-foreground/5',
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-primary/25 blur-3xl"
      />
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-foreground/60">مانده بدهی</span>
            <span className="text-2xl font-black tabular-nums text-foreground">
              {formatToman(plan.remainingBalance)}
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <ReceiptText className="h-6 w-6" aria-hidden />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCell label="قسط ماهانه" value={formatToman(plan.monthlyPayment, { withSuffix: false })} />
          <SummaryCell label="مبلغ کل" value={formatToman(plan.totalPayable, { withSuffix: false })} />
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-foreground/60">
            <span>
              {toPersianDigits(progress.paid)} از {toPersianDigits(progress.total)} قسط پرداخت شده
            </span>
            <span className="font-bold text-foreground">٪{toPersianDigits(progress.pct)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={SOFT_SPRING}
              className="h-full rounded-full bg-gradient-to-l from-primary to-secondary"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-2xl bg-foreground/5 p-3">
      <p className="text-sm text-foreground/50">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
        {value} <span className="text-sm font-normal text-foreground/40">تومان</span>
      </p>
    </div>
  );
}

// ===========================================================================
//  TIMELINE NODE
// ===========================================================================

interface TimelineNodeProps {
  month: LedgerMonth;
  isLast: boolean;
  isOpen: boolean;
  reduceMotion: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSubmitSlip?: (submission: SlipSubmission) => Promise<void> | void;
  onSubmitted: (trackingNumber: string) => void;
}

function TimelineNode({
  month,
  isLast,
  isOpen,
  reduceMotion,
  onOpen,
  onClose,
  onSubmitSlip,
  onSubmitted,
}: TimelineNodeProps): ReactNode {
  const theme = STATUS_THEME[month.status];
  const actionable = isActionable(month.status);
  const overdueDays = month.status === 'OVERDUE' ? daysOverdue(month.dueDate) : 0;

  return (
    <li className={cn('relative flex gap-4', !isLast && 'pb-4')}>
      {/* Node dot on the spine */}
      <div className="relative z-10 shrink-0">
        <motion.div
          layout
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-offset-0',
            theme.dot,
            theme.ring,
          )}
          animate={
            month.status === 'OVERDUE' && !reduceMotion
              ? { boxShadow: ['0 0 0 0 rgba(239,68,68,0.0)', '0 0 0 6px rgba(239,68,68,0.18)', '0 0 0 0 rgba(239,68,68,0.0)'] }
              : undefined
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <NodeIcon status={month.status} />
        </motion.div>
      </div>

      {/* Card / morphing terminal */}
      <div className="min-w-0 flex-1">
        <AnimatePresence initial={false}>
          {isOpen ? (
            <UploadTerminal
              key="terminal"
              month={month}
              reduceMotion={reduceMotion}
              onClose={onClose}
              onSubmitSlip={onSubmitSlip}
              onSubmitted={onSubmitted}
            />
          ) : (
            <NodeCard
              key="card"
              month={month}
              theme={theme}
              actionable={actionable}
              overdueDays={overdueDays}
              reduceMotion={reduceMotion}
              onOpen={onOpen}
            />
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

function NodeIcon({ status }: { status: InstallmentStatus }): ReactNode {
  switch (status) {
    case 'PAID':
      return <CheckCircle2 className="h-5 w-5" aria-hidden />;
    case 'PENDING_REVIEW':
      return <Hourglass className="h-5 w-5" aria-hidden />;
    case 'OVERDUE':
      return <TriangleAlert className="h-5 w-5" aria-hidden />;
    case 'UNPAID':
      return <CalendarClock className="h-5 w-5" aria-hidden />;
    case 'UPCOMING':
    default:
      return <CalendarClock className="h-5 w-5" aria-hidden />;
  }
}

// ===========================================================================
//  COLLAPSED NODE CARD
// ===========================================================================

interface NodeCardProps {
  month: LedgerMonth;
  theme: StatusTheme;
  actionable: boolean;
  overdueDays: number;
  reduceMotion: boolean;
  onOpen: () => void;
}

function NodeCard({ month, theme, actionable, overdueDays, reduceMotion, onOpen }: NodeCardProps): ReactNode {
  return (
    <motion.div
      layoutId={`ledger-card-${month.id}`}
      className={cn('rounded-2xl border p-4 backdrop-blur-sm', theme.card)}
      transition={reduceMotion ? { duration: 0 } : SPRING}
    >
      <motion.div layout="position" className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-foreground">
            قسط {toPersianDigits(month.monthIndex)}
          </span>
          <span className="text-sm text-foreground/55">
            سررسید: {formatJalali(month.dueDate)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('rounded-full px-2.5 py-0.5 text-sm font-bold', theme.card, theme.text)}>
            {theme.label}
          </span>
          <span className="text-sm font-black tabular-nums text-foreground">
            {formatToman(month.amount, { withSuffix: false })}
            <span className="mr-1 text-sm font-normal text-foreground/45">تومان</span>
          </span>
        </div>
      </motion.div>

      {/* PAID detail */}
      {month.status === 'PAID' && month.slip && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-foreground/10 pt-3 text-sm text-foreground/60">
          <span className="flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
            کد پیگیری:{' '}
            <span dir="ltr" className="font-semibold tabular-nums text-foreground/80">
              {toPersianDigits(month.slip.trackingNumber)}
            </span>
          </span>
          {month.slip.reviewedAt && (
            <span>تأیید: {formatJalali(month.slip.reviewedAt)}</span>
          )}
        </div>
      )}

      {/* PENDING_REVIEW — blurred actions + accountant-checking loop */}
      {month.status === 'PENDING_REVIEW' && (
        <div className="relative mt-3 border-t border-foreground/10 pt-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
            {!reduceMotion && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                className="inline-flex"
              >
                <Loader2 className="h-4 w-4" aria-hidden />
              </motion.span>
            )}
            در حال بررسی توسط واحد حسابداری…
          </div>
          {/* Action row, blurred & locked while under review */}
          <div className="pointer-events-none mt-2 flex select-none items-center gap-2 opacity-60 blur-[2px]">
            <span className="rounded-lg bg-foreground/10 px-3 py-1.5 text-sm">ویرایش رسید</span>
            <span className="rounded-lg bg-foreground/10 px-3 py-1.5 text-sm">حذف رسید</span>
            <Lock className="h-3.5 w-3.5 text-foreground/50" aria-hidden />
          </div>
        </div>
      )}

      {/* OVERDUE — days overdue badge */}
      {month.status === 'OVERDUE' && (
        <div className="mt-3 flex items-center gap-2 border-t border-red-500/20 pt-3 text-sm font-semibold text-red-400">
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
          {toPersianDigits(overdueDays)} روز معوقه — لطفاً در اسرع وقت پرداخت کنید
        </div>
      )}

      {/* Actionable CTA (UNPAID / OVERDUE) */}
      {actionable && (
        <motion.button
          type="button"
          onClick={onOpen}
          whileHover={reduceMotion ? undefined : { scale: 1.015 }}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
          transition={SPRING}
          className={cn(
            'mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-[filter]',
            'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          )}
        >
          <CloudUpload className="h-4 w-4" aria-hidden />
          ثبت رسید پرداخت
        </motion.button>
      )}
    </motion.div>
  );
}

// ===========================================================================
//  UPLOAD TERMINAL (the morphed state)
// ===========================================================================

interface UploadTerminalProps {
  month: LedgerMonth;
  reduceMotion: boolean;
  onClose: () => void;
  onSubmitSlip?: (submission: SlipSubmission) => Promise<void> | void;
  onSubmitted: (trackingNumber: string) => void;
}

const PERSIAN_TO_ASCII: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

function UploadTerminal({ month, reduceMotion, onClose, onSubmitSlip, onSubmitted }: UploadTerminalProps): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tracking, setTracking] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Clean up the preview object URL.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const acceptFile = useCallback(
    (incoming: File | undefined) => {
      setError(null);
      if (!incoming) return;
      const validationError = validateDocumentFile(incoming);
      if (validationError) {
        setError(validationError.message);
        return;
      }
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return incoming.type.startsWith('image/') ? URL.createObjectURL(incoming) : null;
      });
      setFile(incoming);
    },
    [],
  );

  const trackingValid = tracking.replace(/\D/g, '').length >= 6;
  const canSubmit = trackingValid && file !== null && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError('بارگذاری تصویر رسید الزامی است.');
      return;
    }
    if (!trackingValid) {
      setError('شماره پیگیری معتبر وارد کنید (حداقل ۶ رقم).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmitSlip?.({ monthId: month.id, trackingNumber: tracking, file });
      onSubmitted(tracking);
    } catch {
      setError('ثبت رسید با خطا مواجه شد. دوباره تلاش کنید.');
      setSubmitting(false);
    }
  }, [file, trackingValid, onSubmitSlip, month.id, tracking, onSubmitted]);

  return (
    <motion.div
      layoutId={`ledger-card-${month.id}`}
      transition={reduceMotion ? { duration: 0 } : SPRING}
      className="overflow-hidden rounded-2xl border border-primary/40 bg-primary/[0.07] p-4 backdrop-blur-md ring-1 ring-inset ring-primary/20"
    >
      <motion.div layout="position" className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground">
            ثبت رسید قسط {toPersianDigits(month.monthIndex)}
          </span>
          <span className="text-sm text-foreground/55">
            مبلغ: {formatToman(month.amount)}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          disabled={submitting}
          className="cursor-pointer rounded-lg p-2 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SOFT_SPRING, delay: reduceMotion ? 0 : 0.08 }}
        className="mt-4 flex flex-col gap-3"
      >
        {/* Tracking number */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`tracking-${month.id}`} className="text-sm font-medium text-foreground/80">
            شماره پیگیری تراکنش
          </label>
          <input
            id={`tracking-${month.id}`}
            type="text"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            value={toPersianDigits(tracking)}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTracking(
                e.target.value
                  .replace(/[۰-۹]/g, (d) => PERSIAN_TO_ASCII[d] ?? '')
                  .replace(/\D/g, '')
                  .slice(0, 18),
              )
            }
            placeholder="۱۲۳۴۵۶۷۸"
            className={cn(
              'w-full rounded-xl border bg-foreground/5 px-4 py-3 text-center text-sm tracking-[0.2em] text-foreground tabular-nums',
              'placeholder:text-foreground/30 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'border-foreground/10 hover:border-foreground/25 focus:border-primary/60',
            )}
          />
        </div>

        {/* Drag-and-drop sub-zone */}
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-foreground/5 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/20">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="پیش‌نمایش رسید" className="h-full w-full object-cover" />
              ) : (
                <ReceiptText className="h-5 w-5 text-primary" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground/70" dir="ltr">
                {file.name}
              </p>
              <p className="text-sm text-foreground/45">
                {toPersianDigits((file.size / (1024 * 1024)).toFixed(2))} مگابایت
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
                setFile(null);
              }}
              disabled={submitting}
              aria-label="حذف فایل"
              className="cursor-pointer rounded-lg p-2 text-foreground/50 transition-colors hover:text-destructive disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setIsDragging(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            aria-label="بارگذاری تصویر رسید بانکی"
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-foreground/15 bg-foreground/5 hover:border-primary/50 hover:bg-foreground/10',
            )}
          >
            <CloudUpload className="h-6 w-6 text-primary" aria-hidden />
            <p className="text-sm font-medium text-foreground/80">
              تصویر فیش واریزی را بکشید و رها کنید
            </p>
            <p className="text-sm text-foreground/45">
              JPG، PNG، WEBP یا PDF — حداکثر {toPersianDigits((MAX_FILE_BYTES / (1024 * 1024)).toFixed(0))} مگابایت
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                acceptFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SOFT_SPRING}
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
            >
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 cursor-pointer rounded-xl border border-foreground/10 py-2.5 text-sm font-semibold text-foreground/70 transition-colors hover:bg-foreground/5 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            انصراف
          </button>
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileHover={reduceMotion || !canSubmit ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion || !canSubmit ? undefined : { scale: 0.98 }}
            transition={SPRING}
            className={cn(
              'flex flex-[1.5] items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-[filter]',
              'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
              canSubmit ? 'cursor-pointer hover:brightness-110' : 'cursor-not-allowed opacity-40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                در حال ثبت…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                ثبت نهایی رسید
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PaymentLedger;
