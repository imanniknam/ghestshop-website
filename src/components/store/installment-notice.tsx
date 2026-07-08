/**
 * GhestShop — Installment purchase notice (matches live site legal banner).
 */

import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface InstallmentNoticeProps {
  className?: string;
}

export function InstallmentNotice({ className }: InstallmentNoticeProps): ReactNode {
  return (
    <div
      dir="rtl"
      role="note"
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-body leading-relaxed text-foreground/90',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p>
        لطفاً{' '}
        <Link href="#installment-rules" className="font-bold text-primary underline-offset-2 hover:underline">
          قوانین خرید اقساطی
        </Link>{' '}
        را مطالعه فرمائید سپس اقدام به خرید نمائید.
      </p>
    </div>
  );
}

export default InstallmentNotice;
