'use client';

/**
 * GhestShop — Admin Overlord Dashboard (orchestrator)
 * ------------------------------------------------------------------
 * The back-office nerve center. Composes three workstations behind an
 * animated RTL tab rail:
 *   1. تحلیل و آمار        → AnalyticsSuite (Recharts)
 *   2. بررسی مدارک (KYC)   → DocumentReviewStation (dual-pane)
 *   3. حسابرسی رسیدها      → SlipAuditLedger
 *
 * All data flows in via props (wired to Server Actions / RSC fetches in
 * Phase 5). Spring physics, strict RTL, fully typed.
 */

import { useState, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { BarChart3, FileCheck2, ReceiptText } from 'lucide-react';
import {
  AnalyticsSuite,
  type AnalyticsSuiteProps,
} from '@/components/admin/analytics-suite';
import {
  DocumentReviewStation,
  type DocumentReviewStationProps,
} from '@/components/admin/document-review-station';
import {
  SlipAuditLedger,
  type SlipAuditLedgerProps,
} from '@/components/admin/slip-audit-ledger';
import { cn } from '@/lib/utils';

const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };

type TabKey = 'analytics' | 'documents' | 'slips';

interface TabDef {
  readonly key: TabKey;
  readonly label: string;
  readonly icon: ComponentType<{ className?: string }>;
}

const TABS: readonly TabDef[] = [
  { key: 'analytics', label: 'تحلیل و آمار', icon: BarChart3 },
  { key: 'documents', label: 'بررسی مدارک', icon: FileCheck2 },
  { key: 'slips', label: 'حسابرسی رسیدها', icon: ReceiptText },
];

export interface OverlordDashboardProps {
  analytics: AnalyticsSuiteProps;
  documentReview: DocumentReviewStationProps;
  slipAudit: SlipAuditLedgerProps;
  /** Name shown in the top bar (e.g. the signed-in admin/accountant). */
  operatorName?: string;
  className?: string;
}

export function OverlordDashboard({
  analytics,
  documentReview,
  slipAudit,
  operatorName,
  className,
}: OverlordDashboardProps): ReactNode {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<TabKey>('analytics');

  return (
    <div
      dir="rtl"
      lang="fa"
      className={cn(
        'min-h-screen w-full bg-[var(--color-background)] px-4 py-6 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-[var(--color-foreground)]">داشبورد مدیریت</h1>
            <p className="text-sm text-[var(--color-foreground)]/55">مرکز فرماندهی فروشگاه قسطی</p>
          </div>
          {operatorName && (
            <div className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-black text-[var(--color-on-primary)]">
                {operatorName.trim().charAt(0)}
              </div>
              <div className="leading-tight">
                <p className="text-xs text-[var(--color-foreground)]/50">اپراتور</p>
                <p className="text-sm font-bold text-[var(--color-foreground)]">{operatorName}</p>
              </div>
            </div>
          )}
        </header>

        {/* Tab rail */}
        <nav
          role="tablist"
          aria-label="بخش‌های داشبورد"
          className="flex w-full items-center gap-1 rounded-2xl border border-foreground/10 bg-foreground/5 p-1 backdrop-blur-xl sm:w-fit"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors sm:flex-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
                  active ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-foreground)]/60 hover:text-[var(--color-foreground)]',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-tab-pill"
                    transition={reduceMotion ? { duration: 0 } : SPRING}
                    className="absolute inset-0 -z-10 rounded-xl bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/25"
                  />
                )}
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Panels */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              role="tabpanel"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
              transition={reduceMotion ? { duration: 0 } : SPRING}
            >
              {tab === 'analytics' && <AnalyticsSuite {...analytics} />}
              {tab === 'documents' && <DocumentReviewStation {...documentReview} />}
              {tab === 'slips' && <SlipAuditLedger {...slipAudit} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default OverlordDashboard;
