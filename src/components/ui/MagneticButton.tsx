"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

/* ============================================================================
   MAGNETIC BUTTON
   A small, tasteful pull toward the cursor. Deliberately capped at a few pixels:
   the effect should register as responsiveness, not as the button running away
   from the pointer.
   ========================================================================= */

const VARIANTS = {
  primary:
    "bg-signal-500 text-white shadow-[0_10px_30px_-12px_rgba(29,91,194,0.55)] hover:bg-signal-600",
  secondary:
    "glass-panel text-navy-800 hover:border-signal-400 hover:text-signal-500",
  ghost: "text-navy-700 hover:text-signal-500",
} as const;

type Variant = keyof typeof VARIANTS;

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  icon?: ReactNode;
  /** Renders a full-width button — used in the contact form. */
  block?: boolean;
};

type Props = BaseProps &
  (
    | { href: string; external?: boolean; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void; type?: never; disabled?: never }
    | { href?: undefined; external?: never; onClick?: (event: MouseEvent<HTMLButtonElement>) => void; type?: "button" | "submit"; disabled?: boolean }
  );

export function MagneticButton({
  children,
  variant = "primary",
  className,
  icon,
  block = false,
  ...rest
}: Props) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 260, damping: 22, mass: 0.5 });

  const onPointerMove = useCallback(
    (event: MouseEvent) => {
      if (reduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const relativeX = event.clientX - (rect.left + rect.width / 2);
      const relativeY = event.clientY - (rect.top + rect.height / 2);
      x.set(Math.max(-7, Math.min(7, relativeX * 0.18)));
      y.set(Math.max(-5, Math.min(5, relativeY * 0.22)));
    },
    [reduced, x, y],
  );

  const onPointerLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const classes = cn(
    "group relative inline-flex items-center justify-center gap-2.5 rounded-full",
    "px-6 py-3 text-sm font-semibold tracking-tight transition-colors duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal-400",
    block && "w-full",
    VARIANTS[variant],
    className,
  );

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {icon ? (
        <span
          aria-hidden="true"
          className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5"
        >
          {icon}
        </span>
      ) : null}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    const { href, external, onClick } = rest;
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ x: springX, y: springY }}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </motion.a>
    );
  }

  const { onClick, type = "button", disabled } = rest;
  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ x: springX, y: springY }}
      className={cn(classes, disabled && "cursor-not-allowed opacity-60")}
    >
      {content}
    </motion.button>
  );
}
