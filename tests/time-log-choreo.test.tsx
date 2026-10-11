// @vitest-environment jsdom
import { gsap } from "gsap";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { registry } from "@/motion/registry";
import type { SceneEnv } from "@/motion/types";
import choreo from "@/scenes/time-log/choreo";
import { TimeLogScene } from "@/scenes/time-log/Scene";
import { finishAllTweens, setWidth } from "./helpers";

const project = fullProjects.find((p) => p.slug === "time-log")!;
const markup = renderToStaticMarkup(<TimeLogScene project={project} />);

function mount(width = 820) {
  document.body.innerHTML = markup;
  const root = document.querySelector<HTMLElement>('[data-scene="time-log"]') as HTMLElement;
  setWidth(root, width);
  return root;
}
const env = (skipEntrance: boolean, mobile = false): SceneEnv => ({ gsap, mobile, pointer: false, skipEntrance });
const entranceTimeline = () => gsap.globalTimeline.getChildren(false, false, true)[0];

describe("time-log choreography", () => {
  beforeEach(() => {
    gsap.globalTimeline.clear();
  });

  it("is the registered time-log choreography", async () => {
    expect((await registry["time-log"]()).default).toBe(choreo);
  });

  it("counts the total up from 0:00 and restores the server text on cleanup", () => {
    const root = mount();
    const total = root.querySelector(".total") as HTMLElement;
    const handle = choreo(root, env(false));
    expect(total.textContent).toBe("0:00");
    handle.enter();
    finishAllTweens(gsap);
    expect(total.textContent).toBe("6:54");
    expect(root.classList.contains("live")).toBe(true);
    expect(root.querySelector(".typing")?.classList.contains("on")).toBe(true);
    handle.cleanup();
    expect(total.textContent).toBe("6:54");
    expect(root.querySelector(".typing")?.classList.contains("on")).toBe(false);
  });

  it("leaves the total alone when skipping the entrance", () => {
    const root = mount();
    const handle = choreo(root, env(true));
    expect(root.querySelector(".total")?.textContent).toBe("6:54");
    handle.enter();
    expect(root.classList.contains("live")).toBe(true);
    handle.cleanup();
  });

  it("flies a chip into the sheet per bubble and removes any left over on cleanup", () => {
    const root = mount();
    const handle = choreo(root, env(false));
    handle.enter();
    entranceTimeline().time(1.7); // past the first bubble's flight start (1.6 s)
    expect(root.querySelectorAll(".layer-fg .mouse > .chip")).toHaveLength(1);
    handle.cleanup();
    expect(root.querySelectorAll(".chip")).toHaveLength(0);
  });

  it("flies only the bubbles shown on the mobile grid", () => {
    const root = mount(358);
    const handle = choreo(root, env(false, true));
    handle.enter();
    entranceTimeline().time(1.6 + 3 * 0.55 + 0.05); // all four mobile flights have started
    expect(root.querySelectorAll(".chip")).toHaveLength(4);
    handle.cleanup();
  });
});
