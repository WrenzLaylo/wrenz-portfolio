import type { ReactNode } from "react";
import { cssVars, type Grid } from "./grid";

type Tier = "full" | "compact" | "hero" | "strip";
type Depth = "bg" | "mid" | "fg";

const POINTER_STRENGTH: Record<Depth, number> = { bg: 0.02, mid: 0.012, fg: 0.035 };

/** Root of every animated stage. `.stage-c` is the size container (`@container stage`); `.stage` is the
 *  design-grid box the motion engine observes. Illustration-only stages pass `label` (role="img"). */
export function Stage({
  slug,
  tier,
  grid,
  label,
  className,
  children,
}: {
  slug: string;
  tier: Tier;
  grid: Grid;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="stage-c">
      <div
        className={className ? `stage ${className}` : "stage"}
        data-scene={slug}
        data-tier={tier}
        role={label ? "img" : undefined}
        aria-label={label}
        style={cssVars({ "--dw": grid.dw, "--dh": grid.dh, "--mdw": grid.mdw, "--mdh": grid.mdh })}
      >
        {children}
      </div>
    </div>
  );
}

/** A depth layer. Decorative layers are aria-hidden and inert. The layer that holds the meaningful
 *  screenshot passes decorative={false}. A layer whose mascot reacts to the pointer passes interactive:
 *  inert would disable its hit-testing (spec clarification 3). */
export function Layer({
  depth,
  decorative = true,
  interactive = false,
  children,
}: {
  depth: Depth;
  decorative?: boolean;
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`layer layer-${depth}`} aria-hidden={decorative || undefined} inert={(decorative && !interactive) || undefined}>
      <div className="mouse" data-k={POINTER_STRENGTH[depth]}>
        {children}
      </div>
    </div>
  );
}
