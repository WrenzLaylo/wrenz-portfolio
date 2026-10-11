import type { CSSProperties } from "react";

/** Below this stage width (px) world scenes use their mobile grid (spec §8 + clarification 1).
 *  Every `@container stage (width < 760px)` must use this literal (tests/scenes.test.tsx). */
export const STAGE_GRID_SWITCH = 760;

/** A stage's design size on its desktop grid (dw × dh) and mobile grid (mdw × mdh), in design px. */
export type Grid = { dw: number; dh: number; mdw: number; mdh: number };

/** Where an object sits on the desktop grid, and optionally on the mobile grid. */
export type Place = { x: number; y: number; w: number; mx?: number; my?: number; mw?: number };

type Vars = Record<`--${string}`, string | number>;

/** Inline custom properties. React passes numbers through unchanged for custom properties. */
export function cssVars(vars: Vars): CSSProperties {
  return vars as CSSProperties;
}

export function place(p: Place, extra: Vars = {}): CSSProperties {
  const vars: Vars = { "--x": p.x, "--y": p.y, "--w": p.w, ...extra };
  if (p.mx !== undefined) vars["--mx"] = p.mx;
  if (p.my !== undefined) vars["--my"] = p.my;
  if (p.mw !== undefined) vars["--mw"] = p.mw;
  return cssVars(vars);
}
