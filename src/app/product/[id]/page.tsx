import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ProductView, type ProductDetail } from '@/components/store/product-view';
import type { ColorVariant } from '@/components/store/gallery-carousel';
import { PriceHistory } from '@/components/store/price-history';
import { buildPriceHistory } from '@/lib/store/price-history';
import { ProductTabs, type SpecRow } from '@/components/store/product-tabs';
import { ComparisonModule } from '@/components/store/comparison-module';
import { AiInstallmentPlanner } from '@/components/store/ai-installment-planner';
import { AiAdvisorChat } from '@/components/store/ai-advisor-chat';
import type { ProductReview, ProductReviewSummary } from '@/components/store/product-reviews';
import { RelatedProducts } from '@/components/store/related-products';
import { mapRawProductToVM, type ProductCardVM, type RawProduct } from '@/lib/store/types';
import { swatchHexBare } from '@/lib/store/colors';
import { getPowerProfile, type StoreDevice } from '@/lib/store/ai';
import { DEVICE_MEDIA, productImage } from '@/lib/store/media';
import { toPersianDigits } from '@/lib/format';

// ---------------------------------------------------------------------------
//  Mock catalog (→ Prisma `product.findUnique({ where: { id } })` in prod).
// ---------------------------------------------------------------------------

interface CatalogEntry {
  raw: RawProduct;
  brandName: string;
  network: string;
}

const variantImg = (label: string, colorName: string): string =>
  `https://placehold.co/800x800/${swatchHexBare(colorName)}/f8fafc?text=${encodeURIComponent(label)}`;

const CATALOG: Record<string, CatalogEntry> = {
  'p-ip15pm': {
    brandName: 'اپل', network: '۵G',
    raw: {
      id: 'p-ip15pm', title: 'آیفون ۱۵ پرو مکس', slug: 'iphone-15-pro-max',
      images: ['https://placehold.co/800x800/0f172a/f8fafc?text=iPhone+15+Pro+Max'],
      cashPrice: 78_000_000, installmentMarkupBps: 1800,
      storage: '256', ram: '8', colors: ['تیتانیوم', 'مشکی', 'طلایی'], brand: { slug: 'apple' },
      isFlashSale: true, discountPercent: 8,
    },
  },
  'p-ip15': {
    brandName: 'اپل', network: '۵G',
    raw: {
      id: 'p-ip15', title: 'آیفون ۱۵', slug: 'iphone-15',
      images: ['https://placehold.co/800x800/0f172a/f8fafc?text=iPhone+15'],
      cashPrice: 54_000_000, installmentMarkupBps: 1800,
      storage: '128', ram: '6', colors: ['مشکی', 'آبی', 'صورتی'], brand: { slug: 'apple' },
    },
  },
  'p-s24u': {
    brandName: 'سامسونگ', network: '۵G',
    raw: {
      id: 'p-s24u', title: 'سامسونگ گلکسی S24 اولترا', slug: 'galaxy-s24-ultra',
      images: ['https://placehold.co/800x800/0f172a/f8fafc?text=Galaxy+S24+Ultra'],
      cashPrice: 64_000_000, installmentMarkupBps: 1900,
      storage: '512', ram: '12', colors: ['مشکی', 'طلایی', 'بنفش'], brand: { slug: 'samsung' },
      isFlashSale: true, discountPercent: 10,
    },
  },
  'p-mi14': {
    brandName: 'شیائومی', network: '۵G',
    raw: {
      id: 'p-mi14', title: 'شیائومی ۱۴', slug: 'xiaomi-14',
      images: ['https://placehold.co/800x800/0f172a/f8fafc?text=Xiaomi+14'],
      cashPrice: 38_000_000, installmentMarkupBps: 2000,
      storage: '256', ram: '12', colors: ['مشکی', 'سبز', 'سفید'], brand: { slug: 'xiaomi' },
    },
  },
  'p-redmi13': {
    brandName: 'شیائومی', network: '۴G',
    raw: {
      id: 'p-redmi13', title: 'شیائومی ردمی نوت ۱۳ پرو', slug: 'redmi-note-13-pro',
      images: ['https://placehold.co/800x800/0f172a/f8fafc?text=Redmi+Note+13+Pro'],
      cashPrice: 16_500_000, installmentMarkupBps: 2100,
      storage: '256', ram: '8', colors: ['آبی', 'مشکی', 'بنفش'], brand: { slug: 'xiaomi' },
      isFlashSale: true, discountPercent: 12,
    },
  },
};

const DEFAULT_ANNUAL_RATE_BPS = 1800;

function getProductDetail(id: string): ProductDetail | null {
  const entry = CATALOG[id];
  if (!entry) return null;

  // Real multi-angle gallery from the device media CDN.
  const galleryImages = [
    productImage(entry.raw.id),
    DEVICE_MEDIA.phoneAngled,
    DEVICE_MEDIA.phoneBack,
    DEVICE_MEDIA.flagship,
  ];
  const product = { ...mapRawProductToVM(entry.raw), images: galleryImages, image: galleryImages[0] };
  const variants: ColorVariant[] = entry.raw.colors.map((color, index) => ({
    color,
    image: variantImg(`${entry.raw.slug} ${index + 1}`, color),
  }));

  return {
    product,
    brandName: entry.brandName,
    network: entry.network,
    variants,
    annualRateBps:
      entry.raw.installmentMarkupBps && entry.raw.installmentMarkupBps > 0
        ? entry.raw.installmentMarkupBps
        : DEFAULT_ANNUAL_RATE_BPS,
  };
}

// ---------------------------------------------------------------------------
//  Route
// ---------------------------------------------------------------------------

interface ProductPageProps {
  params: { id: string };
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const detail = getProductDetail(params.id);
  if (!detail) return { title: 'محصول یافت نشد' };
  return {
    title: `خرید اقساطی ${detail.product.title}`,
    description: `${detail.product.title} با شرایط اقساطی ویژه، پیش‌پرداخت دلخواه و بازپرداخت تا ۲۴ ماه در قسط‌شاپ.`,
  };
}

const REVIEW_SUMMARY: ProductReviewSummary = {
  average: 4.6,
  total: 128,
  distribution: [88, 26, 8, 4, 2] as const,
};

const REVIEWS: ProductReview[] = [
  {
    id: 'r1', name: 'علی محمدی', rating: 5, dateLabel: '۳ روز پیش', verified: true,
    body: 'فرایند خرید اقساطی واقعاً ساده بود. اعتبارسنجی سریع انجام شد و دستگاه در کمتر از دو روز به دستم رسید.',
  },
  {
    id: 'r2', name: 'سارا کریمی', rating: 4, dateLabel: '۱ هفته پیش', verified: true,
    body: 'کیفیت دستگاه عالی بود و مبلغ اقساط دقیقاً همان چیزی بود که در ماشین‌حساب نشان داده شد. شفافیت کامل.',
  },
  {
    id: 'r3', name: 'رضا احمدی', rating: 5, dateLabel: '۲ هفته پیش', verified: false,
    body: 'پشتیبانی بسیار حرفه‌ای بود. برای تنظیم پیش‌پرداخت کمک زیادی کردند.',
  },
];

function getRelatedProducts(currentId: string): ProductCardVM[] {
  return Object.values(CATALOG)
    .filter((entry) => entry.raw.id !== currentId)
    .map((entry) => {
      const vm = mapRawProductToVM(entry.raw);
      return { ...vm, image: productImage(entry.raw.id), images: [productImage(entry.raw.id)] };
    });
}

// ---------------------------------------------------------------------------
//  Technical specs + power comparison
// ---------------------------------------------------------------------------

function buildSpecs(detail: ProductDetail): SpecRow[] {
  const storageLabel =
    detail.product.storage === '1024'
      ? '۱ ترابایت'
      : `${toPersianDigits(detail.product.storage)} گیگابایت`;
  const isApple = detail.brandName === 'اپل';
  return [
    { label: 'برند', value: detail.brandName },
    { label: 'مدل', value: detail.product.title },
    { label: 'حافظه داخلی', value: storageLabel },
    { label: 'حافظه رم', value: `${toPersianDigits(detail.product.ram)} گیگابایت` },
    { label: 'نوع شبکه', value: detail.network },
    { label: 'نمایشگر', value: 'OLED ۶.۷ اینچ، ۱۲۰ هرتز' },
    { label: 'دوربین اصلی', value: '۴۸ مگاپیکسل' },
    { label: 'باتری', value: '۵۰۰۰ میلی‌آمپرساعت' },
    { label: 'سیستم‌عامل', value: isApple ? 'iOS ۱۷' : 'اندروید ۱۴' },
    { label: 'گارانتی', value: '۱۸ ماه گارانتی رسمی' },
  ];
}

/** Build the rich device list the comparison + advisor modules consume. */
function buildDevices(): StoreDevice[] {
  return Object.values(CATALOG).map((entry) => {
    const vm = mapRawProductToVM(entry.raw);
    return {
      id: entry.raw.id,
      name: entry.raw.title,
      image: productImage(entry.raw.id),
      cashPrice: vm.cashPrice,
      monthlyFrom: vm.monthlyInstallmentFrom,
      brandLabel: entry.brandName,
      ecosystem: entry.raw.brand.slug === 'apple' ? 'ios' : 'android',
      power: getPowerProfile(entry.raw.id),
    };
  });
}

export default function ProductPage({ params }: ProductPageProps): ReactNode {
  const detail = getProductDetail(params.id);
  if (!detail) notFound();

  const priceHistory = buildPriceHistory(detail.product.cashPrice);
  const related = getRelatedProducts(params.id);
  const specs = buildSpecs(detail);
  const allDevices = buildDevices();
  const currentDevice = allDevices.find((d) => d.id === params.id);
  const candidates = allDevices.filter((d) => d.id !== params.id);

  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProductView detail={detail} />

      <div className="mt-14 flex flex-col gap-14">
        <PriceHistory points={priceHistory} />
        <ProductTabs specs={specs} reviewsSummary={REVIEW_SUMMARY} reviews={REVIEWS} />
        {currentDevice && <ComparisonModule current={currentDevice} candidates={candidates} />}
        <AiInstallmentPlanner defaultPrice={detail.product.cashPrice} annualRateBps={detail.annualRateBps} />
        <AiAdvisorChat devices={allDevices} />
        <RelatedProducts products={related} />
      </div>
    </main>
  );
}
