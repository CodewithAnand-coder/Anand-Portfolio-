"use client";

import { useSyncExternalStore } from "react";

/* ============================================================================
   EXPERIENCE STORE
   A single source of truth for the scroll + pointer state that stitches the DOM
   page and the WebGL world together.

   Two channels on purpose:
   1. `frame`     — mutated every animation frame. Read imperatively inside
                    useFrame / rAF loops. NEVER triggers a React render.
   2. `discrete`  — changes rarely (active section, hovered object, readiness).
                    Exposed through useSyncExternalStore so components re-render
                    only when something they display actually changes.
   ========================================================================= */

export type FrameState = {
  /** Raw window scroll offset in px. */
  scrollY: number;
  /** 0 → 1 across the whole document. */
  progress: number;
  /** Signed scroll speed, normalised around 1. */
  velocity: number;
  /** Raw viewport pointer position in px. */
  pointerX: number;
  pointerY: number;
  /** Pointer position normalised to -1 → 1, origin at viewport centre. */
  pointerNX: number;
  pointerNY: number;
  /** Eases 0 → 1 while the pointer is inside the window. */
  pointerPresence: number;
  /** Viewport size in CSS px. */
  viewportWidth: number;
  viewportHeight: number;
  /** True while the user is actively scrolling (used to wake idle scenes). */
  scrolling: boolean;
  /** Timestamp (ms) of the last user input of any kind. */
  lastInputAt: number;
  /**
   * Smoothed camera depth, written by the camera rig and read by every station
   * to decide how present it should be. Owned by the rig so neighbourhood
   * stations agree on one value within a single frame.
   */
  cameraZ: number;
  /** Seconds since the world started, shared so scenes never disagree. */
  time: number;
};

/** How far in front of a station centre the camera sits, in world units. */
export const CAMERA_OFFSET = 18;

/** Starting depth — matches `STATION_Z.home + CAMERA_OFFSET`. */
export const CAMERA_START_Z = 18;

export const frame: FrameState = {
  scrollY: 0,
  progress: 0,
  velocity: 0,
  pointerX: 0,
  pointerY: 0,
  pointerNX: 0,
  pointerNY: 0,
  pointerPresence: 0,
  viewportWidth: 1280,
  viewportHeight: 800,
  scrolling: false,
  lastInputAt: 0,
  cameraZ: CAMERA_START_Z,
  time: 0,
};

export type DiscreteState = {
  /** id of the section currently filling the viewport. */
  activeStation: string;
  /** id of the 3D object the user is hovering/focusing, e.g. "cert-1". */
  hoveredObject: string | null;
  /** True once the preloader has handed over. */
  entered: boolean;
  /** True once the WebGL world has compiled and drawn a first frame. */
  worldReady: boolean;
};

let discrete: DiscreteState = {
  activeStation: "home",
  hoveredObject: null,
  entered: false,
  worldReady: false,
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeDiscrete(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDiscrete(): DiscreteState {
  return discrete;
}

export function setDiscrete(patch: Partial<DiscreteState>) {
  let changed = false;
  for (const key of Object.keys(patch) as (keyof DiscreteState)[]) {
    if (discrete[key] !== patch[key]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  discrete = { ...discrete, ...patch };
  emit();
}

/* ---- Reactive selectors ------------------------------------------------- */

export function useDiscrete<T>(select: (state: DiscreteState) => T): T {
  return useSyncExternalStore(
    subscribeDiscrete,
    () => select(getDiscrete()),
    () => select(getDiscrete()),
  );
}

export function useActiveStation() {
  return useDiscrete((s) => s.activeStation);
}

export function useEntered() {
  return useDiscrete((s) => s.entered);
}

export function useHoveredObject() {
  return useDiscrete((s) => s.hoveredObject);
}

/* ---- Imperative navigation --------------------------------------------- */

/**
 * Element that hosts a station, by id.
 *
 * Falls back to a plain `#id` lookup so container-only targets — the projects
 * wrapper, which holds five stations rather than being one — can still be
 * scrolled to by the navigation.
 */
export function stationElement(id: string) {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector<HTMLElement>(`[data-station="${id}"]`) ??
    document.getElementById(id)
  );
}

/**
 * Scroll to a station. Prefers Lenis when it is driving the page so the
 * camera rig stays perfectly in sync with the DOM.
 */
export function scrollToStation(id: string, offset = 0) {
  const el = stationElement(id);
  if (!el) return;
  const lenis = getLenis();
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  if (lenis) {
    lenis.scrollTo(top, { duration: 1.35 });
  } else {
    window.scrollTo({ top, behavior: "smooth" });
  }
}

/* ---- Lenis handle ------------------------------------------------------- */

type LenisLike = {
  scrollTo: (target: number | HTMLElement, opts?: Record<string, unknown>) => void;
  destroy: () => void;
  raf: (time: number) => void;
  on: (event: string, cb: (e: { velocity: number }) => void) => void;
  stop: () => void;
  start: () => void;
};

let lenisInstance: LenisLike | null = null;

export function setLenis(instance: LenisLike | null) {
  lenisInstance = instance;
}

export function getLenis() {
  return lenisInstance;
}


