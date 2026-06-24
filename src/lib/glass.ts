/**
 * GhestShop — Tiered "Liquid Glass" Utility Matrix
 * ------------------------------------------------------------------
 * Glassmorphism is GPU-expensive: every `backdrop-filter` layer forces the
 * compositor to re-sample the pixels behind it. On a dense product grid that
 * tanks scroll FPS on mid-range devices. To keep the look without the cost we
 * split glass into THREE tiers and apply real blur only where it earns its
 * keep (≤3 hero surfaces per viewport).
 *
 *   • glassHero  — REAL backdrop-blur. Reserve for overlays, modals, the cart
 *                  sheet, and the landing hero. Never on repeated list items.
 *   • glassCard  — FAUX glass. A semi-opaque slate fill + hairline border +
 *                  deep shadow. Visually reads as glass when stationary but has
 *                  ZERO backdrop-filter, so it composites for free while
 *                  scrolling. Use on product cards / list rows / any N-of-many.
 *   • glassInset — Flat translucent accent for badges, chips, and nested nodes.
 *
 * Consume via the `glass` object or the named exports, and compose extra
 * utilities through `glassClass(tier, ...extra)`.
 */

import { cn } from '@/lib/utils';

export type GlassTier = 'hero' | 'card' | 'inset';

/**
 * REAL backdrop blur — overlays, modals, sheets, hero (≤3 per viewport).
 * Light: luminous frosted white. Dark: faint translucent charcoal.
 *
 * Upgraded per the ui-ux-pro-max glassmorphism spec: backdrop-saturate for
 * richer light transmission + a 1px top "light-source reflection" (inset
 * highlight) composited with the depth drop-shadow for true Z-depth.
 */
export const glassHero =
  'backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300 ' +
  'bg-white/50 border border-white/60 ' +
  'shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.7)] ' +
  'dark:bg-white/[0.04] dark:border-white/[0.12] ' +
  'dark:shadow-[0_16px_50px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)]';

/**
 * FAUX glass — high-density rendering, NO backdrop-filter (GPU-cheap).
 * Light: soft white card with hardware drop shadow. Dark: slate glass.
 * Carries the same light-reflection highlight for premium depth — for free,
 * since it composites in a single box-shadow declaration.
 */
export const glassCard =
  'border transition-colors duration-300 ' +
  'bg-white/70 border-slate-200/80 ' +
  'shadow-[0_8px_30px_-10px_rgba(15,23,42,0.15),inset_0_1px_0_0_rgba(255,255,255,0.6)] ' +
  'dark:bg-[#1E293B]/40 dark:border-white/[0.06] ' +
  'dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]';

/** Flat translucent accent — badges, chips, nested nodes. */
export const glassInset =
  'transition-colors duration-300 ' +
  'bg-slate-900/[0.05] text-slate-700 ' +
  'dark:bg-white/[0.06] dark:text-slate-200';

/**
 * Optional decorative sheen overlay for faux-glass cards. Pair with
 * `glassCard` on a `relative` element to fake the light-refraction highlight a
 * real blur would give — still free to composite.
 */
export const glassSheen =
  'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] ' +
  'before:bg-gradient-to-br before:from-white/[0.08] before:to-transparent before:opacity-60';

export const glass = {
  hero: glassHero,
  card: glassCard,
  inset: glassInset,
} as const satisfies Record<GlassTier, string>;

/**
 * Resolve a glass tier and merge any extra utility classes. Keeps consumers
 * from hard-coding blur values ad-hoc (which is how perf regressions creep in).
 *
 * @example glassClass('card', 'rounded-3xl p-4')
 */
export function glassClass(tier: GlassTier, ...extra: Array<string | undefined | false | null>): string {
  return cn(glass[tier], ...extra);
}
