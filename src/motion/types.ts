export type SceneEnv = {
  mobile: boolean; // the stage is on its mobile grid (width < STAGE_GRID_SWITCH)
  pointer: boolean; // (hover: hover) and (pointer: fine) and (min-width: 1024px)
  skipEntrance: boolean; // the scene was already visible when its module arrived
};

/** `name` is the literal "choreo:<folder>"; tools/perf/chunks.mjs finds each chunk by it. */
export type SceneHandle = { name: string; enter(): void; cleanup(): void };

/** Calling a choreography prepares it (spec §11): start state only when !skipEntrance, interactions wired.
 *  Choreographies animate with the Web Animations API (src/motion/waapi.ts); GSAP was dropped at the
 *  Phase 3 gate (Wrenz, 2026-10-11). */
export type Choreo = (root: HTMLElement, env: SceneEnv) => SceneHandle;

export type ChoreoLoader = () => Promise<{ default: Choreo }>;
