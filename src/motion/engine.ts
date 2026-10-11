import { STAGE_GRID_SWITCH } from "@/scenes/grid";
import { startPointer } from "./pointer";
import type { Choreo, ChoreoLoader, Gsap, SceneHandle } from "./types";

export type EngineDeps = {
  doc: Document;
  win: Window & typeof globalThis;
  registry: Readonly<Partial<Record<string, ChoreoLoader>>>;
  loadGsap: () => Promise<{ gsap: Gsap }>;
};

type Rec = {
  stage: HTMLElement;
  loader: ChoreoLoader;
  loading: boolean;
  choreo?: Choreo;
  handle?: SceneHandle;
  entered: boolean;
  width: number;
};

const NEAR = "50% 0px 50% 0px"; // start loading within half a viewport (spec §11 step 2)
const ENTER = "0px 0px -15% 0px"; // play the entrance once the stage is 15% of a viewport into view
const STATE_CLASSES = ["live", "paused", "ready"];

/** Starts the page's motion and returns a stop function that undoes everything (spec §11). */
export function startMotion({ doc, win, registry, loadGsap }: EngineDeps): () => void {
  const teardown: Array<() => void> = [];
  const stop = () => {
    for (const fn of teardown.splice(0).reverse()) fn();
  };

  // Mobile menu: close the popover after a link inside it is tapped. Installed even with reduced motion.
  const onClick = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]");
    const menu = link?.closest<HTMLElement>("[popover]");
    if (!menu || typeof menu.hidePopover !== "function") return;
    try {
      menu.hidePopover();
    } catch {
      // already closed
    }
  };
  doc.addEventListener("click", onClick);
  teardown.push(() => doc.removeEventListener("click", onClick));

  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) return stop;

  const stages = Array.from(doc.querySelectorAll<HTMLElement>("[data-scene]"));
  const visible = new Set<HTMLElement>();
  const onMobileGrid = new Map<HTMLElement, boolean>();
  const recs = new Map<HTMLElement, Rec>();
  const pointer = win.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches;
  const widthOf = (el: HTMLElement) => el.getBoundingClientRect().width;
  // World stages switch grid by their own width; the hero switches by the viewport (spec clarification 2).
  const gridIsMobile = (stage: HTMLElement) =>
    stage.dataset.tier === "hero" ? win.matchMedia("(max-width: 767px)").matches : widthOf(stage) < STAGE_GRID_SWITCH;
  let gsap: Gsap | undefined;
  let disposed = false;

  for (const stage of stages) {
    onMobileGrid.set(stage, gridIsMobile(stage));
    const loader = registry[stage.dataset.scene ?? ""];
    if (loader) recs.set(stage, { stage, loader, loading: false, entered: false, width: 0 });
  }

  const prepare = (rec: Rec) => {
    if (!rec.choreo || !gsap) return;
    const skipEntrance = rec.entered || visible.has(rec.stage);
    rec.width = widthOf(rec.stage);
    rec.handle = rec.choreo(rec.stage, { gsap, mobile: rec.width < STAGE_GRID_SWITCH, pointer, skipEntrance });
    if (skipEntrance) {
      rec.entered = true;
      rec.handle.enter();
    }
  };

  // Visible at all: drives .paused for every stage (worlds, vignettes, hero, contact strip).
  const visibility = new win.IntersectionObserver((entries) => {
    for (const entry of entries) {
      const stage = entry.target as HTMLElement;
      if (entry.isIntersecting) visible.add(stage);
      else visible.delete(stage);
      stage.classList.toggle("paused", !entry.isIntersecting);
    }
  });

  // Near: load GSAP + the world's choreography, then prepare it.
  const near = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const rec = recs.get(entry.target as HTMLElement);
        if (!entry.isIntersecting || !rec || rec.loading) continue;
        rec.loading = true;
        near.unobserve(rec.stage);
        Promise.all([loadGsap(), rec.loader()]).then(
          ([g, mod]) => {
            if (disposed) return;
            gsap = g.gsap;
            rec.choreo = mod.default;
            prepare(rec);
          },
          (error: unknown) => {
            console.warn(`[motion] ${rec.stage.dataset.scene}: choreography failed to load, keeping the static scene`, error);
          },
        );
      }
    },
    { rootMargin: NEAR },
  );

  // In view: play the entrance of a prepared world.
  const enter = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const rec = recs.get(entry.target as HTMLElement);
        if (!entry.isIntersecting || !rec?.handle || rec.entered) continue;
        rec.entered = true;
        rec.handle.enter();
      }
    },
    { rootMargin: ENTER },
  );

  for (const stage of stages) {
    visibility.observe(stage);
    if (recs.has(stage)) {
      near.observe(stage);
      enter.observe(stage);
    }
  }

  // Width changes (rotation, resize) can cross the grid switch, and choreographies measure in pixels:
  // clean up and prepare again on the new size. A world already entered keeps its end state.
  let timer = 0;
  const resize = new win.ResizeObserver(() => {
    win.clearTimeout(timer);
    timer = win.setTimeout(() => {
      for (const stage of stages) onMobileGrid.set(stage, gridIsMobile(stage));
      for (const rec of recs.values()) {
        if (!rec.handle || Math.abs(widthOf(rec.stage) - rec.width) < 1) continue;
        rec.handle.cleanup();
        rec.handle = undefined;
        prepare(rec);
      }
    }, 200);
  });
  for (const stage of stages) resize.observe(stage);

  if (pointer) teardown.push(startPointer(win, stages, (stage) => visible.has(stage) && !onMobileGrid.get(stage)));

  teardown.push(() => {
    disposed = true;
    visibility.disconnect();
    near.disconnect();
    enter.disconnect();
    resize.disconnect();
    win.clearTimeout(timer);
    for (const rec of recs.values()) rec.handle?.cleanup();
    for (const stage of stages) stage.classList.remove(...STATE_CLASSES);
  });
  return stop;
}
