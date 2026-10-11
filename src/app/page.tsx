import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import MotionRuntime from "@/motion/MotionRuntime";
import { Sprite } from "@/components/Sprite";
import { Work } from "@/components/Work";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";

// Shell sections until Phase 4 replaces them.
const shellSections = [sections.moreWork, sections.capabilities, sections.experience, sections.about, sections.contact];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Work />
        {shellSections.map((s) => (
          <section key={s.id} id={s.id} className="section" aria-labelledby={`${s.id}-h`}>
            <div className="wrap">
              <h2 id={`${s.id}-h`} className="section-h">
                {s.heading}
              </h2>
            </div>
          </section>
        ))}
      </main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
