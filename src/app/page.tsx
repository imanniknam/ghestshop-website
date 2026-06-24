import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Flame } from 'lucide-react';
import { ScrollytellingUnboxing } from '@/components/store/scrollytelling-unboxing';
import { HeroCarousel, type HeroSlide } from '@/components/store/hero-carousel';
import { HeroBento } from '@/components/store/hero-bento';
import { TrustStrip } from '@/components/store/trust-strip';
import { FlashSalePanel, type OfferProduct } from '@/components/store/flash-sale-panel';
import { ProductCard } from '@/components/store/product-card';
import {
  mapRawFlashOfferToVM,
  mapRawProductToVM,
  type ProductCardVM,
  type RawFlashOffer,
  type RawProduct,
} from '@/lib/store/types';
import { productImage } from '@/lib/store/media';

/** Swap mock placeholder art for the real device CDN image. */
const withRealImage = (p: ProductCardVM): ProductCardVM => ({
  ...p,
  image: productImage(p.id),
  images: [productImage(p.id)],
});

export const metadata: Metadata = {
  title: 'قسط‌شاپ | خرید اقساطی موبایل و کالای دیجیتال',
  description:
    'خرید اقساطی موبایل، تبلت و کالای دیجیتال با اعتبارسنجی آنی، پیش‌پرداخت دلخواه و بازپرداخت تا ۲۴ ماه.',
};

// Flash-sale end times are computed per request so the countdown is always live.
export const dynamic = 'force-dynamic';

const img = (label: string): string =>
  `https://placehold.co/600x600/0f172a/f8fafc?text=${encodeURIComponent(label)}`;

// ---------------------------------------------------------------------------
//  Mock catalog (→ Prisma `product.findMany` in production)
// ---------------------------------------------------------------------------

const TRENDING_RAW: RawProduct[] = [
  {
    id: 'p-ip15pm', title: 'آیفون ۱۵ پرو مکس', slug: 'iphone-15-pro-max',
    images: [img('iPhone 15 Pro Max')], cashPrice: 78_000_000, installmentMarkupBps: 1800,
    storage: '256', ram: '8', colors: ['تیتانیوم', 'مشکی', 'طلایی'], brand: { slug: 'apple' },
    isFlashSale: true, discountPercent: 8,
  },
  {
    id: 'p-s24u', title: 'سامسونگ گلکسی S24 اولترا', slug: 'galaxy-s24-ultra',
    images: [img('Galaxy S24 Ultra')], cashPrice: 64_000_000, installmentMarkupBps: 1900,
    storage: '512', ram: '12', colors: ['مشکی', 'طلایی', 'بنفش'], brand: { slug: 'samsung' },
    isFlashSale: true, discountPercent: 10,
  },
  {
    id: 'p-mi14', title: 'شیائومی ۱۴', slug: 'xiaomi-14',
    images: [img('Xiaomi 14')], cashPrice: 38_000_000, installmentMarkupBps: 2000,
    storage: '256', ram: '12', colors: ['مشکی', 'سبز', 'سفید'], brand: { slug: 'xiaomi' },
  },
  {
    id: 'p-ip15', title: 'آیفون ۱۵', slug: 'iphone-15',
    images: [img('iPhone 15')], cashPrice: 54_000_000, installmentMarkupBps: 1800,
    storage: '128', ram: '6', colors: ['مشکی', 'آبی', 'صورتی'], brand: { slug: 'apple' },
  },
  {
    id: 'p-zflip6', title: 'سامسونگ گلکسی Z Flip6', slug: 'galaxy-z-flip6',
    images: [img('Galaxy Z Flip6')], cashPrice: 72_000_000, installmentMarkupBps: 1900,
    storage: '512', ram: '12', colors: ['نقره‌ای', 'مشکی', 'زرد'], brand: { slug: 'samsung' },
  },
  {
    id: 'p-redmi13', title: 'شیائومی ردمی نوت ۱۳ پرو', slug: 'redmi-note-13-pro',
    images: [img('Redmi Note 13 Pro')], cashPrice: 16_500_000, installmentMarkupBps: 2100,
    storage: '256', ram: '8', colors: ['آبی', 'مشکی', 'بنفش'], brand: { slug: 'xiaomi' },
    isFlashSale: true, discountPercent: 12,
  },
  {
    id: 'p-ip14', title: 'آیفون ۱۴', slug: 'iphone-14',
    images: [img('iPhone 14')], cashPrice: 42_000_000, installmentMarkupBps: 1800,
    storage: '256', ram: '6', colors: ['بنفش', 'سفید', 'مشکی'], brand: { slug: 'apple' },
  },
  {
    id: 'p-poco-f6', title: 'شیائومی پوکو F6', slug: 'poco-f6',
    images: [img('POCO F6')], cashPrice: 21_000_000, installmentMarkupBps: 2100,
    storage: '512', ram: '12', colors: ['مشکی', 'سبز'], brand: { slug: 'xiaomi' },
  },
];

/** Minutes from now → ISO string, used for live flash-sale end times. */
const endsIn = (minutes: number): string => new Date(Date.now() + minutes * 60_000).toISOString();

const FLASH_RAW: RawFlashOffer[] = [
  {
    id: 'fo-1', productId: 'p-ip15pm',
    originalPrice: 78_000_000, currentPrice: 71_760_000, installmentMarkupBps: 1800,
    countdownEndsAt: endsIn(60 * 8 + 32), // ~8h32m
  },
  {
    id: 'fo-2', productId: 'p-s24u',
    originalPrice: 64_000_000, currentPrice: 57_600_000, installmentMarkupBps: 1900,
    countdownEndsAt: endsIn(60 * 3 + 15),
  },
  {
    id: 'fo-3', productId: 'p-redmi13',
    originalPrice: 16_500_000, currentPrice: 14_520_000, installmentMarkupBps: 2100,
    countdownEndsAt: endsIn(45),
  },
];

export default function HomePage(): ReactNode {
  const trending: ProductCardVM[] = TRENDING_RAW.map(mapRawProductToVM).map(withRealImage);
  const offers = FLASH_RAW.map(mapRawFlashOfferToVM);

  // Build the productId → display lookup the flash panel needs.
  const lookup: Record<string, OfferProduct> = {};
  for (const p of TRENDING_RAW) {
    lookup[p.id] = { title: p.title, image: productImage(p.id) };
  }

  const heroSlides: HeroSlide[] = [
    {
      kind: 'product',
      id: 'slide-ip15pm',
      tag: 'پرفروش‌ترین دستگاه',
      title: 'آیفون ۱۵ پرو مکس',
      subtitle: 'قدرتمندترین آیفون تاریخ، حالا با شرایط اقساطی استثنایی و تحویل فوری.',
      image: trending[0].image,
      href: `/product/${trending[0].id}`,
      priceFrom: trending[0].monthlyInstallmentFrom,
    },
    {
      kind: 'editorial',
      id: 'slide-editorial',
      tag: 'مجله قسط‌شاپ',
      title: 'راهنمای کامل خرید اقساطی',
      subtitle: 'هر آنچه باید درباره اعتبارسنجی، چک صیادی و بازپرداخت بدانید.',
      image: 'https://placehold.co/640x480/1e293b/f8fafc?text=GhestShop+Magazine',
      href: '/apply',
    },
    {
      kind: 'product',
      id: 'slide-s24u',
      tag: 'فروش ویژه',
      title: 'سامسونگ گلکسی S24 اولترا',
      subtitle: 'پرچم‌دار سامسونگ با هوش مصنوعی گلکسی، اکنون با تخفیف اقساطی.',
      image: trending[1].image,
      href: `/product/${trending[1].id}`,
      priceFrom: trending[1].monthlyInstallmentFrom,
    },
  ];

  return (
    <main dir="rtl" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <ScrollytellingUnboxing />

      <HeroCarousel slides={heroSlides} />

      <HeroBento />

      <TrustStrip />

      <FlashSalePanel offers={offers} lookup={lookup} />

      {/* Trending */}
      <section className="flex flex-col gap-4">
        <header className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-gold">
            <Flame className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-lg font-black text-foreground">پرفروش‌ترین‌ها</h2>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
