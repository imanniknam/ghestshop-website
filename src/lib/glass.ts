/**
 * GhestShop — Surface System  ("Clarity")
 * ------------------------------------------------------------------
 * The old build leaned on GPU-expensive glassmorphism (stacked backdrop-blur).
 * The redesign replaces that with a clean, opaque surface system: solid
 * theme-aware fills, hairline borders, and a soft neutral elevation scale.
 * This composites for free while scrolling and reads far more trustworthy for
 * a financial product.
 *
 * The historical export names are preserved (glassHero / glassCard / glassInset
 * / glassSheen / glass / glassClass) so existing call-sites keep working — only
 * the visual values changed. Prefer the `surface*` aliases in new code.
 *
 *   • surfaceRaised (hero)  — overlays, modals, sheets, hero panels. Highest
 *                             elevation: solid surface + float shadow.
 *   • surfaceCard  (card)   — product cards / list rows / any N-of-many.
 *                             Solid surface + soft card shadow, hover-ready.
 *   • surfaceInset (inset)  — badges, chips, nested fills (brand-tinted).
 */

import { cn } from '@/lib/utils';

export type GlassTier = 'hero' | 'card' | 'inset';

/** Highest elevation — overlays, modals, sheets, hero panels. */
export const surfaceRaised =
  'bg-surface border border-border ' +
  'shadow-[0_24px_60px_-24px_rgba(15,29,48,0.28)] ' +
  'transition-colors duration-300';

/** Standard elevation — cards, list rows, repeated content. */
export const surfaceCard =
  'bg-surface border border-border ' +
  'shadow-[0_1px_2px_rgba(15,29,48,0.04),0_8px_24px_-12px_rgba(15,29,48,0.12)] ' +
  'transition-[box-shadow,border-color,transform,background-color] duration-300';

/** Flat brand-tinted accent — badges, chips, nested nodes. */
export const surfaceInset =
  'transition-colors duration-300 ' +
  'bg-primary/[0.08] text-gold dark:bg-primary/[0.16]';

/**
 * Subtle top light-edge for raised surfaces. Kept minimal so surfaces read as
 * solid material, not decorative glass.
 */
export const surfaceSheen =
  'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-[inherit] ' +
  'before:bg-gradient-to-l before:from-transparent before:via-white/70 before:to-transparent before:opacity-70 ' +
  'dark:before:via-white/10';

// ---- Back-compat aliases (old names → new surfaces) -----------------------
export const glassHero = surfaceRaised;
export const glassCard = surfaceCard;
export const glassInset = surfaceInset;
export const glassSheen = surfaceSheen;

export const glass = {
  hero: surfaceRaised,
  card: surfaceCard,
  inset: surfaceInset,
} as const satisfies Record<GlassTier, string>;

/**
 * Resolve a surface tier and merge extra utility classes.
 *
 * @example glassClass('card', 'rounded-3xl p-4')
 */
export function glassClass(tier: GlassTier, ...extra: Array<string | undefined | false | null>): string {
  return cn(glass[tier], ...extra);
}

/** Preferred alias for new code. */
export const surface = glass;
export const surfaceClass = glassClass;
