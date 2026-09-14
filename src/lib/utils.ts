import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Upper bound on the delta fed into frame-rate-independent easing.
 *
 * Clamping this too aggressively is a real bug, not a micro-optimisation.
 * `damp()` decays exponentially in `dt`, so if the clamp is below the device's
 * actual frame time the camera advances slower than wall-clock time and never
 * fully settles on its target — measured as the camera sitting 13-21 units short
 * of its station on a slow renderer.
 *
 * 1/15s keeps easing accurate down to 15fps while still stopping a background
 * tab or a long garbage-collection pause from teleporting the scene on resume.
 */
export const MAX_FRAME_DELTA = 1 / 15;

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Ease-out cubic. */
export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Frame-rate independent exponential smoothing toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** Format an integer with thousands separators, without locale surprises. */
export function formatNumber(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Smoothed step: 0 below `edge0`, 1 above `edge1`, eased in between. */
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}
