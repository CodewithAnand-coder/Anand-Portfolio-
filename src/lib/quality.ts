"use client";

/* ============================================================================
   QUALITY TIERS
   The 3D world is authored once and dialled down per device rather than being
   duplicated for mobile. Everything that costs GPU time reads from here, so
   lowering a tier is a one-line change instead of a search across scenes.
   ========================================================================= */

export type Tier = "low" | "mid" | "high";

export type QualitySettings = {
  /** Device pixel ratio range handed to the renderer. */
  dpr: [number, number];
  /** Particles in the ambient data field. */
  ambientParticles: number;
  /** Nodes in the hero / about network graphs. */
  networkNodes: number;
  /** Draw the connecting lines between network nodes. */
  networkLinks: boolean;
  /** Segments on the hero core geometry. */
  coreDetail: number;
  /** Enable the postprocessing chain (bloom / vignette / grain). */
  postprocessing: boolean;
  bloomIntensity: number;
  /** Enable the faint ground grid beneath the corridor. */
  groundGrid: boolean;
};

export const QUALITY: Record<Tier, QualitySettings> = {
  high: {
    dpr: [1, 1.9],
    ambientParticles: 5200,
    networkNodes: 54,
    networkLinks: true,
    coreDetail: 220,
    postprocessing: true,
    bloomIntensity: 0.85,
    groundGrid: true,
  },
  mid: {
    dpr: [1, 1.5],
    ambientParticles: 2400,
    networkNodes: 34,
    networkLinks: true,
    coreDetail: 140,
    postprocessing: true,
    bloomIntensity: 0.6,
    groundGrid: true,
  },
  low: {
    dpr: [1, 1.15],
    ambientParticles: 700,
    networkNodes: 18,
    networkLinks: false,
    coreDetail: 72,
    postprocessing: false,
    bloomIntensity: 0,
    groundGrid: false,
  },
};

/**
 * Decide a tier from real device signals. We intentionally bias toward `mid`
 * rather than `high`: a portfolio that runs smoothly at 60fps everywhere beats
 * one that looks marginally better on the author's machine and stutters for a
 * recruiter on a laptop with integrated graphics.
 */
export function detectTier(reducedMotion = false): Tier {
  if (typeof window === "undefined") return "mid";

  const width = window.innerWidth;
  const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  // Respect the OS setting: reduced motion also means "do less work".
  if (reducedMotion) return "low";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

  if (saveData) return "low";

  // Small screens get fewer pixels but also weaker GPUs, and they are the most
  // likely to be on battery. Treat them as mid, not high.
  if (width < 768) return cores <= 4 || memory <= 4 ? "low" : "mid";
  if (width < 1180) return cores <= 4 || memory <= 4 ? "mid" : "high";

  if (cores <= 4 || memory <= 4) return "mid";
  if (coarse) return "mid";
  return "high";
}

/** Cheap WebGL availability probe. Runs once; result is cached. */
let webglSupport: boolean | null = null;

export function supportsWebGL() {
  if (webglSupport !== null) return webglSupport;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    webglSupport = Boolean(gl);
    // Release the probe context immediately — browsers cap live contexts.
    if (gl && "getExtension" in gl) {
      (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
