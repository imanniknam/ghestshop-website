/**
 * GhestShop — Storefront Catalog Contracts & View-Models
 * ------------------------------------------------------------------
 * Client-safe projections of the catalog domain. Mirrors the same discipline
 * as the fintech/admin view-models: money is normalized from BigInt to number
 * at the boundary, dates from Date|string to Date, and the "starting from"
 * monthly figure is computed through the SHARED installment engine so a card's
 * promise always reconciles with what the server later mints.
 */

import { ALLOWED_MONTHS, calculateInstallment } from '@/lib/finance/installment-engine';

// Platform fallback annual rate (bps) when a product carries no markup. Mirrors
// the server policy in `src/server/actions/loan.ts` — kept here only to produce
// the indicative "از X در ماه" estimate; the authoritative figure is minted
// server-side at approval.
const FALLBACK_ANNUAL_RATE_BPS = 1800;

// Longest allowed term yields the lowest monthly payment → the honest
// "installments starting from…" number.
const MAX_TERM_MONTHS = Math.max(...ALLOWED_MONTHS);

// ---------------------------------------------------------------------------
//  View-Models
// ---------------------------------------------------------------------------

export interface ProductCardVM {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  /** Primary image (= images[0]) — kept for cards/lookups that need one URL. */
  readonly image: string;
  /** Full gallery image set. */
  readonly images: string[];
  readonly cashPrice: number; // Toman
  readonly monthlyInstallmentFrom: number; // Toman / month (longest term)
  readonly storage: string;
  readonly ram: string;
  readonly colors: string[];
  readonly brandSlug: string;
  readonly isFlashSale: boolean;
  readonly discountPercent?: number;
}

export interface BrandVM {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly logo?: string;
  readonly activeOffersCount: number;
}

export interface FlashOfferVM {
  readonly id: string;
  readonly productId: string;
  readonly originalPrice: number; // Toman
  readonly currentPrice: number; // Toman
  readonly monthlyInstallment: number; // Toman / month
  readonly countdownEndsAt: Date;
}

// ---------------------------------------------------------------------------
//  Raw row shapes (Prisma-/mock-shaped inputs) + normalizers
// ---------------------------------------------------------------------------

type Money = bigint | number;
const num = (v: Money): number => (typeof v === 'bigint' ? Number(v) : v);
const toDate = (v: Date | string): Date => (v instanceof Date ? v : new Date(v));

/** Lowest monthly payment for a given cash price (full term, zero down). */
function monthlyFrom(cashPrice: number, annualRateBps: number, months: number = MAX_TERM_MONTHS): number {
  return calculateInstallment({ cashPrice, downPayment: 0, months, annualRateBps }).monthlyPayment;
}

export interface RawProduct {
  id: string;
  title: string;
  slug: string;
  images: string[];
  cashPrice: Money;
  installmentMarkupBps?: number | null;
  storage: string;
  ram: string;
  colors: string[];
  brand: { slug: string };
  isFlashSale?: boolean | null;
  discountPercent?: number | null;
}

export function mapRawProductToVM(raw: RawProduct): ProductCardVM {
  const cashPrice = num(raw.cashPrice);
  const annualRateBps =
    raw.installmentMarkupBps && raw.installmentMarkupBps > 0
      ? raw.installmentMarkupBps
      : FALLBACK_ANNUAL_RATE_BPS;

  const base: ProductCardVM = {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    image: raw.images[0] ?? '',
    images: raw.images.length > 0 ? [...raw.images] : [''],
    cashPrice,
    monthlyInstallmentFrom: monthlyFrom(cashPrice, annualRateBps),
    storage: raw.storage,
    ram: raw.ram,
    colors: [...raw.colors],
    brandSlug: raw.brand.slug,
    isFlashSale: raw.isFlashSale ?? false,
  };

  // Only attach discount when it is a real, positive percentage.
  return raw.discountPercent != null && raw.discountPercent > 0
    ? { ...base, discountPercent: raw.discountPercent }
    : base;
}

export interface RawBrand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  activeOffersCount?: number | null;
}

export function mapRawBrandToVM(raw: RawBrand): BrandVM {
  const base: BrandVM = {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    activeOffersCount: raw.activeOffersCount ?? 0,
  };
  return raw.logo ? { ...base, logo: raw.logo } : base;
}

export interface RawFlashOffer {
  id: string;
  productId: string;
  originalPrice: Money;
  currentPrice: Money;
  installmentMarkupBps?: number | null;
  countdownEndsAt: Date | string;
}

export function mapRawFlashOfferToVM(raw: RawFlashOffer): FlashOfferVM {
  const currentPrice = num(raw.currentPrice);
  const annualRateBps =
    raw.installmentMarkupBps && raw.installmentMarkupBps > 0
      ? raw.installmentMarkupBps
      : FALLBACK_ANNUAL_RATE_BPS;

  return {
    id: raw.id,
    productId: raw.productId,
    originalPrice: num(raw.originalPrice),
    currentPrice,
    monthlyInstallment: monthlyFrom(currentPrice, annualRateBps),
    countdownEndsAt: toDate(raw.countdownEndsAt),
  };
}
