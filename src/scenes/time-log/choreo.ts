import type { Choreo } from "@/motion/types";
import { backOut, canAnimate, EASE, entrance, px } from "@/motion/waapi";

// GSAP's timeline, in ms after enter(): bubble i's chip takes off at FLY(i) and lands 0.64 s later; the
// clock sweeps to each posted time in 0.55 s from its landing (landings are 0.55 s apart).
const FLY = (i: number) => 1600 + i * 550;
const LAND = (i: number) => FLY(i) + 640;
const FLIGHT = 740;
const SWEEP = 550;

// The chip's path mixes eases per axis (GSAP tweened x and y separately), so it is sampled into one
// keyframe per 20 ms; these are GSAP's curves for that.
const power1InOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2);
const power1Out = (p: number) => 1 - (1 - p) ** 2;
const power2Out = (p: number) => 1 - (1 - p) ** 3;
const power2In = (p: number) => p ** 3;
const back2Out = (p: number) => (p - 1) ** 2 * (3 * (p - 1) + 2) + 1;

/** AGG Doors time-log: the window rises, the chat bubbles pop in, each posted time flies into its cell
 *  as a chip while the clock sweeps to it, then the total appears, "Read-back OK" pops and the typing
 *  bubble appears. .live is added at the end. Every animation of the entrance spans the whole entrance
 *  (src/motion/waapi.ts entrance()), so the page re-layerizes for its start and its end, not per tween. */
const choreo: Choreo = (root, { mobile, skipEntrance }) => {
  const one = (selector: string) => root.querySelector<HTMLElement>(selector);
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  const u = root.getBoundingClientRect().width / (mobile ? 358 : 820);

  const total = one(".total");
  const layer = one(".layer-fg .mouse");
  // Desktop-only parts (.g-d) are not shown on the mobile grid, so they take no part there.
  const shown = (el: HTMLElement) => !(mobile && el.classList.contains("g-d"));
  const bubbles = all(".bubble[data-cell]").filter(shown);
  const cells = bubbles.map((b) => one(`[data-slot="${b.dataset.cell}"]`));
  const values = cells.map((c) => c?.querySelector<HTMLElement>(".v") ?? null);
  const typingEl = one(".typing");
  const typing = typingEl && shown(typingEl) ? typingEl : null;
  const serverTotal = total?.textContent ?? "";
  const last = Math.max(bubbles.length - 1, 0);
  const done = LAND(last); // the last chip lands
  // GSAP's finish() came 1.85 s after the last landing.
  const intro = entrance(done + 1850);
  const timers: Array<ReturnType<typeof setTimeout>> = [];
  // Without the Web Animations API the scene keeps its server end state, total included.
  const animate = !skipEntrance && canAnimate(root);
  let ended = false;

  const pop = (scale: number): Keyframe[] => [
    { transform: `scale(${scale})`, opacity: 0 },
    { transform: "scale(1)", opacity: 1 },
  ];
  const fadeIn: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

  if (animate) {
    const copyEnd = mobile ? { x: 12, y: -14 } : { x: 24, y: -24 };
    intro.add(one('[data-part="win"]'), [{ transform: `translateY(${px(30 * u)})` }, { transform: "translateY(0px)" }], { dur: 600, ease: EASE.power3Out });
    intro.add(one('[data-part="win-copy"]'), [{ transform: "translate(0px, 0px)" }, { transform: `translate(${px(copyEnd.x * u)}, ${px(copyEnd.y * u)})` }], {
      at: 1000,
      dur: 400,
      ease: EASE.power2Out,
    });
    intro.add(one('[data-part="backed"]'), pop(0), { at: 1200, dur: 350, ease: backOut(2) });
    bubbles.forEach((bubble, i) => {
      intro.add(bubble, pop(0.4), { at: 300 + i * 120, dur: 400, ease: backOut(2) });
      intro.add(bubble.querySelector(".ok"), pop(0), { at: FLY(i), dur: 300, ease: backOut(2.5) });
      intro.add(values[i], fadeIn, { at: LAND(i), dur: 250, ease: EASE.power1Out });
      // The flash is CSS opacity 0 until its landing, then jumps to 0.9 and fades.
      intro.add(cells[i]?.querySelector(".flash"), [{ opacity: 0.9 }, { opacity: 0 }], { at: LAND(i), dur: 500, ease: EASE.power1Out, before: { opacity: 0 } });
    });

    // The clock: minutes since midnight drive both hands, from 7:00 through each posted time; the minute
    // hand always moves forward the short way. One animation per hand, one 0.55 s sweep per landing.
    if (bubbles.length) {
      const hours = [7 * 60 * 0.5];
      const minutes = [0];
      for (const bubble of bubbles) {
        const [h, m] = (bubble.dataset.time ?? "15:00").split(":").map(Number);
        const t = h * 60 + m;
        const minute = minutes[minutes.length - 1];
        minutes.push(minute + (((((t % 60) * 6 - (minute % 360)) % 360) + 360) % 360));
        hours.push(t * 0.5);
      }
      const hand = (angles: number[]): Keyframe[] => angles.map((a, k) => ({ transform: `rotate(${a}deg)`, offset: k / bubbles.length }));
      const sweep = { at: LAND(0), dur: SWEEP * bubbles.length, ease: EASE.power2InOut };
      intro.add(one('[data-part="hour"]'), hand(hours), sweep);
      intro.add(one('[data-part="minute"]'), hand(minutes), sweep);
    }

    intro.add(one('[data-part="badge"]'), pop(0), { at: done + 950, dur: 500, ease: backOut(2.2) });
    const dots = all(".burst i");
    dots.forEach((dot, k) => {
      const angle = (k / dots.length) * Math.PI * 2 - Math.PI / 2;
      const to = `translate(${px(Math.cos(angle) * 54 * u)}, ${px(Math.sin(angle) * 40 * u)}) scale(0.4)`;
      intro.add(dot, [{ transform: "translate(0px, 0px) scale(1)", opacity: 1 }, { transform: to, opacity: 0 }], { at: done + 1000, dur: 600, ease: EASE.power2Out });
    });
    intro.add(typing, fadeIn, { at: done + 1500, dur: 300, ease: EASE.power1Out });
    if (total) total.textContent = "0:00";
  }

  const setTotal = (text: string) => {
    // A text change costs a full re-layerization, so it is written only when it differs.
    if (total && total.textContent !== text) total.textContent = text;
  };

  // The flights. A chip with the posted time arcs from each bubble into its cell. Layout is read once,
  // when the first chip takes off (all reads, then all writes), and every chip is created then, holding
  // invisible until its own take-off; each path is one sampled transform/opacity animation.
  const fly = () => {
    if (ended || !layer) return;
    const box = layer.getBoundingClientRect();
    const legs = bubbles.map((bubble, i) => {
      const cell = cells[i];
      const value = values[i];
      if (!cell || !value) return null;
      const from = bubble.getBoundingClientRect();
      const to = cell.getBoundingClientRect();
      const ox = from.left + from.width * 0.66;
      const oy = from.top + from.height / 2;
      return { i, text: value.textContent, ox, oy, dx: to.left + to.width / 2 - ox, dy: to.top + to.height / 2 - oy };
    });
    const chips = legs.map((leg) => {
      if (!leg) return null;
      const chip = root.ownerDocument.createElement("span");
      chip.className = "chip";
      chip.textContent = leg.text;
      layer.appendChild(chip);
      return chip;
    });
    const sizes = chips.map((chip) => (chip ? [chip.offsetWidth, chip.offsetHeight] : [0, 0]));
    legs.forEach((leg, n) => {
      const chip = chips[n];
      if (!leg || !chip) return;
      chip.style.left = px(leg.ox - box.left - sizes[n][0] / 2);
      chip.style.top = px(leg.oy - box.top - sizes[n][1] / 2);
      const peak = Math.min(0, leg.dy) - 56 * u;
      const STEPS = 37;
      const keyframes: Keyframe[] = Array.from({ length: STEPS + 1 }, (_, k) => {
        const t = (k / STEPS) * (FLIGHT / 1000); // seconds into the flight
        // GSAP: x over 0.7 s (power1.inOut); y up for 0.32 s (power2.out), then down for 0.38 s (power2.in);
        // scale 0.5 → 1 and opacity in over 0.16 s (back.out(2)); scale to 0.7 and fade out from 0.62 s (0.12 s).
        const x = t < 0.7 ? leg.dx * power1InOut(t / 0.7) : leg.dx;
        const y = t < 0.32 ? peak * power2Out(t / 0.32) : t < 0.7 ? peak + (leg.dy - peak) * power2In((t - 0.32) / 0.38) : leg.dy;
        const grow = back2Out(Math.min(1, t / 0.16));
        const fade = t < 0.62 ? 0 : power1Out(Math.min(1, (t - 0.62) / 0.12));
        const scale = t < 0.16 ? 0.5 + 0.5 * grow : 1 - 0.3 * fade;
        const opacity = Math.max(0, Math.min(1, grow) * (1 - fade));
        return { transform: `translate(${px(x)}, ${px(y)}) scale(${Math.round(scale * 1e4) / 1e4})`, opacity: Math.round(opacity * 1e4) / 1e4 };
      });
      // fill both: hidden from its creation (its start can lie a frame in the future) until it is removed.
      intro.add(chip, keyframes, { at: FLY(leg.i), dur: FLIGHT }, { from: FLY(0), fill: "both" });
    });
  };

  const finish = () => {
    ended = true;
    for (const id of timers.splice(0)) clearTimeout(id);
    for (const chip of root.querySelectorAll(".chip")) chip.remove();
    setTotal(serverTotal);
    typing?.classList.add("on");
    root.classList.add("live");
  };

  return {
    name: "choreo:time-log",
    enter() {
      if (animate) {
        if (bubbles.length) timers.push(setTimeout(fly, FLY(0)));
        // GSAP counted the total up from 0:00 over 0.6 s; every text change costs a full re-layerization,
        // so the total appears in one step when the count-up would have ended.
        timers.push(setTimeout(() => setTotal(serverTotal), done + 900));
      }
      intro.play(finish);
    },
    cleanup() {
      ended = true;
      for (const id of timers.splice(0)) clearTimeout(id);
      intro.cancel();
      for (const chip of root.querySelectorAll(".chip")) chip.remove();
      setTotal(serverTotal);
      typing?.classList.remove("on");
      root.classList.remove("live");
    },
  };
};

export default choreo;
