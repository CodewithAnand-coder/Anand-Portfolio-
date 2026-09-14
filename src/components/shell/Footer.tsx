import { ArrowDownIcon, LinkedInIcon, GitHubIcon, YouTubeIcon, MailIcon } from "@/components/ui/Icons";
import { profile, socials } from "@/data/profile";

const ICONS = {
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  youtube: YouTubeIcon,
} as const;

/**
 * Quiet sign-off on a navy band. The page content is done; the footer is for
 * people who scrolled to the bottom looking for a way to make contact.
 */
export function Footer() {
  return (
    <footer className="relative z-10 border-t border-ink-600 bg-navy-900 px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm">
          <p className="font-display text-lg font-bold tracking-tight text-white">
            {profile.name}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-navy-300">{profile.roleLine}</p>
          <a
            href={`mailto:${profile.email}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-signal-300 transition-colors hover:text-white"
          >
            <MailIcon className="h-4 w-4" />
            {profile.email}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-14">
          <nav aria-label="Elsewhere">
            <h2 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-navy-400">
              Elsewhere
            </h2>
            <ul className="flex flex-col gap-3">
              {socials.map((social) => {
                const Icon = ICONS[social.key];
                return (
                  <li key={social.key}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 text-sm font-medium text-navy-200 transition-colors hover:text-white"
                    >
                      <Icon className="h-4 w-4 text-navy-400 transition-colors group-hover:text-signal-300" />
                      {social.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-navy-400">
              Based in
            </h2>
            <p className="text-sm leading-relaxed text-navy-200">{profile.location}</p>
            <p className="mt-2 text-sm leading-relaxed text-navy-400">
              {profile.languages[0].name} — {profile.languages[0].level}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h2 className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-navy-400">
              Status
            </h2>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-navy-200">
              <span
                aria-hidden="true"
                className="relative mt-1.5 block h-2 w-2 shrink-0 rounded-full bg-signal-400"
              >
                <span className="absolute inset-0 rounded-full bg-signal-400 opacity-60 motion-safe:animate-ping" />
              </span>
              {profile.availability}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex w-full max-w-6xl flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-navy-400">
          © {new Date().getFullYear()} {profile.name}. All rights reserved.
        </p>
        <a
          href="#main"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-300 transition-colors hover:text-white"
        >
          <ArrowDownIcon className="h-3.5 w-3.5 rotate-180" />
          Back to top
        </a>
      </div>
    </footer>
  );
}
