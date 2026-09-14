"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { easeOutCubic, formatNumber } from "@/lib/utils";

/**
 * Counts up when the value scrolls into view.
 *
 * Two details worth noting: the animation is driven from `performance.now()`
 * rather than frame count, so the duration is honest on 120Hz displays; and
 * reduced motion lands on the final value immediately rather than animating
 * faster, because a counting number is exactly the kind of motion that setting
 * exists to suppress.
 */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 1.7,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      setDisplay(value * easeOutCubic(progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduced]);

  const shown = decimals > 0 ? display.toFixed(decimals) : formatNumber(display);

  return (
    <span ref={ref} className={className}>
      {/* The animating value is decorative; the real number is exposed to
          assistive tech once, in full, without the intermediate frames. */}
      <span aria-hidden="true">
        {prefix}
        {shown}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {decimals > 0 ? value.toFixed(decimals) : formatNumber(value)}
        {suffix}
      </span>
    </span>
  );
}
