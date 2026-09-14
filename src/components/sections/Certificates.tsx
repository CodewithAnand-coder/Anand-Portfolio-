"use client";

import { useState } from "react";

import { AwardIcon, MailIcon } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { certifications, type Certification } from "@/data/certifications";
import { profile } from "@/data/profile";
import { setDiscrete } from "@/lib/experience-store";

/* ============================================================================
   CERTIFICATES
   The same five credentials as clean credential cards. Hovering or focusing a
   card still lifts the matching plaque in the 3D gallery behind the section.
   The polished viewer on click is preserved, including keyboard reachability.
   ========================================================================= */

export function Certificates() {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected: Certification | undefined = certifications.find((item) => item.id === openId);

  const highlight = (id: string | null) => setDiscrete({ hoveredObject: id ? `cert:${id}` : null });

  return (
    <SectionShell id="certificates" labelledBy="certificates-title" tinted>
      <SectionHeading
        id="certificates-title"
        eyebrow="Credentials"
        title="Certifications & Awards"
        lead="Training that backs the toolkit — data science and analytics, AI tooling, corporate readiness and reasoning ability."
      />

      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
        {certifications.map((certification, index) => {
          const isAward = certification.kind === "award";

          return (
            <RevealItem key={certification.id}>
              <button
                type="button"
                onClick={() => setOpenId(certification.id)}
                onMouseEnter={() => highlight(certification.id)}
                onMouseLeave={() => highlight(null)}
                onFocus={() => highlight(certification.id)}
                onBlur={() => highlight(null)}
                aria-haspopup="dialog"
                className="glass-panel group relative flex h-full w-full flex-col rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-signal-300 hover:shadow-card-hover"
              >
                <span className="mb-5 flex items-center justify-between">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl bg-signal-100 text-signal-500 transition-colors duration-300 group-hover:bg-signal-500 group-hover:text-white"
                    aria-hidden="true"
                  >
                    {isAward ? <AwardIcon className="h-5 w-5" /> : <CertGlyph />}
                  </span>
                  <span className="rounded-full border border-ink-600 bg-ink-850 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-mist-500">
                    {isAward ? "Award" : "Certification"} · {String(index + 1).padStart(2, "0")}
                  </span>
                </span>

                <span className="block text-base font-semibold leading-snug text-navy-900">
                  {certification.title}
                </span>

                <span className="mt-2.5 block text-[13px] leading-relaxed text-mist-400">
                  {certification.summary}
                </span>

                <span className="mt-4 flex flex-wrap gap-1.5">
                  {certification.strands.map((strand) => (
                    <span
                      key={strand}
                      className="rounded-full border border-ink-600 bg-ink-850 px-2.5 py-1 text-[11px] font-medium text-mist-400"
                    >
                      {strand}
                    </span>
                  ))}
                </span>

                <span className="mt-auto flex items-center gap-2 pt-6 text-[12.5px] font-semibold text-signal-500">
                  View details
                  <span
                    aria-hidden="true"
                    className="h-px w-4 bg-current transition-all duration-300 group-hover:w-7"
                  />
                </span>
              </button>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <Reveal delay={0.15}>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-mist-500">
          Issuing organisations and dates are not published here. The original documents are
          available on request —{" "}
          <a
            href={`mailto:${profile.email}?subject=${encodeURIComponent("Certificate documents request")}`}
            className="font-medium text-signal-500 underline decoration-signal-300 underline-offset-4 transition-colors hover:text-signal-600"
          >
            ask for a copy
          </a>
          .
        </p>
      </Reveal>

      {/* Viewer */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setOpenId(null)}
        eyebrow={selected?.kind === "award" ? "Award of recognition" : "Certificate of completion"}
        title={selected?.title ?? ""}
      >
        {selected ? (
          <div className="flex flex-col gap-6">
            {/* A rendered credential document rather than a mock scan */}
            <div className="relative overflow-hidden rounded-2xl border border-signal-200 bg-gradient-to-br from-signal-100/70 via-white to-ink-850 p-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
                    Awarded to
                  </p>
                  <p className="mt-2 font-display text-xl font-semibold text-navy-900">
                    {profile.name}
                  </p>
                </div>
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-signal-300 bg-white font-display text-base font-semibold text-signal-500"
                  aria-hidden="true"
                >
                  {selected.seal}
                </span>
              </div>

              <div className="mt-6 h-px w-full bg-ink-600" />

              <p className="mt-6 text-pretty leading-relaxed text-mist-400">{selected.summary}</p>

              <ul className="mt-5 flex flex-wrap gap-1.5">
                {selected.strands.map((strand) => (
                  <li
                    key={strand}
                    className="rounded-full border border-signal-200 bg-white px-3 py-1.5 text-[11px] font-medium text-navy-700"
                  >
                    {strand}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${profile.email}?subject=${encodeURIComponent(`Certificate request — ${selected.title}`)}&body=${encodeURIComponent(`Hello ${profile.shortName},\n\nCould you share the original document for "${selected.title}"?\n\nThanks,`)}`}
                className="inline-flex items-center gap-2.5 rounded-full bg-signal-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-signal-600"
              >
                <MailIcon className="h-4 w-4" />
                Request the original
              </a>
              <a
                href={profile.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-ink-600 bg-white px-5 py-3 text-sm font-medium text-navy-700 transition-colors hover:border-signal-400 hover:text-signal-500"
              >
                Verify on LinkedIn
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </SectionShell>
  );
}

function CertGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M7 9h10M7 12.5h10M7 16h6" />
    </svg>
  );
}
