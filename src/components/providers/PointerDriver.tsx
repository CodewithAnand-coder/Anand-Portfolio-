"use client";

import { useEffect } from "react";

import { frame } from "@/lib/experience-store";

/**
 * Publishes cursor position into the frame store.
 *
 * Deliberately passive: it only writes plain numbers and never triggers a React
 * render. The camera rig and shaders sample these values on their own clock, so
 * a fast mouse cannot outrun the renderer.
 *
 * Touch is ignored on purpose — a finger dragging is not a hover, and feeding
 * it into a parallax rig makes phones feel broken rather than immersive.
 */
export function PointerDriver() {
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      frame.pointerX = event.clientX;
      frame.pointerY = event.clientY;
      frame.pointerNX = (event.clientX / window.innerWidth) * 2 - 1;
      frame.pointerNY = -((event.clientY / window.innerHeight) * 2 - 1);
      frame.pointerPresence = 1;
      frame.lastInputAt = performance.now();
    };

    const onLeave = () => {
      frame.pointerPresence = 0;
    };

    const onDown = () => {
      frame.lastInputAt = performance.now();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return null;
}
