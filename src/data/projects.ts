/**
 * Featured projects.
 *
 * NOTE ON LINKS: the brief asked to reuse the GitHub URL from an existing
 * portfolio, but no per-repository URL was supplied. Rather than fabricate
 * repository slugs, each project links to the GitHub profile where the work
 * lives — nothing here points at a URL that has not been verified to exist.
 */

export type ProjectScene =
  | "churn"
  | "fraud"
  | "dashboard"
  | "rag"
  | "interview";

export type Project = {
  id: string;
  index: number;
  title: string;
  short: string;
  category: string;
  description: string;
  capabilities: string[];
  technologies: string[];
  scene: ProjectScene;
  accent: "signal" | "iris" | "amber" | "violet" | "rose";
  github: string;
  /** Copy used by the 3D scene caption. */
  sceneCaption: string;
};

const GITHUB = "https://github.com/CodewithAnand-coder";

export const projects: Project[] = [
  {
    id: "customer-churn",
    index: 0,
    title: "Customer Churn Prediction",
    short: "Churn",
    category: "Machine Learning",
    description:
      "Developed an end-to-end customer churn prediction solution using the IBM Telco Customer Churn dataset to identify customers at risk of leaving a service.",
    capabilities: [
      "End-to-end customer churn prediction",
      "XGBoost-based machine learning",
      "SHAP-based explainable AI",
      "Interactive Streamlit application",
      "Data-driven customer retention support",
    ],
    technologies: ["Python", "Scikit-learn", "XGBoost", "SHAP", "Streamlit"],
    scene: "churn",
    accent: "signal",
    github: GITHUB,
    sceneCaption: "Risk scoring across a live customer graph",
  },
  {
    id: "fraud-detection",
    index: 1,
    title: "Credit Card Fraud Detection System",
    short: "Fraud",
    category: "Data Analysis & ML",
    description:
      "Developed a data analysis and machine learning solution for identifying potentially fraudulent credit card transactions.",
    capabilities: [
      "Transaction data cleaning",
      "Data preprocessing",
      "Exploratory Data Analysis",
      "Pattern and anomaly identification",
      "Machine learning classification",
      "Data-driven fraud detection",
    ],
    technologies: ["Python", "SQL", "Pandas", "NumPy", "Scikit-learn"],
    scene: "fraud",
    accent: "rose",
    github: GITHUB,
    sceneCaption: "Separating legitimate flow from anomaly",
  },
  {
    id: "clipkart-dashboard",
    index: 2,
    title: "Power BI Dashboard — ClipKart Sales Data",
    short: "Dashboard",
    category: "Business Intelligence",
    description:
      "Designed an interactive business dashboard to analyze sales, profit, customer and overall business performance.",
    capabilities: [
      "Data cleaning",
      "Data transformation",
      "Data modeling",
      "KPI development",
      "Interactive charts",
      "Sales trend analysis",
      "Customer trend analysis",
      "Business performance reporting",
    ],
    technologies: ["Power BI", "Power Query", "Excel"],
    scene: "dashboard",
    accent: "amber",
    github: GITHUB,
    sceneCaption: "KPIs, trends and drill-down in one view",
  },
  {
    id: "youtube-rag",
    index: 3,
    title: "AI-Powered YouTube Playlist RAG Assistant",
    short: "RAG",
    category: "AI Engineering",
    description:
      "Developed an AI-powered Retrieval-Augmented Generation solution to help users quickly find relevant videos from a large educational YouTube playlist.",
    capabilities: [
      "Natural-language video search",
      "Video information processing",
      "Video indexing",
      "Retrieval-Augmented Generation",
      "AI semantic retrieval",
      "Relevant video identification",
    ],
    technologies: ["Python", "RAG", "LLMs", "Embeddings", "AI Integration"],
    scene: "rag",
    accent: "violet",
    github: GITHUB,
    sceneCaption: "Query → embeddings → retrieval → answer",
  },
  {
    id: "interviewready-ai",
    index: 4,
    title: "InterviewReady AI",
    short: "InterviewReady",
    category: "Full Stack & AI",
    description:
      "A full-stack platform designed for AI-powered interview preparation and practical job-readiness support.",
    capabilities: [
      "Interview practice with or without AI assistance",
      "Resume analysis",
      "ATS scoring",
      "Keyword matching",
      "Per-question feedback",
      "Strengths and weaknesses analysis",
      "Improved answer suggestions",
    ],
    technologies: ["Full Stack", "AI", "ATS", "Interview Preparation"],
    scene: "interview",
    accent: "iris",
    github: GITHUB,
    sceneCaption: "Practice, score, improve",
  },
];
