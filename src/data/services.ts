/**
 * Services — what R N Anand does, offered as six concrete capabilities.
 *
 * Nothing here is invented: every service is grounded in the skills, projects
 * and channel topics that already exist in this portfolio. The `comesWith`
 * bullets restate real capability, not client history.
 */

export type Service = {
  id: string;
  title: string;
  /** One-line promise shown on the card. */
  summary: string;
  /** What working together looks like — restated from real skills. */
  comesWith: string[];
  /** Tools named on the card, straight from the existing skill list. */
  tools: string[];
  /** Which existing skills cluster backs this service. */
  cluster: string;
};

export const services: Service[] = [
  {
    id: "data-analytics",
    title: "Data Analytics",
    summary: "From raw exports to a defensible insight someone can act on.",
    comesWith: [
      "Exploratory data analysis and cleaning",
      "Data transformation and reporting",
      "Data-driven insights with documentation",
    ],
    tools: ["Python", "SQL", "Pandas", "Excel"],
    cluster: "data-analytics",
  },
  {
    id: "power-bi",
    title: "Power BI",
    summary: "Interactive dashboards built for the person making the call.",
    comesWith: [
      "Data modelling and Power Query pipelines",
      "KPI development and interactive charts",
      "Sales, profit and customer trend reporting",
    ],
    tools: ["Power BI", "DAX", "Power Query", "Excel"],
    cluster: "business-intelligence",
  },
  {
    id: "ai-ml",
    title: "AI / ML Engineering",
    summary: "Supervised models end to end — features, training, honest evaluation.",
    comesWith: [
      "Classification and regression modelling",
      "Explainable outputs with XGBoost + SHAP",
      "Deployment as a usable application",
    ],
    tools: ["Python", "Scikit-learn", "XGBoost", "SHAP"],
    cluster: "machine-learning",
  },
  {
    id: "ai-workflow-automation",
    title: "AI Workflow Automation",
    summary: "Retrieval systems and AI-assisted pipelines that remove repetitive work.",
    comesWith: [
      "RAG pipelines over real documents",
      "LLM integration and prompt engineering",
      "AI-assisted development workflows",
    ],
    tools: ["Python", "LLMs", "Embeddings", "RAG"],
    cluster: "ai-llm-rag",
  },
  {
    id: "technical-training",
    title: "Technical Training",
    summary: "Teaching the tool and the thinking — beginner-friendly, job-oriented.",
    comesWith: [
      "Structured, practical curriculum",
      "Excel, analytics and AI workflow instruction",
      "Industry-oriented examples and documentation",
    ],
    tools: ["Excel", "Power BI", "Python", "AI Workflows"],
    cluster: "professional-strengths",
  },
  {
    id: "web-tech-solutions",
    title: "Web / Technology Solutions",
    summary: "Shipping the result as something people can actually open.",
    comesWith: [
      "Data collection and HTML parsing",
      "Flask apps, REST APIs and Chart.js dashboards",
      "Git/GitHub-based project delivery",
    ],
    tools: ["HTML5", "CSS3", "Flask", "REST APIs"],
    cluster: "development-web",
  },
] as const;
