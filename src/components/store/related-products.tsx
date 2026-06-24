/**
 * GhestShop — Related Products Shelf
 * ------------------------------------------------------------------
 * Horizontal, touch-friendly scroll-snap track that re-uses the elite
 * ProductCard. Linear-gradient mask fades both edges so the shelf appears to
 * recede into cinematic depth. Server component (cards hydrate themselves).
 */

import type { CSSProperties, ReactNode } from 'react';
import { Layers } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import type { ProductCardVM } from '@/lib/store/types';
import { cn } from '@/lib/utils';

const EDGE_MASK: CSSProperties = {
  WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 4%, #000 96%, transparent 100%)',
  maskImage: 'linear-gradient(to right, transparent 0, #000 4%, #000 96%, transparent 100%)',
};

export interface RelatedProductsProps {
  products: ProductCardVM[];
  title?: string;
  className?: string;
}

export function RelatedProducts({
  products,
  title = 'محصولات مشابه',
  className,
}: RelatedProductsProps): ReactNode {
  if (products.length === 0) return null;

  return (
    <section dir="rtl" className={cn('flex flex-col gap-4', className)}>
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold">
          <Layers className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
      </header>

      <div
        style={EDGE_MASK}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[16rem] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default RelatedProducts;
