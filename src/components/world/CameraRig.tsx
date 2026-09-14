"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { CAMERA_OFFSET, frame } from "@/lib/experience-store";
import { getCorridor, zAtScroll } from "@/lib/stations";
import { MAX_FRAME_DELTA, damp } from "@/lib/utils";

/**
 * The single camera that travels the corridor.
 *
 * Registered with a **negative** frame priority so it resolves before any
 * station reads `frame.cameraZ`. Within one frame every scene therefore agrees
 * on where the viewer is, which is what keeps the cross-dissolves between
 * stations clean instead of one frame out of step.
 *
 * Note also what this rig deliberately does *not* do: it never reads React
 * state. It samples the imperatively-updated frame store, so a scroll gesture
 * costs zero renders.
 */
export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const camera = useThree((state) => state.camera);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const rig = useRef({
    z: CAMERA_OFFSET,
    x: 0,
    y: 0,
    lookX: 0,
    lookY: 0,
    presence: 0,
  });

  // Keep the projection in step with viewport aspect on resize.
  useEffect(() => {
    const onResize = () => {
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const perspective = camera as THREE.PerspectiveCamera;
      // Widen the field of view on portrait phones so the station geometry,
      // which is authored landscape-first, still fits the frame horizontally.
      perspective.fov = aspect < 0.85 ? 68 : aspect < 1.4 ? 58 : 52;
      perspective.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, MAX_FRAME_DELTA);
    frame.time += dt;

    const rigState = rig.current;
    const spans = getCorridor();
    const targetZ = zAtScroll(frame.scrollY, spans) + CAMERA_OFFSET;

    // Reduced motion keeps the travel (it is scroll-driven, not decorative) but
    // removes the smoothing lag and the idle drift.
    rigState.z = reducedMotion ? targetZ : damp(rigState.z, targetZ, 5.6, dt);

    const presenceLambda = reducedMotion ? 12 : 2.6;
    rigState.presence = damp(rigState.presence, frame.pointerPresence, presenceLambda, dt);

    const pointerStrength = reducedMotion ? 0 : 1;
    const offsetX = frame.pointerNX * 2.7 * rigState.presence * pointerStrength;
    const offsetY = frame.pointerNY * 1.7 * rigState.presence * pointerStrength;
    rigState.x = damp(rigState.x, offsetX, 3.1, dt);
    rigState.y = damp(rigState.y, offsetY, 3.1, dt);

    // Idle breathing: keeps the frame alive without fighting user input.
    const time = frame.time;
    const breatheX = reducedMotion ? 0 : Math.sin(time * 0.19) * 0.5;
    const breatheY = reducedMotion ? 0 : Math.cos(time * 0.152) * 0.38;

    // Scroll velocity nudges the camera forward, so a fast flick feels physical.
    const velocityPush = reducedMotion ? 0 : frame.velocity * 0.9;

    camera.position.set(
      rigState.x + breatheX,
      rigState.y + breatheY,
      rigState.z - velocityPush,
    );

    // The look target trails the camera, which is what produces parallax on the
    // station objects instead of a flat pan.
    rigState.lookX = damp(rigState.lookX, rigState.x * 0.5, 2.4, dt);
    rigState.lookY = damp(rigState.lookY, rigState.y * 0.42, 2.4, dt);
    lookTarget.set(rigState.lookX, rigState.lookY, rigState.z - 24);
    camera.lookAt(lookTarget);

    // A degree of roll tied to horizontal pointer position — subtle, but it is
    // the difference between "3D scene" and "camera you are holding".
    if (!reducedMotion) camera.rotateZ(-rigState.x * 0.016);

    // Publish for stations. Resolved before any of them run, so every scene in a
    // given frame sees the same camera depth.
    frame.cameraZ = rigState.z;
  }, -1);

  return null;
}
