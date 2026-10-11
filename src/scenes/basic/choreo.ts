import type { Choreo } from "@/motion/types";
import { backOut, entrance } from "@/motion/waapi";

/** Interim entrance for worlds still on the basic scene: the mascot pops up, then the loops start. */
const choreo: Choreo = (root, { skipEntrance }) => {
  const mascot = root.querySelector<HTMLElement>('[data-part="mascot"]');
  const pop = entrance(600);
  if (!skipEntrance) {
    pop.add(mascot, [{ transform: "translateY(48px) scale(0.6)" }, { transform: "translateY(0px) scale(1)" }], { dur: 600, ease: backOut(1.7) });
  }

  return {
    name: "choreo:basic",
    enter() {
      pop.play(() => root.classList.add("live"));
    },
    cleanup() {
      pop.cancel();
      root.classList.remove("live");
    },
  };
};

export default choreo;
