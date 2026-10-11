import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import type { FullProject } from "@/content/types";
import { type Grid, place } from "../grid";
import { Layer, Stage } from "../Stage";

const SPLIT: Grid = { dw: 820, dh: 620, mdw: 358, mdh: 340 };
const BLEED: Grid = { dw: 1280, dh: 720, mdw: 358, mdh: 400 };

/** Interim world scene (spec clarification 15): clouds, the screenshot if there is one, and the mascot. */
export function BasicWorld({ project }: { project: FullProject }) {
  const { shot } = project;
  const bleed = project.layout === "bleed";
  const at = bleed
    ? {
        cloudA: place({ x: 640, y: 80, w: 200, mx: 24, my: 20, mw: 70 }),
        cloudB: place({ x: 1040, y: 60, w: 150 }),
        device: place({ x: 640, y: 110, w: 560, mx: 24, my: 40, mw: 310 }),
        mascotWithShot: place({ x: 1060, y: 470, w: 180, mx: 262, my: 290, mw: 84 }),
        mascotAlone: place({ x: 820, y: 220, w: 280, mx: 104, my: 110, mw: 150 }),
      }
    : {
        cloudA: place({ x: 60, y: 56, w: 150, mx: 24, my: 20, mw: 70 }),
        cloudB: place({ x: 610, y: 40, w: 110 }),
        device: place({ x: 150, y: 70, w: 520, mx: 24, my: 28, mw: 310 }),
        mascotWithShot: place({ x: 620, y: 400, w: 170, mx: 262, my: 238, mw: 84 }),
        mascotAlone: place({ x: 300, y: 180, w: 220, mx: 104, my: 80, mw: 150 }),
      };
  return (
    <Stage slug={project.slug} tier="full" grid={bleed ? BLEED : SPLIT} label={shot ? undefined : project.illustrationLabel} className="basic">
      <Layer depth="bg">
        <svg className="pos cloud loop" style={at.cloudA} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="pos cloud loop g-d" style={at.cloudB} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={at.device}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 560px, 90vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        <div className="pos" data-part="mascot" style={shot ? at.mascotWithShot : at.mascotAlone}>
          <div className="bob loop">
            <Mascot slug={project.slug} />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
