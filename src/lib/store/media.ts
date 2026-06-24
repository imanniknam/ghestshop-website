/**
 * GhestShop — Real device media (CDN-hosted, hotlink-friendly).
 * ------------------------------------------------------------------
 * Centralized so scroll-linked animations and screenshot paints render real
 * hardware (no empty/gray placeholders). Sourced from the Unsplash image CDN
 * (`images.unsplash.com`), which is reliable and hotlink-friendly. Swap these
 * URLs for first-party product photography in production.
 */

const U = (id: string, w = 900): string =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const DEVICE_MEDIA = {
  /** Hero smartphone (iPhone 15 Pro) — used for the unboxing reveal. */
  phoneHero: U('1695048133142-1a20484d2569'),
  /** Smartphone — angled, showing the frame. */
  phoneAngled: U('1678652197831-2d180705cd2c'),
  /** Smartphone back / camera array. */
  phoneBack: U('1610945415295-d9bbf067e59c'),
  /** Premium flagship (Galaxy-style). */
  flagship: U('1610945264803-c22b62d2a7b3'),
  /** Laptop / MacBook Pro. */
  laptop: U('1517336714731-489689fd1ca8'),
} as const;

/** Per-catalog-id image (falls back to the hero device). */
export const PRODUCT_IMAGE: Record<string, string> = {
  'p-ip15pm': DEVICE_MEDIA.phoneHero,
  'p-ip15': DEVICE_MEDIA.phoneAngled,
  'p-ip14': DEVICE_MEDIA.phoneAngled,
  'p-s24u': DEVICE_MEDIA.flagship,
  'p-s24': DEVICE_MEDIA.flagship,
  'p-zflip6': DEVICE_MEDIA.phoneBack,
  'p-mi14': DEVICE_MEDIA.phoneBack,
  'p-redmi13': DEVICE_MEDIA.phoneAngled,
  'p-poco-f6': DEVICE_MEDIA.phoneBack,
  'p-ipad-air': DEVICE_MEDIA.laptop,
};

export function productImage(id: string): string {
  return PRODUCT_IMAGE[id] ?? DEVICE_MEDIA.phoneHero;
}
