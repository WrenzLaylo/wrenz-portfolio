// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fullProjects } from "@/content/projects";
import { registry } from "@/motion/registry";
import type { SceneEnv } from "@/motion/types";
import choreo from "@/scenes/pos/choreo";
import { PosScene } from "@/scenes/pos/Scene";
import { animationsOf, declarations, FakeAnimation, finishAll, installFakeWaapi, removeFakeWaapi, sample, setWidth } from "./helpers";

const project = fullProjects.find((p) => p.slug === "pos")!;
const markup = renderToStaticMarkup(<PosScene project={project} />);

function mount(width = 820) {
  document.body.innerHTML = markup;
  const root = document.querySelector<HTMLElement>('[data-scene="pos"]') as HTMLElement;
  setWidth(root, width);
  return root;
}
const env = (skipEntrance: boolean, mobile = false): SceneEnv => ({ mobile, pointer: false, skipEntrance });
const part = (root: HTMLElement, name: string) => root.querySelector<HTMLElement>(`[data-part="${name}"]`) as HTMLElement;
/** The one animation on `el` that animates `property`. */
const anim = (el: Element, property: string) => animationsOf(el).find((a) => property in a.keyframes[0]) as FakeAnimation;
const END = 1350; // the entrance ends when the legs settle: 0.3 + 5 × 0.18 + 0.15 s
const at = (ms: number) => ms / END;

describe("POS choreography", () => {
  beforeEach(() => {
    installFakeWaapi();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    removeFakeWaapi();
  });

  it("is the registered POS choreography", async () => {
    expect((await registry.pos()).default).toBe(choreo);
  });

  it("sets the loop distances in pixels on enter and removes them on cleanup", () => {
    const root = mount(820);
    const handle = choreo(root, env(true));
    expect(root.style.getPropertyValue("--fall")).toBe("");
    handle.enter();
    expect(root.style.getPropertyValue("--fall")).toBe("84px");
    expect(root.style.getPropertyValue("--cx")).toBe("196px");
    handle.cleanup();
    expect(root.style.getPropertyValue("--fall")).toBe("");
  });

  it("scales the distances to the mobile grid", () => {
    const root = mount(716); // two mobile design px per px
    const handle = choreo(root, env(true, true));
    handle.enter();
    expect(root.style.getPropertyValue("--fall")).toBe("52px");
    handle.cleanup();
  });

  it("holds the start frame with inline styles until enter(), then hands it to the animations", () => {
    const root = mount(820);
    const pig = part(root, "pig");
    const sack = part(root, "sack");
    const pigStyle = declarations(pig);
    const handle = choreo(root, env(false));
    expect(pig.style.transform).toBe("translateX(-640px)");
    expect(sack.style.opacity).toBe("0");
    expect(FakeAnimation.all).toHaveLength(0);
    vi.advanceTimersByTime(10_000);
    expect(root.classList.contains("live")).toBe(false);
    handle.enter();
    expect(declarations(pig)).toBe(pigStyle);
    expect(sack.style.opacity).toBe("");
    expect(anim(pig, "transform").keyframes[0].transform).toBe("translateX(-640px)");
    expect(FakeAnimation.all.every((a) => a.playState === "running" && a.options.duration === END)).toBe(true);
    handle.cleanup();
  });

  it("plays GSAP's timeline: laptop, walk, legs and sack, then .live when the legs settle", () => {
    const root = mount(820);
    const handle = choreo(root, env(false));
    handle.enter();
    const walk = anim(part(root, "pig"), "transform").keyframes;
    const laptop = anim(part(root, "laptop"), "transform").keyframes;
    const sack = part(root, "sack");
    const drop = anim(sack, "translate").keyframes;
    const turn = anim(sack, "rotate").keyframes;
    const leg = anim(root.querySelector(".pig-leg.leg-a") as HTMLElement, "transform").keyframes;

    // laptop: y 40 → 0 over 0.6 s, power3.out (closest cubic-bézier)
    expect(sample(laptop, "transform", at(300))).toBeCloseTo(40 * (1 - 0.5) ** 4, 0);
    // pig: x -640 → 0 from 0.3 s over 0.9 s, power2.out
    expect(sample(walk, "transform", at(299))).toBeCloseTo(-640, 0);
    expect(sample(walk, "transform", at(750))).toBeCloseTo(-640 * 0.5 ** 3, 3);
    expect(sample(walk, "transform", at(1200))).toBeCloseTo(0, 6);
    // sack: drops 360 from 0.35 s over 0.7 s with bounce.out, turning from 40° to its CSS 96° (power2.out)
    expect(sample(drop, "translate", at(349), 1)).toBeCloseTo(-360, 6);
    expect(sample(drop, "translate", at(350 + 0.3 * 700), 1)).toBeCloseTo(-360 * (1 - 7.5625 * 0.09), 3);
    expect(sample(turn, "rotate", at(350 + 0.5 * 700))).toBeCloseTo(-56 * 0.5 ** 3, 3);
    // legs: ±14° swings every 0.18 s from 0.3 s, at rest by 1.35 s
    [300, 480, 660, 840, 1020, 1200].forEach((ms, k) => expect(sample(leg, "transform", at(ms))).toBeCloseTo(k % 2 ? 14 : -14, 6));
    expect(sample(leg, "transform", 1)).toBe(0);

    vi.advanceTimersByTime(END - 1);
    expect(root.classList.contains("live")).toBe(false);
    vi.advanceTimersByTime(1);
    expect(root.classList.contains("live")).toBe(true);
    expect(animationsOf(sack)).toHaveLength(0);
    handle.cleanup();
  });

  it("hops only once the scene is live", () => {
    const root = mount(820);
    const handle = choreo(root, env(false));
    const pig = part(root, "pig");
    const inner = part(root, "pig-inner");
    pig.dispatchEvent(new Event("pointerenter"));
    expect(animationsOf(inner)).toHaveLength(0);
    handle.enter();
    finishAll();
    pig.dispatchEvent(new Event("pointerenter"));
    expect(animationsOf(inner).length).toBeGreaterThan(0);
    handle.cleanup();
    expect(animationsOf(inner)).toHaveLength(0);
    expect(inner.style.transform).toBe("");
  });

  it("hops like GSAP: up 24 px with power2.out, down with bounce.out, three coins arcing out", () => {
    const root = mount(820);
    const handle = choreo(root, env(true));
    handle.enter();
    part(root, "pig").dispatchEvent(new Event("pointerdown"));
    const hop = anim(part(root, "pig-inner"), "transform");
    expect(hop.options.duration).toBe(580);
    expect(sample(hop.keyframes, "transform", 90 / 580)).toBeCloseTo(-24 * (1 - 0.5 ** 3), 3);
    expect(sample(hop.keyframes, "transform", 180 / 580)).toBeCloseTo(-24, 6);
    expect(sample(hop.keyframes, "transform", 380 / 580)).toBeCloseTo(-24 * (1 - (7.5625 * (0.5 - 1.5 / 2.75) ** 2 + 0.75)), 3);
    expect(sample(hop.keyframes, "transform", 1)).toBe(0);
    const coins = [...root.querySelectorAll<HTMLElement>('[data-part="burst"]')].map((c) => anim(c, "transform"));
    expect(coins).toHaveLength(3);
    expect(coins.map((c) => c.keyframes[1].transform)).toEqual([
      "translate(-46px, -86px) scale(1)",
      "translate(0px, -86px) scale(1)",
      "translate(46px, -86px) scale(1)",
    ]);
    expect(coins.map((c) => c.keyframes.at(-1)?.opacity)).toEqual([0, 0, 0]);
    handle.cleanup();
  });

  it("does not start a second hop until the first has landed", () => {
    const root = mount(820);
    const handle = choreo(root, env(true));
    handle.enter();
    const pig = part(root, "pig");
    const inner = part(root, "pig-inner");
    pig.dispatchEvent(new Event("pointerenter"));
    pig.dispatchEvent(new Event("pointerdown"));
    expect(animationsOf(inner)).toHaveLength(1);
    vi.advanceTimersByTime(580);
    pig.dispatchEvent(new Event("pointerenter"));
    expect(animationsOf(inner)).toHaveLength(1);
    expect(FakeAnimation.all.filter((a) => a.target === inner)).toHaveLength(2);
    handle.cleanup();
  });

  it("hops at once when the entrance is skipped", () => {
    const root = mount(820);
    const handle = choreo(root, env(true));
    handle.enter();
    const inner = part(root, "pig-inner");
    part(root, "pig").dispatchEvent(new Event("pointerenter"));
    expect(animationsOf(inner).length).toBeGreaterThan(0);
    handle.cleanup();
  });

  it("adds no duplicate listeners on a second prepare, enter and cleanup cycle", () => {
    const root = mount(820);
    const pig = part(root, "pig");
    const inner = part(root, "pig-inner");
    const first = choreo(root, env(true));
    first.enter();
    first.cleanup();
    const second = choreo(root, env(true));
    second.enter();
    pig.dispatchEvent(new Event("pointerenter"));
    expect(animationsOf(inner)).toHaveLength(1);
    second.cleanup();
    expect(animationsOf(inner)).toHaveLength(0);
  });
});
