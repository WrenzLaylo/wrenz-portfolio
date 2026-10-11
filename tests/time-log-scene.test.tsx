import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { fullScenes } from "@/scenes";
import { TimeLogScene } from "@/scenes/time-log/Scene";

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

  it("marks the time-based loops with .loop", () => {
    expect(stage.querySelector(".hand-s")?.classList.contains("loop")).toBe(true);
    for (const dot of stage.querySelectorAll(".typing .dots i")) expect(dot.classList.contains("loop")).toBe(true);
    for (const cloud of stage.querySelectorAll(".cloud")) expect(cloud.classList.contains("loop")).toBe(true);
  });
});
