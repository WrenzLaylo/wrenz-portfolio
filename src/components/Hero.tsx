import Image from "next/image";
import { fullProjects } from "@/content/projects";
import { site } from "@/content/site";
import type { FullSlug } from "@/content/types";
import { cssVars, type Place, place } from "@/scenes/grid";
import { Layer } from "@/scenes/Stage";
import { HeroHeading } from "./HeroHeading";
import { HillEdge } from "./HillEdge";
import { Icon } from "./Icon";
import { Mascot } from "./Mascot";

type Cast = { place: Place; vars: Record<`--${string}`, string>; desktopOnly?: boolean };

// Placement and motion values from the slice (index.html lines 75-97). --bd bob period, --bdl bob start
// offset after the entrance, --by/--br bob lift and tilt, --dox/--doy/--or desktop scroll-out,
// --mox/--moy mobile scroll-out, --tilt the resting tilt. The slice's keycap slot holds the Agent Island bot.
const CAST: Record<FullSlug, Cast> = {
  pos: {
    place: { x: 58, y: 466, w: 140, mx: 6, my: 204, mw: 86 },
    vars: { "--bd": "1.5s", "--bdl": "0.7s", "--by": "-10px", "--br": "4deg", "--dox": "-120px", "--doy": "220px", "--or": "-12deg", "--mox": "-50px", "--moy": "130px", "--tilt": "-4deg" },
  },
  "time-log": {
    place: { x: 0, y: 40, w: 130, mx: 0, my: 14, mw: 78 },
    vars: { "--bd": "1.7s", "--bdl": "0.4s", "--by": "-9px", "--br": "-3deg", "--dox": "-160px", "--doy": "60px", "--or": "-12deg", "--mox": "-40px", "--moy": "80px", "--tilt": "-6deg" },
  },
  "service-areas": {
    place: { x: -8, y: 282, w: 112 },
    vars: { "--bd": "1.9s", "--bdl": "1.1s", "--by": "-7px", "--br": "3deg", "--dox": "-200px", "--doy": "160px", "--or": "-12deg", "--tilt": "5deg" },
    desktopOnly: true,
  },
  katiwala: {
    place: { x: 508, y: 286, w: 92 },
    vars: { "--bd": "1.6s", "--bdl": "0.2s", "--by": "-9px", "--br": "3deg", "--dox": "210px", "--doy": "160px", "--or": "12deg", "--tilt": "-5deg" },
    desktopOnly: true,
  },
  stockroom: {
    place: { x: 452, y: 474, w: 122, mx: 276, my: 200, mw: 76 },
    vars: { "--bd": "1.75s", "--bdl": "0.9s", "--by": "-7px", "--br": "-3deg", "--dox": "140px", "--doy": "220px", "--or": "12deg", "--mox": "50px", "--moy": "130px", "--tilt": "4deg" },
  },
  "agent-island": {
    place: { x: 478, y: 56, w: 110, mx: 286, my: 22, mw: 66 },
    vars: { "--bd": "1.8s", "--bdl": "1.4s", "--by": "-8px", "--br": "-4deg", "--dox": "170px", "--doy": "70px", "--or": "12deg", "--mox": "40px", "--moy": "80px", "--tilt": "6deg" },
  },
};

/** The hero stage: yolk blob, portrait arch and one mascot per world. Its grid switches with the
 *  viewport at 767 px (spec clarification 2), so it has its own container, not `.stage-c`. */
export function HeroStage() {
  return (
    <div className="hero-stage-c">
      <div className="hero-stage" data-scene="hero" data-tier="hero" style={cssVars({ "--dw": 620, "--dh": 620, "--mdw": 358, "--mdh": 300 })}>
        <Layer depth="bg">
          <svg className="hero-blob pos" style={place({ x: 40, y: 46, w: 540, mx: 44, my: 18, mw: 270 })} viewBox="0 0 540 520">
            <path
              fill="#FFC72C"
              d="M282 18C380 14 470 70 506 160C540 246 528 344 470 418C410 494 300 520 206 500C110 480 36 414 16 318C-4 222 34 120 112 64C162 30 222 20 282 18Z"
            />
            <circle cx="60" cy="40" r="12" fill="#FF9EC4" />
            <path className="g-d" d="M486 34l22 34h-44z" fill="#4F86F7" />
            <path d="M500 480q12-14 24 0t24 0" fill="none" stroke="#20B2A0" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </Layer>
        <Layer depth="mid" decorative={false}>
          <div className="pos p-scroll" style={place({ x: 160, y: 126, w: 300, mx: 96, my: 52, mw: 166 })}>
            <div className="p-pop">
              <div className="portrait">
                <Image
                  src={site.portrait.src}
                  alt={site.portrait.alt}
                  width={site.portrait.width}
                  height={site.portrait.height}
                  sizes="(min-width: 768px) 300px, 47vw"
                  fetchPriority="high"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </Layer>
        <Layer depth="fg">
          {fullProjects.map((project, index) => {
            const cast = CAST[project.slug];
            return (
              <div
                key={project.slug}
                className={cast.desktopOnly ? "m pos g-d" : "m pos"}
                style={place(cast.place, { ...cast.vars, "--mi": index })}
              >
                <div className="m-pop">
                  <div className="bob loop">
                    <Mascot slug={project.slug} />
                  </div>
                </div>
              </div>
            );
          })}
        </Layer>
      </div>
    </div>
  );
}

/** The hero "cast" (spec §7). Nothing waits for JavaScript: the entrance is CSS, the H1 and the portrait
 *  enter with transform only, and there is no preload class. */
export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-h">
      <div className="wrap hero-grid">
        <div className="hero-copy">
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
        <HeroStage />
      </div>
      <HillEdge fill="var(--color-tint-pos)" variant={0} />
    </section>
  );
}
