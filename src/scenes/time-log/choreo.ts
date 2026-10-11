import type { Choreo } from "@/motion/types";

/** AGG Doors time-log: the window rises, the chat bubbles pop in, each posted time flies into its cell
 *  as a chip while the clock sweeps to it, then the total counts up, "Read-back OK" pops and the typing
 *  bubble appears. .live is added at the end. */
const choreo: Choreo = (root, { gsap, mobile, skipEntrance }) => {
  const one = (selector: string) => root.querySelector<HTMLElement>(selector);
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  const els = (...items: Array<HTMLElement | null | undefined>) => items.filter((el): el is HTMLElement => Boolean(el));
  const u = root.getBoundingClientRect().width / (mobile ? 358 : 820);

  const win = one('[data-part="win"]');
  const copy = one('[data-part="win-copy"]');
  const backed = one('[data-part="backed"]');
  const badge = one('[data-part="badge"]');
  const hourHand = one('[data-part="hour"]');
  const minuteHand = one('[data-part="minute"]');
  const total = one(".total");
  const dots = all(".burst i");
  const layer = one(".layer-fg .mouse");
  // Desktop-only parts (.g-d) are not shown on the mobile grid, so they take no part there.
  const shown = (el: HTMLElement) => !(mobile && el.classList.contains("g-d"));
  const bubbles = all(".bubble[data-cell]").filter(shown);
  const oks = bubbles.map((b) => b.querySelector<HTMLElement>(".ok"));
  const cells = bubbles.map((b) => one(`[data-slot="${b.dataset.cell}"]`));
  const values = cells.map((c) => c?.querySelector<HTMLElement>(".v") ?? null);
  const flashes = cells.map((c) => c?.querySelector<HTMLElement>(".flash") ?? null);
  const typingEl = one(".typing");
  const typing = typingEl && shown(typingEl) ? typingEl : null;
  const copyEnd = mobile ? { x: 12, y: -14 } : { x: 24, y: -24 };
  const serverTotal = total?.textContent ?? "";
  const targets = els(win, copy, backed, badge, hourHand, minuteHand, typing, ...dots, ...bubbles, ...oks, ...values, ...flashes);
  const owned: Array<{ kill(): unknown }> = [];
  let minuteAngle = 0;

  if (!skipEntrance) {
    gsap.set(els(win), { y: 30 * u });
    gsap.set(els(copy), { x: 0, y: 0 });
    gsap.set(els(backed, badge), { scale: 0, autoAlpha: 0 });
    gsap.set(bubbles, { scale: 0.4, autoAlpha: 0 });
    gsap.set(els(...oks), { scale: 0, autoAlpha: 0 });
    gsap.set(els(typing), { autoAlpha: 0 });
    gsap.set(els(...values), { autoAlpha: 0 });
    gsap.set(els(hourHand), { rotation: 7 * 60 * 0.5 }); // 7:00
    gsap.set(els(minuteHand), { rotation: 0 });
    if (total) total.textContent = "0:00";
  }

  const finish = () => {
    typing?.classList.add("on");
    root.classList.add("live");
  };

  // Minutes since midnight drive both hands; the minute hand always moves forward the short way.
  const sweepTo = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const t = h * 60 + m;
    minuteAngle += ((((t % 60) * 6 - (minuteAngle % 360)) % 360) + 360) % 360;
    if (minuteHand) owned.push(gsap.to(minuteHand, { rotation: minuteAngle, duration: 0.55, ease: "power2.inOut" }));
    if (hourHand) owned.push(gsap.to(hourHand, { rotation: t * 0.5, duration: 0.55, ease: "power2.inOut" }));
  };

  const land = (i: number, time: string, last: boolean) => {
    const value = values[i];
    const flash = flashes[i];
    if (value) owned.push(gsap.to(value, { autoAlpha: 1, duration: 0.25 }));
    if (flash) owned.push(gsap.fromTo(flash, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.5, ease: "power1.out" }));
    sweepTo(time);
    if (!last) return;
    const counter = { minutes: 0 };
    owned.push(
      gsap.to(counter, {
        minutes: 414,
        duration: 0.6,
        delay: 0.3,
        ease: "power1.out",
        onUpdate: () => {
          const m = Math.round(counter.minutes);
          if (total) total.textContent = `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
        },
      }),
    );
    if (badge) owned.push(gsap.to(badge, { scale: 1, autoAlpha: 1, duration: 0.5, delay: 0.95, ease: "back.out(2.2)" }));
    dots.forEach((dot, k) => {
      const angle = (k / dots.length) * Math.PI * 2 - Math.PI / 2;
      owned.push(
        gsap.fromTo(
          dot,
          { x: 0, y: 0, autoAlpha: 1, scale: 1 },
          { x: Math.cos(angle) * 54 * u, y: Math.sin(angle) * 40 * u, autoAlpha: 0, scale: 0.4, duration: 0.6, delay: 1.0, ease: "power2.out" },
        ),
      );
    });
    if (typing) owned.push(gsap.to(typing, { autoAlpha: 1, duration: 0.3, delay: 1.5 }));
    owned.push(gsap.delayedCall(1.85, finish));
  };

  // One-shot flight: a chip with the posted time arcs from the bubble into its cell. Layout is read once
  // per flight (not per frame); the chip removes itself when it lands.
  const fly = (bubble: HTMLElement, i: number) => {
    const cell = cells[i];
    const value = values[i];
    if (!layer || !cell || !value) return;
    const box = layer.getBoundingClientRect();
    const from = bubble.getBoundingClientRect();
    const to = cell.getBoundingClientRect();
    const chip = root.ownerDocument.createElement("span");
    chip.className = "chip";
    chip.textContent = value.textContent;
    layer.appendChild(chip);
    const ox = from.left + from.width * 0.66;
    const oy = from.top + from.height / 2;
    gsap.set(chip, { left: ox - box.left - chip.offsetWidth / 2, top: oy - box.top - chip.offsetHeight / 2 });
    const dx = to.left + to.width / 2 - ox;
    const dy = to.top + to.height / 2 - oy;
    const ok = oks[i];
    if (ok) owned.push(gsap.to(ok, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(2.5)" }));
    owned.push(
      gsap
        .timeline({ onComplete: () => chip.remove() })
        .fromTo(chip, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.16, ease: "back.out(2)" }, 0)
        .to(chip, { x: dx, duration: 0.7, ease: "power1.inOut" }, 0)
        .to(chip, { y: Math.min(0, dy) - 56 * u, duration: 0.32, ease: "power2.out" }, 0)
        .to(chip, { y: dy, duration: 0.38, ease: "power2.in" }, 0.32)
        .to(chip, { scale: 0.7, autoAlpha: 0, duration: 0.12 }, 0.62)
        .add(() => land(i, bubble.dataset.time ?? "15:00", i === bubbles.length - 1), 0.64),
    );
  };

  return {
    name: "choreo:time-log",
    enter() {
      if (skipEntrance) {
        finish();
        return;
      }
      const tl = gsap.timeline();
      if (win) tl.to(win, { y: 0, duration: 0.6, ease: "power3.out" }, 0);
      if (bubbles.length) tl.to(bubbles, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.12 }, 0.3);
      if (copy) tl.to(copy, { x: copyEnd.x * u, y: copyEnd.y * u, duration: 0.4, ease: "power2.out" }, 1.0);
      if (backed) tl.to(backed, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(2)" }, 1.2);
      bubbles.forEach((bubble, i) => tl.add(() => fly(bubble, i), 1.6 + i * 0.55));
      owned.push(tl);
    },
    cleanup() {
      for (const animation of owned.splice(0)) animation.kill();
      for (const chip of root.querySelectorAll(".chip")) chip.remove();
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "transform,opacity,visibility" });
      if (total) total.textContent = serverTotal;
      typing?.classList.remove("on");
      root.classList.remove("live");
      minuteAngle = 0;
    },
  };
};

export default choreo;
