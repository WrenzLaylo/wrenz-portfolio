import type { ComponentType } from "react";
import type { CompactProject, CompactSlug, FullProject, FullSlug } from "@/content/types";
import { BasicVignette } from "./basic/BasicVignette";
import { BasicWorld } from "./basic/BasicWorld";

export type FullScene = ComponentType<{ project: FullProject }>;
export type CompactScene = ComponentType<{ project: CompactProject }>;

/** One scene per project: a missing entry fails the type check (spec §5).
 *  Phases 3, 5, 6 and 7 swap each basic scene for the designed one. */
export const fullScenes: Record<FullSlug, FullScene> = {
  pos: BasicWorld,
  "time-log": BasicWorld,
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
