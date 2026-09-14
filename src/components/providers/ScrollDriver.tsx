"use client";

import { useEffect } from "react";

import { frame, setDiscrete, setLenis } from "@/lib/experience-store";
import { getCorridor, refreshCorridor, stationAtScroll } from "@/lib/stations";
import { clamp } from "@/lib/utils";

/**
 * Owns three things that must agree at all times:
 *
 *  1. **Smooth scrolling** — Lenis, mounted lazily so the 3D bundle and the
 *     scroll engine never compete for the first paint.
 *  2. **The frame store** — scroll offset, progress, velocity and viewport size,
 *     written every frame and read imperatively by the WebGL camera rig.
 *  3. **The corridor table** — section positions in the document, rebuilt only
 *     when the layout actually changes.
 *
 * Note the single rAF loop: Lenis is *driven* by it rather than owning its own,
 * which guarantees the camera is sampled from the same scroll position the
 * browser painted. Two independent loops is how 3D portfolios end up jittering.
 */
export function ScrollDriver({ reducedMotion }: { reducedMotion: boolean }) {
  /* ---- Corridor measurement ------------------------------------------- */
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        frame.viewportWidth = window.innerWidth;
        frame.viewportHeight = window.innerHeight;
        refreshCorridor();
      });
    };

    measure();

    // Fonts and images change section heights after first paint.
    void document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    // The body grows as fonts finish, images decode and sections lazy-mount.
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      observer.disconnect();
    };
  }, []);

  /* ---- Per-frame loop -------------------------------------------------- */
  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    let lastMovement = performance.now();
    let lastStation = "";

    const tick = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);

      frame.scrollY = y;
      frame.progress = clamp(y / maxScroll, 0, 1);

      const delta = y - lastY;
      if (Math.abs(delta) > 0.05) {
        lastMovement = performance.now();
        frame.lastInputAt = lastMovement;
        // Normalised speed: ~1.0 is a brisk wheel flick, 0 is parked.
        frame.velocity = clamp(delta / 18, -1, 1);
      } else {
        frame.velocity *= 0.86;
      }
      frame.scrolling = performance.now() - lastMovement < 180;
      lastY = y;

      const spans = getCorridor();
      if (spans.length > 0) {
        const station = stationAtScroll(y, spans);
        if (station !== lastStation) {
          lastStation = station;
          setDiscrete({ activeStation: station });
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---- Lenis ----------------------------------------------------------- */
  useEffect(() => {
    // Reduced motion: keep native scrolling. The whole point of the setting is
    // to remove exactly this kind of inertial movement.
    if (reducedMotion) {
      setLenis(null);
      return;
    }

    let cancelled = false;
    let raf = 0;
    let instance: InstanceType<typeof import("lenis").default> | null = null;

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;

      instance = new Lenis({
        duration: 1.15,
        // Slight exponential feel: responsive to small wheel ticks, weighty on
        // long flicks. Lenis blends duration/lerp internally.
        easing: (t: number) => 1 - Math.pow(1 - t, 3.2),
        wheelMultiplier: 0.95,
        touchMultiplier: 1.5,
        smoothWheel: true,
        // Never hijack touch — native momentum beats any JS implementation.
        syncTouch: false,
        autoRaf: false,
      });

      instance.on("scroll", () => {
        frame.lastInputAt = performance.now();
      });

      setLenis(instance as unknown as Parameters<typeof setLenis>[0]);

      const loop = (time: number) => {
        instance?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      setLenis(null);
      instance?.destroy();
      instance = null;
    };
  }, [reducedMotion]);

  return null;
}
