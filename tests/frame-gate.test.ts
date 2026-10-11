import { describe, expect, it } from "vitest";
import { createFrameGate } from "@/motion/frame-gate";

const run = (frames: number[]) => {
  const gate = createFrameGate();
  return frames.map((ms) => gate.record(ms));
};

describe("createFrameGate", () => {
  it("stays on while frames are fast", () => {
    expect(run(Array(80).fill(16)).every((r) => r === "ok")).toBe(true);
  });

  it("switches off when more than 25% of a 40-frame window is slow", () => {
    const result = run([...Array(29).fill(16), ...Array(11).fill(30)]);
    expect(result.at(-1)).toBe("off");
  });

  it("stays on at exactly 25% slow", () => {
    const result = run([...Array(30).fill(16), ...Array(10).fill(30)]);
    expect(result.at(-1)).toBe("ok");
  });

  it("judges each window on its own", () => {
    const result = run([...Array(30).fill(16), ...Array(10).fill(30), ...Array(40).fill(16)]);
    expect(result.every((r) => r === "ok")).toBe(true);
  });
});
