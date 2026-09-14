"use client";

import { motion, useReducedMotion } from "framer-motion";

import { ArrowDownIcon, ArrowRightIcon, MailIcon } from "@/components/ui/Icons";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ProfilePhoto } from "@/components/ui/ProfilePhoto";
import { profile } from "@/data/profile";
import { scrollToStation, useEntered } from "@/lib/experience-store";

/* ============================================================================
   HERO
   Light, premium, business-first. The professional identity lands in one
   glance: name, the four roles, a short positioning line, the real location and
   achievements, and two clear CTAs. The photo (or its monogram fallback) anchors
   the right column like a company "about the founder" panel.
   ========================================================================= */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const entered = useEntered();
  const reduced = useReducedMotion();
  const show = entered || reduced;

  const rise = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 24 },
    animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    transition: { duration: reduced ? 0.3 : 0.8, delay: reduced ? 0 : delay, ease: EASE },
  });

  return (
    <section
      id="home"
      data-station="home"
      aria-labelledby="hero-title"
      className="relative z-10 flex min-h-[100svh] items-center px-5 pb-20 pt-28 sm:px-8 lg:px-12"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
        {/* ---- Copy ---- */}
        <div>
          <motion.p {...rise(0.05)}>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-ink-600 bg-white px-4 py-2 shadow-card">
              <span aria-hidden="true" className="relative block h-2 w-2 rounded-full bg-signal-500">
                <span className="absolute inset-0 rounded-full bg-signal-500 opacity-60 motion-safe:animate-ping" />
              </span>
              <span className="text-[12.5px] font-medium text-navy-700">{profile.badge}</span>
            </span>
          </motion.p>

          <motion.h1
            id="hero-title"
            {...rise(0.12)}
            className="mt-6 text-[2.5rem] font-bold leading-[1.05] tracking-[-0.03em] text-navy-900 sm:text-6xl lg:text-[4.1rem]"
          >
            R N Anand
          </motion.h1>

          <motion.p
            {...rise(0.2)}
            className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[15px] font-medium text-signal-500 sm:text-base"
          >
            {profile.roles.map((role, index) => (
              <span key={role} className="flex items-center gap-2.5">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-mist-500">
                    •
                  </span>
                ) : null}
                {role}
              </span>
            ))}
          </motion.p>

          <motion.p
            {...rise(0.28)}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-mist-400 sm:text-lg"
          >
            {profile.intro}
          </motion.p>

          {/* Grounding facts */}
          <motion.dl
            {...rise(0.36)}
            className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-lg border border-ink-600 bg-white text-signal-500 shadow-card"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true" focusable="false">
                  <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
              </span>
              <dt className="sr-only">Location</dt>
              <dd className="text-[13.5px] text-mist-400">{profile.location}</dd>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-lg border border-ink-600 bg-white text-signal-500 shadow-card"
              >
                <MailIcon className="h-4 w-4" />
              </span>
              <dt className="sr-only">Email</dt>
              <dd>
                <a
                  href={`mailto:${profile.email}`}
                  className="text-[13.5px] text-mist-400 transition-colors hover:text-signal-500"
                >
                  {profile.email}
                </a>
              </dd>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-lg border border-ink-600 bg-white text-signal-500 shadow-card"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true" focusable="false">
                  <circle cx="12" cy="9.5" r="5.5" />
                  <path d="m8.5 14.5-1.4 6 4.9-2.6 4.9 2.6-1.4-6" />
                </svg>
              </span>
              <dt className="sr-only">Achievement</dt>
              <dd className="text-[13.5px] text-mist-400">CGPA 9.0/10 — BCA Graduate</dd>
            </div>
          </motion.dl>

          {/* CTAs */}
          <motion.div {...rise(0.44)} className="mt-9 flex flex-wrap items-center gap-3.5">
            <MagneticButton
              onClick={() => scrollToStation("projects")}
              icon={<ArrowRightIcon className="h-4 w-4" />}
            >
              View My Work
            </MagneticButton>
            <MagneticButton
              onClick={() => scrollToStation("contact")}
              variant="secondary"
            >
              Let&rsquo;s Work Together
            </MagneticButton>
          </motion.div>
        </div>

        {/* ---- Photo panel ---- */}
        <motion.div {...rise(0.3)} className="mx-auto w-full max-w-[340px] lg:max-w-none">
          <div className="relative">
            {/* Decorative navy arc, echoing the rounded-card language */}
            <div
              aria-hidden="true"
              className="absolute -left-5 -top-5 h-full w-full rounded-[2rem] border border-signal-200"
            />
            <ProfilePhoto />
            {/* Availability chip */}
            <p className="glass-panel relative z-10 mx-4 -mt-6 rounded-2xl px-4 py-3 text-center text-[12.5px] font-medium leading-snug text-navy-700">
              {profile.availability}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Scroll affordance */}
      <motion.button
        type="button"
        onClick={() => scrollToStation("about")}
        initial={{ opacity: 0 }}
        animate={show ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: reduced ? 0 : 1.1 }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 lg:flex"
        aria-label="Scroll to About"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mist-500">
          Scroll
        </span>
        <span aria-hidden="true" className="relative block h-12 w-px overflow-hidden bg-ink-600">
          <motion.span
            className="absolute inset-x-0 top-0 block h-5 bg-signal-500"
            animate={reduced ? undefined : { y: [-20, 48] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
        <ArrowDownIcon className="h-3.5 w-3.5 text-mist-500" />
      </motion.button>
    </section>
  );
}
