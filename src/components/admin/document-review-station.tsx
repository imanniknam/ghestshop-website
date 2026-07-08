'use client';

/**
 * GhestShop — Dual-Pane KYC & Document Approval Station
 * ------------------------------------------------------------------
 * Left pane: scrollable list of pending LoanApplications with quick-glance
 * risk scores. Right pane: an animated dual-document inspector showing the
 * National ID scan side-by-side with the Cheque/Safteh, plus single-click
 * Approve / Reject actions. Reject opens an animated remarks popover
 * (علت رد مدارک). Spring physics, strict RTL, full keyboard support.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import {
  CheckCircle2,
  FileSearch,
  IdCard,
  Inbox,
  Loader2,
  ScrollText,
  ShieldQuestion,
  X,
} from 'lucide-react';
import {
  DOCUMENT_TYPE_LABEL,
  assessRisk,
  type AdminApplication,
  type AdminDocument,
  type RiskBand,
} from '@/lib/admin/types';
import { formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };
const SOFT_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26 };

const RISK_STYLES: Record<RiskBand, string> = {
  LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  HIGH: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export interface DocumentReviewStationProps {
  applications: AdminApplication[];
  onApprove?: (applicationId: string) => Promise<void> | void;
  onReject?: (applicationId: string, remarks: string) => Promise<void> | void;
  className?: string;
}

export function DocumentReviewStation({
  applications,
  onApprove,
  onReject,
  className,
}: DocumentReviewStationProps): ReactNode {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(applications[0]?.id ?? null);

  const selected = useMemo(
    () => applications.find((a) => a.id === selectedId) ?? null,
    [applications, selectedId],
  );

  return (
    <div
      dir="rtl"
      className={cn(
        'grid grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr]',
        className,
      )}
    >
      {/* ---- Left pane: application list ------------------------------- */}
      <aside className="flex max-h-[34rem] flex-col overflow-hidden rounded-3xl border border-foreground/15 bg-foreground/10 backdrop-blur-xl ring-1 ring-inset ring-foreground/5">
        <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
          <h3 className="text-sm font-bold text-foreground">درخواست‌های در انتظار</h3>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-sm font-bold text-primary tabular-nums">
            {toPersianDigits(applications.length)}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-2">
          {applications.length === 0 ? (
            <EmptyState icon={Inbox} text="درخواستی برای بررسی وجود ندارد" />
          ) : (
            <ul className="flex flex-col gap-1">
              {applications.map((app) => {
                const risk = assessRisk(app.applicant.creditScore);
                const active = app.id === selectedId;
                return (
                  <li key={app.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(app.id)}
                      aria-pressed={active}
                      className={cn(
                        'relative w-full cursor-pointer rounded-2xl border p-3 text-right transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-transparent hover:bg-foreground/5',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="app-active-rail"
                          transition={reduceMotion ? { duration: 0 } : SPRING}
                          className="absolute inset-y-2 right-0 w-1 rounded-full bg-primary"
                        />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {app.applicant.fullName}
                          </p>
                          <p className="truncate text-sm text-foreground/50">{app.productTitle}</p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full border px-2 py-0.5 text-sm font-bold tabular-nums',
                            RISK_STYLES[risk.band],
                          )}
                        >
                          {toPersianDigits(risk.score)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold tabular-nums text-foreground/70">
                        {formatToman(app.requestedPrincipal)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* ---- Right pane: dynamic inspector ----------------------------- */}
      <section className="min-h-[34rem] overflow-hidden rounded-3xl border border-foreground/15 bg-foreground/10 backdrop-blur-xl ring-1 ring-inset ring-foreground/5">
        <AnimatePresence mode="wait">
          {selected ? (
            <Inspector
              key={selected.id}
              application={selected}
              reduceMotion={Boolean(reduceMotion)}
              onApprove={onApprove}
              onReject={onReject}
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <EmptyState icon={FileSearch} text="یک درخواست را برای بررسی انتخاب کنید" />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

// ===========================================================================
//  INSPECTOR
// ===========================================================================

interface InspectorProps {
  application: AdminApplication;
  reduceMotion: boolean;
  onApprove?: (applicationId: string) => Promise<void> | void;
  onReject?: (applicationId: string, remarks: string) => Promise<void> | void;
}

function Inspector({ application, reduceMotion, onApprove, onReject }: InspectorProps): ReactNode {
  const [rejecting, setRejecting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const risk = assessRisk(application.applicant.creditScore);

  // Pick the two documents to display side-by-side: an identity doc and the
  // financial guarantee (cheque/safteh).
  const identityDoc = useMemo<AdminDocument | undefined>(
    () =>
      application.documents.find(
        (d) => d.type === 'NATIONAL_CARD_FRONT' || d.type === 'NATIONAL_CARD_BACK',
      ),
    [application.documents],
  );
  const guaranteeDoc = useMemo<AdminDocument | undefined>(
    () => application.documents.find((d) => d.type === 'CHEQUE' || d.type === 'SAFTEH'),
    [application.documents],
  );

  const handleApprove = useCallback(async () => {
    setBusy('approve');
    try {
      await onApprove?.(application.id);
    } finally {
      setBusy(null);
    }
  }, [onApprove, application.id]);

  const handleReject = useCallback(async () => {
    if (remarks.trim().length < 3) return;
    setBusy('reject');
    try {
      await onReject?.(application.id, remarks.trim());
      setRejecting(false);
      setRemarks('');
    } finally {
      setBusy(null);
    }
  }, [onReject, application.id, remarks]);

  return (
    <motion.div
      initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
      transition={reduceMotion ? { duration: 0 } : SPRING}
      className="flex h-full flex-col"
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <IdCard className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{application.applicant.fullName}</p>
            <p className="text-sm text-foreground/55" dir="ltr">
              {application.applicant.nationalId
                ? toPersianDigits(application.applicant.nationalId)
                : '—'}{' '}
              · {toPersianDigits(application.applicant.phone)}
            </p>
          </div>
        </div>
        <span className={cn('rounded-full border px-3 py-1 text-sm font-bold', RISK_STYLES[risk.band])}>
          {risk.label} · {toPersianDigits(risk.score)}
        </span>
      </header>

      {/* Application facts */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4">
        <Fact label="محصول" value={application.productTitle} />
        <Fact label="مبلغ تأمین" value={formatToman(application.requestedPrincipal, { withSuffix: false })} />
        <Fact label="پیش‌پرداخت" value={formatToman(application.downPayment, { withSuffix: false })} />
        <Fact label="مدت" value={`${toPersianDigits(application.months)} ماه`} />
      </div>

      {/* Dual-document inspector */}
      <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
        <DocumentPane title="مدرک هویتی" fallbackIcon={IdCard} document={identityDoc} />
        <DocumentPane title="چک صیادی / سفته" fallbackIcon={ScrollText} document={guaranteeDoc} />
      </div>

      {/* Action bar */}
      <div className="relative border-t border-foreground/10 p-4">
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={busy !== null}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="flex-1 cursor-pointer rounded-xl border border-destructive/40 bg-destructive/10 py-3 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            رد درخواست
          </motion.button>
          <motion.button
            type="button"
            onClick={handleApprove}
            disabled={busy !== null}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={SPRING}
            className="flex flex-[1.4] cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-[filter] hover:brightness-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {busy === 'approve' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            )}
            تأیید مدارک
          </motion.button>
        </div>

        {/* Reject remarks popover */}
        <AnimatePresence>
          {rejecting && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !busy && setRejecting(false)}
                className="absolute inset-0 z-10 rounded-b-3xl bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="علت رد مدارک"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={reduceMotion ? { duration: 0 } : SOFT_SPRING}
                className="absolute inset-x-4 bottom-4 z-20 rounded-2xl border border-foreground/15 bg-background/95 p-4 shadow-2xl"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <ShieldQuestion className="h-4 w-4 text-destructive" aria-hidden />
                    علت رد مدارک
                  </h4>
                  <button
                    type="button"
                    onClick={() => setRejecting(false)}
                    disabled={busy !== null}
                    aria-label="بستن"
                    className="cursor-pointer rounded-lg p-1.5 text-foreground/50 hover:bg-foreground/10 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="مثلاً: تصویر کارت ملی ناخوانا است یا چک صیادی ثبت نشده."
                  className="w-full resize-none rounded-xl border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground placeholder:text-foreground/30 focus-visible:border-destructive/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground/40">حداقل ۳ کاراکتر</span>
                  <motion.button
                    type="button"
                    onClick={handleReject}
                    disabled={remarks.trim().length < 3 || busy !== null}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-destructive/25 transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {busy === 'reject' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    ثبت رد درخواست
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ===========================================================================
//  SUB-COMPONENTS
// ===========================================================================

function Fact({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-xl bg-foreground/5 px-3 py-2">
      <p className="text-sm text-foreground/45">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

interface DocumentPaneProps {
  title: string;
  document?: AdminDocument;
  fallbackIcon: typeof IdCard;
}

function DocumentPane({ title, document, fallbackIcon: FallbackIcon }: DocumentPaneProps): ReactNode {
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-black/20">
      <figcaption className="flex items-center justify-between border-b border-foreground/10 bg-foreground/5 px-3 py-2">
        <span className="text-sm font-bold text-foreground/80">{title}</span>
        {document && (
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-sm text-foreground/60">
            {DOCUMENT_TYPE_LABEL[document.type]}
          </span>
        )}
      </figcaption>
      <div className="relative flex aspect-[4/3] items-center justify-center">
        {document ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={document.url}
            alt={`${title} — ${document.fileName}`}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-foreground/30">
            <FallbackIcon className="h-8 w-8" aria-hidden />
            <span className="text-sm">مدرکی بارگذاری نشده</span>
          </div>
        )}
      </div>
    </figure>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Inbox; text: string }): ReactNode {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center text-foreground/40">
      <Icon className="h-10 w-10" aria-hidden />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export default DocumentReviewStation;
