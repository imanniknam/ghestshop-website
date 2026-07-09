'use client';

import { useState, type ReactNode } from 'react';
import { PackagePlus } from 'lucide-react';
import { RequestProductModal } from '@/components/store/request-product-modal';
import { cn } from '@/lib/utils';

export function RequestProductTrigger({ className }: { className?: string }): ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-primary/35 bg-primary/8 px-3 text-sm font-bold text-primary md:h-10 md:text-nav lg:px-4',
          'transition-colors hover:bg-primary/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          className,
        )}
      >
        <PackagePlus className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">درخواست کالای جدید</span>
        <span className="sm:hidden">درخواست کالا</span>
      </button>
      <RequestProductModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default RequestProductTrigger;
