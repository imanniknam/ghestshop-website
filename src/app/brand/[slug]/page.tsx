import type { Metadata } from 'next';
import { Suspense, type ReactElement, type ReactNode } from 'react';
import { PackageSearch } from 'lucide-react';
import { FacetRail } from '@/components/store/facet-rail';
import { ProductCard } from '@/components/store/product-card';
import { ProductGridSkeleton } from '@/components/store/product-skeleton';
import {
  mapRawProductToVM,
  type ProductCardVM,
  type RawProduct,
} from '@/lib/store/types';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
//  Brand registry + mock catalog. In production `getBrandProducts` becomes a
//  Prisma query (`product.findMany({ where: { brand: { slug } }, ... })`); the
//  mapper and the rest of this file stay identical.
// ---------------------------------------------------------------------------

interface BrandMeta {
  readonly name: string;
  readonly tagline: string;
}

const BRANDS: Record<string, BrandMeta> = {
  apple: { name: 'اپل', tagline: 'آیفون و آیپد، اقساط بدون دردسر' },
  samsung: { name: 'سامسونگ', tagline: 'سری گلکسی با شرایط ویژه اقساطی' },
  xiaomi: { name: 'شیائومی', tagline: 'بهترین انتخاب اقتصادی، قسطی' },
};

const img = (label: string): string =>
  `https://placehold.co/600x600/0f172a/f8fafc?text=${encodeURIComponent(label)}`;

const RAW_CATALOG: RawProduct[] = [
  // ---- Apple ----
  {
    id: 'p-ip15pm', title: 'آیفون ۱۵ پرو مکس', slug: 'iphone-15-pro-max',
    images: [img('iPhone 15 Pro Max')], cashPrice: 78_000_000, installmentMarkupBps: 1800,
    storage: '256', ram: '8', colors: ['تیتانیوم', 'مشکی', 'طلایی'], brand: { slug: 'apple' },
    isFlashSale: true, discountPercent: 8,
  },
  {
    id: 'p-ip15', title: 'آیفون ۱۵', slug: 'iphone-15',
    images: [img('iPhone 15')], cashPrice: 54_000_000, installmentMarkupBps: 1800,
    storage: '128', ram: '6', colors: ['مشکی', 'آبی', 'صورتی'], brand: { slug: 'apple' },
  },
  {
    id: 'p-ip14', title: 'آیفون ۱۴ نرمال', slug: 'iphone-14',
    images: [img('iPhone 14')], cashPrice: 42_000_000, installmentMarkupBps: 1800,
    storage: '256', ram: '6', colors: ['بنفش', 'سفید', 'مشکی'], brand: { slug: 'apple' },
  },
  {
    id: 'p-ipad-air', title: 'آیپد ایر M2', slug: 'ipad-air-m2',
    images: [img('iPad Air M2')], cashPrice: 48_000_000, installmentMarkupBps: 1800,
    storage: '512', ram: '8', colors: ['نقره‌ای', 'خاکستری'], brand: { slug: 'apple' },
  },
  // ---- Samsung ----
  {
    id: 'p-s24u', title: 'سامسونگ گلکسی S24 اولترا', slug: 'galaxy-s24-ultra',
    images: [img('Galaxy S24 Ultra')], cashPrice: 64_000_000, installmentMarkupBps: 1900,
    storage: '512', ram: '12', colors: ['مشکی', 'طلایی', 'بنفش'], brand: { slug: 'samsung' },
    isFlashSale: true, discountPercent: 10,
  },
  {
    id: 'p-s24', title: 'سامسونگ گلکسی S24', slug: 'galaxy-s24',
    images: [img('Galaxy S24')], cashPrice: 41_000_000, installmentMarkupBps: 1900,
    storage: '256', ram: '8', colors: ['آبی', 'مشکی', 'سبز'], brand: { slug: 'samsung' },
  },
  {
    id: 'p-a55', title: 'سامسونگ گلکسی A55', slug: 'galaxy-a55',
    images: [img('Galaxy A55')], cashPrice: 22_000_000, installmentMarkupBps: 2000,
    storage: '128', ram: '8', colors: ['آبی', 'مشکی'], brand: { slug: 'samsung' },
  },
  {
    id: 'p-zflip6', title: 'سامسونگ گلکسی Z Flip6', slug: 'galaxy-z-flip6',
    images: [img('Galaxy Z Flip6')], cashPrice: 72_000_000, installmentMarkupBps: 1900,
    storage: '512', ram: '12', colors: ['نقره‌ای', 'مشکی', 'زرد'], brand: { slug: 'samsung' },
  },
  // ---- Xiaomi ----
  {
    id: 'p-mi14', title: 'شیائومی ۱۴', slug: 'xiaomi-14',
    images: [img('Xiaomi 14')], cashPrice: 38_000_000, installmentMarkupBps: 2000,
    storage: '256', ram: '12', colors: ['مشکی', 'سبز', 'سفید'], brand: { slug: 'xiaomi' },
  },
  {
    id: 'p-redmi13', title: 'شیائومی ردمی نوت ۱۳ پرو', slug: 'redmi-note-13-pro',
    images: [img('Redmi Note 13 Pro')], cashPrice: 16_500_000, installmentMarkupBps: 2100,
    storage: '256', ram: '8', colors: ['آبی', 'مشکی', 'بنفش'], brand: { slug: 'xiaomi' },
    isFlashSale: true, discountPercent: 12,
  },
  {
    id: 'p-poco-f6', title: 'شیائومی پوکو F6', slug: 'poco-f6',
    images: [img('POCO F6')], cashPrice: 21_000_000, installmentMarkupBps: 2100,
    storage: '512', ram: '12', colors: ['مشکی', 'سبز'], brand: { slug: 'xiaomi' },
  },
  {
    id: 'p-mi-pad6', title: 'شیائومی پد ۶', slug: 'xiaomi-pad-6',
    images: [img('Xiaomi Pad 6')], cashPrice: 19_000_000, installmentMarkupBps: 2100,
    storage: '128', ram: '6', colors: ['خاکستری', 'آبی'], brand: { slug: 'xiaomi' },
  },
];

async function getBrandProducts(slug: string): Promise<ProductCardVM[]> {
  // Simulated async boundary (DB round-trip in production).
  const rows = RAW_CATALOG.filter((p) => p.brand.slug === slug);
  return Promise.resolve(rows.map(mapRawProductToVM));
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
  const all = await getBrandProducts(slug);
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
