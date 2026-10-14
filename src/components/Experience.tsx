import { experience } from "@/content/experience";
import { sections } from "@/content/sections";

/** Vertical timeline. The line draws as the section scrolls (CSS scroll-driven scaleY, transform only). */
export function Experience() {
  const { id, heading } = sections.experience;
  return (
    <section id={id} className="section experience" aria-labelledby={`${id}-h`}>
      <div className="wrap">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
        <div className="timeline">
          <span className="timeline-line" aria-hidden="true" />
          <ol className="tl-list">
            {experience.map((entry) => (
              <li key={`${entry.org}-${entry.role}`} className="tl-item">
                <p className="tl-period">{entry.period}</p>
                <h3 className="tl-role">{entry.role}</h3>
                <p className="tl-org">{entry.org}</p>
                <p className="tl-detail">{entry.detail}</p>
                <p className="tl-body">{entry.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
