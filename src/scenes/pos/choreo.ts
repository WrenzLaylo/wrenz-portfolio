import type { Choreo } from "@/motion/types";

// Distances in design px for each grid (from the slice). The CSS loops read the first five as pixels.
const DESKTOP = { fall: 84, drift: 22, cx: 196, cu: 86, cd: 80, walk: -640, drop: -360 };
const MOBILE = { fall: 26, drift: 12, cx: 142, cu: 40, cd: 62, walk: -320, drop: -200 };
const LOOP_VARS = ["fall", "drift", "cx", "cu", "cd"] as const;

/** Pig Feeds POS: the laptop rises, the pig walks in, the sack drops and starts pouring; then .live
 *  starts the CSS loops. Hover or tap the pig and it hops while three coins pop out. */
const choreo: Choreo = (root, { gsap, mobile, skipEntrance }) => {
  const one = (selector: string) => root.querySelector<HTMLElement>(selector);
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  const D = mobile ? MOBILE : DESKTOP;
  const u = root.getBoundingClientRect().width / (mobile ? 358 : 820);

  const laptop = one('[data-part="laptop"]');
  const pig = one('[data-part="pig"]');
  const inner = one('[data-part="pig-inner"]');
  const head = one('[data-part="pig-head"]');
  const sack = one('[data-part="sack"]');
  const legsA = all(".pig-leg.leg-a");
  const legsB = all(".pig-leg.leg-b");
  const ears = all(".pig-ear");
  const eyes = all(".pig-eye");
  const burst = all('[data-part="burst"]');
  const targets = [laptop, pig, inner, sack, ...legsA, ...legsB, ...burst].filter((el): el is HTMLElement => el !== null);

  let ready = false;
  let hopping = false;
  let entrance: { kill(): unknown } | undefined;
  const owned: Array<{ kill(): unknown }> = [];
  let flourishes: Animation[] = [];

  if (!skipEntrance) {
    if (laptop) gsap.set(laptop, { y: 40 * u });
    if (pig) gsap.set(pig, { x: D.walk * u });
    if (sack) gsap.set(sack, { y: D.drop * u, rotation: 40, autoAlpha: 0 });
    if (legsA.length) gsap.set(legsA, { rotation: -14 });
    if (legsB.length) gsap.set(legsB, { rotation: 14 });
  }

  const goLive = () => {
    root.classList.add("live");
    ready = true;
  };

  // Each eat cycle, once the head is back up, the ears flick and the eyes blink twice. Short WAAPI
  // flourishes, skipped off-screen and where Element.animate is missing.
  const lookAtYou = () => {
    if (root.classList.contains("paused")) return;
    flourishes = flourishes.filter((a) => a.playState !== "finished");
    ears.forEach((ear, k) => {
      if (typeof ear.animate !== "function") return;
      flourishes.push(
        ear.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(0deg)" }], {
          duration: 260,
          delay: 4850 + k * 60,
          easing: "ease-in-out",
        }),
      );
    });
    for (const eye of eyes) {
      if (typeof eye.animate !== "function") continue;
      flourishes.push(
        eye.animate(
          [{ transform: "scaleY(1)" }, { transform: "scaleY(.1)" }, { transform: "scaleY(1)" }, { transform: "scaleY(.1)" }, { transform: "scaleY(1)" }],
          { duration: 300, delay: 5150, easing: "ease-in-out" },
        ),
      );
    }
  };

  const hop = () => {
    if (hopping || !ready || !inner) return;
    hopping = true;
    owned.push(
      gsap
        .timeline({ onComplete: () => { hopping = false; } })
        .to(inner, { y: -24 * u, duration: 0.18, ease: "power2.out" })
        .to(inner, { y: 0, duration: 0.4, ease: "bounce.out" }),
    );
    burst.forEach((coin, i) => {
      owned.push(
        gsap.fromTo(
          coin,
          { x: 0, y: 0, scale: 0.5, autoAlpha: 1 },
          {
            keyframes: [
              { x: (i - 1) * 46 * u, y: -86 * u, scale: 1, duration: 0.35, ease: "power2.out" },
              { y: -40 * u, autoAlpha: 0, duration: 0.35, ease: "power2.in" },
            ],
          },
        ),
      );
    });
  };

  head?.addEventListener("animationstart", lookAtYou);
  head?.addEventListener("animationiteration", lookAtYou);
  pig?.addEventListener("pointerenter", hop);
  pig?.addEventListener("pointerdown", hop);

  return {
    name: "choreo:pos",
    enter() {
      for (const key of LOOP_VARS) root.style.setProperty(`--${key}`, `${D[key] * u}px`);
      if (skipEntrance) {
        goLive();
        return;
      }
      const legs = [...legsA, ...legsB];
      const tl = gsap.timeline();
      if (laptop) tl.to(laptop, { y: 0, duration: 0.6, ease: "power3.out" }, 0);
      if (pig) tl.to(pig, { x: 0, duration: 0.9, ease: "power2.out" }, 0.3);
      if (legsA.length) tl.to(legsA, { rotation: 14, duration: 0.18, yoyo: true, repeat: 4, ease: "sine.inOut" }, 0.3);
      if (legsB.length) tl.to(legsB, { rotation: -14, duration: 0.18, yoyo: true, repeat: 4, ease: "sine.inOut" }, 0.3);
      if (legs.length) tl.to(legs, { rotation: 0, duration: 0.15 }, 1.2);
      if (sack) {
        tl.to(sack, { autoAlpha: 1, duration: 0.1 }, 0.35)
          .to(sack, { y: 0, duration: 0.7, ease: "bounce.out" }, 0.35)
          .to(sack, { rotation: 96, duration: 0.7, ease: "power2.out" }, 0.35);
      }
      tl.add(() => {
        // Hand the sack back to CSS (its resting rotate(96deg) and the wobble loop).
        if (sack) gsap.set(sack, { clearProps: "transform" });
        goLive();
      }, 1.1);
      entrance = tl;
    },
    cleanup() {
      entrance?.kill();
      for (const animation of owned.splice(0)) animation.kill();
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "transform,opacity,visibility" });
      for (const animation of flourishes) animation.cancel();
      flourishes = [];
      head?.removeEventListener("animationstart", lookAtYou);
      head?.removeEventListener("animationiteration", lookAtYou);
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
