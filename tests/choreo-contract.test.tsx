// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fullProjects } from "@/content/projects";
import { registry } from "@/motion/registry";
import type { SceneEnv } from "@/motion/types";
import { fullScenes } from "@/scenes";
import { finishAll, installFakeWaapi, removeFakeWaapi, setWidth } from "./helpers";

/** What a choreography may change: classes, inline styles, appended elements and leaf text. Cleanup must
 *  restore all of it: every inline declaration (placement variables included) of every element. */
function snapshot(root: HTMLElement) {
  return [root, ...root.querySelectorAll<HTMLElement>("*")].map((el) => ({
    tag: el.tagName,
    cls: el.getAttribute("class") ?? "",
    style: Array.from(el.style, (p) => `${p}:${el.style.getPropertyValue(p)}`).sort().join(";"),
    text: el.childElementCount ? "" : (el.textContent ?? ""),
  }));
}

describe.each(fullProjects)("choreography for $slug", (project) => {
  const Scene = fullScenes[project.slug];
  const markup = renderToStaticMarkup(<Scene project={project} />);
  const mount = (mobile: boolean) => {
    document.body.innerHTML = markup;
    const root = document.querySelector<HTMLElement>(`[data-scene="${project.slug}"]`) as HTMLElement;
    setWidth(root, mobile ? 358 : 820);
    return root;
  };
  const env = (skipEntrance: boolean, mobile: boolean): SceneEnv => ({ mobile, pointer: false, skipEntrance });

  beforeEach(() => {
    installFakeWaapi();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    removeFakeWaapi();
  });

  for (const mobile of [false, true]) {
    const grid = mobile ? "mobile" : "desktop";

    it(`${grid}: names its handle choreo:<folder>`, async () => {
      const choreo = (await registry[project.slug]()).default;
      const handle = choreo(mount(mobile), env(true, mobile));
      expect(handle.name).toMatch(/^choreo:[a-z0-9-]+$/);
      handle.cleanup();
    });

    it(`${grid}: changes nothing when skipping the entrance, and enter() adds .live`, async () => {
      const root = mount(mobile);
      const before = snapshot(root);
      const handle = (await registry[project.slug]()).default(root, env(true, mobile));
      expect(snapshot(root)).toEqual(before);
      handle.enter();
      expect(root.classList.contains("live")).toBe(true);
      handle.cleanup();
      expect(snapshot(root)).toEqual(before);
    });

    it(`${grid}: plays the entrance to .live, and cleanup restores the server markup`, async () => {
      const root = mount(mobile);
      const before = snapshot(root);
      const handle = (await registry[project.slug]()).default(root, env(false, mobile));
      handle.enter();
      finishAll();
      expect(root.classList.contains("live")).toBe(true);
      handle.cleanup();
      expect(snapshot(root)).toEqual(before);
    });

    it(`${grid}: without the Web Animations API, keeps the server end state and goes live at once`, async () => {
      removeFakeWaapi();
      const root = mount(mobile);
      const before = snapshot(root);
      const handle = (await registry[project.slug]()).default(root, env(false, mobile));
      expect(snapshot(root)).toEqual(before);
      handle.enter();
      expect(root.classList.contains("live")).toBe(true);
      handle.cleanup();
      expect(snapshot(root)).toEqual(before);
    });
  }
});
