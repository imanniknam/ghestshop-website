/**
 * GhestShop — Unified product catalog + search.
 * Single source for brand pages, search results, and future API routes.
 */

import { mapRawProductToVM, type ProductCardVM, type RawProduct } from '@/lib/store/types';
import { productImage } from '@/lib/store/media';

const img = (label: string): string =>
  `https://placehold.co/600x600/0f172a/f8fafc?text=${encodeURIComponent(label)}`;

export const BRAND_LABELS: Record<string, string> = {
  apple: 'اپل',
  samsung: 'سامسونگ',
  xiaomi: 'شیائومی',
};

const RAW_CATALOG: readonly RawProduct[] = [
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

const withRealImage = (product: ProductCardVM): ProductCardVM => ({
  ...product,
  image: productImage(product.id),
  images: [productImage(product.id)],
});

/** Normalize Persian/ASCII for case-insensitive matching. */
function normalizeForSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, '');
}

const BRAND_ALIASES: Record<string, readonly string[]> = {
  apple: ['apple', 'اپل', 'آیفون', 'iphone', 'ipad', 'آیپد'],
  samsung: ['samsung', 'سامسونگ', 'galaxy', 'گلکسی', 'galxy'],
  xiaomi: ['xiaomi', 'شیائومی', 'redmi', 'ردمی', 'poco', 'پوکو'],
};

function productSearchText(product: ProductCardVM): string {
  const brand = BRAND_LABELS[product.brandSlug] ?? product.brandSlug;
  const aliases = BRAND_ALIASES[product.brandSlug] ?? [];
  return normalizeForSearch(
    [product.title, product.slug, product.brandSlug, brand, ...aliases, product.ram, product.storage].join(' '),
  );
}

export function getAllProducts(): ProductCardVM[] {
  return RAW_CATALOG.map(mapRawProductToVM).map(withRealImage);
}

export function getBrandProducts(slug: string): ProductCardVM[] {
  return getAllProducts().filter((p) => p.brandSlug === slug);
}

export function searchProducts(query: string): ProductCardVM[] {
  const normalized = normalizeForSearch(query);
  if (normalized.length < 2) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const all = getAllProducts();

  return all.filter((product) => {
    const haystack = productSearchText(product);
    return tokens.every((token) => haystack.includes(token));
  });
}
