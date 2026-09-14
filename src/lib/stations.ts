"use client";

import { clamp, smoothstep } from "./utils";

/* ============================================================================
   THE CORRIDOR
   The whole portfolio is one continuous 3D environment laid out along -Z.
   Every DOM section declares `data-station="<id>"`; at runtime we measure where
   that section sits in the document and map scroll position onto the matching
   depth. Result: the camera is always exactly at the station whose content the
   visitor is reading, no matter the viewport size or content length.
   ========================================================================= */

export const ALL_STATIONS = [
  "home",
  "about",
  "services",
  "experience",
  "education",
  "skills",
  "project-0",
  "project-1",
  "project-2",
  "project-3",
  "project-4",
  "certificates",
  "youtube",
  "contact",
] as const;

export type StationId = (typeof ALL_STATIONS)[number];

/** Depth of each station along the corridor. */
export const STATION_Z: Record<StationId, number> = {
  home: 0,
  about: -26,
  services: -50,
  experience: -74,
  education: -96,
  skills: -122,
  "project-0": -148,
  "project-1": -170,
  "project-2": -192,
  "project-3": -214,
  "project-4": -236,
  certificates: -262,
  youtube: -288,
  contact: -314,
};

/** Navigation entries — several stations can share one nav target. */
export const NAV_SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "certificates", label: "Certificates" },
  { id: "youtube", label: "YouTube" },
  { id: "contact", label: "Contact" },
] as const;

export type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];

/** Collapse a station id down to the navigation entry it belongs to. */
export function stationToNav(station: string): NavSectionId {
  if (station.startsWith("project-")) return "projects";
  if ((NAV_SECTIONS as readonly { id: string }[]).some((s) => s.id === station)) {
    return station as NavSectionId;
  }
  return "home";
}

export type StationSpan = {
  id: string;
  z: number;
  /** Document scroll offset (px) at which this station is centred in the viewport. */
  center: number;
};

/**
 * Measure every declared station in the document and produce a sorted table of
 * (scroll offset → depth) keys. Cheap enough to rebuild on resize and after
 * fonts/images settle.
 */
export function buildStationMap(): StationSpan[] {
  if (typeof document === "undefined") return [];
  const viewport = window.innerHeight;
  const spans: StationSpan[] = [];

  for (const id of ALL_STATIONS) {
    const el = document.querySelector<HTMLElement>(`[data-station="${id}"]`);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    spans.push({
      id,
      z: STATION_Z[id],
      center: clamp(absoluteTop + rect.height / 2 - viewport / 2, 0, Number.MAX_SAFE_INTEGER),
    });
  }

  spans.sort((a, b) => a.center - b.center);
  return spans;
}

/**
 * Blend of linear and smoothstep. Pure smoothstep makes the camera crawl at
 * every station (nice for the hero, sluggish deeper in), pure linear kills the
 * cinematic dwell. The 60/40 mix reads as "travelling, then arriving".
 */
function pace(t: number) {
  return t * 0.62 + smoothstep(0, 1, t) * 0.38;
}

/** Camera depth for a given scroll offset. */
export function zAtScroll(scrollY: number, spans: StationSpan[]): number {
  if (spans.length === 0) return 0;
  if (spans.length === 1) return spans[0].z;
  if (scrollY <= spans[0].center) return spans[0].z;

  const last = spans[spans.length - 1];
  if (scrollY >= last.center) return last.z;

  for (let i = 0; i < spans.length - 1; i += 1) {
    const a = spans[i];
    const b = spans[i + 1];
    if (scrollY >= a.center && scrollY <= b.center) {
      const span = b.center - a.center;
      const t = span <= 0 ? 1 : (scrollY - a.center) / span;
      return a.z + (b.z - a.z) * pace(t);
    }
  }
  return last.z;
}

/**
 * Sub-pixel tolerance on station boundaries.
 *
 * Browsers quantise scroll position, so a scroll that targets a station's exact
 * centre can land a fraction of a pixel short. Without this tolerance the
 * previous station would still be reported as active while the camera is already
 * centred on the next one, leaving the navigation pointing at the wrong section.
 */
const STATION_BOUNDARY_TOLERANCE = 1;

/** Station whose content currently owns the viewport. */
export function stationAtScroll(scrollY: number, spans: StationSpan[]): string {
  if (spans.length === 0) return "home";
  let current = spans[0].id;
  for (const span of spans) {
    if (scrollY >= span.center - STATION_BOUNDARY_TOLERANCE) current = span.id;
  }
  // The final section may be shorter than the viewport, so scrolling can never
  // reach its centre. Fall back to the last station once we are near the bottom.
  const docHeight = document.documentElement.scrollHeight;
  if (scrollY + window.innerHeight >= docHeight - 2) {
    return spans[spans.length - 1].id;
  }
  return current;
}

/* ---- Cached corridor table ---------------------------------------------- */

let cached: StationSpan[] = [];

/**
 * Re-measure the document. Called on mount, resize, font load and whenever the
 * page height changes — never per frame.
 */
export function refreshCorridor(): StationSpan[] {
  cached = buildStationMap();
  return cached;
}

export function getCorridor(): StationSpan[] {
  return cached;
}

/** Normalised 0 → 1 position along the whole corridor. */
export function corridorProgress(scrollY: number, spans: StationSpan[]) {
  if (spans.length < 2) return 0;
  const from = spans[0].center;
  const to = spans[spans.length - 1].center;
  if (to - from <= 0) return 0;
  return clamp((scrollY - from) / (to - from), 0, 1);
}
