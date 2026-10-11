import type { ComponentType } from "react";
import type { CompactProject, CompactSlug, FullProject, FullSlug } from "@/content/types";
import { BasicVignette } from "./basic/BasicVignette";
import { BasicWorld } from "./basic/BasicWorld";
import { PosScene } from "./pos/Scene";
import { TimeLogScene } from "./time-log/Scene";

export type FullScene = ComponentType<{ project: FullProject }>;
export type CompactScene = ComponentType<{ project: CompactProject }>;

/** One scene per project: a missing entry fails the type check (spec §5).
 *  Phases 3, 5, 6 and 7 swap each basic scene for the designed one. */
export const fullScenes: Record<FullSlug, FullScene> = {
  pos: PosScene,
  "time-log": TimeLogScene,
  "service-areas": BasicWorld,
  katiwala: BasicWorld,
  stockroom: BasicWorld,
  "agent-island": BasicWorld,
};

export const compactScenes: Record<CompactSlug, CompactScene> = {
  "everyday-rockstar": BasicVignette,
  lipad: BasicVignette,
  keyclick: BasicVignette,
  med42: BasicVignette,
  pesowise: BasicVignette,
};
