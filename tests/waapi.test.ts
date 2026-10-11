// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backOut, bounce, canAnimate, EASE, entrance, px, span, tracker } from "@/motion/waapi";
import { animationsOf, ease, FakeAnimation, installFakeWaapi, removeFakeWaapi, sample } from "./helpers";

// GSAP 3's ease formulas (gsap-core.js), the reference the choreographies were written against.
const gsap = {
  "power1.in": (p: number) => p ** 2,
  "power1.out": (p: number) => 1 - (1 - p) ** 2,
  "power2.out": (p: number) => 1 - (1 - p) ** 3,
  "power2.in": (p: number) => p ** 3,
  "power3.out": (p: number) => 1 - (1 - p) ** 4,
  "power1.inOut": (p: number) => (p < 0.5 ? 2 * p ** 2 : 1 - 2 * (1 - p) ** 2),
  "power2.inOut": (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - 4 * (1 - p) ** 3),
  "sine.inOut": (p: number) => -(Math.cos(Math.PI * p) - 1) / 2,
  back: (s: number) => (p: number) => {
    const q = p - 1;
    return q * q * ((s + 1) * q + s) + 1;
  },
  "bounce.out": (p: number) => {
    const n = 7.5625;
    if (p < 1 / 2.75) return n * p * p;
    if (p < 2 / 2.75) return n * (p - 1.5 / 2.75) ** 2 + 0.75;
    if (p < 2.5 / 2.75) return n * (p - 2.25 / 2.75) ** 2 + 0.9375;
    return n * (p - 2.625 / 2.75) ** 2 + 0.984375;
  },
};

const maxError = (f: (x: number) => number, g: (x: number) => number) => {
  let max = 0;
  for (let i = 0; i <= 500; i++) max = Math.max(max, Math.abs(f(i / 500) - g(i / 500)));
  return max;
};

describe("easings", () => {
  it("reproduces GSAP's power1, power2 and back eases exactly with cubic-bÃ©ziers", () => {
    expect(maxError((x) => ease(EASE.quadIn, x), gsap["power1.in"])).toBeLessThan(1e-5);
    expect(maxError((x) => ease(EASE.power1Out, x), gsap["power1.out"])).toBeLessThan(1e-5);
    expect(maxError((x) => ease(EASE.power2Out, x), gsap["power2.out"])).toBeLessThan(1e-5);
    expect(maxError((x) => ease(EASE.power2In, x), gsap["power2.in"])).toBeLessThan(1e-5);
    for (const s of [1.7, 2, 2.2, 2.5]) expect(maxError((x) => ease(backOut(s), x), gsap.back(s))).toBeLessThan(1e-4);
  });

  it("stays within 1% of GSAP's power3.out and in-out eases", () => {
    expect(maxError((x) => ease(EASE.power3Out, x), gsap["power3.out"])).toBeLessThan(0.01);
    expect(maxError((x) => ease(EASE.power1InOut, x), gsap["power1.inOut"])).toBeLessThan(0.01);
    expect(maxError((x) => ease(EASE.power2InOut, x), gsap["power2.inOut"])).toBeLessThan(0.01);
    expect(maxError((x) => ease(EASE.sineInOut, x), gsap["sine.inOut"])).toBeLessThan(0.01);
  });

  it("uses only cubic-bÃ©zier or keyword easings, never linear()", () => {
    for (const value of [...Object.values(EASE), backOut(2)]) expect(value).toMatch(/^(linear|cubic-bezier\([^)]*\))$/);
  });

  it("builds GSAP's bounce.out from keyframes exactly", () => {
    const keyframes = bounce((p) => ({ transform: `translateY(${p * 100}px)` }));
    expect(keyframes[0].offset).toBe(0);
    expect(keyframes.at(-1)?.offset).toBe(1);
    expect(maxError((t) => sample(keyframes, "transform", t) / 100, gsap["bounce.out"])).toBeLessThan(1e-5);
  });

  it("places a bounce between two offsets", () => {
    const keyframes = bounce((p) => ({ opacity: p }), 0.5, 1);
    expect(keyframes[0].offset).toBe(0.5);
    expect(keyframes.at(-1)?.offset).toBe(1);
  });
});

describe("span", () => {
  it("turns the delay into a leading hold and holds the last frame to the end", () => {
    const out = span([{ opacity: 0 }, { opacity: 1 }], { at: 200, dur: 400, ease: EASE.power1Out }, 0, 1000);
    expect(out).toEqual([
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: 0.2, easing: EASE.power1Out },
      { opacity: 1, offset: 0.6 },
      { opacity: 1, offset: 1 },
    ]);
  });

  it("keeps a keyframe's own easing and offsets, and holds `before` with a step until the start", () => {
    const out = span([{ opacity: 0.9, easing: "ease-in" }, { opacity: 0.5, offset: 0.5 }, { opacity: 0 }], { at: 500, dur: 500, before: { opacity: 0 } }, 0, 1000);
    expect(out).toEqual([
      { opacity: 0, offset: 0, easing: "step-end" },
      { opacity: 0.9, offset: 0.5, easing: "ease-in" },
      { opacity: 0.5, offset: 0.75 },
      { opacity: 0, offset: 1 },
    ]);
  });

  it("adds no holds for a tween that already fills the entrance", () => {
    expect(span([{ opacity: 0 }, { opacity: 1 }], { dur: 600, ease: EASE.power2Out }, 0, 600)).toEqual([
      { opacity: 0, offset: 0, easing: EASE.power2Out },
      { opacity: 1, offset: 1 },
    ]);
  });

  it("measures from `from` for a part added mid-entrance", () => {
    const out = span([{ opacity: 1 }, { opacity: 0 }], { at: 1600, dur: 200 }, 1000, 2000);
    expect(out.map((k) => k.offset)).toEqual([0, 0.6, 0.8, 1]);
  });
});

describe("entrance", () => {
  beforeEach(() => {
    installFakeWaapi();
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>';
  });
  afterEach(() => {
    vi.useRealTimers();
    removeFakeWaapi();
  });
  const a = () => document.getElementById("a") as HTMLElement;
  const b = () => document.getElementById("b") as HTMLElement;

  it("creates every animation paused, over the whole entrance, and writes no inline style", () => {
    const intro = entrance(1000);
    intro.add(a(), [{ opacity: 0 }, { opacity: 1 }], { dur: 300 });
    intro.add(b(), [{ transform: "scale(0)" }, { transform: "scale(1)" }], { at: 500, dur: 300 });
    expect(FakeAnimation.all.map((x) => x.playState)).toEqual(["paused", "paused"]);
    expect(FakeAnimation.all.map((x) => x.options.duration)).toEqual([1000, 1000]);
    expect(a().getAttribute("style")).toBeNull();
    vi.advanceTimersByTime(5000);
    expect(FakeAnimation.all.map((x) => x.playState)).toEqual(["paused", "paused"]);
  });

  it("plays them together and calls back once when they end", () => {
    const intro = entrance(1000);
    intro.add(a(), [{ opacity: 0 }, { opacity: 1 }], { dur: 300 });
    intro.add(b(), [{ opacity: 0 }, { opacity: 1 }], { at: 700, dur: 300 });
    const done = vi.fn();
    intro.play(done);
    vi.advanceTimersByTime(999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledOnce();
    expect(animationsOf(a())).toHaveLength(0);
  });

  it("ends at once when it has nothing to play", () => {
    const done = vi.fn();
    entrance(1000).play(done);
    expect(done).toHaveBeenCalledOnce();
  });

  it("starts a part added mid-entrance on the entrance's clock, with its own fill", () => {
    const intro = entrance(1000);
    intro.add(a(), [{ opacity: 0 }, { opacity: 1 }], { dur: 1000 });
    const done = vi.fn();
    intro.play(done);
    vi.advanceTimersByTime(610); // a timer for 600 ms that fired a little late
    const late = intro.add(b(), [{ opacity: 1 }, { opacity: 0 }], { at: 600, dur: 200 }, { from: 600, fill: "forwards" });
    expect(late?.playState).toBe("running");
    expect((late as unknown as FakeAnimation).options).toMatchObject({ duration: 400, fill: "forwards" });
    expect(late?.startTime).toBe(Number(FakeAnimation.all[0].startTime) + 600);
    vi.advanceTimersByTime(390);
    expect(done).toHaveBeenCalledOnce();
    expect(late?.playState).toBe("finished");
  });

  it("cancels everything and calls back no more", () => {
    const intro = entrance(1000);
    intro.add(a(), [{ opacity: 0 }, { opacity: 1 }], { dur: 300 });
    const done = vi.fn();
    intro.play(done);
    intro.cancel();
    vi.advanceTimersByTime(2000);
    expect(done).not.toHaveBeenCalled();
    expect(FakeAnimation.all[0].playState).toBe("idle");
  });

  it("skips missing elements", () => {
    const intro = entrance(1000);
    expect(intro.add(null, [{ opacity: 0 }, { opacity: 1 }], { dur: 300 })).toBeUndefined();
    expect(FakeAnimation.all).toHaveLength(0);
  });
});

describe("without the Web Animations API", () => {
  it("animates nothing and still ends the entrance", () => {
    document.body.innerHTML = '<div id="a"></div>';
    const el = document.getElementById("a") as HTMLElement;
    expect(canAnimate(el)).toBe(false);
    const intro = entrance(1000);
    expect(intro.add(el, [{ opacity: 0 }, { opacity: 1 }], { dur: 300 })).toBeUndefined();
    const done = vi.fn();
    intro.play(done);
    expect(done).toHaveBeenCalledOnce();
    expect(tracker().run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 })).toBeUndefined();
  });
});

describe("tracker", () => {
  beforeEach(() => {
    installFakeWaapi();
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="a"></div>';
  });
  afterEach(() => {
    vi.useRealTimers();
    removeFakeWaapi();
  });

  it("runs an animation, calls back when it ends and forgets it", () => {
    const el = document.getElementById("a") as HTMLElement;
    const hops = tracker();
    const done = vi.fn();
    hops.run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }, done);
    vi.advanceTimersByTime(300);
    expect(done).toHaveBeenCalledOnce();
    hops.cancel();
    expect(FakeAnimation.all[0].playState).toBe("finished");
  });

  it("cancels what is still running", () => {
    const el = document.getElementById("a") as HTMLElement;
    const hops = tracker();
    const done = vi.fn();
    hops.run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }, done);
    hops.cancel();
    vi.advanceTimersByTime(300);
    expect(done).not.toHaveBeenCalled();
    expect(animationsOf(el)).toHaveLength(0);
  });
});

describe("px", () => {
  it("rounds to thousandths and never prints -0", () => {
    expect(px(12.34567)).toBe("12.346px");
    expect(px(-0)).toBe("0px");
    expect(px(-0.0001)).toBe("0px");
  });
});
