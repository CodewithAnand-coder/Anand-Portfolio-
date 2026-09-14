import { About } from "@/components/sections/About";
import { Certificates } from "@/components/sections/Certificates";
import { Contact } from "@/components/sections/Contact";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";
import { Skills } from "@/components/sections/Skills";
import { Stats } from "@/components/sections/Stats";
import { YouTube } from "@/components/sections/YouTube";
import { Footer } from "@/components/shell/Footer";
import { Nav } from "@/components/shell/Nav";
import { Preloader } from "@/components/shell/Preloader";
import { ScrollProgress } from "@/components/shell/ScrollProgress";
import { PageBackdrop } from "@/components/shell/PageBackdrop";
import { WorldStage } from "@/components/world/WorldStage";

/**
 * One page, one corridor.
 *
 * The order of these sections is not cosmetic: it matches the depth order in
 * `lib/stations.ts`, and the camera rig interpolates between each section's
 * position in the document and its fixed depth along -Z. Adding or reordering a
 * section means updating that table too, or the camera will overshoot.
 *
 * `Stats` is intentionally the only section without a `data-station` — it lives
 * in the scroll distance between two stations rather than being one.
 */
export default function HomePage() {
  return (
    <>
      <Preloader />
      <ScrollProgress />
      <Nav />
      <PageBackdrop />
      <WorldStage />

      <main id="main" className="relative z-10">
        <Hero />
        <About />
        <Stats />
        <Services />
        <Experience />
        <Education />
        <Skills />
        <Projects />
        <Certificates />
        <YouTube />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
