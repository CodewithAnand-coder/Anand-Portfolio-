"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * A panel that tilts toward the cursor in 3D, with a specular highlight that
 * tracks the pointer across its surface.
 *
 * The tilt is small (max ~5°) and the perspective is generous, because a strong
 * tilt on a text-heavy card makes the text harder to read — the effect has to
 * serve the content, not the other way round.
 */
export function TiltCard({
  children,
  className,
  intensity = 5,
  glare = true,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees. */
  intensity?: number;
  glare?: boolean;
  as?: "div" | "article" | "li";
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springX = useSpring(rotateX, { stiffness: 180, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 20 });

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(47,111,219,0.08), transparent 55%)`;

  const onPointerMove = useCallback(
    (event: MouseEvent) => {
      if (reduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      rotateY.set((px - 0.5) * intensity * 2);
      rotateX.set(-(py - 0.5) * intensity * 2);
      glareX.set(px * 100);
      glareY.set(py * 100);
    },
    [reduced, intensity, rotateX, rotateY, glareX, glareY],
  );

  const onPointerLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  }, [rotateX, rotateY, glareX, glareY]);

  // `motion[as]` resolves to a union of component types, which makes the ref
  // prop a union of ref types too. Narrowing to the div variant keeps the ref
  // usable while the rendered tag still follows `as`.
  const Component = motion[as] as typeof motion.div;

  return (
    <Component
      ref={ref as React.Ref<HTMLDivElement>}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={
        reduced
          ? undefined
          : { rotateX: springX, rotateY: springY, transformPerspective: 1100 }
      }
      className={cn("group relative [transform-style:preserve-3d]", className)}
    >
      {children}
      {glare && !reduced ? (
        <motion.span
          aria-hidden="true"
          style={{ background: glareBackground }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      ) : null}
    </Component>
  );
}
