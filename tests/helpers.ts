import { vi } from "vitest";
import { JSDOM } from "jsdom";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { pageCopy } from "@/content/page-copy";
import { site } from "@/content/site";

export class FakeIO {
  static all: FakeIO[] = [];
  readonly targets = new Set<Element>();
  disconnected = false;
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    FakeIO.all.push(this);
  }
  observe(target: Element) { this.targets.add(target); }
  unobserve(target: Element) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); this.disconnected = true; }
  takeRecords() { return []; }
  /** Deliver one entry, as the browser would, if the target is still observed. */
  fire(target: Element, isIntersecting: boolean) {
    if (!this.targets.has(target)) return;
    this.callback([{ target, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

export class FakeRO {
  static all: FakeRO[] = [];
  readonly targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) { FakeRO.all.push(this); }
  observe(target: Element) { this.targets.add(target); }
  unobserve(target: Element) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
  fire() { this.callback([], this as unknown as ResizeObserver); }
}

export type TestWindow = Window & typeof globalThis & {
  emit(type: string, init?: Record<string, number>): void;
  runFrames(count: number, stepMs?: number): void;
  listenerCount(type: string): number;
};

/** A window stand-in with fake observers, synchronous timers and manual animation frames. */
export function fakeWindow(opts: { reduced?: boolean; pointer?: boolean } = {}): TestWindow {
  FakeIO.all = [];
  FakeRO.all = [];
  const listeners = new Map<string, Set<EventListener>>();
  let frames: FrameRequestCallback[] = [];
  let now = 1000;
  const win = {
    matchMedia: (query: string) => ({
      matches: query.includes("reduce") ? Boolean(opts.reduced) : query.includes("pointer: fine") ? Boolean(opts.pointer) : false,
    }),
    IntersectionObserver: FakeIO,
    ResizeObserver: FakeRO,
    setTimeout: (fn: () => void) => { fn(); return 1; },
    clearTimeout: () => {},
    requestAnimationFrame: (fn: FrameRequestCallback) => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: () => {},
    innerWidth: 1440,
    innerHeight: 900,
    addEventListener: (type: string, fn: EventListener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(fn);
    },
    removeEventListener: (type: string, fn: EventListener) => { listeners.get(type)?.delete(fn); },
    emit: (type: string, init: Record<string, number> = {}) => {
      for (const fn of listeners.get(type) ?? []) fn(init as unknown as Event);
    },
    runFrames: (count: number, stepMs = 16) => {
      for (let i = 0; i < count; i++) {
        const due = frames;
        frames = [];
        now += stepMs;
        for (const fn of due) fn(now);
      }
    },
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
  };
  return win as unknown as TestWindow;
}

/** Stages as the server renders them, plus the nav popover with one link. */
export function mountStages(...slugs: string[]): HTMLElement[] {
  document.body.innerHTML =
    slugs
      .map(
        (slug) =>
          `<div class="stage-c"><div class="stage" data-scene="${slug}" data-tier="full">` +
          `<div class="layer layer-bg"><div class="mouse" data-k="0.02"></div></div></div></div>`,
      )
      .join("") + `<nav id="nav-menu" popover="auto"><a href="#about">About</a></nav>`;
  const stages = slugs.map((slug) => document.querySelector<HTMLElement>(`[data-scene="${slug}"]`) as HTMLElement);
  for (const stage of stages) setWidth(stage, 820);
  return stages;
}

export function setWidth(el: HTMLElement, width: number) {
  el.getBoundingClientRect = () => ({ width, height: 600, top: 0, left: 0, right: width, bottom: 600, x: 0, y: 0, toJSON() {} }) as DOMRect;
}

export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// ---------------------------------------------------------------------------------------------------
// A fake Web Animations API. jsdom has none, so choreography tests install this one. Animations run on
// the (fake) timers: a play() stays pending for one FRAME (start time null, current time held at 0), as
// in Chrome, then the animation finishes when the clock passes its end, so vi.advanceTimersByTime() moves
// animations and setTimeout callbacks together, in order. A start time set in the future is the before
// phase, where only a backwards (or both) fill shows the first keyframe (`effectApplied`).
// It is strict where browsers are: element.animate throws a TypeError on an easing the browser does not
// know (so `linear()` is refused here, as in older browsers) and on offsets outside 0..1 or out of
// order. It also refuses any property but transform and opacity (and the individual transform
// properties), so every choreography stays on the compositor.

const PROPERTIES = new Set(["transform", "opacity", "translate", "rotate", "scale"]);
const KEYWORD_EASINGS = new Set(["linear", "ease", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end"]);

function checkEasing(easing: unknown) {
  if (easing === undefined) return;
  const value = String(easing);
  if (KEYWORD_EASINGS.has(value)) return;
  const m = /^cubic-bezier\(\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*,\s*([-\d.e]+)\s*\)$/.exec(value);
  const [x1, , x2] = m ? m.slice(1).map(Number) : [];
  if (!m || !(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) throw new TypeError(`Invalid easing: ${value}`);
}

function checkKeyframes(keyframes: Keyframe[]) {
  let last = 0;
  for (const keyframe of keyframes) {
    for (const key of Object.keys(keyframe)) {
      if (key !== "offset" && key !== "easing" && !PROPERTIES.has(key)) throw new TypeError(`Not a compositor property: ${key}`);
    }
    checkEasing(keyframe.easing);
    if (keyframe.offset == null) continue;
    const offset = Number(keyframe.offset);
    if (!(offset >= 0 && offset <= 1) || offset < last) throw new TypeError(`Offsets must be in 0..1 and in order: ${offset}`);
    last = offset;
  }
}

/** How long a play() stays pending: Chrome resolves an animation's start time on a later frame. */
export const FRAME = 16;

export class FakeAnimation extends EventTarget {
  static all: FakeAnimation[] = [];
  playState: AnimationPlayState = "running";
  /** True from play() (or creation) until the start time is resolved, one FRAME later. */
  pending = true;
  private start: number | null = null;
  private hold: number | null = 0; // the current time while pending or paused
  private timer: ReturnType<typeof setTimeout> | undefined;
  private ready: ReturnType<typeof setTimeout> | undefined;
  readonly duration: number;
  constructor(
    readonly target: Element,
    readonly keyframes: Keyframe[],
    readonly options: KeyframeAnimationOptions,
  ) {
    super();
    if (!Array.isArray(keyframes)) throw new TypeError("Use a keyframe array");
    checkKeyframes(keyframes);
    checkEasing(options.easing);
    this.duration = Number(options.delay ?? 0) + Number(options.duration ?? 0);
    if (!Number.isFinite(this.duration) || this.duration < 0) throw new TypeError("Invalid duration");
    FakeAnimation.all.push(this);
    this.resolveLater();
  }
  /** null while pending, as in browsers. */
  get startTime() {
    return this.start;
  }
  /** Setting a start time resolves a pending play; it may lie in the future (the before phase). */
  set startTime(time: number | null) {
    if (time === null) return;
    clearTimeout(this.ready);
    this.pending = false;
    this.hold = null;
    this.start = time;
    this.playState = "running";
    this.schedule();
  }
  /** Negative when the start time lies in the future. */
  get currentTime() {
    if (this.playState === "idle") return null;
    if (this.playState === "finished") return this.duration;
    if (this.hold !== null) return this.hold;
    return Date.now() - (this.start ?? Date.now());
  }
  /** Whether the effect shows now. In the before phase (current time < delay) only a backwards or both
   *  fill shows the first keyframe; after the end only a forwards or both fill shows the last. */
  get effectApplied() {
    const time = this.currentTime;
    if (time === null) return false;
    const fill = this.options.fill ?? "auto";
    if (time < Number(this.options.delay ?? 0)) return fill === "backwards" || fill === "both";
    if (time >= this.duration) return fill === "forwards" || fill === "both";
    return true;
  }
  play() {
    if (this.playState !== "paused") return;
    this.playState = "running";
    this.pending = true;
    this.resolveLater();
  }
  pause() {
    if (this.playState !== "running") return;
    this.hold = this.currentTime;
    this.start = null;
    this.pending = false;
    this.playState = "paused";
    clearTimeout(this.timer);
    clearTimeout(this.ready);
  }
  cancel() {
    clearTimeout(this.timer);
    clearTimeout(this.ready);
    if (this.playState === "idle") return;
    this.playState = "idle";
    this.pending = false;
    this.start = null;
    this.hold = null;
    this.dispatchEvent(new Event("cancel"));
  }
  finish() {
    clearTimeout(this.timer);
    clearTimeout(this.ready);
    if (this.playState === "finished" || this.playState === "idle") return;
    this.playState = "finished";
    this.pending = false;
    this.dispatchEvent(new Event("finish"));
  }
  private resolveLater() {
    clearTimeout(this.ready);
    this.ready = setTimeout(() => {
      this.pending = false;
      this.start = Date.now() - (this.hold ?? 0);
      this.hold = null;
      this.schedule();
    }, FRAME);
  }
  private schedule() {
    clearTimeout(this.timer);
    if (this.start === null) return;
    this.timer = setTimeout(() => this.finish(), Math.max(0, this.start + this.duration - Date.now()));
  }
}

/** Gives every element a fake `animate()`. Call with vi.useFakeTimers() active; undo with removeFakeWaapi(). */
export function installFakeWaapi() {
  FakeAnimation.all = [];
  Element.prototype.animate = function (this: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) {
    const timing = typeof options === "number" ? { duration: options } : (options ?? {});
    return new FakeAnimation(this, keyframes as Keyframe[], timing) as unknown as Animation;
  };
}

export function removeFakeWaapi() {
  delete (Element.prototype as Partial<Element>).animate;
}

/** Animations on `el` that have not finished or been cancelled. */
export const animationsOf = (el: Element) =>
  FakeAnimation.all.filter((a) => a.target === el && (a.playState === "running" || a.playState === "paused"));

/** Runs the clock until every playing animation and pending timer is done (paused animations stay). */
export const finishAll = () => vi.runAllTimers();

/** The value a keyframe list gives `property` at progress `t` (0..1), honouring each segment's easing.
 *  Reads the `index`-th number of the value (e.g. 1 for the y of "0px -360px"). */
export function sample(keyframes: Keyframe[], property: string, t: number, index = 0): number {
  const n = keyframes.length;
  const offsets = keyframes.map((k, i) => (k.offset == null ? (n === 1 ? 1 : i / (n - 1)) : Number(k.offset)));
  const num = (k: Keyframe) => Number(String(k[property]).match(/-?[\d.]+(?:e-?\d+)?/g)?.[index]);
  let i = 0;
  while (i < n - 2 && t >= offsets[i + 1]) i++;
  const span = offsets[i + 1] - offsets[i];
  const local = span > 0 ? Math.min(1, Math.max(0, (t - offsets[i]) / span)) : 1;
  const progress = ease(String(keyframes[i].easing ?? "linear"), local);
  return num(keyframes[i]) + (num(keyframes[i + 1]) - num(keyframes[i])) * progress;
}

/** Evaluates a CSS easing keyword or cubic-bezier() at x (0..1). */
export function ease(easing: string, x: number): number {
  if (easing === "linear") return x;
  if (easing === "step-end") return x < 1 ? 0 : 1;
  if (easing === "step-start") return x > 0 ? 1 : 0;
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(easing);
  if (!m) throw new Error(`Cannot evaluate easing ${easing}`);
  const [x1, y1, x2, y2] = m[1].split(",").map(Number);
  const bx = (s: number) => 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s * s * x2 + s ** 3;
  let lo = 0;
  let hi = 1;
  let s = x;
  for (let k = 0; k < 60; k++) {
    s = (lo + hi) / 2;
    if (bx(s) < x) lo = s;
    else hi = s;
  }
  return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s * s * y2 + s ** 3;
}

/** The public path an <img> shows: the `url` of a Next image-optimizer src, or the src itself. */
export function imageSrc(img: Element): string {
  const src = img.getAttribute("src") ?? "";
  return src.startsWith("/_next/image?") ? (new URL(src, "http://x").searchParams.get("url") ?? "") : src;
}

/** The body of the first `<prelude> { ... }` block in a stylesheet (nested blocks included), or null.
 *  Comments are stripped first. */
export function cssBlock(css: string, prelude: string): string | null {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const at = source.indexOf(`${prelude} {`);
  if (at < 0) return null;
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return source.slice(open + 1, i);
  }
  return null;
}

/** The declarations of the first rule whose selector list is exactly `selector`, as a map, or null. */
export function cssRule(css: string, selector: string): Map<string, string> | null {
  for (const [, selectors, body] of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{};]+)\{([^{}]*)\}/g)) {
    if (selectors.trim().replace(/\s+/g, " ") !== selector) continue;
    const declarations = new Map<string, string>();
    for (const part of body.split(";")) {
      const colon = part.indexOf(":");
      if (colon > 0) declarations.set(part.slice(0, colon).trim(), part.slice(colon + 1).trim());
    }
    return declarations;
  }
  return null;
}

/** The [x, y] in design px of a rule's `transform: translate(calc(X * var(--u)), calc(Y * var(--u)))`. */
export function designTranslate(rule: Map<string, string> | null): [number, number] {
  const transform = rule?.get("transform") ?? "";
  const u = String.raw`calc\(\s*(-?[\d.]+)\s*\*\s*var\(--u\)\s*\)`;
  const m = new RegExp(String.raw`^translate\(\s*${u}\s*,\s*${u}\s*\)$`).exec(transform);
  if (!m) throw new Error(`No design-px translate in "${transform}"`);
  return [Number(m[1]), Number(m[2])];
}

/** An element's inline declarations, sorted ("" when it has none): what the server sent, however serialized. */
export const declarations = (el: Element) => {
  const style = (el as HTMLElement).style;
  return Array.from(style, (p) => `${p}:${style.getPropertyValue(p)}${style.getPropertyPriority(p) ? "!important" : ""}`).sort().join(";");
};

/** Render a server component into a standalone document for markup tests. */
export function renderDoc(element: ReactElement): Document {
  return new JSDOM(`<body>${renderToStaticMarkup(element)}</body>`).window.document;
}

const KNOWN_COPY = [...pageCopy(), ...Object.values(site.labels), ...site.socials.map((s) => s.label)];

/** Visible text that does not come from src/content: components hold no copy (spec §5).
 *  Decorative subtrees (aria-hidden), scripts, styles and punctuation-only text are skipped. */
export function strayText(doc: Document): string[] {
  const stray: string[] = [];
  const walker = doc.createTreeWalker(doc.body, 4); // NodeFilter.SHOW_TEXT
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? "";
    if (!/[A-Za-z0-9]/.test(text)) continue;
    if (node.parentElement?.closest('[aria-hidden="true"], script, style')) continue;
    if (!KNOWN_COPY.some((copy) => copy.includes(text))) stray.push(text);
  }
  return stray;
}
