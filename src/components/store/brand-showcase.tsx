/**
 * GhestShop — Brand product showcase section (one per brand on homepage).
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import type { ProductCardVM } from '@/lib/store/types';
import { cn } from '@/lib/utils';

export interface BrandShowcaseProps {
  readonly heading: string;
  readonly brandTitle: string;
  readonly href: string;
  readonly products: readonly ProductCardVM[];
  className?: string;
}

export function BrandShowcase({
  heading,
  brandTitle,
  href,
  products,
  className,
}: BrandShowcaseProps): ReactNode {
  return (
    <section dir="rtl" aria-labelledby={`brand-${brandTitle}`} className={cn('flex flex-col gap-5', className)}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-gold">
            <Smartphone className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 id={`brand-${brandTitle}`} className="text-xl font-bold text-foreground">
              {heading}
            </h2>
            <p className="text-caption text-foreground/60">برند {brandTitle}</p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-body font-bold text-primary transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          مشاهده همه
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={`${heading}-${product.id}`} product={product} />
        ))}
      </div>
    </section>
  );
}

export default BrandShowcase;
