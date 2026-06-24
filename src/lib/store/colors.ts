/**
 * GhestShop — Persian colour-name → swatch hex.
 * Shared by the product card, gallery, and product page so a colour always
 * renders the same dot and the same tinted variant image.
 */

export const COLOR_HEX: Record<string, string> = {
  مشکی: '#0B0B0F',
  سیاه: '#0B0B0F',
  سفید: '#F3F4F6',
  طلایی: '#D4AF37',
  'نقره‌ای': '#C0C4CC',
  نقرهای: '#C0C4CC',
  آبی: '#2563EB',
  قرمز: '#DC2626',
  سبز: '#16A34A',
  بنفش: '#7C3AED',
  خاکستری: '#6B7280',
  صورتی: '#EC4899',
  زرد: '#F59E0B',
  تیتانیوم: '#8E8E93',
};

/** Resolve a Persian colour name to a hex value (falls back to slate grey). */
export function swatchHex(name: string): string {
  return COLOR_HEX[name.trim()] ?? '#6B7280';
}

/** Hex without the leading '#', for URL-encoded placeholders (placehold.co). */
export function swatchHexBare(name: string): string {
  return swatchHex(name).replace('#', '');
}
