import { Capabilities } from "@/components/Capabilities";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import { Work } from "@/components/Work";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";
import MotionRuntime from "@/motion/MotionRuntime";

/** A section Phase 4 has not built yet: its anchor and heading only (removed in Task 4.3). */
function ShellSection({ id, heading }: { id: string; heading: string }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-h`}>
      <div className="wrap">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
      </div>
    </section>
  );
}

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
        <ShellSection id={sections.moreWork.id} heading={sections.moreWork.heading} />
        <Capabilities />
        <Experience />
        <ShellSection id={sections.about.id} heading={sections.about.heading} />
        <ShellSection id={sections.contact.id} heading={sections.contact.heading} />
      </main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
