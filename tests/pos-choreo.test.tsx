// @vitest-environment jsdom
import { gsap } from "gsap";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { registry } from "@/motion/registry";
import type { SceneEnv } from "@/motion/types";
import choreo from "@/scenes/pos/choreo";
import { PosScene } from "@/scenes/pos/Scene";
import { finishAllTweens, setWidth } from "./helpers";

const project = fullProjects.find((p) => p.slug === "pos")!;
const markup = renderToStaticMarkup(<PosScene project={project} />);

function mount(width = 820) {
  document.body.innerHTML = markup;
  const root = document.querySelector<HTMLElement>('[data-scene="pos"]') as HTMLElement;
  setWidth(root, width);
  return root;
}
const env = (skipEntrance: boolean, mobile = false): SceneEnv => ({ gsap, mobile, pointer: false, skipEntrance });

describe("POS choreography", () => {
  beforeEach(() => {
    gsap.globalTimeline.clear();
  });

  it("is the registered POS choreography", async () => {
    expect((await registry.pos()).default).toBe(choreo);
  });

  it("sets the loop distances in pixels on enter and removes them on cleanup", () => {
    const root = mount(820);
    const handle = choreo(root, env(true));
    expect(root.style.getPropertyValue("--fall")).toBe("");
    handle.enter();
    expect(root.style.getPropertyValue("--fall")).toBe("84px");
    expect(root.style.getPropertyValue("--cx")).toBe("196px");
    handle.cleanup();
    expect(root.style.getPropertyValue("--fall")).toBe("");
  });

  it("scales the distances to the mobile grid", () => {
    const root = mount(716); // two mobile design px per px
    const handle = choreo(root, env(true, true));
    handle.enter();
    expect(root.style.getPropertyValue("--fall")).toBe("52px");
    handle.cleanup();
  });

  it("starts the pig off-stage and the sack hidden when it has an entrance to play", () => {
    const root = mount(820);
    const handle = choreo(root, env(false));
    const pig = root.querySelector<HTMLElement>('[data-part="pig"]') as HTMLElement;
    const sack = root.querySelector<HTMLElement>('[data-part="sack"]') as HTMLElement;
    expect(pig.style.transform).toContain("-640px");
    expect(sack.style.visibility).toBe("hidden");
    handle.enter();
    finishAllTweens(gsap);
    expect(root.classList.contains("live")).toBe(true);
    expect(sack.style.visibility).not.toBe("hidden");
    handle.cleanup();
  });

  it("hops only once the scene is live", () => {
    const root = mount(820);
    const handle = choreo(root, env(false));
    const pig = root.querySelector<HTMLElement>('[data-part="pig"]') as HTMLElement;
    const inner = root.querySelector<HTMLElement>('[data-part="pig-inner"]') as HTMLElement;
    pig.dispatchEvent(new Event("pointerenter"));
    expect(gsap.getTweensOf(inner)).toHaveLength(0);
    handle.enter();
    finishAllTweens(gsap);
    pig.dispatchEvent(new Event("pointerenter"));
    expect(gsap.getTweensOf(inner).length).toBeGreaterThan(0);
    handle.cleanup();
    expect(gsap.getTweensOf(inner)).toHaveLength(0);
    expect(inner.style.transform).toBe("");
  });
});
