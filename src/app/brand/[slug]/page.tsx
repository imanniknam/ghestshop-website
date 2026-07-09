import type { Metadata } from 'next';
import { Suspense, type ReactElement, type ReactNode } from 'react';
import { PackageSearch } from 'lucide-react';
import { FacetRail } from '@/components/store/facet-rail';
import { ProductCard } from '@/components/store/product-card';
import { ProductGridSkeleton } from '@/components/store/product-skeleton';
import {
  getBrandProducts,
} from '@/lib/store/catalog';
import {
  type ProductCardVM,
} from '@/lib/store/types';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

interface BrandMeta {
  readonly name: string;
  readonly tagline: string;
}

const BRANDS: Record<string, BrandMeta> = {
  apple: { name: 'اپل', tagline: 'آیفون و آیپد، اقساط بدون دردسر' },
  samsung: { name: 'سامسونگ', tagline: 'سری گلکسی با شرایط ویژه اقساطی' },
  xiaomi: { name: 'شیائومی', tagline: 'بهترین انتخاب اقتصادی، قسطی' },
};

async function fetchBrandProducts(slug: string): Promise<ProductCardVM[]> {
  return Promise.resolve(getBrandProducts(slug));
}

// ---------------------------------------------------------------------------
//  Search-param filtering
// ---------------------------------------------------------------------------

type SearchParams = Record<string, string | string[] | undefined>;

function parseList(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  const joined = Array.isArray(value) ? value.join(',') : value;
  return joined.split(',').filter(Boolean);
}

function parseNumber(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function filterProducts(products: ProductCardVM[], sp: SearchParams): ProductCardVM[] {
  const ram = parseList(sp.ram);
  const storage = parseList(sp.storage);
  const maxPrice = parseNumber(sp.maxPrice);

  return products.filter(
    (p) =>
      (ram.length === 0 || ram.includes(p.ram)) &&
      (storage.length === 0 || storage.includes(p.storage)) &&
      (maxPrice === null || p.cashPrice <= maxPrice),
  );
}

// ---------------------------------------------------------------------------
//  Page
// ---------------------------------------------------------------------------

interface BrandPageProps {
  params: { slug: string };
  searchParams: SearchParams;
}

export function generateMetadata({ params }: BrandPageProps): Metadata {
  const brand = BRANDS[params.slug];
  const name = brand?.name ?? params.slug;
  return {
    title: `خرید اقساطی محصولات ${name}`,
    description: brand?.tagline ?? `محصولات ${name} با شرایط اقساطی ویژه در قسط شاپ.`,
  };
}

export default function BrandPage({ params, searchParams }: BrandPageProps): ReactNode {
  const brand = BRANDS[params.slug];
  const brandName = brand?.name ?? params.slug;

  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Brand heading */}
      <header className={cn(glassClass('hero', 'mb-6 flex items-center gap-4 rounded-3xl p-6'))}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#407DC0] to-[#38BDF8] text-2xl font-black text-white">
          {brandName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">
            محصولات {brandName}
          </h1>
          <p className="mt-0.5 text-sm text-foreground/60">
            {brand?.tagline ?? 'خرید اقساطی با شرایط ویژه'}
          </p>
        </div>
      </header>

      {/* Right rail (RTL) + product grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <Suspense fallback={<div className="hidden lg:block" />}>
          <FacetRail />
        </Suspense>

        <Suspense fallback={<ProductGridSkeleton count={8} />}>
          <BrandCollection slug={params.slug} searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
//  Async collection (suspends → shows ProductGridSkeleton)
// ---------------------------------------------------------------------------

async function BrandCollection({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: SearchParams;
}): Promise<ReactElement> {
  const all = await fetchBrandProducts(slug);
  const visible = filterProducts(all, searchParams);

  if (all.length === 0) {
    return <EmptyState title="برندی یافت نشد" subtitle="محصولی برای این برند ثبت نشده است." />;
  }
  if (visible.length === 0) {
    return (
      <EmptyState
        title="نتیجه‌ای یافت نشد"
        subtitle="با فیلترهای انتخابی محصولی موجود نیست. فیلترها را تغییر دهید."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visible.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }): ReactNode {
  return (
    <div className={cn(glassClass('card', 'flex flex-col items-center gap-3 rounded-3xl p-12 text-center'))}>
      <PackageSearch className="h-10 w-10 text-foreground/30" aria-hidden />
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-sm text-foreground/50">{subtitle}</p>
    </div>
  );
}
