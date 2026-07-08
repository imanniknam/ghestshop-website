'use client';

/**
 * GhestShop — Pointer-tracked glow.
 * ------------------------------------------------------------------
 * The Helix-Earth "mouse effect": a soft radial light that follows the cursor
 * across a surface. Returns a Framer `MotionTemplate` background string plus the
 * raw x/y motion values (0–100%) for optional parallax. Honors reduced-motion
 * by parking the light at centre.
 *
 * Usage:
 *   const glow = usePointerGlow();
 *   <div onMouseMove={glow.onMouseMove} className="group relative">
 *     <motion.div style={{ background: glow.background }}
 *       className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
 *   </div>
 */

import { useCallback } from 'react';
import {
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';

export interface PointerGlowOptions {
  /** Diameter of the light, px. */
  size?: number;
  /** Centre colour (CSS color w/ alpha). */
  color?: string;
}

export interface PointerGlow {
  readonly mx: MotionValue<number>;
  readonly my: MotionValue<number>;
  readonly background: MotionValue<string>;
  readonly onMouseMove: (event: React.MouseEvent<HTMLElement>) => void;
}

export function usePointerGlow({
  size = 320,
  color = 'rgba(64,125,192,0.18)',
}: PointerGlowOptions = {}): PointerGlow {
  const reduceMotion = useReducedMotion();
  const mx = useMotionValue(50);
  const my = useMotionValue(50);

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (reduceMotion) return;
      const rect = event.currentTarget.getBoundingClientRect();
      mx.set(((event.clientX - rect.left) / rect.width) * 100);
      my.set(((event.clientY - rect.top) / rect.height) * 100);
    },
    [mx, my, reduceMotion],
  );

  // The literal `%` characters are static template text between the motion
  // values, so the result is e.g. "...at 50% 42%...".
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${mx}% ${my}%, ${color}, transparent 70%)`;

  return { mx, my, background, onMouseMove };
}
