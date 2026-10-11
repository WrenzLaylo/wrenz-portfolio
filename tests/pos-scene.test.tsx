import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { fullScenes } from "@/scenes";
import { PosScene } from "@/scenes/pos/Scene";

const project = fullProjects.find((p) => p.slug === "pos")!;
const doc = new JSDOM(`<body>${renderToStaticMarkup(<PosScene project={project} />)}</body>`).window.document;
const stage = doc.querySelector<HTMLElement>('[data-scene="pos"]') as HTMLElement;

describe("POS scene", () => {
  it("is the registered POS scene", () => {
    expect(fullScenes.pos).toBe(PosScene);
  });

  it("shows the counter on the desktop grid and the rail on the mobile grid, both with the real alt text", () => {
    const counter = stage.querySelector('img[src="/work/pos/counter.webp"]');
    const rail = stage.querySelector('img[src="/work/pos/rail.webp"]');
    expect(counter?.classList.contains("shot-d")).toBe(true);
    expect(rail?.classList.contains("shot-m")).toBe(true);
    expect(counter?.getAttribute("alt")).toBe(project.shot?.alt);
    expect(rail?.getAttribute("alt")).toBe(project.shot?.alt);
  });

  it("keeps the saved-sale strips decorative", () => {
    const saved = stage.querySelector(".screen-saved") as HTMLElement;
    expect(saved.getAttribute("aria-hidden")).toBe("true");
    expect([...saved.querySelectorAll("img")].map((i) => i.getAttribute("alt"))).toEqual(["", ""]);
  });

  it("lets the pig react to the pointer from a hidden, non-inert layer", () => {
    const pig = stage.querySelector('[data-part="pig"]') as HTMLElement;
    expect(pig.hasAttribute("data-interactive")).toBe(true);
    const layer = pig.closest(".layer") as HTMLElement;
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    expect(layer.hasAttribute("inert")).toBe(false);
  });

  it("names every part the choreography needs", () => {
    for (const part of ["laptop", "pig", "pig-inner", "pig-head", "sack"]) expect(stage.querySelectorAll(`[data-part="${part}"]`), part).toHaveLength(1);
    expect(stage.querySelectorAll('[data-part="burst"]')).toHaveLength(3);
    expect(stage.querySelectorAll(".pig-leg.leg-a")).toHaveLength(2);
    expect(stage.querySelectorAll(".pig-leg.leg-b")).toHaveLength(2);
    expect(stage.querySelectorAll(".pig-ear")).toHaveLength(2);
    expect(stage.querySelectorAll(".pig-eye")).toHaveLength(2);
  });

  it("keeps the legs out of the SVG, so the walk-in never tweens SVG internals", () => {
    for (const leg of stage.querySelectorAll(".pig-leg")) expect(leg.closest("svg")).toBeNull();
  });

  it("marks every looping element with .loop", () => {
    const loops = [".pellet", ".coin:not(.coin-burst)", ".coin:not(.coin-burst) .coin-y", ".jar", ".sack", ".pig-tail", ".pig-head", ".pig-jaw", ".screen-saved", ".cloud"];
    for (const selector of loops) {
      const found = [...stage.querySelectorAll(selector)];
      expect(found.length, selector).toBeGreaterThan(0);
      for (const el of found) expect(el.classList.contains("loop"), selector).toBe(true);
    }
  });

  it("hides the sack and jar lettering on the mobile grid", () => {
    for (const text of stage.querySelectorAll("text")) expect(text.classList.contains("g-d")).toBe(true);
  });
});
