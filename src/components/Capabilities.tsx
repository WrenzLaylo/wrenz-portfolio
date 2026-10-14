import { capabilities, stack } from "@/content/capabilities";
import { sections } from "@/content/sections";
import { Icon } from "./Icon";

/** Plain paper, no scene: a breather between the worlds and the timeline (spec §10). */
export function Capabilities() {
  const { id, heading } = sections.capabilities;
  return (
    <section id={id} className="section capabilities" aria-labelledby={`${id}-h`}>
      <div className="wrap caps-grid">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
        <ul className="caps-list">
          {capabilities.map((c) => (
            <li key={c.name} className="cap">
              <span className="cap-icon">
                <Icon name={c.icon} />
              </span>
              <div>
                <h3 className="cap-name">{c.name}</h3>
                <p className="cap-line">{c.line}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="stack">
          {stack.map((group) => (
            <div key={group.name} className="stack-group">
              <h3 className="stack-name">{group.name}</h3>
              <ul className="pills">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
