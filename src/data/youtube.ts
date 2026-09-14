/** The Code with Anand 365 learning channel. */

export const youtube = {
  channel: "Code with Anand 365",
  handle: "@codewithanand365",
  url: "https://youtube.com/@codewithanand365",
  description:
    "Practical technical learning content focused on Excel, Data Analytics, AI workflows, productivity and technology.",
  cta: "Explore Code with Anand 365",
  /** Headline metric shown on the channel panel — matches the "365" branding. */
  metric: { value: "365", label: "Days of teaching" },
} as const;

export const youtubeTopics = [
  { id: "excel", label: "Microsoft Excel", note: "The tool most teams actually run on." },
  { id: "formulas", label: "Excel formulas", note: "Written to be read by a colleague." },
  { id: "pivots", label: "Pivot Tables", note: "Summarise a table without touching a formula." },
  { id: "power-query", label: "Power Query", note: "Repeatable cleaning instead of manual edits." },
  { id: "dashboards", label: "Dashboards", note: "Charts chosen to answer a question." },
  { id: "analytics", label: "Data Analytics", note: "From raw export to a defensible insight." },
  { id: "ai-workflows", label: "AI workflows", note: "Where a model genuinely saves time." },
  { id: "productivity", label: "Productivity", note: "Small habits, compounding output." },
  { id: "vs-code", label: "VS Code", note: "A setup that stops getting in the way." },
  { id: "technology", label: "Technology integration", note: "Making the tooling work together." },
] as const;

export const teachingApproach = [
  "Practical industry-oriented examples",
  "Beginner-friendly explanations",
  "Structured technical learning",
  "AI-assisted productivity workflows",
  "Job-oriented technical skills",
] as const;

/** Contact form subject options, as specified. */
export const contactSubjects = ["Job Opportunity", "Project Inquiry", "Training"] as const;
