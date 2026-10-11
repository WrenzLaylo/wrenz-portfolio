import { site } from "@/content/site";
import type { Varied } from "@/content/types";
import { Rich } from "@/lib/rich";

/** The one block per world that keeps the worlds from reading as a template (spec §8). */
export function VariedBlock({ varied }: { varied: Varied }) {
  switch (varied.kind) {
    case "stat":
      return (
        <p className="varied varied-stat">
          <strong className="stat-value">{varied.value}</strong> <span className="stat-label">{varied.label}</span>
        </p>
      );
    case "flow":
      return (
        <ol className="varied varied-flow">
          {varied.steps.map((step) => (
            <li key={step}>
              <Rich text={step} />
            </li>
          ))}
        </ol>
      );
    case "beforeAfter":
      return (
        <dl className="varied varied-ba">
          <div>
            <dt>{site.labels.before}</dt>
            <dd>
              <Rich text={varied.before} />
            </dd>
          </div>
          <div>
            <dt>{site.labels.after}</dt>
            <dd>
              <Rich text={varied.after} />
            </dd>
          </div>
        </dl>
      );
    case "promise":
      return (
        <p className="varied varied-promise">
          <Rich text={varied.text} />
        </p>
      );
    case "quote":
      return (
        <figure className="varied varied-quote">
          <blockquote>
            <p>
              <Rich text={varied.text} />
            </p>
          </blockquote>
          <figcaption>
            {varied.name}, {varied.role}
          </figcaption>
        </figure>
      );
  }
}
