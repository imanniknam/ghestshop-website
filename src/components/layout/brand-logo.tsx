/**
 * GhestShop — Brand Mark
 * ------------------------------------------------------------------
 * Faithful vector recreation of the production GhestShop logo: two concentric
 * rings where the OUTER ring is broken into installment-like segments (the اقساط
 * metaphor) and the INNER ring is a near-complete arc. Drawn with `currentColor`
 * so it inherits the brand blue from context and adapts to light/dark themes.
 */

import type { ReactNode, SVGProps } from 'react';

export interface BrandMarkProps extends SVGProps<SVGSVGElement> {
  /** Pixel size of the square mark. */
  size?: number;
}

export function BrandMark({ size = 28, className, ...rest }: BrandMarkProps): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="لوگوی قسط شاپ"
      className={className}
      {...rest}
    >
      {/* Inner ring — near-complete arc, small opening (bottom-right). */}
      <circle
        cx="50"
        cy="50"
        r="27"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="148 22"
        strokeDashoffset="-6"
        opacity="0.92"
      />
      {/* Outer ring — segmented into installment arcs around the right side. */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="132 10 12 10 12 10 12 10 12 10"
        strokeDashoffset="-4"
      />
    </svg>
  );
}

export interface BrandLogoProps {
  /** Show the "قسط شاپ" wordmark next to the mark. */
  withWordmark?: boolean;
  /** Size of the mark badge in pixels. */
  size?: number;
  className?: string;
}

/**
 * Full brand lockup: the segmented-circle mark inside a soft brand-tinted
 * badge, optionally followed by the Persian wordmark.
 */
export function BrandLogo({ withWordmark = true, size = 40, className }: BrandLogoProps): ReactNode {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}>
      <span
        className="flex items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20"
        style={{ width: size, height: size }}
      >
        <BrandMark size={Math.round(size * 0.62)} />
      </span>
      {withWordmark && (
        <span className="text-lg font-bold tracking-tight text-foreground">قسط شاپ</span>
      )}
    </span>
  );
}

export default BrandLogo;
