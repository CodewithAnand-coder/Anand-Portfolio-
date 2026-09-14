import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import Script from "next/script"; // Upgraded import
import { ExperienceProvider } from "@/components/providers/ExperienceProvider";
import { profile } from "@/data/profile";
import "./globals.css";



/* ---------------------------------------------------------------------------
   Typography
   Sora for display (geometric, technical without being cold),
   Inter for body (unbeatable at small sizes on dark backgrounds),
   JetBrains Mono for the technical labels that tie the interface to the data theme.
------------------------------------------------------------------------ */
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

/* ---------------------------------------------------------------------------
   Metadata
------------------------------------------------------------------------ */
const title = `${profile.name} — Data Science, Analytics & AI/ML Engineer`;
const description =
  "Portfolio of R N Anand: BCA graduate (CGPA 9.0/10) working across Data Science, Data Analytics and AI/ML Engineering — Python, SQL, Power BI, machine learning and RAG systems.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s — ${profile.name}`,
  },
  description,
  applicationName: "R N Anand — Portfolio",
  authors: [{ name: profile.name }],
  creator: profile.name,
  keywords: [
    "R N Anand",
    "Data Science",
    "Data Analyst",
    "AI ML Engineer",
    "Machine Learning",
    "Power BI",
    "Python",
    "SQL",
    "RAG",
    "Data Analytics",
    "Technical Training",
    "Ramanagara",
    "Karnataka",
  ],
  category: "technology",
  openGraph: {
    type: "website",
    title,
    description,
    siteName: `${profile.name} — Portfolio`,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: { telephone: true, email: true, address: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/* ---------------------------------------------------------------------------
   Structured data — helps recruiters' tooling and search engines read 
   the professional identity without scraping the WebGL scene.
------------------------------------------------------------------------ */
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  email: `mailto:${profile.email}`,
  telephone: profile.phone,
  jobTitle: "Data Science • Data Analyst • AI & ML Engineer • Workflow Trainer",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Ramanagara",
    addressRegion: "Karnataka",
    addressCountry: "IN",
  },
  knowsLanguage: ["English"],
  sameAs: [profile.links.linkedin, profile.links.github, profile.links.youtube],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "RNS First Grade College",
  },
  knowsAbout: [
    "Data Science",
    "Data Analytics",
    "Machine Learning",
    "Artificial Intelligence",
    "Retrieval-Augmented Generation",
    "Python",
    "SQL",
    "Power BI",
    "Microsoft Excel",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="relative min-h-screen bg-white antialiased">
        {/* Skip link — the 3D world is decorative, the content is not. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-signal-500 focus:px-5 focus:py-2.5 focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        
        <ExperienceProvider>{children}</ExperienceProvider>

        {/* Upgraded Next.js Script Component for structured data */}
        <Script
          id="structured-data-person"
          type="application/ld+json"
          strategy="beforeInteractive" // Loads early so search crawlers catch it immediately
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
