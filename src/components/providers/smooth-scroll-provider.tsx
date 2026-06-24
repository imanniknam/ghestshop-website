'use client';

/**
 * GhestShop — Global Smooth Scroll Provider (Lenis)
 * ------------------------------------------------------------------
 * Wraps the app in Helix-grade inertia scrolling. `ReactLenis root` drives the
 * real document scroll, so:
 *   • RTL is unaffected (Lenis is vertical; dir="rtl" only flips the X axis).
 *   • `position: sticky` islands (e.g. the product calculator) keep working —
 *     Lenis scrolls the actual page, it doesn't transform a wrapper, so there
 *     is no jitter or layout shift.
 *   • framer-motion scroll-linked animations (useScroll / whileInView) keep
 *     firing because Lenis updates native scroll position + emits scroll events.
 *
 * `ReactLenis` owns its requestAnimationFrame loop and tears it down on unmount,
 * so there are no background frame leaks. On every route change we snap to the
 * top (Lenis intercepts the browser's native scroll restoration). Users who
 * prefer reduced motion bypass Lenis entirely and get native scrolling.
 */

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ReactLenis, useLenis } from 'lenis/react';
import { useReducedMotion } from 'framer-motion';

/** Expo-out easing — the cinematic, decelerating "settle". */
const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Resets scroll to the top on client navigation (must live inside ReactLenis). */
function RouteScrollReset(): null {
  const lenis = useLenis();
  const pathname = usePathname();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [lenis, pathname]);
  return null;
}

export interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps): ReactNode {
  const reduceMotion = useReducedMotion();

  // Honour reduced-motion: native scroll, no JS smoothing, no rAF loop.
  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1, // buttery continuous deceleration
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        easing: easeOutExpo,
      }}
    >
      <RouteScrollReset />
      {children}
    </ReactLenis>
  );
}

export default SmoothScrollProvider;
