// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fullProjects } from "@/content/projects";
import { registry } from "@/motion/registry";
import type { SceneEnv } from "@/motion/types";
import choreo from "@/scenes/time-log/choreo";
import { TimeLogScene } from "@/scenes/time-log/Scene";
import {
  animationsOf,
  cssBlock,
  cssRule,
  declarations,
  designTranslate,
  FakeAnimation,
  finishAll,
  FRAME,
  installFakeWaapi,
  removeFakeWaapi,
  sample,
  setWidth,
} from "./helpers";

const project = fullProjects.find((p) => p.slug === "time-log")!;
const markup = renderToStaticMarkup(<TimeLogScene project={project} />);

function mount(width = 820) {
  document.body.innerHTML = markup;
  const root = document.querySelector<HTMLElement>('[data-scene="time-log"]') as HTMLElement;
  setWidth(root, width);
  return root;
}
const env = (skipEntrance: boolean, mobile = false): SceneEnv => ({ mobile, pointer: false, skipEntrance });
// GSAP's timeline (ms after enter): bubble i's chip takes off at FLY(i) and lands 0.64 s later.
const FLY = (i: number) => 1600 + i * 550;
const LAND = (i: number) => FLY(i) + 640;
const DESKTOP_END = LAND(4) + 1850; // five bubbles on the desktop grid; GSAP's finish() came 1.85 s after the last landing
const anim = (el: Element | null) => animationsOf(el as Element)[0];

describe("time-log choreography", () => {
  beforeEach(() => {
    installFakeWaapi();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    removeFakeWaapi();
  });

  it("is the registered time-log choreography", async () => {
    expect((await registry["time-log"]()).default).toBe(choreo);
  });

  it("shows the total in one step when the count-up would have ended, and restores the server text on cleanup", () => {
    const root = mount();
    const total = root.querySelector(".total") as HTMLElement;
    const handle = choreo(root, env(false));
    expect(total.textContent).toBe("0:00");
    handle.enter();
    vi.advanceTimersByTime(LAND(4) + 899); // GSAP counted up from LAND + 0.3 s to LAND + 0.9 s
    expect(total.textContent).toBe("0:00");
    vi.advanceTimersByTime(1);
    expect(total.textContent).toBe("6:54");
    finishAll();
    expect(total.textContent).toBe("6:54");
    expect(root.classList.contains("live")).toBe(true);
    expect(root.querySelector(".typing")?.classList.contains("on")).toBe(true);
    handle.cleanup();
    expect(total.textContent).toBe("6:54");
    expect(root.querySelector(".typing")?.classList.contains("on")).toBe(false);
  });

  it("holds the start frame inline until enter(): window low, bubbles small, clock at 7:00, cells empty", () => {
    const root = mount();
    const win = root.querySelector('[data-part="win"]') as HTMLElement;
    const bubble = root.querySelector(".bubble[data-cell]") as HTMLElement;
    const hour = root.querySelector('[data-part="hour"]') as HTMLElement;
    const value = root.querySelector('[data-slot="out"] .v') as HTMLElement;
    const server = [win, bubble, hour, value].map(declarations);
    const handle = choreo(root, env(false));
    expect(FakeAnimation.all).toHaveLength(0);
    expect(win.style.transform).toBe("translateY(30px)");
    expect([bubble.style.transform, bubble.style.opacity]).toEqual(["scale(0.4)", "0"]);
    expect(hour.style.transform).toBe("rotate(210deg)");
    expect(value.style.opacity).toBe("0");
    handle.enter();
    expect([win, bubble, hour, value].map(declarations)).toEqual(server);
    handle.cleanup();
  });

  it("adds .live when GSAP's timeline ended: 1.85 s after the last landing, all animations together", () => {
    const root = mount();
    const handle = choreo(root, env(false));
    handle.enter();
    expect(FakeAnimation.all.length).toBeGreaterThan(20);
    expect(FakeAnimation.all.every((a) => a.options.duration === DESKTOP_END && a.playState === "running")).toBe(true);
    vi.advanceTimersByTime(FRAME + DESKTOP_END - 1); // the start time resolves a frame after enter()
    expect(root.classList.contains("live")).toBe(false);
    vi.advanceTimersByTime(1);
    expect(root.classList.contains("live")).toBe(true);
    expect(FakeAnimation.all.some((a) => a.playState === "running")).toBe(false);
    handle.cleanup();
  });

  it("leaves the total alone when skipping the entrance", () => {
    const root = mount();
    const handle = choreo(root, env(true));
    expect(root.querySelector(".total")?.textContent).toBe("6:54");
    expect(FakeAnimation.all).toHaveLength(0);
    handle.enter();
    expect(root.classList.contains("live")).toBe(true);
    handle.cleanup();
  });

  it("pops the parts in on GSAP's schedule", () => {
    const root = mount();
    choreo(root, env(false)).enter();
    const t = (ms: number) => ms / DESKTOP_END;
    const bubbles = [...root.querySelectorAll<HTMLElement>(".bubble[data-cell]")];
    // bubble i: scale 0.4 → 1 from 0.3 + 0.12 i s over 0.4 s (back.out(2)), opacity with it
    bubbles.forEach((bubble, i) => {
      const keyframes = anim(bubble).keyframes;
      expect(sample(keyframes, "transform", t(300 + i * 120))).toBeCloseTo(0.4, 6);
      expect(sample(keyframes, "transform", t(300 + i * 120 + 400))).toBeCloseTo(1, 6);
    });
    // values appear at their landing; the flash jumps to 0.9 there and fades
    const out = root.querySelector('[data-slot="out"]') as HTMLElement;
    const value = anim(out.querySelector(".v")).keyframes;
    const flash = anim(out.querySelector(".flash")).keyframes;
    expect(sample(value, "opacity", t(LAND(4) - 1))).toBe(0);
    expect(sample(value, "opacity", t(LAND(4) + 250))).toBeCloseTo(1, 6);
    expect(sample(flash, "opacity", t(LAND(4) - 1))).toBe(0);
    expect(sample(flash, "opacity", t(LAND(4)))).toBeCloseTo(0.9, 6);
    expect(sample(flash, "opacity", t(LAND(4) + 500))).toBeCloseTo(0, 6);
    // "Read-back OK" pops 0.95 s after the last landing; the typing bubble fades in at 1.5 s
    const badge = anim(root.querySelector('[data-part="badge"]')).keyframes;
    expect(sample(badge, "opacity", t(LAND(4) + 949))).toBe(0);
    expect(sample(badge, "transform", t(LAND(4) + 1450))).toBeCloseTo(1, 6);
    const typing = anim(root.querySelector(".typing")).keyframes;
    expect(sample(typing, "opacity", t(LAND(4) + 1499))).toBe(0);
    expect(sample(typing, "opacity", t(LAND(4) + 1800))).toBeCloseTo(1, 6);
  });

  // The server sends the end state; the entrance must land on it, or the sheet jumps when .live arrives.
  it.each([false, true])("slides the backup sheet out to its CSS end offset (mobile grid: %s)", (mobile) => {
    const css = readFileSync("src/scenes/time-log/scene.css", "utf8");
    const scope = mobile ? (cssBlock(css, "@container stage (width < 760px)") ?? "") : css;
    const [x, y] = designTranslate(cssRule(scope, '[data-scene="time-log"] .win-copy'));
    const root = mount(mobile ? 358 : 820); // one design px is one CSS px on either grid
    choreo(root, env(false, mobile)).enter();
    const keyframes = anim(root.querySelector('[data-part="win-copy"]')).keyframes;
    expect(sample(keyframes, "transform", 0, 0)).toBe(0);
    expect(sample(keyframes, "transform", 0, 1)).toBe(0);
    expect(sample(keyframes, "transform", 1, 0)).toBe(x);
    expect(sample(keyframes, "transform", 1, 1)).toBe(y);
  });

  it("sweeps the clock from 7:00 through each posted time, ending on the server's 3:00", () => {
    const root = mount();
    choreo(root, env(false)).enter();
    const t = (ms: number) => ms / DESKTOP_END;
    const hour = anim(root.querySelector('[data-part="hour"]')).keyframes;
    const minute = anim(root.querySelector('[data-part="minute"]')).keyframes;
    expect(sample(hour, "transform", 0)).toBe(210); // 7:00
    expect(sample(hour, "transform", t(LAND(0) + 550))).toBeCloseTo((7 * 60 + 21) * 0.5, 6); // arrived 7:21
    expect(sample(minute, "transform", t(LAND(0) + 550))).toBeCloseTo(21 * 6, 6);
    expect(sample(hour, "transform", 1) % 360).toBe(90); // 15:00, the CSS rotate(90deg)
    expect(sample(minute, "transform", 1) % 360).toBe(0); // the CSS rotate(0deg)
  });

  it("flies a chip into the sheet per bubble, all taking off with the first, and removes them at the end", () => {
    const root = mount();
    const handle = choreo(root, env(false));
    handle.enter();
    vi.advanceTimersByTime(FLY(0) - 1);
    expect(root.querySelectorAll(".chip")).toHaveLength(0);
    vi.advanceTimersByTime(1);
    const chips = root.querySelectorAll<HTMLElement>(".layer-fg .mouse > .chip");
    expect(chips).toHaveLength(5);
    expect([...chips].map((c) => c.textContent)).toEqual(["7:21", "7:23", "12:04", "12:47", "3:00"]);
    // chip i holds invisible until its own take-off, then flies for 0.74 s
    // The entrance's clock started a frame after enter(), so the chips start a frame in the future: until
    // then only a backwards fill keeps them invisible (their first frame), instead of painted at their origin.
    for (const chip of chips) {
      const a = anim(chip);
      expect(a.currentTime).toBeLessThan(0);
      expect(a.effectApplied).toBe(true);
      expect(a.keyframes[0].opacity).toBe(0);
    }
    const last = anim(chips[4]);
    expect(last.options).toMatchObject({ duration: DESKTOP_END - FLY(0), fill: "both" });
    expect(sample(last.keyframes, "opacity", (FLY(4) - FLY(0) - 1) / (DESKTOP_END - FLY(0)))).toBe(0);
    finishAll();
    expect(root.querySelectorAll(".chip")).toHaveLength(0);
    handle.cleanup();
  });

  it("removes chips still in flight on cleanup", () => {
    const root = mount();
    const handle = choreo(root, env(false));
    handle.enter();
    vi.advanceTimersByTime(FLY(0) + 100);
    expect(root.querySelectorAll(".chip").length).toBeGreaterThan(0);
    handle.cleanup();
    expect(root.querySelectorAll(".chip")).toHaveLength(0);
    expect(FakeAnimation.all.some((a) => a.playState === "running")).toBe(false);
    vi.runAllTimers();
    expect(root.querySelectorAll(".chip")).toHaveLength(0);
    expect(root.querySelector(".total")?.textContent).toBe("6:54");
  });

  it("flies only the bubbles shown on the mobile grid", () => {
    const root = mount(358);
    const handle = choreo(root, env(false, true));
    handle.enter();
    vi.advanceTimersByTime(FLY(0));
    expect(root.querySelectorAll(".chip")).toHaveLength(4);
    handle.cleanup();
  });
});
