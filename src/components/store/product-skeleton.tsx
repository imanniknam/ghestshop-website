/**
 * GhestShop — Product Card Skeleton
 * ------------------------------------------------------------------
 * Shimmering placeholder that mirrors `ProductCard`'s exact geometry — same
 * rounded faux-glass shell, square image block, two-line title, spec chips,
 * pricing block, and CTA height. Because every reserved box matches the real
 * card, swapping skeleton → content produces zero layout shift (CLS = 0).
 *
 * Server-renderable (no hooks). The shimmer uses the Tailwind `shimmer`
 * keyframe (background-position sweep) — pure CSS, no JS, reduced-motion-safe
 * via the global media query.
 */

import type { ReactNode } from 'react';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

/** A single shimmering block. */
function Shimmer({ className }: { className?: string }): ReactNode {
  return (
    <span
      aria-hidden
      className={cn(
        'block rounded-md bg-[length:200%_100%] animate-shimmer',
        'bg-gradient-to-r from-white/[0.04] via-white/[0.12] to-white/[0.04]',
        className,
      )}
    />
  );
}

export function ProductSkeleton({ className }: { className?: string }): ReactNode {
  return (
    <div
      aria-hidden
      className={cn(glassClass('card', 'flex flex-col overflow-hidden rounded-3xl'), className)}
    >
      {/* Image block — matches aspect-square + p-4 */}
      <div className="aspect-square w-full p-4">
        <Shimmer className="h-full w-full rounded-2xl" />
      </div>

      {/* Body — matches p-4 pt-2 gap-3 */}
      <div className="flex flex-1 flex-col gap-3 p-4 pt-2">
        {/* Title (two lines, min-h-[2.5rem]) */}
        <div className="flex min-h-[2.5rem] flex-col gap-1.5">
          <Shimmer className="h-3.5 w-11/12" />
          <Shimmer className="h-3.5 w-2/3" />
        </div>

        {/* Spec chips */}
        <div className="flex gap-1.5">
          <Shimmer className="h-6 w-20 rounded-lg" />
          <Shimmer className="h-6 w-24 rounded-lg" />
        </div>

        {/* Colour swatches */}
        <div className="flex gap-1.5">
          <Shimmer className="h-4 w-4 rounded-full" />
          <Shimmer className="h-4 w-4 rounded-full" />
          <Shimmer className="h-4 w-4 rounded-full" />
        </div>

        {/* Pricing block */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <Shimmer className="h-10 w-full rounded-xl" />
          <Shimmer className="mx-auto h-3 w-1/2" />
        </div>

        {/* CTA (matches py-2.5 button height) */}
        <Shimmer className="mt-1 h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

export interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

/** A grid of skeleton cards — the Suspense fallback for the brand collection. */
export function ProductGridSkeleton({ count = 8, className }: ProductGridSkeletonProps): ReactNode {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export default ProductSkeleton;
