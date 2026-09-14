"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type * as THREE from "three";

import { CAMERA_OFFSET, frame, getDiscrete, getLenis } from "@/lib/experience-store";
import { ALL_STATIONS, getCorridor, refreshCorridor } from "@/lib/stations";

/* ============================================================================
   DIAGNOSTICS BRIDGE
   Mounted only when the page is opened with `?debug=1`.

   A WebGL portfolio is unusually hard to inspect: the interesting state lives in
   a render loop, not the DOM, so "is this actually working?" cannot be answered
   from the HTML. This exposes camera depth, genuine object visibility and the
   renderer's real per-frame load on `window.__world`, so the scene can be
   asserted against from an automated browser rather than guessed at.

   DRAW-CALL MEASUREMENT — the non-obvious part. `gl.info.render` is reset by
   every `renderer.render()` call, and the postprocessing chain issues one call
   per effect pass. Reading `gl.info.render.calls` at the end of a frame therefore
   reports the *final full-screen pass* (invariably 1 call / 1 triangle), not the
   scene. So automatic reset is disabled here, the counters are harvested once per
   frame before being cleared, and the reported figure is the true total for the
   whole frame including every composer pass.

   Costs nothing when not requested: without the flag the component is never
   mounted, so there is no frame subscriber and no global.
   ========================================================================= */

export type WorldSnapshot = {
  ready: boolean;
  frameCount: number;
  fps: number;
  longestFrameMs: number;
  cameraZ: number;
  stationZ: number;
  activeStation: string;
  progress: number;
  scrollY: number;
  /** Total draw calls issued in the last full frame, across every pass. */
  drawCalls: number;
  triangles: number;
  programs: number;
  geometries: number;
  textures: number;
  visibleStations: string[];
  viewport: [number, number];
  dpr: number;
  animationRunning: boolean;
};

export type WorldDebugApi = {
  ready: boolean;
  stations: readonly string[];
  snapshot: () => WorldSnapshot;
  /** Document scroll offset at which each station is centred. */
  corridor: () => { id: string; z: number; center: number }[];
  /** Snap the page to a station centre and wait for the camera to settle. */
  snapTo: (station: string) => Promise<void>;
};

declare global {
  interface Window {
    __world?: WorldDebugApi;
  }
}

export function Diagnostics() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  const tracker = useRef({
    frameCount: 0,
    samples: [] as number[],
    longest: 0,
    /** Harvested from the previous frame, before the counters were cleared. */
    drawCalls: 0,
    triangles: 0,
  });

  const stationNames = useMemo(() => ALL_STATIONS.map((id) => `station-${id}`), []);

  // Own the info counters for the lifetime of this component.
  useEffect(() => {
    gl.info.autoReset = false;
    return () => {
      gl.info.autoReset = true;
    };
  }, [gl]);

  useEffect(() => {
    const api: WorldDebugApi = {
      ready: false,
      stations: ALL_STATIONS,

      corridor: () =>
        getCorridor().map((span) => ({ id: span.id, z: span.z, center: Math.round(span.center) })),

      snapshot: () => {
        const state = tracker.current;
        const recent = state.samples.slice(-60);
        const average = recent.length
          ? recent.reduce((sum, value) => sum + value, 0) / recent.length
          : 0;

        const visible = stationNames.filter((name) => {
          const object = scene.getObjectByName(name);
          if (!object) return false;
          // Effective visibility: drawn only if it and every ancestor are visible.
          let node: THREE.Object3D | null = object;
          while (node) {
            if (!node.visible) return false;
            node = node.parent;
          }
          return true;
        });

        return {
          ready: api.ready,
          frameCount: state.frameCount,
          fps: average > 0 ? Math.round(1 / average) : 0,
          longestFrameMs: Math.round(state.longest * 1000),
          cameraZ: Number(frame.cameraZ.toFixed(2)),
          stationZ: Number((frame.cameraZ - CAMERA_OFFSET).toFixed(2)),
          activeStation: getDiscrete().activeStation,
          progress: Number(frame.progress.toFixed(4)),
          scrollY: Math.round(frame.scrollY),
          drawCalls: state.drawCalls,
          triangles: state.triangles,
          programs: gl.info.programs?.length ?? 0,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
          visibleStations: visible,
          viewport: [window.innerWidth, window.innerHeight],
          dpr: gl.getPixelRatio(),
          animationRunning: getDiscrete().entered,
        };
      },

      snapTo: (station: string) =>
        new Promise<void>((resolve) => {
          const spans = refreshCorridor();
          const span = spans.find((entry) => entry.id === station);
          if (!span) {
            resolve();
            return;
          }

          // Scroll to the station's measured CENTRE, not its top — the corridor
          // is mapped to centres, so scrolling to `top` lands a station and a
          // half short of the intended depth.
          const lenis = getLenis();
          if (lenis) {
            // Lenis owns the scroll position; a raw window.scrollTo would be
            // fought and reverted on the next frame.
            lenis.scrollTo(span.center, { immediate: true });
          } else {
            window.scrollTo({ top: span.center, behavior: "auto" });
          }

          // Poll until the rig has genuinely settled, rather than waiting a fixed
          // interval. On a slow renderer each frame advances only `MAX_FRAME_DELTA`
          // of simulated time, so wall-clock waiting is not a reliable proxy for
          // convergence — and a fixed timeout would report drift that is purely an
          // artefact of the test, not of the app.
          const targetCameraZ = span.z + CAMERA_OFFSET;
          const deadline = performance.now() + 25_000;
          let stableFrames = 0;

          const settle = () => {
            if (Math.abs(frame.cameraZ - targetCameraZ) < 1) stableFrames += 1;
            else stableFrames = 0;

            if (stableFrames >= 3 || performance.now() > deadline) {
              resolve();
              return;
            }
            requestAnimationFrame(settle);
          };

          requestAnimationFrame(settle);
        }),
    };

    window.__world = api;
    return () => {
      if (window.__world === api) delete window.__world;
    };
  }, [gl, scene, stationNames]);

  // Runs before everything else (priority -3) so the numbers reported by
  // `snapshot()` describe a complete, uninterrupted frame.
  useFrame(() => {
    const state = tracker.current;
    state.drawCalls = gl.info.render.calls;
    state.triangles = gl.info.render.triangles;
    gl.info.reset();
  }, -3);

  useFrame((_, delta) => {
    const state = tracker.current;
    state.frameCount += 1;
    state.samples.push(delta);
    // Keep the window bounded — this runs for the life of the page.
    if (state.samples.length > 120) state.samples.shift();
    if (delta > state.longest) state.longest = delta;

    if (window.__world && !window.__world.ready && state.frameCount > 2) {
      window.__world.ready = true;
    }
  });

  // Corridor measurements depend on layout; refresh once fonts have settled.
  useEffect(() => {
    const timer = window.setTimeout(() => refreshCorridor(), 800);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
