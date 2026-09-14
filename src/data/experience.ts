/** Internships, in reverse-chronological order. */

export type Experience = {
  id: string;
  company: string;
  role: string;
  duration: string;
  /** ISO-ish sort key derived from the stated duration. */
  start: string;
  current?: boolean;
  description: string;
  responsibilities: string[];
  /** Technologies implied by the stated work. */
  stack: string[];
  /** Points rendered in the 3D node cluster for this entry. */
  scene: {
    accent: "signal" | "iris" | "amber" | "violet";
    satellites: string[];
  };
};

export const experience: Experience[] = [
  {
    id: "techcentrix",
    company: "TechCentrix",
    role: "Python AI Intern",
    duration: "Nov 2025 – Dec 2025",
    start: "2025-11",
    description:
      "Developed application modules using Python and SQL and worked with data-handling workflows for project requirements.",
    responsibilities: [
      "Worked with databases and supported data management activities.",
      "Collaborated during development, debugging, testing, troubleshooting and application integration.",
      "Assisted in identifying application issues and implementing solutions.",
      "Gained experience in documentation, problem solving, teamwork and project delivery.",
    ],
    stack: ["Python", "SQL", "Databases", "AI", "Debugging"],
    scene: {
      accent: "signal",
      satellites: ["Python", "SQL", "Database", "AI"],
    },
  },
  {
    id: "saiket",
    company: "Saiket Systems",
    role: "Web Developer Intern",
    duration: "Aug 2025 – Sep 2025",
    start: "2025-08",
    description:
      "Worked on application development and backend database integration using APIs and relational database concepts.",
    responsibilities: [
      "Assisted with application functionality, debugging, testing and issue resolution.",
      "Collaborated with team members to understand requirements and implement assigned features.",
      "Gained experience in requirement analysis, testing and professional project workflows.",
    ],
    stack: ["APIs", "Relational Databases", "REST", "Testing", "Requirement Analysis"],
    scene: {
      accent: "iris",
      satellites: ["API", "RDBMS", "Web", "Testing"],
    },
  },
];
