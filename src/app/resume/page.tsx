import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRightIcon, GitHubIcon, LinkedInIcon, MailIcon, PhoneIcon, PinIcon, YouTubeIcon } from "@/components/ui/Icons";
import { PrintButton } from "@/components/resume/PrintButton";
import { certifications } from "@/data/certifications";
import { education } from "@/data/education";
import { experience } from "@/data/experience";
import { profile, aboutParagraphs } from "@/data/profile";
import { projects } from "@/data/projects";
import { skillClusters } from "@/data/skills";

export const metadata: Metadata = {
  title: "Resume",
  description: `Resume of ${profile.name} — Data Science, Data Analytics, AI & ML Engineering and Workflow Training.`,
};

/**
 * A deliberately plain, fast, printable CV rendered from the same data modules
 * as the portfolio. It is the counterpart to the 3D experience: no WebGL, no
 * animation, no reveals — just the record, in a form a recruiter can read in
 * fifteen seconds or save as a PDF.
 */
export default function ResumePage() {
  return (
    <main id="main" className="resume-sheet relative z-10 mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="no-print mb-10 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-navy-9000 transition-colors hover:text-signal-500"
        >
          <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" />
          Back to portfolio
        </Link>
        <PrintButton />
      </div>

      {/* ---- Header ---- */}
      <header className="border-b border-ink-600 pb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-navy-900 sm:text-5xl">
          {profile.name}
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-signal-500">
          {profile.roleLine}
        </p>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[13.5px] text-mist-400">
          <li className="flex items-center gap-2">
            <MailIcon className="h-4 w-4 shrink-0" />
            <a href={`mailto:${profile.email}`} className="transition-colors hover:text-signal-500">
              {profile.email}
            </a>
          </li>
          <li className="flex items-center gap-2">
            <PhoneIcon className="h-4 w-4 shrink-0" />
            <a href={`tel:${profile.phoneHref}`} className="transition-colors hover:text-signal-500">
              {profile.phone}
            </a>
          </li>
          <li className="flex items-center gap-2">
            <PinIcon className="h-4 w-4 shrink-0" />
            {profile.location}
          </li>
          <li className="flex items-center gap-2">
            <LinkedInIcon className="h-4 w-4 shrink-0" />
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-signal-500"
            >
              linkedin.com/in/rnanand
            </a>
          </li>
          <li className="flex items-center gap-2">
            <GitHubIcon className="h-4 w-4 shrink-0" />
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-signal-500"
            >
              github.com/CodewithAnand-coder
            </a>
          </li>
          <li className="flex items-center gap-2">
            <YouTubeIcon className="h-4 w-4 shrink-0" />
            <a
              href={profile.links.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-signal-500"
            >
              youtube.com/@codewithanand365
            </a>
          </li>
        </ul>
      </header>

      <ResumeSection title="Profile">
        {aboutParagraphs.map((paragraph, index) => (
          <p key={index} className="mb-3 text-[14px] leading-relaxed text-mist-300 last:mb-0">
            {paragraph}
          </p>
        ))}
      </ResumeSection>

      <ResumeSection title="Education">
        <ul className="flex flex-col gap-5">
          {education.map((entry) => (
            <li key={entry.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[15px] font-semibold text-navy-900">{entry.institution}</h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy-9000">
                  {entry.period}
                </span>
              </div>
              <p className="mt-1 text-[13.5px] text-mist-400">{entry.qualification}</p>
              <p className="mt-1 font-mono text-[11.5px] text-signal-500">{entry.result}</p>
              {entry.focus ? (
                <p className="mt-2 text-[13px] leading-relaxed text-navy-9000">{entry.focus}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </ResumeSection>

      <ResumeSection title="Experience">
        <ul className="flex flex-col gap-6">
          {experience.map((entry) => (
            <li key={entry.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[15px] font-semibold text-navy-900">
                  {entry.role} — {entry.company}
                </h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy-9000">
                  {entry.duration}
                </span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-mist-400">
                {entry.description}
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                {entry.responsibilities.map((item) => (
                  <li key={item} className="text-[13px] leading-relaxed text-mist-400">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[11px] tracking-wide text-mist-600">
                {entry.stack.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </ResumeSection>

      <ResumeSection title="Projects">
        <ul className="flex flex-col gap-6">
          {projects.map((project) => (
            <li key={project.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[15px] font-semibold text-navy-900">{project.title}</h3>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-navy-9000">
                  {project.category}
                </span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-mist-400">
                {project.description}
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5">
                {project.capabilities.map((capability) => (
                  <li key={capability} className="text-[13px] leading-relaxed text-mist-400">
                    {capability}
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[11px] tracking-wide text-mist-600">
                {project.technologies.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </ResumeSection>

      <ResumeSection title="Skills">
        <dl className="flex flex-col gap-4">
          {skillClusters.map((cluster) => (
            <div key={cluster.id} className="grid gap-1 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-4">
              <dt className="text-[13px] font-medium text-mist-200">{cluster.title}</dt>
              <dd className="text-[13px] leading-relaxed text-mist-400">
                {cluster.skills.join(", ")}
              </dd>
            </div>
          ))}
        </dl>
      </ResumeSection>

      <ResumeSection title="Certifications & Awards">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {certifications.map((certification) => (
            <li key={certification.id} className="text-[13.5px] leading-relaxed text-mist-400">
              <span className="text-mist-100">{certification.title}</span>
              <span className="text-navy-9000"> — {certification.summary}</span>
            </li>
          ))}
        </ul>
      </ResumeSection>

      <ResumeSection title="Languages">
        <ul className="flex flex-col gap-2">
          {profile.languages.map((language) => (
            <li key={language.name} className="text-[13.5px] text-mist-400">
              <span className="text-mist-100">{language.name}</span> — {language.level}
            </li>
          ))}
        </ul>
      </ResumeSection>

      <footer className="mt-14 border-t border-ink-600 pt-6">
        <p className="text-[12.5px] leading-relaxed text-navy-9000">{profile.availability}</p>
      </footer>
    </main>
  );
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t border-ink-600 pt-7 first:border-0">
      <h2 className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.22em] text-signal-500">
        {title}
      </h2>
      {children}
    </section>
  );
}
