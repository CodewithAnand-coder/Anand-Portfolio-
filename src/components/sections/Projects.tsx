"use client";

import { ArrowUpRightIcon, CheckIcon, GitHubIcon } from "@/components/ui/Icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { projects, type Project } from "@/data/projects";

/* ============================================================================
   PROJECTS
   The strongest section by design, because it is the one a recruiter actually
   evaluates. Each project is its own full-width feature band AND its own station
   in the corridor — the data-station anchor gives the camera a distinct scroll
   centre per project, which a shared grid row could not.

   Alternating alignment keeps the long scroll from feeling repetitive while the
   card language stays identical band to band.
   ========================================================================= */

export function Projects() {
  return (
    <SectionShell id="projects" labelledBy="projects-title" bleed={false}>
      <SectionHeading
        id="projects-title"
        eyebrow="Selected Work"
        title="Projects"
        lead="Five end-to-end builds. Each one starts with a real dataset and ends with something a person can open, read and act on."
      />

      <RevealGroup className="flex flex-col gap-8 lg:gap-12" stagger={0.05}>
        {projects.map((project, index) => (
          <RevealItem key={project.id}>
            <ProjectBand project={project} flip={index % 2 === 1} />
          </RevealItem>
        ))}
      </RevealGroup>
    </SectionShell>
  );
}

function ProjectBand({ project, flip }: { project: Project; flip: boolean }) {
  return (
    <article
      id={project.id}
      data-station={`project-${project.index}`}
      aria-labelledby={`${project.id}-title`}
      className="group glass-panel grid overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-card-hover lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
    >
      {/* ---- Content ---- */}
      <div className={`flex flex-col p-6 sm:p-8 ${flip ? "lg:order-2" : ""}`}>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="font-display text-3xl font-bold leading-none text-signal-200"
          >
            {String(project.index + 1).padStart(2, "0")}
          </span>
          <span className="rounded-full border border-signal-200 bg-signal-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-signal-500">
            {project.category}
          </span>
        </div>

        <h3
          id={`${project.id}-title`}
          className="mt-4 text-balance text-xl font-semibold leading-snug text-navy-900 sm:text-2xl"
        >
          {project.title}
        </h3>

        <p className="mt-3 text-pretty text-[14px] leading-relaxed text-mist-400">
          {project.description}
        </p>

        <div className="mt-5">
          <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-700">
            What it does
          </h4>
          <ul className="grid gap-2 sm:grid-cols-2">
            {project.capabilities.slice(0, 4).map((capability) => (
              <li key={capability} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-500" />
                <span className="text-[12.5px] leading-relaxed text-mist-400">{capability}</span>
              </li>
            ))}
          </ul>
          {project.capabilities.length > 4 ? (
            <p className="mt-2 text-[12px] text-mist-500">
              + {project.capabilities.length - 4} more capabilities in the repository.
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((technology) => (
              <span
                key={technology}
                className="rounded-full border border-ink-600 bg-ink-850 px-3 py-1.5 text-[11.5px] font-medium text-navy-700"
              >
                {technology}
              </span>
            ))}
          </div>

          <div className="mt-5 border-t border-ink-600 pt-4">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-signal-500 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal-400"
            >
              <GitHubIcon className="h-4 w-4" />
              View on GitHub
              <ArrowUpRightIcon className="h-3.5 w-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* ---- Visual panel ---- */}
      <div
        className={`relative flex min-h-[220px] items-center justify-center overflow-hidden border-t border-ink-600 bg-gradient-to-br from-signal-100/80 via-ink-850 to-white p-8 lg:min-h-0 lg:border-t-0 ${
          flip ? "lg:order-1 lg:border-r" : "lg:border-l"
        }`}
      >
        <div
          aria-hidden="true"
          className="grid-veil absolute inset-0 opacity-50"
          style={{
            maskImage: "radial-gradient(70% 70% at 50% 50%, black, transparent 85%)",
            WebkitMaskImage: "radial-gradient(70% 70% at 50% 50%, black, transparent 85%)",
          }}
        />
        <span
          aria-hidden="true"
          className="relative font-display text-[5.5rem] font-bold leading-none text-signal-200/90 sm:text-[7rem]"
        >
          {String(project.index + 1).padStart(2, "0")}
        </span>
        <p className="absolute bottom-4 left-0 right-0 px-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500">
          {project.sceneCaption}
        </p>
      </div>
    </article>
  );
}
