"use client";

import { CheckIcon } from "@/components/ui/Icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { services } from "@/data/services";

/* ============================================================================
   SERVICES — "What I Do"
   Six concrete offerings, each grounded in the skill clusters and projects that
   already exist in this portfolio. Business-card language: promise first, then
   what's included, then the tools.
   ========================================================================= */

export function Services() {
  return (
    <SectionShell id="services" labelledBy="services-title" tinted>
      <SectionHeading
        id="services-title"
        eyebrow="What I Do"
        title="Services"
        lead="Six ways I can help your team work with data, AI and technology — each one grounded in the projects and training delivered on this site."
      />

      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
        {services.map((service) => (
          <RevealItem key={service.id}>
            <article className="group glass-panel relative flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
              {/* Icon tile */}
              <span
                aria-hidden="true"
                className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-signal-100 text-signal-500 transition-colors duration-300 group-hover:bg-signal-500 group-hover:text-white"
              >
                <ServiceGlyph id={service.id} />
              </span>

              <h3 className="text-lg font-semibold text-navy-900">{service.title}</h3>
              <p className="mt-2 text-pretty text-[13.5px] leading-relaxed text-mist-400">
                {service.summary}
              </p>

              <ul className="mt-4 flex flex-col gap-2">
                {service.comesWith.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-500" />
                    <span className="text-[13px] leading-relaxed text-mist-300">{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-auto flex flex-wrap gap-1.5 pt-5">
                {service.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-ink-600 bg-ink-850 px-2.5 py-1 text-[11px] font-medium text-mist-400"
                  >
                    {tool}
                  </span>
                ))}
              </p>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal delay={0.15}>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-mist-500">
          Looking for something specific?{" "}
          <a
            href="#contact"
            className="font-medium text-signal-500 underline decoration-signal-300 underline-offset-4 transition-colors hover:text-signal-600"
          >
            Tell me about the project
          </a>{" "}
          and I&rsquo;ll tell you honestly whether I&rsquo;m the right fit.
        </p>
      </Reveal>
    </SectionShell>
  );
}

/* ---- Minimal line glyphs, one per service ------------------------------- */

function ServiceGlyph({ id }: { id: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
    "aria-hidden": true as const,
    focusable: false as const,
  };

  switch (id) {
    case "data-analytics":
      return (
        <svg {...common}>
          <path d="M4 19.5V5M4 19.5h15.5" />
          <path d="M8 15.5v-4M12.5 15.5V8M17 15.5v-6.5" />
        </svg>
      );
    case "power-bi":
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <path d="M3.5 9.5h17M9 9.5v10" />
        </svg>
      );
    case "ai-ml":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <circle cx="5" cy="6" r="1.7" />
          <circle cx="19" cy="6" r="1.7" />
          <circle cx="5" cy="18" r="1.7" />
          <circle cx="19" cy="18" r="1.7" />
          <path d="M6.3 7.1 9.6 10M17.7 7.1 14.4 10M6.3 16.9 9.6 14M17.7 16.9 14.4 14" />
        </svg>
      );
    case "ai-workflow-automation":
      return (
        <svg {...common}>
          <path d="M4 7h9M4 12h5M4 17h9" />
          <circle cx="18.5" cy="12" r="3" />
          <path d="M13 12h2.5M18.5 15v3.5" />
        </svg>
      );
    case "technical-training":
      return (
        <svg {...common}>
          <path d="m3 8.5 9-4 9 4-9 4-9-4Z" />
          <path d="M7 10.7v4c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6v-4" />
        </svg>
      );
    case "web-tech-solutions":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="13" rx="2" />
          <path d="m8.5 9-2.5 2 2.5 2M15.5 9l2.5 2-2.5 2M13 8.5l-2 5" />
          <path d="M9 21h6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      );
  }
}
