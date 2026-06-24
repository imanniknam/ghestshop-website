/**
 * GhestShop — Motion tokens.
 * ------------------------------------------------------------------
 * Two distinct motion languages, used deliberately:
 *   • SPRING  — physical, for direct interaction (tap/hover/drag).
 *   • EASE_EXPO — long decelerating "cinematic" curve, for entrance/reveal
 *     choreography. This is the Helix-Earth feel: motion that settles rather
 *     than bounces.
 */

import type { Transition } from 'framer-motion';

/** Expo-out (cubic-bezier .16,1,.3,1) — the cinematic settle. */
export const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Physical spring for interaction states. */
export const SPRING: Transition = { type: 'spring', stiffness: 300, damping: 20 };
export const SOFT_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26 };

/** Cinematic reveal transition factory (entrance choreography). */
export const reveal = (delay = 0, duration = 0.8): Transition => ({
  duration,
  delay,
  ease: EASE_EXPO,
});
