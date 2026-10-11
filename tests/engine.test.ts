// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { startMotion } from "@/motion/engine";
import type { Choreo, ChoreoLoader, SceneEnv } from "@/motion/types";
import { FakeIO, FakeRO, fakeWindow, flush, mountStages, setWidth } from "./helpers";

const gsapStub = { gsap: {} as SceneEnv["gsap"] };
const NEAR = "50% 0px 50% 0px";
const ENTER = "0px 0px -15% 0px";
const observer = (rootMargin?: string) => FakeIO.all.find((o) => o.options.rootMargin === rootMargin) as FakeIO;

function recorder() {
  const envs: SceneEnv[] = [];
  const handles: { enter: Mock; cleanup: Mock }[] = [];
  const choreo: Choreo = (root, env) => {
    envs.push(env);
    const handle = {
      name: "choreo:test",
      enter: vi.fn(() => root.classList.add("live")),
      cleanup: vi.fn(() => root.classList.remove("live")),
    };
    handles.push(handle);
    return handle;
  };
  const loader = vi.fn<ChoreoLoader>(async () => ({ default: choreo }));
  return { envs, handles, loader };
}

const started: Array<() => void> = [];

function start(opts: { reduced?: boolean; pointer?: boolean } = {}, registry: Record<string, ChoreoLoader> = {}) {
  const win = fakeWindow(opts);
  const loadGsap = vi.fn(async () => gsapStub);
  const stop = startMotion({ doc: document, win, registry, loadGsap });
  started.push(stop);
  return { win, loadGsap, stop };
}

describe("startMotion", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  // Tests that do not call stop() must not leave a document click listener behind for the next test.
  afterEach(() => {
    for (const stop of started.splice(0)) stop();
  });

  it("closes the nav popover after a link tap, even with reduced motion", () => {
    mountStages("pos");
    const menu = document.getElementById("nav-menu") as HTMLElement;
    menu.hidePopover = vi.fn();
    const { stop } = start({ reduced: true });
    document.querySelector<HTMLAnchorElement>("#nav-menu a")?.click();
    expect(menu.hidePopover).toHaveBeenCalledOnce();
    expect(FakeIO.all).toHaveLength(0);
    stop();
  });

  it("loads only registered scenes, once, when they come within half a viewport", async () => {
    const [pos, hero] = mountStages("pos", "hero");
    const r = recorder();
    const { loadGsap } = start({}, { pos: r.loader });
    observer(NEAR).fire(hero, true);
    observer(NEAR).fire(pos, true);
    observer(NEAR).fire(pos, true);
    await flush();
    expect(r.loader).toHaveBeenCalledOnce();
    expect(loadGsap).toHaveBeenCalledOnce();
    expect(r.envs).toHaveLength(1);
  });

  it("enters a world prepared off-screen when it scrolls into view", async () => {
    const [pos] = mountStages("pos");
    const r = recorder();
    start({}, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    expect(r.envs[0].skipEntrance).toBe(false);
    expect(r.handles[0].enter).not.toHaveBeenCalled();
    observer(ENTER).fire(pos, true);
    observer(ENTER).fire(pos, true);
    expect(r.handles[0].enter).toHaveBeenCalledOnce();
    expect(pos.classList.contains("live")).toBe(true);
  });

  it("skips the entrance for a stage visible when its module arrives", async () => {
    const [pos] = mountStages("pos");
    const r = recorder();
    start({}, { pos: r.loader });
    observer(undefined).fire(pos, true);
    observer(NEAR).fire(pos, true);
    await flush();
    expect(r.envs[0].skipEntrance).toBe(true);
    expect(r.handles[0].enter).toHaveBeenCalledOnce();
  });

  it("tells the choreography which grid and pointer it is on", async () => {
    const [pos] = mountStages("pos");
    setWidth(pos, 500);
    const r = recorder();
    start({ pointer: true }, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    expect(r.envs[0].mobile).toBe(true);
    expect(r.envs[0].pointer).toBe(true);
  });

  it("pauses loops off-screen and resumes them on screen, for every stage", () => {
    const [pos, hero] = mountStages("pos", "hero");
    start({}, {});
    observer(undefined).fire(pos, false);
    observer(undefined).fire(hero, false);
    expect(pos.classList.contains("paused")).toBe(true);
    expect(hero.classList.contains("paused")).toBe(true);
    observer(undefined).fire(pos, true);
    expect(pos.classList.contains("paused")).toBe(false);
  });

  it("leaves the end state alone when a module fails to load", async () => {
    const [pos] = mountStages("pos");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = vi.fn<ChoreoLoader>(async () => {
      throw new Error("chunk 404");
    });
    start({}, { pos: failing });
    observer(NEAR).fire(pos, true);
    await flush();
    observer(ENTER).fire(pos, true);
    expect(pos.classList.contains("live")).toBe(false);
    expect(pos.getAttribute("style")).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("re-prepares a stage whose width changes", async () => {
    const [pos] = mountStages("pos");
    const r = recorder();
    start({}, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    observer(ENTER).fire(pos, true);
    FakeRO.all[0].fire(); // same width: nothing happens
    expect(r.envs).toHaveLength(1);
    setWidth(pos, 500);
    FakeRO.all[0].fire();
    expect(r.handles[0].cleanup).toHaveBeenCalledOnce();
    expect(r.envs).toHaveLength(2);
    expect(r.envs[1]).toMatchObject({ mobile: true, skipEntrance: true });
    expect(r.handles[1].enter).toHaveBeenCalledOnce();
    expect(pos.classList.contains("live")).toBe(true);
  });

  it("never prepares after stop, even if the module arrives later", async () => {
    const [pos] = mountStages("pos");
    const r = recorder();
    let release: () => void = () => {};
    const slow = vi.fn<ChoreoLoader>(() => new Promise((resolve) => { release = () => resolve(r.loader()); }));
    const { stop } = start({}, { pos: slow });
    observer(NEAR).fire(pos, true);
    stop();
    release();
    await flush();
    await flush();
    expect(r.envs).toHaveLength(0);
  });

  it("stops cleanly and starts again", async () => {
    const [pos] = mountStages("pos");
    const menu = document.getElementById("nav-menu") as HTMLElement;
    menu.hidePopover = vi.fn();
    const r = recorder();
    const first = start({}, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    observer(ENTER).fire(pos, true);
    observer(undefined).fire(pos, false);
    first.stop();
    expect(r.handles[0].cleanup).toHaveBeenCalledOnce();
    expect([...pos.classList]).toEqual(["stage"]);
    expect(FakeIO.all.every((o) => o.disconnected)).toBe(true);
    document.querySelector<HTMLAnchorElement>("#nav-menu a")?.click();
    expect(menu.hidePopover).not.toHaveBeenCalled();

    const second = start({}, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    observer(ENTER).fire(pos, true);
    expect(r.handles[1].enter).toHaveBeenCalledOnce();
    expect(pos.classList.contains("live")).toBe(true);
    second.stop();
  });

  it("moves only visible desktop-grid stages with the pointer", () => {
    const [pos, time] = mountStages("pos", "time-log");
    const { win, stop } = start({ pointer: true }, {});
    observer(undefined).fire(pos, true);
    observer(undefined).fire(time, false);
    win.emit("pointermove", { clientX: 1440, clientY: 900 });
    win.runFrames(5);
    const moved = (stage: HTMLElement) => (stage.querySelector(".mouse") as HTMLElement).style.transform;
    expect(moved(pos)).toMatch(/^translate3d\(/);
    expect(moved(time)).toBe("");
    stop();
    expect(moved(pos)).toBe("");
    expect(win.listenerCount("pointermove")).toBe(0);
  });
});
