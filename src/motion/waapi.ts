/** Web Animations helpers for the choreographies (spec §11). The choreographies moved from GSAP to the
 *  Web Animations API at the Phase 3 gate (Wrenz, 2026-10-11): a main-thread GSAP frame made Chrome
 *  re-layerize the whole page, while these keyframe animations of transform and opacity run on the
 *  compositor. Every easing is a cubic-bézier or a keyword: element.animate() throws on an easing the
 *  browser does not know, and CSS linear() needs Chrome 113 / Safari 17.2 / Firefox 112. */

/** False where the Web Animations API is missing: the scene then keeps its server end state. */
export const canAnimate = (el: Element | null | undefined): el is Element => typeof el?.animate === "function";

const r6 = (v: number) => Math.round(v * 1e6) / 1e6;
const bezier = (x1: number, y1: number, x2: number, y2: number) => `cubic-bezier(${r6(x1)}, ${r6(y1)}, ${r6(x2)}, ${r6(y2)})`;

/** GSAP's eases. power1, power2 and back are cubic polynomials, which a cubic Bézier with its x handles at
 *  1/3 and 2/3 reproduces exactly; power3.out and the in-outs are the closest standard curves (within
 *  1%, tests/waapi.test.ts). GSAP's default ease is power1.out. */
export const EASE = {
  linear: "linear",
  quadIn: bezier(1 / 3, 0, 2 / 3, 1 / 3), // power1.in
  power1Out: bezier(1 / 3, 2 / 3, 2 / 3, 1),
  power2Out: bezier(1 / 3, 1, 2 / 3, 1),
  power2In: bezier(1 / 3, 0, 2 / 3, 0),
  power3Out: "cubic-bezier(0.25, 1, 0.5, 1)",
  power1InOut: "cubic-bezier(0.45, 0, 0.55, 1)",
  power2InOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  sineInOut: "cubic-bezier(0.37, 0, 0.63, 1)",
} as const;

/** GSAP's back.out(s), exactly. */
export const backOut = (s: number) => bezier(1 / 3, (s + 3) / 3, 2 / 3, 1);

// bounce.out is four parabolic arcs. Between a contact (1) and an apex, each half arc is a quadratic:
// ease-in on the way down to a contact, ease-out on the way up to an apex. [time × 2.75, value]
const BOUNCE = [
  [0, 0],
  [1, 1],
  [1.5, 0.75],
  [2, 1],
  [2.25, 0.9375],
  [2.5, 1],
  [2.625, 0.984375],
  [2.75, 1],
] as const;

/** GSAP's bounce.out, exactly, as keyframes from offset `start` to `end`; `frame(p)` builds the keyframe
 *  for eased progress p (0 at the start value, 1 at the end value). */
export function bounce(frame: (p: number) => Keyframe, start = 0, end = 1): Keyframe[] {
  return BOUNCE.map(([t, p], i) => ({
    ...frame(p),
    offset: i === BOUNCE.length - 1 ? end : start + (t / 2.75) * (end - start),
    ...(i < BOUNCE.length - 1 ? { easing: i % 2 ? EASE.power1Out : EASE.quadIn } : {}),
  }));
}

/** Pixels, rounded to thousandths (never "-0px"). */
export const px = (v: number) => `${Math.round(v * 1000) / 1000 || 0}px`;

/** One tween of an entrance: start `at` and last `dur` ms (after the entrance starts); `ease` applies to
 *  each segment without its own easing; `before` is shown until the start (default: the first keyframe). */
export type Tween = { at?: number; dur: number; ease?: string; before?: Keyframe };

const valueOf = (keyframe: Keyframe): Keyframe => {
  const value = { ...keyframe };
  delete value.offset;
  delete value.easing;
  return value;
};

/** Spreads a tween over [from, end] ms of the entrance: its delay becomes a leading hold and it holds its
 *  last frame until `end`. */
export function span(keyframes: Keyframe[], { at = 0, dur, ease, before }: Tween, from: number, end: number): Keyframe[] {
  const total = end - from;
  const start = at - from;
  const n = keyframes.length;
  const out: Keyframe[] = [];
  if (start > 0) out.push({ ...valueOf(before ?? keyframes[0]), offset: 0, ...(before ? { easing: "step-end" } : {}) });
  keyframes.forEach((keyframe, i) => {
    const offset = keyframe.offset ?? (n === 1 ? 1 : i / (n - 1));
    const easing = keyframe.easing ?? (i < n - 1 ? ease : undefined);
    out.push({ ...valueOf(keyframe), offset: (start + offset * dur) / total, ...(easing ? { easing } : {}) });
  });
  if (start + dur < total) out.push({ ...valueOf(keyframes[n - 1]), offset: 1 });
  return out;
}

/** One entrance: every animation in it runs from the entrance's start to `end` ms (see span()). Chrome
 *  re-layerizes the whole page each time a compositor animation starts after a delay or finishes on its
 *  own, so an entrance whose animations start together and finish together pays for that once each
 *  instead of once per tween (waapi-experiment-report.md, Task 3.7a). Animations are created paused,
 *  which shows the start frame from prepare on without writing inline styles; play() starts them all. */
export function entrance(end: number) {
  const all: Animation[] = [];
  let playing = false;
  return {
    /** Adds a tween. A part created mid-entrance passes `from` (its creation time on the entrance's clock)
     *  and starts at once, on the entrance's clock, so it still ends with the others. */
    add(el: Element | null | undefined, keyframes: Keyframe[], tween: Tween, { from = 0, fill }: { from?: number; fill?: FillMode } = {}) {
      if (!canAnimate(el)) return undefined;
      const animation = el.animate(span(keyframes, tween, from, end), { duration: end - from, ...(fill ? { fill } : {}) });
      const clock = all[0]?.startTime;
      if (!playing) animation.pause();
      else if (typeof clock === "number") animation.startTime = clock + from;
      all.push(animation);
      return animation;
    },
    /** Plays the entrance; `onEnd` runs in the frame where it ends (at once if there is nothing to play). */
    play(onEnd: () => void) {
      playing = true;
      for (const animation of all) animation.play();
      if (all[0]) all[0].addEventListener("finish", onEnd, { once: true });
      else onEnd();
    },
    cancel() {
      playing = false;
      for (const animation of all.splice(0)) animation.cancel();
    },
  };
}

/** Animations outside an entrance (short interactions), kept until they finish so cleanup can cancel them. */
export function tracker() {
  const running = new Set<Animation>();
  return {
    run(el: Element, keyframes: Keyframe[], timing: KeyframeAnimationOptions, onEnd?: () => void) {
      if (!canAnimate(el)) return undefined;
      const animation = el.animate(keyframes, timing);
      running.add(animation);
      animation.addEventListener(
        "finish",
        () => {
          running.delete(animation);
          onEnd?.();
        },
        { once: true },
      );
      return animation;
    },
    cancel() {
      for (const animation of running) animation.cancel();
      running.clear();
    },
  };
}
