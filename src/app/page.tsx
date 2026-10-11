import { Footer } from "@/components/Footer";
import { HeroHeading } from "@/components/HeroHeading";
import { Icon } from "@/components/Icon";
import { Nav } from "@/components/Nav";
import MotionRuntime from "@/motion/MotionRuntime";
import { Sprite } from "@/components/Sprite";
import { sections } from "@/content/sections";
import { site } from "@/content/site";

// Shell: Task 3.2 replaces the hero section, Tasks 3.x add the worlds, Phase 4 fills the other sections.
const shellSections = [sections.work, sections.moreWork, sections.capabilities, sections.experience, sections.about, sections.contact];

export default function Home() {
  return (
    <>
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <section id="top" className="hero" aria-labelledby="hero-h">
          <div className="wrap hero-copy">
            <HeroHeading />
            <p className="lede">{site.lede}</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#work">
                {site.labels.work}
                <Icon name="arrow-up-right" />
              </a>
              <a className="btn btn-secondary" href={site.resume} download>
                {site.labels.resume}
                <Icon name="download" />
              </a>
            </div>
          </div>
        </section>
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
