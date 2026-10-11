import type { Choreo } from "@/motion/types";

/** Interim entrance for worlds still on the basic scene: the mascot pops up, then the loops start. */
const choreo: Choreo = (root, { gsap, skipEntrance }) => {
  const mascot = root.querySelector<HTMLElement>('[data-part="mascot"]');
  if (mascot && !skipEntrance) gsap.set(mascot, { y: 48, scale: 0.6 });

  return {
    name: "choreo:basic",
    enter() {
      if (!mascot || skipEntrance) {
        root.classList.add("live");
        return;
      }
      gsap.to(mascot, { y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)", onComplete: () => root.classList.add("live") });
    },
    cleanup() {
      if (mascot) {
        gsap.killTweensOf(mascot);
        gsap.set(mascot, { clearProps: "transform" });
      }
      root.classList.remove("live");
    },
  };
};

export default choreo;
