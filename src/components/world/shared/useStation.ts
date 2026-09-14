"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type * as THREE from "three";

import { CAMERA_OFFSET, frame } from "@/lib/experience-store";
import { STATION_Z } from "@/lib/stations";
import { clamp } from "@/lib/utils";

/**
 * Distance from the camera to a station.
 *
 * The camera parks `CAMERA_OFFSET` units *in front* of a station so the scene is
 * framed rather than flattened against the near plane. Presence must therefore
 * be measured from that parked position, not from the raw camera depth — using
 * the raw depth would mean a station peaks at 40% opacity at its own centre and
 * never fully arrives.
 */
function distanceTo(stationZ: number) {
  return Math.abs(frame.cameraZ - CAMERA_OFFSET - stationZ);
}

/** Units of travel over which a station fades from fully present to gone. */
const DEFAULT_HOLD = 6;
const DEFAULT_FADE = 20;
/** Beyond this the station is invisible anyway; skipping it saves draw calls. */
const DEFAULT_CULL = 46;

export type StationDirector = {
  /** Live 1 → 0 presence readout, updated every frame. */
  presence: RefObject<number>;
};

type DirectorOptions = {
  /** The station's root group. Owned by the component, driven by the director. */
  ref: RefObject<THREE.Group | null>;
  hold?: number;
  fade?: number;
  cull?: number;
  /** Per-frame hook so a station can drive its own materials from `presence`. */
  onFrame?: (presence: number, delta: number, elapsed: number) => void;
  /** Skip the scripted entrance drift (used by full-bleed backdrop stations). */
  static?: boolean;
};

/**
 * Drives one station of the corridor.
 *
 * Presence is derived from the distance between the camera and the station's
 * fixed depth, so neighbouring stations dissolve through each other instead of
 * popping. Stations respond through `onFrame` — traversing the scene graph to
 * force opacity every frame is the classic way to turn a 3D portfolio into a
 * space heater, so each station owns a short explicit list of materials instead.
 */
export function useStation(stationId: string, options: DirectorOptions): StationDirector {
  const { ref, hold = DEFAULT_HOLD, fade = DEFAULT_FADE, cull = DEFAULT_CULL, onFrame, static: isStatic = false } =
    options;

  const presence = useRef(0);
  const baseZ = STATION_Z[stationId as keyof typeof STATION_Z] ?? 0;
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useFrame((_, delta) => {
    const node = ref.current;
    if (!node) return;

    const distance = distanceTo(baseZ);
    const value = clamp(1 - (distance - hold) / fade, 0, 1);
    presence.current = value;

    node.visible = value > 0.002 && distance < cull;
    if (!node.visible) return;

    if (!isStatic) {
      // Arrive with a gentle push-in rather than a hard cut.
      const settle = 1 - value;
      node.position.z = baseZ + settle * 2.6;
      node.scale.setScalar(0.94 + value * 0.06);
    }

    onFrameRef.current?.(value, delta, frame.time);
  });

  return { presence };
}

/**
 * Presence for a station measured from the camera, for helpers that animate
 * children outside the director's tree.
 */
export function presenceOf(stationId: string, hold = DEFAULT_HOLD, fade = DEFAULT_FADE) {
  const baseZ = STATION_Z[stationId as keyof typeof STATION_Z] ?? 0;
  return clamp(1 - (distanceTo(baseZ) - hold) / fade, 0, 1);
}
