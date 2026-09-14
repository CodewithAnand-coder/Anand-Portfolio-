/**
 * Identity, contact and hero copy.
 * Source of truth: the supplied brief. Nothing here is invented — fields that
 * were not provided are omitted rather than filled with plausible-sounding
 * fabrications.
 */

export const profile = {
  name: "R N Anand",
  shortName: "Anand",
  initials: "RNA",
  location: "Ramanagara, Karnataka, India",
  email: "rnanand258@gmail.com",
  phone: "+91 8088816520",
  /** tel: needs the raw digits. */
  phoneHref: "+918088816520",

  headline: "Hello, I'm R N Anand",

  /** Primary professional identity, in the order given. */
  roles: ["Data Science", "Data Analyst", "AI & ML Engineer", "Workflow Trainer"],
  roleLine: "Data Science • Data Analyst • AI & ML Engineer • Workflow Trainer",

  intro:
    "BCA graduate with hands-on experience in Python, SQL, Power BI, Excel, Data Analytics, Machine Learning and RAG Systems. Skilled in transforming data into actionable insights and building practical AI-powered solutions.",

  badge: "BCA Graduate • CGPA 9.0/10",

  availability:
    "Open for Data Science, Data Analytics, AI/ML Engineering and Technical Training opportunities.",

  languages: [{ name: "English", level: "Fluent — Verbal & Written" }],

  links: {
    linkedin: "https://www.linkedin.com/in/rnanand/",
    github: "https://github.com/CodewithAnand-coder",
    youtube: "https://youtube.com/@codewithanand365",
  },
} as const;

export type SocialKey = keyof typeof profile.links;

/** Ordered social links with presentation metadata. */
export const socials: { key: SocialKey; label: string; handle: string; href: string }[] = [
  {
    key: "linkedin",
    label: "LinkedIn",
    handle: "/in/rnanand",
    href: profile.links.linkedin,
  },
  {
    key: "github",
    label: "GitHub",
    handle: "@CodewithAnand-coder",
    href: profile.links.github,
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@codewithanand365",
    href: profile.links.youtube,
  },
];

/** The three "Who I Am" paragraphs, verbatim from the brief. */
export const aboutParagraphs = [
  "BCA graduate with a strong academic record (CGPA 9.0/10) and hands-on experience in Python, SQL, Microsoft Excel, Power BI, data analysis, reporting and technical projects.",
  "Strong verbal and written English communication skills with practical experience in internships, technical content creation, documentation, teamwork, problem solving and client-oriented communication.",
  "Interested in opportunities where I can contribute to business operations, data handling, client support, documentation and analytical activities.",
] as const;

/** Focus areas rendered as an interconnected network in the 3D scene. */
export const focusAreas = [
  {
    id: "data-analytics",
    label: "Data Analytics",
    detail: "Turning raw tables into decisions.",
  },
  {
    id: "ai-workflows",
    label: "AI Workflows",
    detail: "Practical pipelines, not demos.",
  },
  {
    id: "machine-learning",
    label: "Machine Learning",
    detail: "Models that answer a real question.",
  },
  {
    id: "technical-training",
    label: "Technical Training",
    detail: "Teaching the tool and the thinking.",
  },
  {
    id: "continuous-learning",
    label: "Continuous Learning",
    detail: "Shipping something new every week.",
  },
] as const;

/** Animated counters. Values are exactly as supplied. */
export const stats = [
  { value: 9.0, decimals: 1, suffix: "/10", label: "BCA CGPA", hint: "RNS First Grade College" },
  { value: 4, decimals: 0, suffix: "+", label: "Featured Projects", hint: "End-to-end builds" },
  { value: 4, decimals: 0, suffix: "+", label: "Certifications", hint: "Data, AI, readiness" },
  { value: 365, decimals: 0, suffix: "", label: "Code with Anand", hint: "Days of teaching" },
] as const;
