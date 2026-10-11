import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import type { FullProject } from "@/content/types";
import { place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 820, dh: 620, mdw: 358, mdh: 340 };

/** Interim world scene (spec clarification 15): clouds, the screenshot if there is one, and the mascot. */
export function BasicWorld({ project }: { project: FullProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="full" grid={GRID} label={shot ? undefined : project.illustrationLabel} className="basic">
      <Layer depth="bg">
        <svg className="pos cloud loop" style={place({ x: 60, y: 56, w: 150, mx: 24, my: 20, mw: 70 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="pos cloud loop g-d" style={place({ x: 610, y: 40, w: 110 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={place({ x: 150, y: 70, w: 520, mx: 24, my: 28, mw: 310 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 520px, 90vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        <div
          className="pos"
          data-part="mascot"
          style={shot ? place({ x: 620, y: 400, w: 170, mx: 262, my: 238, mw: 84 }) : place({ x: 300, y: 180, w: 220, mx: 104, my: 80, mw: 150 })}
        >
          <div className="bob loop">
            <Mascot slug={project.slug} />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
