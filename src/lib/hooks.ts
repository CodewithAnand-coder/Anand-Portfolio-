"use client";

import { useEffect, useState } from "react";
import { getLenis } from "./experience-store";
import { detectTier, type Tier } from "./quality";

/* ============================================================================
   ENVIRONMENT HOOKS
   Small and SSR-safe. Every hook returns a conservative default on the server
   and during the first client paint, then refines after mount. This keeps
   hydration clean while still letting us adapt aggressively once we can
   actually measure the device.
   ========================================================================= */

/** True only after the component has mounted on the client. */
export function useHasMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Subscribe to a CSS media query. Returns `false` on the server. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Whether the visitor has asked the OS to reduce motion. */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Detect the rendering tier once on mount. Deliberately mounted-gated: reading
 * `hardwareConcurrency` / `deviceMemory` during SSR is impossible, and guessing
 * would cause a hydration mismatch on the 3D bundle.
 */
export function useDeviceTier(): { tier: Tier; ready: boolean } {
  const [state, setState] = useState<{ tier: Tier; ready: boolean }>({
    tier: "mid",
    ready: false,
  });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setState({ tier: detectTier(reduced), ready: true });
  }, []);

  return state;
}

/** True while the tab is visible. Used to park the WebGL loop in background. */
export function usePageVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
}

/**
 * Locks/unlocks body scrolling. Lenis keeps its own position, so we have to
 * stop it as well or the page scrolls behind modals.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const lenis = getLenis();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [locked]);
}
