"use client";

import { useState, type FormEvent } from "react";

import {
  ArrowUpRightIcon,
  CheckIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  SendIcon,
  YouTubeIcon,
} from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SectionShell } from "@/components/ui/SectionShell";
import { profile, socials } from "@/data/profile";
import { contactSubjects } from "@/data/youtube";
import { cn } from "@/lib/utils";

/* ============================================================================
   CONTACT
   There is no backend here, and pretending otherwise would be dishonest — a
   form that says "message sent!" while doing nothing is worse than no form.

   So the form validates properly, then hands off to the visitor's own mail
   client with the subject and body pre-composed. The success state says exactly
   that, and the direct email address stays visible for anyone who would rather
   just write.
   ========================================================================= */

const SOCIAL_ICONS = {
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  youtube: YouTubeIcon,
} as const;

type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(contactSubjects[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [handedOff, setHandedOff] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const next: Errors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Please enter a valid email address.";
    if (message.trim().length < 10) next.message = "Please add a little more detail.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      "",
      message.trim(),
    ].join("\n");

    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    setHandedOff(true);
  };

  return (
    <SectionShell id="contact" labelledBy="contact-title" tinted>
      <SectionHeading
        id="contact-title"
        eyebrow="Get in Touch"
        title="Let's Work Together"
        lead={profile.availability}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        {/* Details */}
        <Reveal>
          <div className="flex h-full flex-col gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="glass-panel group flex items-center gap-4 rounded-2xl p-5 transition-all duration-300 hover:border-signal-300 hover:shadow-card-hover"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-100 text-signal-500">
                <MailIcon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                  Email
                </span>
                <span className="mt-0.5 block truncate text-[14.5px] font-medium text-navy-900">
                  {profile.email}
                </span>
              </span>
              <ArrowUpRightIcon className="ml-auto h-4 w-4 shrink-0 text-mist-500 transition-colors group-hover:text-signal-500" />
            </a>

            <a
              href={`tel:${profile.phoneHref}`}
              className="glass-panel group flex items-center gap-4 rounded-2xl p-5 transition-all duration-300 hover:border-signal-300 hover:shadow-card-hover"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-100 text-signal-500">
                <PhoneIcon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                  Phone
                </span>
                <span className="mt-0.5 block text-[14.5px] font-medium text-navy-900">
                  {profile.phone}
                </span>
              </span>
              <ArrowUpRightIcon className="ml-auto h-4 w-4 shrink-0 text-mist-500 transition-colors group-hover:text-signal-500" />
            </a>

            <div className="glass-panel flex items-center gap-4 rounded-2xl p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-100 text-signal-500">
                <PinIcon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                  Location
                </span>
                <span className="mt-0.5 block text-[14.5px] font-medium text-navy-900">
                  {profile.location}
                </span>
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.key];
                return (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-full border border-ink-600 bg-white px-4 py-2.5 text-[13px] font-medium text-navy-700 shadow-card transition-all duration-300 hover:border-signal-400 hover:text-signal-500"
                  >
                    <Icon className="h-4 w-4 text-mist-500" />
                    {social.label}
                  </a>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Form */}
        <Reveal delay={0.1}>
          <form
            onSubmit={onSubmit}
            noValidate
            className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-signal-500 to-signal-300"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" htmlFor="contact-name" error={errors.name}>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  placeholder="Your name"
                  className={inputClass(Boolean(errors.name))}
                />
              </Field>

              <Field label="Email" htmlFor="contact-email" error={errors.email}>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  placeholder="you@company.com"
                  className={inputClass(Boolean(errors.email))}
                />
              </Field>
            </div>

            {/* Subject */}
            <fieldset className="mt-6">
              <legend className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                Subject
              </legend>
              <div className="flex flex-wrap gap-2">
                {contactSubjects.map((option) => {
                  const isActive = subject === option;
                  return (
                    <label
                      key={option}
                      className={cn(
                        "cursor-pointer rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors duration-200",
                        isActive
                          ? "border-signal-500 bg-signal-500 text-white"
                          : "border-ink-600 bg-white text-mist-400 hover:border-signal-300 hover:text-signal-500",
                      )}
                    >
                      <input
                        type="radio"
                        name="subject"
                        value={option}
                        checked={isActive}
                        onChange={() => setSubject(option)}
                        className="sr-only"
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6">
              <Field label="Message" htmlFor="contact-message" error={errors.message}>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  aria-invalid={errors.message ? true : undefined}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  placeholder="Tell me about the role, project or training you have in mind."
                  className={cn(inputClass(Boolean(errors.message)), "resize-y")}
                />
              </Field>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                className="group inline-flex items-center gap-2.5 rounded-full bg-signal-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-signal-600 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal-400"
              >
                Send message
                <SendIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              <p className="text-[12.5px] leading-snug text-mist-500">
                Opens your email client with the message ready to send.
              </p>
            </div>

            {/* Handoff confirmation */}
            <div aria-live="polite">
              {handedOff ? (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-signal-300 bg-signal-100/70 p-4">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" />
                  <p className="text-[13.5px] leading-relaxed text-navy-700">
                    Your email client should now be open with the message composed. If nothing
                    happened, write directly to{" "}
                    <a
                      href={`mailto:${profile.email}`}
                      className="font-medium text-signal-500 underline decoration-signal-300 underline-offset-4"
                    >
                      {profile.email}
                    </a>
                    .
                  </p>
                </div>
              ) : null}
            </div>
          </form>
        </Reveal>
      </div>
    </SectionShell>
  );
}

/* --------------------------------------------------------------------------- */

function inputClass(hasError: boolean) {
  return cn(
    "w-full rounded-xl border bg-white px-4 py-3 text-[14.5px] text-navy-900",
    "placeholder:text-mist-600 transition-colors duration-200",
    "focus:outline-none focus:ring-1 focus:ring-signal-400",
    hasError
      ? "border-rose-alert/60 focus:border-rose-alert"
      : "border-ink-500 focus:border-signal-400",
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mist-500"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-2 text-[12.5px] leading-snug text-rose-alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
