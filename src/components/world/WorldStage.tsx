"use client";

import dynamic from "next/dynamic";

import { useExperience } from "@/components/providers/ExperienceProvider";

/* ============================================================================
   STAGE
   The 3D world is code-split behind a dynamic import: three.js, the postprocessing
   chain and every scene module are pulled in only on the client, only after the
   device has been measured, and only if the device can actually run them.

   The page backdrop (light, CSS-only) lives in PageBackdrop; this component only
   mounts the WebGL layer itself when the device can run it.
   ========================================================================= */

const WorldCanvas = dynamic(() => import("./WorldCanvas"), {
  ssr: false,
  loading: () => null,
});

export function WorldStage() {
  const { cinematic } = useExperience();

  return cinematic ? <WorldCanvas /> : null;
}
