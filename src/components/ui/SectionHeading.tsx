import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  id,
  align = "left",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Ties `aria-labelledby` on the parent section to the visible heading. */
  id: string;
  align?: "left" | "center";
  children?: ReactNode;
}) {
  return (
    <header className={cn("mb-12 lg:mb-14", align === "center" && "mx-auto max-w-3xl text-center")}>
      <Reveal>
        <p className="label-mono mb-3 flex items-center gap-3">
          <span aria-hidden="true" className="inline-block h-px w-8 bg-signal-500/70" />
          {eyebrow}
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <h2
          id={id}
          className="text-balance text-3xl font-bold leading-[1.1] text-navy-900 sm:text-4xl lg:text-[2.75rem]"
        >
          {title}
        </h2>
      </Reveal>

      {lead ? (
        <Reveal delay={0.12}>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-mist-400 sm:text-lg">
            {lead}
          </p>
        </Reveal>
      ) : null}

      {children ? <Reveal delay={0.18}>{children}</Reveal> : null}
    </header>
  );
}
