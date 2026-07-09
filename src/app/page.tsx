import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AboutInstallment } from '@/components/store/about-installment';
import { BrandShowcase } from '@/components/store/brand-showcase';
import { FeaturesStrip } from '@/components/store/features-strip';
import { HomeHero } from '@/components/store/home-hero';
import { InstallmentNotice } from '@/components/store/installment-notice';
import { TrustStrip } from '@/components/store/trust-strip';
import {
  BRAND_SHOWCASES,
  getBrandShowcaseProducts,
} from '@/lib/store/home-catalog';

export const metadata: Metadata = {
  title: 'قسط شاپ | خرید گوشی قسطی در شیراز بدون ضامن',
  description:
    'خرید گوشی قسطی سامسونگ، شیائومی و اپل در شیراز و جهرم. فروش اقساطی موبایل با شرایط شفاف و اعتبارسنجی سریع.',
};

export default function HomePage(): ReactNode {
  return (
    <main dir="rtl" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      <InstallmentNotice />

      <HomeHero />

      <FeaturesStrip />

      <TrustStrip />

      {BRAND_SHOWCASES.map((brand) => (
        <BrandShowcase
          key={brand.slug}
          heading={brand.heading}
          brandTitle={brand.title}
          href={brand.href}
          products={getBrandShowcaseProducts(brand.slug)}
        />
      ))}

      <AboutInstallment />
    </main>
  );
}
