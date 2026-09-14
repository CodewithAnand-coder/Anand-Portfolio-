"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { useExperience } from "@/components/providers/ExperienceProvider";
import { profile } from "@/data/profile";
import { setDiscrete, useDiscrete } from "@/lib/experience-store";

/* ============================================================================
   PRELOADER
   A short curtain while the WebGL world compiles its shaders. Three ways out,
   whichever happens first: the world reports its first drawn frame, a hard
   ceiling elapses, or there is no 3D at all (reduced motion or no WebGL).
   Plus a minimum display time so the curtain does not flash for 80ms.
   ========================================================================= */

const MIN_VISIBLE_MS = 700;
const CEILING_MS = 3000;

export function Preloader() {
  const { cinematic, measured } = useExperience();
  const worldReady = useDiscrete((state) => state.worldReady);
  const reduced = useReducedMotion();

  const [minElapsed, setMinElapsed] = useState(false);
  const [ceilingHit, setCeilingHit] = useState(false);

  useEffect(() => {
    const minTimer = window.setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const ceilingTimer = window.setTimeout(() => setCeilingHit(true), CEILING_MS);
    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(ceilingTimer);
    };
  }, []);

  // Nothing to wait for when the 3D world is not going to mount.
  const worldResolved = !cinematic || worldReady || ceilingHit;
  const dismissed = worldResolved && minElapsed && (measured || ceilingHit);

  useEffect(() => {
    if (dismissed) setDiscrete({ entered: true });
  }, [dismissed]);

  return (
    <AnimatePresence>
      {!dismissed ? (
        <motion.div
          className="fixed inset-0 z-[300] grid place-items-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.8, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm px-8 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="label-mono"
            >
              Data · AI · Analytics
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-2xl font-bold text-navy-900 sm:text-3xl"
            >
              {profile.name}
            </motion.h1>

            <div className="relative mt-8 h-px w-full overflow-hidden bg-ink-600">
              <motion.div
                className="absolute inset-y-0 left-0 w-full origin-left bg-signal-500"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduced ? 0.2 : 2.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.22em] text-mist-500">
              {worldResolved ? "Ready" : "Preparing environment"}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
