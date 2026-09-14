"use client";

import { useState } from "react";

import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { aboutParagraphs, focusAreas, profile } from "@/data/profile";
import { setDiscrete } from "@/lib/experience-store";
import { cn } from "@/lib/utils";

/* ============================================================================
   ABOUT
   The three real paragraphs lead; focus areas become a clean numbered list.
   Hovering or focusing one still publishes to the 3D network behind the section,
   preserving the existing interaction with the scene.
   ========================================================================= */

export function About() {
  const [active, setActive] = useState<string | null>(null);

  const highlight = (id: string | null) => {
    setActive(id);
    setDiscrete({ hoveredObject: id ? `focus:${id}` : null });
  };

  return (
    <SectionShell id="about" labelledBy="about-title">
      <SectionHeading
        id="about-title"
        eyebrow="Professional Profile"
        title="Who I Am"
        lead="A BCA graduate who works across the whole data path — collecting it, cleaning it, modelling it, and then explaining what it means to the person who has to decide something."
      />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        {/* Narrative */}
        <div className="space-y-5">
          {aboutParagraphs.map((paragraph, index) => (
            <Reveal key={index} delay={index * 0.08}>
              <p
                className={cn(
                  "text-pretty leading-relaxed",
                  index === 0 ? "text-lg text-navy-800" : "text-base text-mist-400",
                )}
              >
                {paragraph}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.26}>
            <div className="mt-8 rounded-2xl border border-signal-200 bg-signal-100/60 p-5">
              <p className="label-mono mb-2">Availability</p>
              <p className="text-pretty text-sm leading-relaxed text-navy-700">
                {profile.availability}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Focus areas — publish to the 3D network behind the section */}
        <div>
          <Reveal>
            <p className="label-mono mb-5">Focus Areas</p>
          </Reveal>

          <RevealGroup className="flex flex-col gap-2.5" stagger={0.06}>
            {focusAreas.map((area, index) => {
              const isActive = active === area.id;
              return (
                <RevealItem key={area.id}>
                  <button
                    type="button"
                    onMouseEnter={() => highlight(area.id)}
                    onMouseLeave={() => highlight(null)}
                    onFocus={() => highlight(area.id)}
                    onBlur={() => highlight(null)}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300",
                      isActive
                        ? "border-signal-400 bg-white shadow-card"
                        : "border-ink-600 bg-white/70 hover:border-signal-300 hover:bg-white",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg font-mono text-[11px] transition-colors duration-300",
                        isActive
                          ? "bg-signal-500 text-white"
                          : "bg-ink-800 text-mist-400 group-hover:bg-signal-100 group-hover:text-signal-500",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-navy-900">
                        {area.label}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-mist-500">
                        {area.detail}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-px shrink-0 transition-all duration-500",
                        isActive ? "w-8 bg-signal-500" : "w-3 bg-ink-500",
                      )}
                    />
                  </button>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </SectionShell>
  );
}
