import type { Choreo } from "@/motion/types";
import { bounce, EASE, entrance, px, tracker } from "@/motion/waapi";

// Distances in design px for each grid (from the slice). The CSS loops read the first five as pixels.
const DESKTOP = { fall: 84, drift: 22, cx: 196, cu: 86, cd: 80, walk: -640, drop: -360 };
const MOBILE = { fall: 26, drift: 12, cx: 142, cu: 40, cd: 62, walk: -320, drop: -200 };
const LOOP_VARS = ["fall", "drift", "cx", "cu", "cd"] as const;

// The entrance ends when the legs settle (0.3 + 5 × 0.18 + 0.15 s). GSAP added .live at 1.1 s, when the
// sack had landed; here .live comes with the end, so the loops start in the same frame the entrance ends.
const END = 1350;

/** A leg swings from ±14° to ∓14° and back, five 0.18 s swings (sine.inOut), then rests in 0.15 s. */
const legSwings = (from: number): Keyframe[] => [
  ...Array.from({ length: 6 }, (_, k) => ({
    transform: `rotate(${k % 2 ? -from : from}deg)`,
    offset: (k * 180) / 1050,
    easing: k < 5 ? EASE.sineInOut : EASE.power1Out,
  })),
  { transform: "rotate(0deg)", offset: 1 },
];

/** Pig Feeds POS: the laptop rises, the pig walks in, the sack drops and starts pouring; then .live
 *  starts the CSS loops. Hover or tap the pig and it hops while three coins pop out. */
const choreo: Choreo = (root, { mobile, skipEntrance }) => {
  const one = (selector: string) => root.querySelector<HTMLElement>(selector);
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  const D = mobile ? MOBILE : DESKTOP;
  const u = root.getBoundingClientRect().width / (mobile ? 358 : 820);

  const laptop = one('[data-part="laptop"]');
  const pig = one('[data-part="pig"]');
  const inner = one('[data-part="pig-inner"]');
  const sack = one('[data-part="sack"]');
  const burst = all('[data-part="burst"]');

  let ready = false;
  let hopping = false;
  const intro = entrance(END);
  const hops = tracker();

  if (!skipEntrance) {
    intro.add(laptop, [{ transform: `translateY(${px(40 * u)})` }, { transform: "translateY(0px)" }], { dur: 600, ease: EASE.power3Out });
    intro.add(pig, [{ transform: `translateX(${px(D.walk * u)})` }, { transform: "translateX(0px)" }], { at: 300, dur: 900, ease: EASE.power2Out });
    for (const leg of all(".pig-leg.leg-a")) intro.add(leg, legSwings(-14), { at: 300, dur: 1050 });
    for (const leg of all(".pig-leg.leg-b")) intro.add(leg, legSwings(14), { at: 300, dur: 1050 });
    // The sack rests at its CSS rotate(96deg). The individual translate and rotate properties compose with
    // that transform, so the sack starts at 40° and the CSS wobble loop takes over untouched.
    intro.add(sack, [{ opacity: 0 }, { opacity: 1 }], { at: 350, dur: 100, ease: EASE.power1Out });
    intro.add(sack, bounce((p) => ({ translate: `0px ${px(D.drop * u * (1 - p))}` })), { at: 350, dur: 700 });
    intro.add(sack, [{ rotate: "-56deg" }, { rotate: "0deg" }], { at: 350, dur: 700, ease: EASE.power2Out });
  }

  const goLive = () => {
    root.classList.add("live");
    ready = true;
  };

  const hop = () => {
    if (hopping || !ready || !inner) return;
    const lift = (p: number) => ({ transform: `translateY(${px(-24 * u * p)})` });
    // Up 24 px in 0.18 s (power2.out), down in 0.4 s (bounce.out).
    const up = hops.run(inner, [{ ...lift(0), offset: 0, easing: EASE.power2Out }, ...bounce((p) => lift(1 - p), 180 / 580, 1)], { duration: 580 }, () => {
      hopping = false;
    });
    if (!up) return;
    hopping = true;
    burst.forEach((coin, i) => {
      const x = px((i - 1) * 46 * u);
      hops.run(
        coin,
        [
          { transform: "translate(0px, 0px) scale(0.5)", opacity: 1, easing: EASE.power2Out },
          { transform: `translate(${x}, ${px(-86 * u)}) scale(1)`, opacity: 1, offset: 0.5, easing: EASE.power2In },
          { transform: `translate(${x}, ${px(-40 * u)}) scale(1)`, opacity: 0 },
        ],
        { duration: 700 },
      );
    });
  };

  pig?.addEventListener("pointerenter", hop);
  pig?.addEventListener("pointerdown", hop);

  return {
    name: "choreo:pos",
    enter() {
      for (const key of LOOP_VARS) root.style.setProperty(`--${key}`, `${D[key] * u}px`);
      intro.play(goLive);
    },
    cleanup() {
      intro.cancel();
      hops.cancel();
      pig?.removeEventListener("pointerenter", hop);
      pig?.removeEventListener("pointerdown", hop);
      for (const key of LOOP_VARS) root.style.removeProperty(`--${key}`);
      root.classList.remove("live");
      ready = false;
      hopping = false;
    },
  };
};

export default choreo;
