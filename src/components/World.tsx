import { site } from "@/content/site";
import type { FullProject } from "@/content/types";
import { Rich } from "@/lib/rich";
import { fullScenes } from "@/scenes";
import { cssVars } from "@/scenes/grid";
import { HillEdge } from "./HillEdge";
import { Icon } from "./Icon";
import { ProjectLinks } from "./ProjectLinks";
import { VariedBlock } from "./VariedBlock";

/** One project world (spec §8): a band on the world's tint, copy beside (or over) the stage, and a hill
 *  edge filled with `next`, the following band's colour. DOM order keeps the h3 first; CSS moves the
 *  stage above the copy when the layout stacks below 1024 px. */
export function World({ project, next, index }: { project: FullProject; next: string; index: number }) {
  const Scene = fullScenes[project.slug];
  const headingId = `${project.slug}-h`;
  return (
    <section
      className={`world world-${project.layout}`}
      data-world={project.slug}
      aria-labelledby={headingId}
      style={cssVars({ "--tint": `var(--color-tint-${project.slug})` })}
    >
      <div className={project.layout === "bleed" ? "world-grid" : "wrap world-grid"}>
        <div className="w-copy">
          <h3 id={headingId}>{project.name}</h3>
          <p className="w-summary">
            <Rich text={project.summary} />
          </p>
          <ul className="w-points">
            {project.points.map((point) => (
              <li key={point}>
                <span className="tick" aria-hidden="true">
                  <Icon name="check" />
                </span>
                <span>
                  <Rich text={point} />
                </span>
              </li>
            ))}
          </ul>
          <VariedBlock varied={project.varied} />
          <ul className="tags" aria-label={site.labels.builtWith}>
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <ProjectLinks project={project} />
        </div>
        <figure className="w-fig">
          <Scene project={project} />
          {project.caption ? <figcaption className="caption">{project.caption}</figcaption> : null}
        </figure>
      </div>
      <HillEdge fill={next} variant={(index % 3) as 0 | 1 | 2} />
    </section>
  );
}
