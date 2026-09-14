"use client";

import Image from "next/image";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";

/* ============================================================================
   PROFILE PHOTO
   The hero asks for the existing photo. No image file is committed yet, so this
   component renders the photo when one exists at build time and a typographic
   monogram card otherwise — designed states either way.

   HOW TO ADD THE PHOTO (two steps):
     1. Drop your photo into `public/` as profile.jpg (or .png/.webp).
     2. Uncomment the matching `import profilePhoto ...` line below.

   Next.js bundles static imports at build time, so a missing file never
   produces a runtime 404 or console error — and Next optimises the image
   (srcset, lazy decode) automatically once wired.
   ========================================================================= */

/** Profile photo located at public/profile.jpg */
const PHOTO_SRC: string | null = "/profile.jpg";

export function ProfilePhoto({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-3xl border border-ink-600 bg-gradient-to-br from-ink-800 via-white to-signal-100 shadow-panel",
        className,
      )}
    >
      {PHOTO_SRC ? (
        <Image
          src={PHOTO_SRC}
          alt={`Portrait of ${profile.name}`}
          fill
          priority
          sizes="(max-width: 1024px) 60vw, 30vw"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <div className="flex flex-col items-center gap-3">
            <span className="grid h-24 w-24 place-items-center rounded-2xl bg-navy-900 font-display text-2xl font-semibold tracking-wide text-white shadow-card sm:h-28 sm:w-28 sm:text-3xl">
              {profile.initials}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist-500">
              {profile.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
