import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { PackageSearch, Search } from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { searchProducts } from '@/lib/store/catalog';
import { toPersianDigits } from '@/lib/format';
import { glassClass } from '@/lib/glass';
import { cn } from '@/lib/utils';

interface SearchPageProps {
  searchParams: { q?: string | string[] };
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const q = readQuery(searchParams.q);
  return {
    title: q ? `جستجو: ${q}` : 'جستجوی محصولات',
    description: 'جستجو در کاتالوگ گوشی‌های اقساطی قسط شاپ',
  };
}

function readQuery(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? '';
  return value?.trim() ?? '';
}

export default function SearchPage({ searchParams }: SearchPageProps): ReactNode {
  const query = readQuery(searchParams.q);
  const results = query.length >= 2 ? searchProducts(query) : [];

  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className={cn(glassClass('hero', 'mb-6 rounded-3xl p-6 sm:p-8'))}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">جستجوی محصولات</h1>
            {query ? (
              <p className="text-body text-foreground/65">
                نتایج برای «<span className="font-semibold text-foreground">{query}</span>»
                {results.length > 0 && (
                  <>
                    {' '}
                    — {toPersianDigits(results.length)} مورد
                  </>
                )}
              </p>
            ) : (
              <p className="text-body text-foreground/65">
                نام گوشی، برند یا مدل را در نوار جستجوی بالای صفحه وارد کنید.
              </p>
            )}
          </div>
        </div>
      </header>

      {query.length < 2 ? (
        <EmptyState
          title="عبارت جستجو را وارد کنید"
          subtitle="حداقل ۲ کاراکتر برای جستجو لازم است — مثلاً «آیفون» یا «گلکسی»."
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="محصولی یافت نشد"
          subtitle="عبارت دیگری امتحان کنید یا از دسته‌بندی برندها انتخاب کنید."
          showBrandLinks
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyState({
  title,
  subtitle,
  showBrandLinks = false,
}: {
  title: string;
  subtitle: string;
  showBrandLinks?: boolean;
}): ReactNode {
  return (
    <div className={cn(glassClass('card', 'flex flex-col items-center gap-4 rounded-3xl p-12 text-center'))}>
      <PackageSearch className="h-10 w-10 text-foreground/30" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-body font-bold text-foreground">{title}</p>
        <p className="text-body text-foreground/55">{subtitle}</p>
      </div>
      {showBrandLinks && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {[
            { href: '/brand/apple', label: 'گوشی اپل' },
            { href: '/brand/samsung', label: 'گوشی سامسونگ' },
            { href: '/brand/xiaomi', label: 'گوشی شیائومی' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-border bg-surface px-4 py-2 text-body font-medium text-primary transition-colors hover:bg-primary/8"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
