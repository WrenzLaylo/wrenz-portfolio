import { fullProjects } from "@/content/projects";
import { sections } from "@/content/sections";
import { World } from "./World";

/** The six full worlds, opened by the section heading on the POS tint (Cross-phase contracts). */
export function Work() {
  return (
    <section id={sections.work.id} className="work" aria-labelledby="work-h">
      <div className="work-head">
        <div className="wrap">
          <h2 id="work-h" className="section-h">
            {sections.work.heading}
          </h2>
        </div>
      </div>
      {fullProjects.map((project, index) => {
        const following = fullProjects[index + 1];
        return (
          <World
            key={project.slug}
            project={project}
            index={index}
            next={following ? `var(--color-tint-${following.slug})` : "var(--color-paper)"}
          />
        );
      })}
    </section>
  );
}
