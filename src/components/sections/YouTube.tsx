"use client";

import { ArrowUpRightIcon, CheckIcon, PlayIcon } from "@/components/ui/Icons";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { teachingApproach, youtube, youtubeTopics } from "@/data/youtube";

/* ============================================================================
   YOUTUBE — "Code with Anand 365"
   Personal brand, and the strongest evidence of the training half of the
   professional identity. The panel leads with what is taught and how.
   ========================================================================= */

export function YouTube() {
  return (
    <SectionShell id="youtube" labelledBy="youtube-title">
      <SectionHeading
        id="youtube-title"
        eyebrow="Teaching & Content"
        title={
          <>
            Code with Anand <span className="text-signal-gradient">365</span>
          </>
        }
        lead={youtube.description}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        {/* Channel card */}
        <Reveal>
          <div className="glass-panel relative flex h-full flex-col overflow-hidden rounded-2xl p-7 sm:p-8">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-signal-500 via-signal-400 to-signal-200"
            />

            <div className="flex items-center gap-4">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-rose-alert/10 text-rose-alert"
                aria-hidden="true"
              >
                <PlayIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-base font-semibold text-navy-900">{youtube.channel}</p>
                <p className="mt-0.5 text-[12.5px] font-medium text-mist-500">{youtube.handle}</p>
              </div>
            </div>

            <div className="mt-7 flex items-baseline gap-3 border-t border-ink-600 pt-6">
              <span className="font-display text-5xl font-bold tracking-tight text-navy-900">
                {youtube.metric.value}
              </span>
              <span className="pb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-mist-500">
                {youtube.metric.label}
              </span>
            </div>

            <div className="mt-7">
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-700">
                Teaching approach
              </h3>
              <ul className="flex flex-col gap-2.5">
                {teachingApproach.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-signal-500" />
                    <span className="text-[13.5px] leading-relaxed text-mist-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-8">
              <MagneticButton
                href={youtube.url}
                external
                icon={<ArrowUpRightIcon className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                {youtube.cta}
              </MagneticButton>
            </div>
          </div>
        </Reveal>

        {/* Topics */}
        <div>
          <Reveal>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-700">
              Topics covered
            </p>
          </Reveal>

          <RevealGroup className="grid gap-2.5 sm:grid-cols-2" stagger={0.05}>
            {youtubeTopics.map((topic) => (
              <RevealItem key={topic.id} y={16}>
                <div className="group flex h-full items-start gap-3.5 rounded-2xl border border-ink-600 bg-white p-4 transition-all duration-300 hover:border-signal-300 hover:shadow-card">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-signal-400 transition-colors duration-300 group-hover:bg-signal-500"
                  />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-navy-900">
                      {topic.label}
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-snug text-mist-500">
                      {topic.note}
                    </span>
                  </span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </SectionShell>
  );
}
