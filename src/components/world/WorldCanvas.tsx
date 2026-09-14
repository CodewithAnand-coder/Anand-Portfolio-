"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

import { useExperience } from "@/components/providers/ExperienceProvider";
import { CAMERA_START_Z, frame, setDiscrete } from "@/lib/experience-store";
import { usePageVisible } from "@/lib/hooks";

import { AmbientField } from "./AmbientField";
import { CameraRig } from "./CameraRig";
import { Diagnostics } from "./Diagnostics";
import { AboutStation } from "./stations/AboutStation";
import { CertificatesStation } from "./stations/CertificatesStation";
import { ContactStation } from "./stations/ContactStation";
import { EducationStation } from "./stations/EducationStation";
import { ExperienceStation } from "./stations/ExperienceStation";
import { HeroStation } from "./stations/HeroStation";
import { ServicesStation } from "./stations/ServicesStation";
import { ProjectStations } from "./stations/ProjectStations";
import { SkillsStation } from "./stations/SkillsStation";
import { YouTubeStation } from "./stations/YouTubeStation";
import { disposeTextures } from "./shared/textures";

/* ============================================================================
   THE WORLD
   One canvas. One scene. One camera travelling a light, airy corridor.

   The light theme inverts the original darkness: the canvas is transparent over
   the white page backdrop, fog is a soft paper blue so distant geometry dissolves
   into the page, and lighting is studio-like rather than emissive-in-the-void.

   The canvas is `pointer-events: none` for its entire life. Nothing here
   raycasts. Interactive 3D — the certificate gallery especially — is driven by
   real DOM controls layered over the scene, so keyboard users get the same
   experience as mouse users and screen readers get actual labels.
   ========================================================================= */

const FOG_COLOR = "#eef3fb";

export default function WorldCanvas() {
  const { quality, reducedMotion } = useExperience();
  const visible = usePageVisible();
  const [contextLost, setContextLost] = useState(false);

  // Opt-in instrumentation, used by the automated browser check. Read once —
  // the flag never changes during a session.
  const [debug] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug"),
  );

  // A lost WebGL context cannot be recovered meaningfully mid-session; hide the
  // canvas and let the CSS backdrop take over rather than showing a frozen frame.
  const handleContextLost = useCallback(() => setContextLost(true), []);

  useEffect(() => {
    const onLost = (event: Event) => {
      event.preventDefault();
      handleContextLost();
    };
    window.addEventListener("webglcontextlost", onLost, true);
    return () => window.removeEventListener("webglcontextlost", onLost, true);
  }, [handleContextLost]);

  // Free every generated texture when the world unmounts.
  useEffect(() => () => disposeTextures(), []);

  if (contextLost) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={quality.dpr}
        // Parking the loop in a hidden tab is the single biggest battery saving
        // available to a page like this.
        frameloop={visible ? "always" : "never"}
        gl={{
          antialias: true, // no dark postprocessing to hide edges behind
          alpha: true, // the white page shows through; canvas paints geometry only
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        camera={{ fov: 52, near: 0.5, far: 220, position: [0, 0, CAMERA_START_Z] }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(FOG_COLOR), 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <fogExp2 attach="fog" args={[FOG_COLOR, 0.02]} />

        <Lights />

        <CameraRig reducedMotion={reducedMotion} />
        <AmbientField />

        <HeroStation />
        <AboutStation />
        <ServicesStation />
        <ExperienceStation />
        <EducationStation />
        <SkillsStation />
        <ProjectStations />
        <CertificatesStation />
        <YouTubeStation />
        <ContactStation />

        {quality.postprocessing ? <Effects /> : null}

        <AdaptiveResolution min={quality.dpr[0]} max={quality.dpr[1]} />
        <FirstFrameSignal />
        {debug ? <Diagnostics /> : null}
      </Canvas>
    </div>
  );
}

/* --------------------------------------------------------------------------- */
/* Lighting                                                                     */
/* --------------------------------------------------------------------------- */

/**
 * Key lighting for the whole corridor.
 *
 * Deliberately sparse: the aesthetic is emissive surfaces inside fog, so most of
 * the "light" in this world is self-illumination. A directional light gives the
 * solid geometry (cores, slabs, platforms) form regardless of how far down the
 * corridor it sits, and a camera-locked point light keeps the station the visitor
 * is actually looking at from going flat.
 */
function Lights() {
  const light = useRef<THREE.DirectionalLight>(null);
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    if (!light.current) return;
    light.current.position.set(camera.position.x + 4, camera.position.y + 6, camera.position.z - 4);
    light.current.target.position.set(camera.position.x, camera.position.y, camera.position.z - 8);
    light.current.target.updateMatrixWorld();
  });

  return (
    <>
      <ambientLight intensity={0.85} color="#dfe7f5" />
      <hemisphereLight args={["#ffffff", "#b7c8e6", 0.7]} />
      <directionalLight position={[8, 14, 10]} intensity={1.5} color="#ffffff" />
      <directionalLight
        ref={light}
        intensity={1.1}
        color="#dbe7fb"
      />
    </>
  );
}

/* --------------------------------------------------------------------------- */
/* Postprocessing                                                               */
/* --------------------------------------------------------------------------- */

function Effects() {
  // The light theme needs no bloom (nothing glows) and no dark vignette; a
  // whisper of grain remains so soft gradients don't band on 8-bit displays.
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

/* --------------------------------------------------------------------------- */
/* Runtime quality adaptation                                                   */
/* --------------------------------------------------------------------------- */

/**
 * Static tier detection gets the first guess right, but laptops throttle,
 * integrated GPUs share memory with the browser, and low-end phones vary wildly.
 * This watches frame time and walks the pixel ratio down (or back up) to hold a
 * smooth frame rate.
 *
 * Two speeds of reaction, because one is not enough:
 *   • a single catastrophic frame drops quality immediately, so a device that is
 *     far too slow does not stutter for seconds before we respond at all;
 *   • otherwise a rolling window decides, which avoids oscillating on noise.
 */
const SAMPLE_WINDOW = 45;
const PANIC_FRAME = 0.08; // 80ms — anything slower than 12fps is an emergency

function AdaptiveResolution({ min, max }: { min: number; max: number }) {
  const gl = useThree((state) => state.gl);
  const setDpr = useThree((state) => state.setDpr);
  const total = useRef(0);
  const count = useRef(0);
  /**
   * Seeded from the renderer's *actual* pixel ratio, never from the configured
   * maximum. R3F resolves an array dpr against `window.devicePixelRatio`, so on a
   * 1x display the canvas legitimately starts at the minimum — assuming `max`
   * here made the first adaptation step *raise* the resolution, slowing down a
   * device that was already struggling (observed as a 2448px-wide canvas on a
   * 1440px viewport).
   */
  const current = useRef<number | null>(null);

  useFrame((_, delta) => {
    if (current.current === null) current.current = gl.getPixelRatio();
    const dpr = current.current;

    if (delta > PANIC_FRAME && dpr > min) {
      current.current = Math.max(min, Number((dpr - 0.2).toFixed(2)));
      setDpr(current.current);
      total.current = 0;
      count.current = 0;
      return;
    }

    total.current += delta;
    count.current += 1;
    if (count.current < SAMPLE_WINDOW) return;

    const average = total.current / count.current;
    total.current = 0;
    count.current = 0;

    const fps = 1 / Math.max(average, 1e-4);
    const next = dpr;

    if (fps < 42) {
      current.current = Math.max(min, Number((next - 0.15).toFixed(2)));
    } else if (fps > 58) {
      current.current = Math.min(max, Number((next + 0.1).toFixed(2)));
    }

    if (current.current !== next) setDpr(current.current);
  });

  return null;
}

/* --------------------------------------------------------------------------- */
/* Readiness                                                                    */
/* --------------------------------------------------------------------------- */

/** Announces that the world has drawn, so the preloader can hand over. */
function FirstFrameSignal() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    frame.time = 0;
    setDiscrete({ worldReady: true });
  });
  return null;
}
