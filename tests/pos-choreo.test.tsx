// @vitest-environment jsdom
import { gsap } from "gsap";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  describe("look-at-you flourish", () => {
    const proto = Element.prototype as unknown as { animate?: unknown };
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel, playState: "running" }));
    const fire = (el: Element) => el.dispatchEvent(new Event("animationiteration", { bubbles: true }));
    const live = (skip = true) => {
      const root = mount(820);
      const handle = choreo(root, env(skip));
      handle.enter();
      if (!skip) finishAllTweens(gsap);
      const head = root.querySelector<HTMLElement>('[data-part="pig-head"]') as HTMLElement;
      return { root, handle, head };
    };
    beforeEach(() => {
      animate.mockClear();
      cancel.mockClear();
      proto.animate = animate;
    });
    afterEach(() => {
      delete proto.animate;
    });

    it("runs once for the head's own animation and not for one bubbling from the jaw", () => {
      const { root, head, handle } = live();
      fire(root.querySelector(".pig-jaw") as Element);
      expect(animate).not.toHaveBeenCalled();
      fire(head);
      expect(animate).toHaveBeenCalledTimes(4); // two ears, two eyes
      handle.cleanup();
    });

    it("bails out while the stage is paused", () => {
      const { root, head, handle } = live();
      root.classList.add("paused");
      fire(head);
      expect(animate).not.toHaveBeenCalled();
      handle.cleanup();
    });

    it("does nothing, and throws nothing, where Element.animate is missing", () => {
      delete proto.animate;
      const { head, handle } = live();
      expect(() => fire(head)).not.toThrow();
      handle.cleanup();
    });

    it("cancels the running flourishes on cleanup", () => {
      const { head, handle } = live();
      fire(head);
      handle.cleanup();
      expect(cancel).toHaveBeenCalledTimes(4);
    });

    it("hops at once when the entrance is skipped", () => {
      const { root, handle } = live(true);
      const inner = root.querySelector<HTMLElement>('[data-part="pig-inner"]') as HTMLElement;
      (root.querySelector('[data-part="pig"]') as HTMLElement).dispatchEvent(new Event("pointerenter"));
      expect(gsap.getTweensOf(inner).length).toBeGreaterThan(0);
      handle.cleanup();
    });

    it("adds no duplicate listeners on a second prepare, enter and cleanup cycle", () => {
      const root = mount(820);
      const head = root.querySelector<HTMLElement>('[data-part="pig-head"]') as HTMLElement;
      const first = choreo(root, env(true));
      first.enter();
      first.cleanup();
      const second = choreo(root, env(true));
      second.enter();
      fire(head);
      expect(animate).toHaveBeenCalledTimes(4);
      second.cleanup();
    });
  });
});
