import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Every section is a "station" in the corridor.
 *
 * The `data-station` attribute is the contract between the DOM and the WebGL
 * camera rig: the rail measures this element's position in the document and maps
 * it onto a fixed depth, which is why the camera lands on the right part of the
 * 3D world no matter how the content reflows, on any viewport.
 *
 * If a section is added, `data-station` must be added to `STATION_Z` in
 * `lib/stations.ts` or the camera will skip straight past it.
 */
export function SectionShell({
  id,
  children,
  className,
  /** Full-bleed sections opt out of the reading-width container. */
  bleed = false,
  /** Soft grey band — the alternating rhythm of a business layout. */
  tinted = false,
  labelledBy,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  bleed?: boolean;
  tinted?: boolean;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      data-station={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative z-10 flex w-full flex-col justify-center",
        "px-5 py-24 sm:px-8 sm:py-28 lg:px-12 lg:py-32",
        tinted && "section-tint border-y border-ink-600",
        className,
      )}
    >
      {bleed ? children : <div className="mx-auto w-full max-w-6xl">{children}</div>}
    </section>
  );
}
