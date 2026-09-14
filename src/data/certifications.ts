/**
 * Certifications and awards.
 *
 * Issuing organisations and dates were not supplied, so they are deliberately
 * absent. The viewer presents the credential by name and offers the original
 * document on request rather than displaying details we cannot verify.
 */

export type Certification = {
  id: string;
  title: string;
  /** "certification" for completed courses, "award" for recognition. */
  kind: "certification" | "award";
  /** Short framing of what the credential covers. */
  summary: string;
  /** Highlighted strands rendered on the certificate plaque. */
  strands: string[];
  accent: "signal" | "iris" | "amber" | "violet" | "rose";
  /** Seal / serial motif drawn on the 3D plaque. */
  seal: string;
};

export const certifications: Certification[] = [
  {
    id: "data-science",
    title: "Data Science Certificate",
    kind: "certification",
    summary:
      "Structured training across the data science workflow — from Python and statistics through to modelling and communication of results.",
    strands: ["Python", "Statistics", "Modelling", "Analysis"],
    accent: "signal",
    seal: "DS",
  },
  {
    id: "data-analytics-ai",
    title: "Data Analytics with AI",
    kind: "certification",
    summary:
      "Applied analytics paired with AI tooling: cleaning, transforming and interrogating data with AI-assisted workflows.",
    strands: ["Analytics", "AI Tooling", "Visualisation"],
    accent: "violet",
    seal: "AI",
  },
  {
    id: "corporate-readiness",
    title: "Corporate Readiness",
    kind: "certification",
    summary:
      "Professional workplace preparation covering communication, documentation and the expectations of a business environment.",
    strands: ["Communication", "Documentation", "Workplace"],
    accent: "iris",
    seal: "CR",
  },
  {
    id: "aptitude",
    title: "Aptitude, LR & Verbal Ability",
    kind: "certification",
    summary:
      "Quantitative aptitude, logical reasoning and verbal ability — the reasoning foundations behind structured problem solving.",
    strands: ["Aptitude", "Logical Reasoning", "Verbal"],
    accent: "amber",
    seal: "AR",
  },
  {
    id: "elite-performer",
    title: "Elite Performer Award",
    kind: "award",
    summary: "Recognition of consistent performance across the programme of study.",
    strands: ["Recognition", "Consistency"],
    accent: "rose",
    seal: "EP",
  },
];
