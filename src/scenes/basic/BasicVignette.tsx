import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import type { CompactProject } from "@/content/types";
import { place } from "../grid";
import { Layer, Stage } from "../Stage";

// One grid at every width: vignettes are always narrow, so they scale instead of switching grids.
const GRID = { dw: 400, dh: 260, mdw: 400, mdh: 260 };

/** Interim vignette scene (spec clarification 15). Phase 7 replaces each with its designed scene. */
export function BasicVignette({ project }: { project: CompactProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="compact" grid={GRID} label={shot ? undefined : project.illustrationLabel} className="basic">
      <Layer depth="bg">
        <svg className="pos cloud loop" style={place({ x: 24, y: 24, w: 90 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={place({ x: 40, y: 30, w: 300 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 560px, 90vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        <div className="pos" data-part="mascot" style={shot ? place({ x: 300, y: 160, w: 84 }) : place({ x: 140, y: 60, w: 120 })}>
          <div className="bob loop">
            <Mascot slug={project.slug} />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
