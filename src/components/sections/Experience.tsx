"use client";

import { BriefcaseIcon, CheckIcon } from "@/components/ui/Icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { experience } from "@/data/experience";

/* ============================================================================
   EXPERIENCE
   A clean vertical timeline with one card per internship. Each entry leads with
   the outcome (description) before the detail (responsibilities), because the
   first thing a reviewer needs is what the role actually was.
   ========================================================================= */

export function Experience() {
  return (
    <SectionShell id="experience" labelledBy="experience-title">
      <SectionHeading
        id="experience-title"
        eyebrow="Where I've Worked"
        title="Experience & Internships"
        lead="Two internships, both hands-on: application modules and databases on one side, backend integration and API work on the other."
      />

      <div className="relative">
        {/* The rail */}
        <div
          aria-hidden="true"
          className="absolute left-[15px] top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-signal-400 via-signal-200 to-transparent sm:block"
        />

        <RevealGroup className="flex flex-col gap-6" stagger={0.12}>
          {experience.map((entry) => (
            <RevealItem key={entry.id}>
              <div className="relative sm:pl-14">
                {/* Node */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-7 hidden h-8 w-8 place-items-center rounded-full border border-signal-200 bg-white shadow-card sm:grid"
                >
                  <span className="block h-2.5 w-2.5 rounded-full bg-signal-500" />
                </span>

                <article className="glass-panel overflow-hidden rounded-2xl transition-shadow duration-300 hover:shadow-card-hover">
                  <div className="p-6 sm:p-8">
                    <header className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-100 text-signal-500">
                          <BriefcaseIcon className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-navy-900 sm:text-xl">
                            {entry.role}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-signal-500">
                            {entry.company}
                          </p>
                        </div>
                      </div>

                      <p className="rounded-full border border-ink-600 bg-ink-850 px-3.5 py-1.5 text-[12px] font-medium text-mist-400">
                        {entry.duration}
                      </p>
                    </header>

                    <p className="mt-5 max-w-3xl text-pretty leading-relaxed text-mist-300">
                      {entry.description}
                    </p>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
                      <div>
                        <h4 className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-700">
                          Responsibilities
                        </h4>
                        <ul className="flex flex-col gap-2.5">
                          {entry.responsibilities.map((item) => (
                            <li key={item} className="flex items-start gap-3">
                              <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-signal-500" />
                              <span className="text-[14px] leading-relaxed text-mist-400">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-700">
                          Worked with
                        </h4>
                        <ul className="flex flex-wrap gap-1.5">
                          {entry.stack.map((technology) => (
                            <li
                              key={technology}
                              className="rounded-full border border-ink-600 bg-ink-850 px-2.5 py-1 text-[11px] font-medium text-mist-400"
                            >
                              {technology}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      <Reveal delay={0.2}>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-mist-500">
          Full detail, including academic record and certifications, is on the{" "}
          <a
            href="/resume"
            className="font-medium text-signal-500 underline decoration-signal-300 underline-offset-4 transition-colors hover:text-signal-600"
          >
            resume page
          </a>
          .
        </p>
      </Reveal>
    </SectionShell>
  );
}
