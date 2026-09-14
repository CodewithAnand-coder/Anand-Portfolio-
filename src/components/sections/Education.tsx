"use client";

import { ArrowUpRightIcon, CapIcon } from "@/components/ui/Icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { education } from "@/data/education";

/* ============================================================================
   EDUCATION
   Three stages, newest first, each with its result drawn as an arc rather than
   only written as text. The arcs are scaled to the real figures — 90%, 83%, 77%
   — so the progression is legible at a glance while the exact number stays
   available for anyone who wants it.
   ========================================================================= */

function ResultArc({ value, label }: { value: number; label: string }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(1, value)) * circumference;

  return (
    <div className="relative grid h-[72px] w-[72px] shrink-0 place-items-center">
      <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-ink-600"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="text-signal-500"
        />
      </svg>
      <span className="relative text-center">
        <span className="block text-[15px] font-semibold leading-none text-navy-900">{label}</span>
      </span>
    </div>
  );
}

export function Education() {
  return (
    <SectionShell id="education" labelledBy="education-title" tinted>
      <SectionHeading
        id="education-title"
        eyebrow="Academic Background"
        title="Education"
        lead="Three stages, the most recent first — a BCA with a 9.0 CGPA, preceded by PUC and SSLC."
      />

      <RevealGroup className="grid gap-5 md:grid-cols-3" stagger={0.1}>
        {education.map((entry) => {
          const reading = entry.result.includes("/")
            ? entry.result.split("/")[0].replace("CGPA ", "")
            : entry.result.replace("%", "");

          return (
            <RevealItem key={entry.id}>
              <article className="glass-panel flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal-100 text-signal-500">
                    <CapIcon className="h-4.5 w-4.5" />
                  </span>
                  <ResultArc value={entry.resultValue} label={reading} />
                </div>

                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                  {entry.period}
                </p>

                <h3 className="mt-2 text-base font-semibold leading-snug text-navy-900">
                  {entry.institution}
                </h3>

                <p className="mt-1.5 text-[13.5px] leading-snug text-mist-400">
                  {entry.qualification}
                </p>

                <p className="mt-4 font-mono text-[11.5px] font-medium tracking-wide text-signal-500">
                  {entry.result}
                </p>

                {entry.focus ? (
                  <p className="mt-4 border-t border-ink-600 pt-4 text-[13px] leading-relaxed text-mist-500">
                    {entry.focus}
                  </p>
                ) : null}

                {entry.id === "rns" ? (
                  <div className="mt-4 border-t border-ink-600 pt-3">
                    <a
                      href="/graduation-certificate.jpeg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-signal-500 transition-colors hover:text-signal-600"
                    >
                      <span>Graduation Ceremony Photo</span>
                      <ArrowUpRightIcon className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
              </article>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </SectionShell>
  );
}
