"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { profile } from "@/data/profile";
import { scrollToStation, useActiveStation, useEntered } from "@/lib/experience-store";
import { useScrollLock } from "@/lib/hooks";
import { NAV_SECTIONS, stationToNav } from "@/lib/stations";
import { cn } from "@/lib/utils";

/* ============================================================================
   NAVIGATION
   A clean floating bar — white pill with a quiet shadow — that stays out of the
   way while the 3D world runs behind the page. Active link gets the blue fill.
   ========================================================================= */

export function Nav() {
  const activeStation = useActiveStation();
  const activeNav = stationToNav(activeStation);
  const entered = useEntered();
  const reduced = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  useScrollLock(menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    // Let the overlay begin closing before the scroll starts, so the scroll
    // animation is not competing with an exit animation for the main thread.
    window.setTimeout(() => scrollToStation(id), 40);
  };

  return (
    <>
      <motion.header
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: -18 }}
        animate={entered || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -18 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="fixed inset-x-0 top-0 z-[140] px-4 pt-4 sm:px-6 sm:pt-5"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Brand */}
          <button
            type="button"
            onClick={() => go("home")}
            className="glass-panel group flex items-center gap-3 rounded-full py-2 pl-2.5 pr-4 transition-all duration-300 hover:border-signal-300 hover:shadow-card-hover"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-full bg-signal-500 font-mono text-[10.5px] font-semibold tracking-wide text-white"
            >
              {profile.initials}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[13px] font-semibold text-navy-900">{profile.name}</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-mist-500">
                Data · AI · Analytics
              </span>
            </span>
          </button>

          {/* Desktop links */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="glass-panel flex items-center gap-0.5 rounded-full p-1.5 shadow-card">
              {NAV_SECTIONS.map((section) => {
                const isActive = section.id === activeNav;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => go(section.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "relative rounded-full px-3 py-2 text-[12.5px] font-medium transition-colors duration-200",
                        isActive ? "text-white" : "text-mist-400 hover:text-navy-900",
                      )}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="nav-active"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-full bg-signal-500"
                        />
                      ) : null}
                      <span className="relative z-10">{section.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            className="glass-panel rounded-full p-3 text-navy-800 shadow-card transition-colors hover:text-signal-500 lg:hidden"
          >
            <MenuIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </motion.header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.28 }}
            className="fixed inset-0 z-[190] bg-white/97 backdrop-blur-xl lg:hidden"
          >
            <div className="flex h-full flex-col px-6 pb-10 pt-6">
              <div className="flex items-center justify-between">
                <span className="label-mono">Navigate</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation"
                  className="rounded-full border border-ink-600 bg-white p-3 text-navy-800 shadow-card transition-colors hover:text-signal-500"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              <nav aria-label="Mobile" className="mt-10 flex-1">
                <ul className="flex flex-col gap-1">
                  {NAV_SECTIONS.map((section, index) => {
                    const isActive = section.id === activeNav;
                    return (
                      <motion.li
                        key={section.id}
                        initial={reduced ? { opacity: 0 } : { opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: reduced ? 0 : 0.04 * index, duration: 0.4 }}
                      >
                        <button
                          type="button"
                          onClick={() => go(section.id)}
                          aria-current={isActive ? "true" : undefined}
                          className={cn(
                            "flex w-full items-baseline gap-4 border-b border-ink-600 py-4 text-left",
                            isActive ? "text-signal-500" : "text-navy-800",
                          )}
                        >
                          <span className="font-mono text-[11px] text-mist-500">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="text-2xl font-semibold tracking-tight">
                            {section.label}
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-mist-500">
                {profile.location}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
