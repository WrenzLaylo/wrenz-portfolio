/** Counts slow frames in fixed windows. Pointer parallax switches itself off for the session when more
 *  than `maxSlowRatio` of a window's frames take longer than `slowMs` (spec §11 step 5). */
export function createFrameGate({ windowSize = 40, slowMs = 24, maxSlowRatio = 0.25 } = {}) {
  let seen = 0;
  let slow = 0;
  return {
    record(frameMs: number): "ok" | "off" {
      seen++;
      if (frameMs > slowMs) slow++;
      if (seen < windowSize) return "ok";
      const off = slow / seen > maxSlowRatio;
      seen = 0;
      slow = 0;
      return off ? "off" : "ok";
    },
  };
}
