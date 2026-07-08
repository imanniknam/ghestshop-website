'use client';

/**
 * GhestShop — Payment Slip Audit Ledger
 * ------------------------------------------------------------------
 * A scannable ledger of uploaded bank-transfer screenshots. Each row expands
 * inline (shared layout animation) to inspect the slip image + tracking
 * number, with quick Approve / Reject triggers and a deep-link to the user's
 * specific installment-month ledger. Strict RTL, Jalali dates, Persian
 * numerals, spring physics.
 */

import { useCallback, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import {
  CheckCircle2,
  ExternalLink,
  Hourglass,
  Loader2,
  Receipt,
  ShieldX,
  XCircle,
} from 'lucide-react';
import type { AdminSlip, SlipStatus } from '@/lib/admin/types';
import { formatJalali, formatToman, toPersianDigits } from '@/lib/format';
import { cn } from '@/lib/utils';

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };
const SOFT_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26 };

const SLIP_STATUS: Record<SlipStatus, { label: string; icon: typeof Hourglass; className: string }> = {
  PENDING: { label: 'در انتظار بررسی', icon: Hourglass, className: 'bg-amber-400/15 text-amber-300 border-amber-400/30' },
  APPROVED: { label: 'تأیید شده', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  REJECTED: { label: 'رد شده', icon: XCircle, className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

/**
 * Deep-link to a user's installment-month ledger. Derived from serializable
 * data on the slip itself — kept inside the Client Component so no function
 * needs to cross the Server→Client boundary.
 */
function buildLedgerHref(slip: AdminSlip): string {
  return `/admin/plans/${slip.planId}?month=${slip.monthId}`;
}

export interface SlipAuditLedgerProps {
  slips: AdminSlip[];
  onApproveSlip?: (slipId: string) => Promise<void> | void;
  onRejectSlip?: (slipId: string) => Promise<void> | void;
  className?: string;
}

export function SlipAuditLedger({
  slips,
  onApproveSlip,
  onRejectSlip,
  className,
}: SlipAuditLedgerProps): ReactNode {
  const reduceMotion = useReducedMotion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div
      dir="rtl"
      className={cn(
        'overflow-hidden rounded-3xl border border-foreground/15 bg-foreground/10 backdrop-blur-xl ring-1 ring-inset ring-foreground/5',
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">دفتر حسابرسی رسیدها</h3>
        </div>
        <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-foreground/70">
          {toPersianDigits(slips.length)} رسید
        </span>
      </header>

      {slips.length === 0 ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center text-foreground/40">
          <Receipt className="h-10 w-10" aria-hidden />
          <p className="text-sm">رسیدی برای حسابرسی ثبت نشده است</p>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {/* Column header (desktop) */}
          <li className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2 text-sm font-medium text-foreground/40 sm:grid">
            <span>کاربر / قسط</span>
            <span>شماره پیگیری</span>
            <span>مبلغ</span>
            <span>تاریخ واریز</span>
            <span>وضعیت</span>
          </li>

          {slips.map((slip) => (
            <SlipRow
              key={slip.id}
              slip={slip}
              expanded={expandedId === slip.id}
              reduceMotion={Boolean(reduceMotion)}
              onToggle={() => setExpandedId((id) => (id === slip.id ? null : slip.id))}
              onApproveSlip={onApproveSlip}
              onRejectSlip={onRejectSlip}
              ledgerHref={buildLedgerHref(slip)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ===========================================================================
//  ROW
// ===========================================================================

interface SlipRowProps {
  slip: AdminSlip;
  expanded: boolean;
  reduceMotion: boolean;
  onToggle: () => void;
  onApproveSlip?: (slipId: string) => Promise<void> | void;
  onRejectSlip?: (slipId: string) => Promise<void> | void;
  ledgerHref?: string;
}

function SlipRow({
  slip,
  expanded,
  reduceMotion,
  onToggle,
  onApproveSlip,
  onRejectSlip,
  ledgerHref,
}: SlipRowProps): ReactNode {
  const status = SLIP_STATUS[slip.status];
  const StatusIcon = status.icon;
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  const run = useCallback(
    async (kind: 'approve' | 'reject', fn?: (id: string) => Promise<void> | void) => {
      setBusy(kind);
      try {
        await fn?.(slip.id);
      } finally {
        setBusy(null);
      }
    },
    [slip.id],
  );

  return (
    <li>
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          'grid w-full cursor-pointer grid-cols-2 items-center gap-3 px-5 py-3 text-right transition-colors hover:bg-foreground/5 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          expanded && 'bg-foreground/5',
        )}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-foreground">{slip.applicantName}</span>
          <span className="block text-sm text-foreground/50">قسط {toPersianDigits(slip.monthIndex)}</span>
        </span>
        <span dir="ltr" className="hidden text-sm font-semibold tabular-nums text-foreground/75 sm:block">
          {toPersianDigits(slip.trackingNumber)}
        </span>
        <span className="hidden text-sm font-bold tabular-nums text-foreground sm:block">
          {formatToman(slip.amount, { withSuffix: false })}
        </span>
        <span className="hidden text-sm text-foreground/55 sm:block">{formatJalali(slip.paidAt)}</span>
        <span className={cn('inline-flex items-center gap-1 justify-self-end rounded-full border px-2 py-0.5 text-sm font-bold', status.className)}>
          <StatusIcon className="h-3 w-3" aria-hidden />
          {status.label}
        </span>
      </button>

      {/* Inline expansion */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : SOFT_SPRING}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-4 border-t border-foreground/5 bg-black/10 p-5 sm:grid-cols-[16rem_1fr]">
              {/* Screenshot */}
              <motion.figure
                layout
                className="overflow-hidden rounded-2xl border border-foreground/10 bg-black/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slip.url}
                  alt={`رسید واریز ${slip.applicantName}`}
                  loading="lazy"
                  className="h-48 w-full object-contain"
                />
              </motion.figure>

              {/* Detail + actions */}
              <div className="flex flex-col justify-between gap-4">
                <dl className="grid grid-cols-2 gap-3">
                  <Detail label="شماره پیگیری" value={toPersianDigits(slip.trackingNumber)} ltr />
                  <Detail label="مبلغ واریزی" value={formatToman(slip.amount)} />
                  <Detail label="تاریخ واریز" value={formatJalali(slip.paidAt)} />
                  <Detail label="شماره قسط" value={`قسط ${toPersianDigits(slip.monthIndex)}`} />
                </dl>

                <div className="flex flex-wrap items-center gap-2">
                  {ledgerHref && (
                    <a
                      href={ledgerHref}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-foreground/10 px-3 py-2 text-sm font-semibold text-foreground/75 transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      مشاهده دفتر اقساط کاربر
                    </a>
                  )}

                  {slip.status === 'PENDING' && (
                    <div className="ms-auto flex items-center gap-2">
                      <motion.button
                        type="button"
                        onClick={() => run('reject', onRejectSlip)}
                        disabled={busy !== null}
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {busy === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <ShieldX className="h-3.5 w-3.5" aria-hidden />}
                        رد رسید
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => run('approve', onApproveSlip)}
                        disabled={busy !== null}
                        whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        transition={SPRING}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-[filter] hover:brightness-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        {busy === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
                        تأیید رسید
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Detail({ label, value, ltr = false }: { label: string; value: string; ltr?: boolean }): ReactNode {
  return (
    <div className="rounded-xl bg-foreground/5 px-3 py-2">
      <dt className="text-sm text-foreground/45">{label}</dt>
      <dd
        dir={ltr ? 'ltr' : 'rtl'}
        className={cn('mt-0.5 text-sm font-bold tabular-nums text-foreground', ltr && 'text-left')}
      >
        {value}
      </dd>
    </div>
  );
}

export default SlipAuditLedger;
