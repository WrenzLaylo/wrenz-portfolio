import type { gsap as Gsap } from "gsap";

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

/** Jump every running GSAP animation to its end, firing callbacks; repeats for animations those callbacks start. */
export function finishAllTweens(gsap: typeof Gsap) {
  for (let round = 0; round < 20; round++) {
    const running = gsap.globalTimeline.getChildren(false, true, true).filter((a) => a.progress() < 1);
    if (running.length === 0) return;
    for (const animation of running) animation.progress(1);
  }
}
