/**
 * GhestShop — Homepage catalog grouped by brand.
 * Mirrors the live production site's three brand sections on the homepage.
 */

import {
  mapRawProductToVM,
  type ProductCardVM,
  type RawProduct,
} from '@/lib/store/types';
import { productImage } from '@/lib/store/media';

const img = (label: string): string =>
  `https://placehold.co/600x600/0f172a/f8fafc?text=${encodeURIComponent(label)}`;

const withRealImage = (p: ProductCardVM): ProductCardVM => ({
  ...p,
  image: productImage(p.id),
  images: [productImage(p.id)],
});

export interface BrandShowcaseMeta {
  readonly slug: string;
  readonly title: string;
  readonly heading: string;
  readonly href: string;
}

export const BRAND_SHOWCASES: readonly BrandShowcaseMeta[] = [
  {
    slug: 'samsung',
    title: 'سامسونگ',
    heading: 'خرید قسطی گوشی سامسونگ',
    href: '/brand/samsung',
  },
  {
    slug: 'xiaomi',
    title: 'شیائومی',
    heading: 'خرید قسطی گوشی شیائومی',
    href: '/brand/xiaomi',
  },
  {
    slug: 'apple',
    title: 'اپل',
    heading: 'خرید قسطی گوشی اپل',
    href: '/brand/apple',
  },
] as const;

const RAW_BY_BRAND: Record<string, readonly RawProduct[]> = {
  samsung: [
    {
      id: 'p-s24u',
      title: 'سامسونگ گلکسی S24 اولترا',
      slug: 'galaxy-s24-ultra',
      images: [img('S24 Ultra')],
      cashPrice: 48_000_000,
      installmentMarkupBps: 1900,
      storage: '256',
      ram: '12',
      colors: ['مشکی', 'طلایی'],
      brand: { slug: 'samsung' },
    },
    {
      id: 'p-a55',
      title: 'سامسونگ گلکسی A55',
      slug: 'galaxy-a55',
      images: [img('Galaxy A55')],
      cashPrice: 16_000_000,
      installmentMarkupBps: 2000,
      storage: '128',
      ram: '8',
      colors: ['آبی', 'مشکی'],
      brand: { slug: 'samsung' },
    },
    {
      id: 'p-s24',
      title: 'سامسونگ گلکسی S24',
      slug: 'galaxy-s24',
      images: [img('Galaxy S24')],
      cashPrice: 20_500_000,
      installmentMarkupBps: 1900,
      storage: '256',
      ram: '8',
      colors: ['آبی', 'مشکی'],
      brand: { slug: 'samsung' },
    },
    {
      id: 'p-zflip6',
      title: 'سامسونگ گلکسی Z Flip6',
      slug: 'galaxy-z-flip6',
      images: [img('Z Flip6')],
      cashPrice: 72_000_000,
      installmentMarkupBps: 1900,
      storage: '512',
      ram: '12',
      colors: ['نقره‌ای', 'مشکی'],
      brand: { slug: 'samsung' },
    },
  ],
  xiaomi: [
    {
      id: 'p-poco-f6',
      title: 'شیائومی پوکو F6',
      slug: 'poco-f6',
      images: [img('Poco F6')],
      cashPrice: 15_000_000,
      installmentMarkupBps: 2100,
      storage: '256',
      ram: '8',
      colors: ['مشکی', 'سبز'],
      brand: { slug: 'xiaomi' },
    },
    {
      id: 'p-redmi13',
      title: 'شیائومی ردمی نوت ۱۳ پرو',
      slug: 'redmi-note-13-pro',
      images: [img('Redmi Note 13 Pro')],
      cashPrice: 10_000_000,
      installmentMarkupBps: 2100,
      storage: '256',
      ram: '8',
      colors: ['آبی', 'مشکی'],
      brand: { slug: 'xiaomi' },
    },
    {
      id: 'p-mi14',
      title: 'شیائومی ۱۴',
      slug: 'xiaomi-14',
      images: [img('Xiaomi 14')],
      cashPrice: 17_500_000,
      installmentMarkupBps: 2000,
      storage: '256',
      ram: '12',
      colors: ['مشکی', 'سبز'],
      brand: { slug: 'xiaomi' },
    },
    {
      id: 'p-poco-x5',
      title: 'شیائومی پوکو X5 Pro',
      slug: 'poco-x5-pro',
      images: [img('Poco X5 Pro')],
      cashPrice: 15_000_000,
      installmentMarkupBps: 2100,
      storage: '256',
      ram: '8',
      colors: ['مشکی'],
      brand: { slug: 'xiaomi' },
    },
  ],
  apple: [
    {
      id: 'p-ip15pm',
      title: 'آیفون ۱۵ پرو مکس',
      slug: 'iphone-15-pro-max',
      images: [img('iPhone 15 Pro Max')],
      cashPrice: 85_000_000,
      installmentMarkupBps: 1800,
      storage: '512',
      ram: '8',
      colors: ['تیتانیوم', 'مشکی'],
      brand: { slug: 'apple' },
    },
    {
      id: 'p-ip15',
      title: 'آیفون ۱۵',
      slug: 'iphone-15',
      images: [img('iPhone 15')],
      cashPrice: 42_000_000,
      installmentMarkupBps: 1800,
      storage: '128',
      ram: '6',
      colors: ['مشکی', 'آبی'],
      brand: { slug: 'apple' },
    },
    {
      id: 'p-ip14',
      title: 'آیفون ۱۴',
      slug: 'iphone-14',
      images: [img('iPhone 14')],
      cashPrice: 40_000_000,
      installmentMarkupBps: 1800,
      storage: '128',
      ram: '6',
      colors: ['بنفش', 'مشکی'],
      brand: { slug: 'apple' },
    },
    {
      id: 'p-ip15',
      title: 'آیفون ۱۳',
      slug: 'iphone-13',
      images: [img('iPhone 13')],
      cashPrice: 42_000_000,
      installmentMarkupBps: 1800,
      storage: '128',
      ram: '4',
      colors: ['مشکی', 'صورتی'],
      brand: { slug: 'apple' },
    },
  ],
};

export function getBrandShowcaseProducts(slug: string): ProductCardVM[] {
  const raw = RAW_BY_BRAND[slug] ?? [];
  return raw.map(mapRawProductToVM).map(withRealImage);
}
