"use client";

import { useState } from "react";

import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { skillClusters, skillTotals } from "@/data/skills";
import { setDiscrete } from "@/lib/experience-store";
import { cn } from "@/lib/utils";

/* ============================================================================
   SKILLS
   The interactive browser over the real skill clusters. Picking a cluster still
   highlights that exact hub in the 3D ecosystem behind this panel — the same
   `hoveredObject` channel the rest of the site uses — so browsing the document
   and exploring the scene remain the same action.
   ========================================================================= */

export function Skills() {
  const [activeId, setActiveId] = useState(skillClusters[0].id);
  const active = skillClusters.find((cluster) => cluster.id === activeId) ?? skillClusters[0];

  const highlight = (id: string | null) => {
    setDiscrete({ hoveredObject: id ? `skill:${id}` : null });
  };

  return (
    <SectionShell id="skills" labelledBy="skills-title">
      <SectionHeading
        id="skills-title"
        eyebrow="Capabilities"
        title="Skills & Toolset"
        lead={`${skillTotals.skills} skills across ${skillTotals.clusters} clusters, from raw data collection through to deployed AI systems. Choose a cluster to light it up in the constellation behind this panel.`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10">
        {/* Cluster selector */}
        <Reveal>
          <div
            role="tablist"
            aria-label="Skill clusters"
            aria-orientation="vertical"
            className="flex flex-col gap-1"
          >
            {skillClusters.map((cluster) => {
              const isActive = cluster.id === activeId;
              return (
                <button
                  key={cluster.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls="skill-panel"
                  id={`skill-tab-${cluster.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveId(cluster.id)}
                  onMouseEnter={() => highlight(cluster.id)}
                  onMouseLeave={() => highlight(null)}
                  onFocus={() => highlight(cluster.id)}
                  onBlur={() => highlight(null)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                    isActive
                      ? "border-signal-400 bg-white shadow-card"
                      : "border-transparent hover:border-ink-600 hover:bg-white",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-6 w-0.5 shrink-0 rounded-full transition-all duration-300",
                      isActive ? "bg-signal-500" : "bg-transparent",
                    )}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[14px] transition-colors",
                      isActive ? "font-semibold text-navy-900" : "text-mist-400 group-hover:text-navy-700",
                    )}
                  >
                    {cluster.title}
                  </span>
                  <span className="shrink-0 rounded-full bg-ink-800 px-2 py-0.5 font-mono text-[10px] text-mist-500">
                    {cluster.skills.length}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Active cluster panel */}
        <Reveal delay={0.1}>
          <div
            id="skill-panel"
            role="tabpanel"
            aria-labelledby={`skill-tab-${active.id}`}
            className="glass-panel relative h-full overflow-hidden rounded-2xl p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className="label-mono">
                  Cluster {String(skillClusters.indexOf(active) + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-navy-900 sm:text-2xl">
                  {active.title}
                </h3>
              </div>
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-mist-500">
                {active.skills.length} skills
              </p>
            </div>

            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-mist-400">
              {active.note}
            </p>

            <RevealGroup className="mt-7 flex flex-wrap gap-2" stagger={0.03}>
              {active.skills.map((skill) => (
                <RevealItem key={skill} y={12}>
                  <span className="inline-block rounded-full border border-signal-200 bg-signal-100/70 px-3.5 py-2 text-[13px] font-medium text-navy-700 transition-colors duration-200 hover:border-signal-400 hover:bg-signal-100">
                    {skill}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>

            {/* Compact cross-reference to the other clusters */}
            <div className="mt-8 border-t border-ink-600 pt-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-700">
                Other clusters
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {skillClusters
                  .filter((cluster) => cluster.id !== active.id)
                  .map((cluster) => (
                    <li key={cluster.id}>
                      <button
                        type="button"
                        onClick={() => setActiveId(cluster.id)}
                        onMouseEnter={() => highlight(cluster.id)}
                        onMouseLeave={() => highlight(null)}
                        className="text-[12.5px] text-mist-500 underline decoration-ink-500 underline-offset-4 transition-colors hover:text-signal-500"
                      >
                        {cluster.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}
