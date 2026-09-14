import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { stats } from "@/data/profile";

/**
 * Statistics band. Deliberately has no `data-station` of its own — it sits in the
 * scroll distance between the About and Services stations, so the camera keeps
 * drifting while the numbers count up.
 */
export function Stats() {
  return (
    <section
      aria-label="Portfolio statistics"
      className="relative z-10 px-5 py-4 sm:px-8 lg:px-12"
    >
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <dl className="grid grid-cols-2 gap-y-8 rounded-panel bg-navy-900 px-6 py-9 shadow-panel sm:px-10 lg:grid-cols-4 lg:gap-y-0">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1.5 lg:border-l lg:border-white/10 lg:px-8 lg:first:border-l-0 lg:first:pl-0"
              >
                <dd className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <Counter
                    value={stat.value}
                    decimals={stat.decimals}
                    suffix={stat.suffix}
                    duration={1.6 + index * 0.15}
                  />
                </dd>
                <dt className="text-[13px] font-medium text-signal-300">{stat.label}</dt>
                <p className="text-[11px] uppercase tracking-[0.12em] text-navy-300">
                  {stat.hint}
                </p>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
