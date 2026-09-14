"use client";

import { useEffect, useRef } from "react";

import { frame, scrollToStation, useActiveStation } from "@/lib/experience-store";
import { NAV_SECTIONS, stationToNav } from "@/lib/stations";
import { cn } from "@/lib/utils";

/* ============================================================================
   PROGRESS RAIL
   A hairline across the top of the viewport plus a station index down the right.

   The continuous parts (bar width, percentage read-out) are written straight to
   the DOM from a rAF loop. The discrete part (which station is active) goes
   through React, because it changes a handful of times per page rather than
   sixty times a second — that split is the whole trick to keeping a long
   scroll-driven page smooth.
   ========================================================================= */

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const activeStation = useActiveStation();
  const activeNav = stationToNav(activeStation);

  useEffect(() => {
    let raf = 0;
    let lastProgress = -1;

    const tick = () => {
      const { progress } = frame;
      if (Math.abs(progress - lastProgress) > 0.0006) {
        lastProgress = progress;
        // `scaleX` stays on the compositor; animating `width` would relayout.
        if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
        if (readoutRef.current) {
          readoutRef.current.textContent = `${Math.round(progress * 100)}`;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Top hairline */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[130]">
        <div className="h-0.5 w-full bg-ink-600">
          <div
            ref={barRef}
            className="h-0.5 w-full origin-left bg-signal-500"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>

      {/*
        Station index. Only shown from 1536px up: below that, the fixed rail would
        overlap the 1152px content column's right edge (the widest label needs
        ~145px from the viewport edge, and there is only 64px of gutter at 1280).
        Narrower viewports still get the top progress bar and the active nav pill.
      */}
      <nav
        aria-label="Portfolio progress"
        className="pointer-events-none fixed right-5 top-1/2 z-[130] hidden -translate-y-1/2 2xl:block"
      >
        <ul className="flex flex-col items-end gap-3">
          {NAV_SECTIONS.map((section) => {
            const isActive = section.id === activeNav;
            return (
              <li key={section.id} className="pointer-events-auto">
                <button
                  type="button"
                  onClick={() => scrollToStation(section.id)}
                  aria-current={isActive ? "true" : undefined}
                  className="group flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-400"
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.18em] transition-all duration-300",
                      isActive
                        ? "text-signal-500 opacity-100"
                        : "text-mist-500 opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {section.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block h-px transition-all duration-500",
                      isActive ? "w-6 bg-signal-500" : "w-3 bg-ink-500 group-hover:w-5",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-right font-mono text-[10px] tracking-[0.18em] text-mist-500">
          <span ref={readoutRef}>0</span>
          <span className="text-mist-600">/100</span>
        </p>
      </nav>
    </>
  );
}
