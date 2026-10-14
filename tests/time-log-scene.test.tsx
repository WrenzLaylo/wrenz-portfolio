import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { fullScenes } from "@/scenes";
import { TimeLogScene } from "@/scenes/time-log/Scene";
import { cssBlock, cssRule, designTranslate } from "./helpers";

const project = fullProjects.find((p) => p.slug === "time-log")!;
const doc = new JSDOM(`<body>${renderToStaticMarkup(<TimeLogScene project={project} />)}</body>`).window.document;
const stage = doc.querySelector<HTMLElement>('[data-scene="time-log"]') as HTMLElement;

describe("time-log scene", () => {
  it("is the registered time-log scene, named by its illustration label", () => {
    expect(fullScenes["time-log"]).toBe(TimeLogScene);
    expect(stage.getAttribute("role")).toBe("img");
    expect(stage.getAttribute("aria-label")).toBe(project.illustrationLabel);
  });

  it("builds the sheet from rows of nine cells, three of them desktop-only", () => {
    const rows = [...stage.querySelectorAll(".sh-row")];
    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.children, row.textContent ?? "").toHaveLength(9);
      expect([...row.children].filter((c) => c.classList.contains("g-d"))).toHaveLength(3);
    }
  });

  it("pairs every chat bubble with its cell, and hides the arrival pair together on the mobile grid", () => {
    const bubbles = [...stage.querySelectorAll<HTMLElement>(".bubble[data-cell]")];
    expect(bubbles.map((b) => b.dataset.cell)).toEqual(["arr", "start", "lunch", "back", "out"]);
    for (const bubble of bubbles) {
      const cell = stage.querySelector(`[data-slot="${bubble.dataset.cell}"]`);
      expect(cell?.querySelector(".v")?.textContent, bubble.dataset.cell).toBeTruthy();
      expect(cell?.querySelector(".flash")).not.toBeNull();
      expect(cell?.classList.contains("g-d")).toBe(bubble.classList.contains("g-d"));
      expect(bubble.querySelector(".ok use")?.getAttribute("href")).toBe("#i-check");
    }
  });

  it("renders the finished week: Friday's total reads 6:54", () => {
    expect(stage.querySelector(".total")?.textContent).toBe("6:54");
  });

  it("names every part the choreography needs", () => {
    for (const part of ["win", "win-copy", "backed", "badge", "hour", "minute"]) expect(stage.querySelectorAll(`[data-part="${part}"]`), part).toHaveLength(1);
    expect(stage.querySelectorAll(".burst i")).toHaveLength(6);
    expect(stage.querySelector(".typing")?.classList.contains("g-d")).toBe(true);
    expect(stage.querySelector(".layer-fg .mouse")).not.toBeNull();
  });

  // Phase 3 MUST-FIX 3: the backup sheet behind the window was the only outlined object in the finished
  // scenes (spec §4: two tones, no outlines), and its offset pushed it past the stage's right edge, which
  // clipped it. It is a flat two-tone sticker now and ends at least 8 design px inside the stage.
  describe("the backup sheet", () => {
    const css = readFileSync("src/scenes/time-log/scene.css", "utf8");
    const desktop = cssRule(css, '[data-scene="time-log"] .win-copy');
    const mobile = cssRule(cssBlock(css, "@container stage (width < 760px)") ?? "", '[data-scene="time-log"] .win-copy');

    it("has no outline, only a flat bottom shade", () => {
      for (const [property] of desktop ?? []) expect(property).not.toMatch(/^(border(?!-radius)|outline)/);
      for (const [property] of mobile ?? []) expect(property).not.toMatch(/^(border(?!-radius)|outline)/);
      expect(desktop?.get("box-shadow")).toBe("0 calc(6 * var(--u)) 0 #E3D6BF");
    });

    it("ends at least 8 design px inside the stage on both grids", () => {
      const wrap = stage.querySelector<HTMLElement>(".win-wrap") as HTMLElement;
      const v = (el: HTMLElement, name: string) => Number(el.style.getPropertyValue(name));
      expect(v(wrap, "--x") + v(wrap, "--w") + designTranslate(desktop)[0]).toBeLessThanOrEqual(v(stage, "--dw") - 8);
      expect(v(wrap, "--mx") + v(wrap, "--mw") + designTranslate(mobile)[0]).toBeLessThanOrEqual(v(stage, "--mdw") - 8);
    });
  });

  it("marks the time-based loops with .loop", () => {
    expect(stage.querySelector(".hand-s")?.classList.contains("loop")).toBe(true);
    for (const dot of stage.querySelectorAll(".typing .dots i")) expect(dot.classList.contains("loop")).toBe(true);
    for (const cloud of stage.querySelectorAll(".cloud")) expect(cloud.classList.contains("loop")).toBe(true);
  });
});
