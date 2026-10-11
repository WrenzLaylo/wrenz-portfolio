import { site } from "@/content/site";

// One H1 holding name, role and slogan (spec §7, SEO P1). The yolk mark under "Reliable" is decorative.
export function HeroHeading() {
  const { lineOne, lineTwo, highlight } = site.slogan;
  const rest = lineTwo.slice(highlight.length);
  return (
    <h1 id="hero-h">
      <span className="h1-name">
        {site.name}, {site.role}
      </span>{" "}
      <span className="h1-slogan">
        <span className="line">{lineOne}</span>{" "}
        <span className="line">
          <span className="hl">
            <span className="mark" aria-hidden="true" />
            {highlight}
          </span>
          {rest}
        </span>
      </span>
    </h1>
  );
}
