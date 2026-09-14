/**
 * Skills, grouped exactly as supplied.
 *
 * `orbit` places a cluster in the 3D ecosystem (0 = innermost core, 2 = outer
 * shell) and is a presentation decision, not a proficiency claim — the brief
 * supplies no ratings, so none are implied anywhere in the UI.
 */

export type SkillAccent = "signal" | "iris" | "amber" | "violet" | "rose";

export type SkillCluster = {
  id: string;
  title: string;
  /** Short label used inside the 3D scene where space is tight. */
  abbr: string;
  /** One-line framing, written to add meaning without inventing credentials. */
  note: string;
  orbit: 0 | 1 | 2;
  accent: SkillAccent;
  skills: string[];
};

export const skillClusters: SkillCluster[] = [
  {
    id: "data-analytics",
    title: "Data Analytics",
    abbr: "Analytics",
    note: "The core practice: from messy input to a decision someone can act on.",
    orbit: 0,
    accent: "signal",
    skills: [
      "Exploratory Data Analysis",
      "Data Cleaning & Preprocessing",
      "Data Transformation",
      "Data-driven Insights",
      "Reporting & Analysis",
      "Data Visualization",
    ],
  },
  {
    id: "python-data-science",
    title: "Python & Data Science",
    abbr: "Python",
    note: "The working language for every analysis and model in this portfolio.",
    orbit: 0,
    accent: "amber",
    skills: ["Python", "NumPy", "Pandas", "Matplotlib", "Seaborn"],
  },
  {
    id: "sql-databases",
    title: "SQL & Databases",
    abbr: "SQL",
    note: "Querying relational data with confidence, not just SELECT *.",
    orbit: 0,
    accent: "iris",
    skills: [
      "MySQL",
      "PostgreSQL",
      "SQL Queries",
      "JOINs & Relationships",
      "GROUP BY & Aggregations",
      "Subqueries & Views",
      "Database Concepts",
    ],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    abbr: "ML",
    note: "Supervised modelling end to end: features, training, honest evaluation.",
    orbit: 0,
    accent: "violet",
    skills: [
      "Machine Learning",
      "Supervised Learning",
      "Classification",
      "Regression",
      "Scikit-learn",
      "Model Evaluation",
      "XGBoost",
    ],
  },
  {
    id: "business-intelligence",
    title: "Business Intelligence",
    abbr: "BI",
    note: "Dashboards built for the person who has to make the call.",
    orbit: 1,
    accent: "violet",
    skills: [
      "Power BI",
      "Interactive Dashboards",
      "KPI Development",
      "Data Modeling",
      "DAX",
      "Power Query",
      "Tableau",
    ],
  },
  {
    id: "excel",
    title: "Microsoft Excel",
    abbr: "Excel",
    note: "Where most business data actually lives — used properly.",
    orbit: 1,
    accent: "signal",
    skills: [
      "Advanced Excel",
      "Formulas & Functions",
      "VLOOKUP",
      "HLOOKUP",
      "XLOOKUP",
      "Pivot Tables",
      "Power Query",
      "Power Pivot",
      "Dashboard Development",
    ],
  },
  {
    id: "ai-llm-rag",
    title: "AI / LLM / RAG",
    abbr: "RAG",
    note: "Retrieval systems that ground a model in real documents.",
    orbit: 1,
    accent: "violet",
    skills: [
      "Artificial Intelligence",
      "Large Language Models",
      "Retrieval-Augmented Generation",
      "Vector Embeddings",
      "Text Chunking",
      "Prompt Engineering",
      "AI Pipeline Design",
    ],
  },
  {
    id: "deep-learning",
    title: "Deep Learning & Automation",
    abbr: "DL",
    note: "Networks, plus the automation that removes the repetitive work.",
    orbit: 1,
    accent: "rose",
    skills: [
      "Neural Networks",
      "Deep Learning Fundamentals",
      "TensorFlow",
      "Keras",
      "AI Workflows",
      "AI-assisted Development",
    ],
  },
  {
    id: "statistics",
    title: "Statistics & Mathematics",
    abbr: "Stats",
    note: "The reasoning underneath the model — and the reason to trust it.",
    orbit: 2,
    accent: "amber",
    skills: [
      "Probability",
      "Probability Distributions",
      "Linear Algebra",
      "Correlation & Covariance",
      "Normal Distribution",
      "Hypothesis Testing",
      "Confidence Intervals",
      "Central Limit Theorem",
    ],
  },
  {
    id: "data-collection",
    title: "Data Collection",
    abbr: "Scrape",
    note: "Getting the data in the first place, then parsing it cleanly.",
    orbit: 2,
    accent: "signal",
    skills: [
      "Web Data Collection",
      "HTML",
      "Requests",
      "Beautiful Soup",
      "HTML Parsing",
      "Data Extraction",
    ],
  },
  {
    id: "development-web",
    title: "Development & Web",
    abbr: "Web",
    note: "Shipping the result as something people can actually open.",
    orbit: 2,
    accent: "iris",
    skills: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "Flask",
      "REST APIs",
      "Chart.js",
      "Dashboard Development",
    ],
  },
  {
    id: "tools",
    title: "Tools",
    abbr: "Tools",
    note: "The daily environment everything above is built in.",
    orbit: 2,
    accent: "amber",
    skills: [
      "Git",
      "GitHub",
      "VS Code",
      "Jupyter Notebook",
      "Google Colab",
      "Anaconda / Conda",
      "PyCharm",
    ],
  },
  {
    id: "professional-strengths",
    title: "Professional Strengths",
    abbr: "Strengths",
    note: "How the work gets communicated, documented and delivered.",
    orbit: 2,
    accent: "violet",
    skills: [
      "Verbal & Written English",
      "Analytical Thinking",
      "Problem Solving",
      "Team Collaboration",
      "Adaptability",
      "Technical Documentation",
      "Technical Training",
    ],
  },
];

/** Skill totals used by the stats strip above the ecosystem. */
export const skillTotals = {
  clusters: skillClusters.length,
  skills: skillClusters.reduce((sum, cluster) => sum + cluster.skills.length, 0),
};

export const ACCENT_HEX: Record<SkillAccent, string> = {
  signal: "#2f6fdb",
  iris: "#5a61e0",
  amber: "#d97706",
  violet: "#1e3a6e",
  rose: "#dc2626",
};
