import type { FullSlug } from "@/content/types";
import type { ChoreoLoader } from "./types";

/** One literal import() per world, so each choreography is its own small chunk (spec §6).
 *  Worlds still on the basic scene share the basic choreography until their phase replaces it. */
export const registry: Record<FullSlug, ChoreoLoader> = {
  pos: () => import("@/scenes/pos/choreo"),
  "time-log": () => import("@/scenes/time-log/choreo"),
  "service-areas": () => import("@/scenes/basic/choreo"),
  katiwala: () => import("@/scenes/basic/choreo"),
  stockroom: () => import("@/scenes/basic/choreo"),
  "agent-island": () => import("@/scenes/basic/choreo"),
};
