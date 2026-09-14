"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useDeviceTier, usePrefersReducedMotion } from "@/lib/hooks";
import { QUALITY, supportsWebGL, type QualitySettings, type Tier } from "@/lib/quality";

import { PointerDriver } from "./PointerDriver";
import { ScrollDriver } from "./ScrollDriver";

type ExperienceContextValue = {
  /** Rendering tier chosen for this device. */
  tier: Tier;
  /** Concrete budgets for the tier (particles, dpr, effects). */
  quality: QualitySettings;
  /** False until the client has measured the device. */
  measured: boolean;
  /** The visitor asked the OS to reduce motion. */
  reducedMotion: boolean;
  /** WebGL is available — otherwise we render the accessible fallback. */
  hasWebGL: boolean;
  /** True when the full 3D world should mount. */
  cinematic: boolean;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const { tier, ready } = useDeviceTier();
  const prefersReduced = usePrefersReducedMotion();
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(supportsWebGL());
  }, []);

  const value = useMemo<ExperienceContextValue>(() => {
    const quality = QUALITY[tier];
    return {
      tier,
      quality,
      measured: ready,
      reducedMotion: prefersReduced,
      hasWebGL,
      // Reduced motion or no WebGL means: keep the page, drop the show.
      cinematic: ready && hasWebGL && !prefersReduced,
    };
  }, [tier, ready, prefersReduced, hasWebGL]);

  return (
    <ExperienceContext.Provider value={value}>
      <ScrollDriver reducedMotion={prefersReduced} />
      <PointerDriver />
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used inside <ExperienceProvider>");
  }
  return context;
}
