/** Academic journey, most recent first. */

export type Education = {
  id: string;
  institution: string;
  qualification: string;
  short: string;
  period: string;
  result: string;
  /** Rendered as a progress read-out on the 3D ascent. */
  resultValue: number;
  focus?: string;
  accent: "signal" | "iris" | "amber";
};

export const education: Education[] = [
  {
    id: "rns",
    institution: "RNS First Grade College",
    qualification: "Bachelor of Computer Applications (BCA)",
    short: "BCA",
    period: "2023 – 2026",
    result: "CGPA 9.0/10",
    resultValue: 0.9,
    focus:
      "Python, SQL databases, Data Science, AI/ML fundamentals, software engineering and computer applications.",
    accent: "signal",
  },
  {
    id: "universal",
    institution: "Universal PU College",
    qualification: "Pre-University Course (PUC)",
    short: "PUC",
    period: "2021 – 2023",
    result: "83%",
    resultValue: 0.83,
    accent: "iris",
  },
  {
    id: "nethaji",
    institution: "Nethaji Popular English School",
    qualification: "Secondary School Leaving Certificate (SSLC)",
    short: "SSLC",
    period: "2020 – 2021",
    result: "77%",
    resultValue: 0.77,
    accent: "amber",
  },
];
