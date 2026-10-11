import { createFrameGate } from "./frame-gate";

type Mover = { el: HTMLElement; stage: HTMLElement; k: number; x: number; y: number };

const LIMIT = 18; // px
const EASE = 0.12;

/** Desktop pointer parallax: one pointermove listener; each animation frame writes `transform` to the
 *  `.mouse[data-k]` wrappers of active stages. Write-only: no layout reads per frame (the viewport centre
 *  is cached and refreshed on resize). Switches itself off for the session when frames run long. */
export function startPointer(win: Window, stages: HTMLElement[], isActive: (stage: HTMLElement) => boolean): () => void {
  const movers: Mover[] = stages.flatMap((stage) =>
    Array.from(stage.querySelectorAll<HTMLElement>(".mouse[data-k]"), (el) => ({ el, stage, k: Number(el.dataset.k), x: 0, y: 0 })),
  );
  const gate = createFrameGate();
  const clamp = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));
  let cx = win.innerWidth / 2;
  let cy = win.innerHeight / 2;
  let px = cx;
  let py = cy;
  let raf = 0;
  let last = 0;
  let off = false;

  const reset = () => {
    for (const m of movers) {
      m.el.style.transform = "";
      m.x = 0;
      m.y = 0;
    }
  };

  const step = (now: number) => {
    raf = 0;
    if (off) return;
    if (last && now - last < 100 && gate.record(now - last) === "off") {
      off = true;
      reset();
      return;
    }
    last = now;
    const dx = px - cx;
    const dy = py - cy;
    let moving = false;
    for (const m of movers) {
      if (!isActive(m.stage)) continue;
      const tx = clamp(dx * m.k);
      const ty = clamp(dy * m.k);
      m.x += (tx - m.x) * EASE;
      m.y += (ty - m.y) * EASE;
      if (Math.abs(tx - m.x) > 0.05 || Math.abs(ty - m.y) > 0.05) moving = true;
      else {
        m.x = tx;
        m.y = ty;
      }
      m.el.style.transform = `translate3d(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px,0)`;
    }
    if (moving) raf = win.requestAnimationFrame(step);
    else last = 0;
  };

  const onMove = (event: Event) => {
    if (off) return;
    px = (event as PointerEvent).clientX;
    py = (event as PointerEvent).clientY;
    if (!raf) raf = win.requestAnimationFrame(step);
  };
  const onResize = () => {
    cx = win.innerWidth / 2;
    cy = win.innerHeight / 2;
  };

  win.addEventListener("pointermove", onMove, { passive: true });
  win.addEventListener("resize", onResize);
  return () => {
    win.removeEventListener("pointermove", onMove);
    win.removeEventListener("resize", onResize);
    if (raf) win.cancelAnimationFrame(raf);
    reset();
  };
}
