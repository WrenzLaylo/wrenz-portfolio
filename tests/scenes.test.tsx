import { existsSync, readdirSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sprite } from "@/components/Sprite";
import { compactProjects, fullProjects } from "@/content/projects";
import type { Project } from "@/content/types";
import { compactScenes, fullScenes } from "@/scenes";
import { STAGE_GRID_SWITCH } from "@/scenes/grid";

const FORBIDDEN = "h1, h2, h3, h4, h5, h6, button, a, table, th, form, input";
const spriteDoc = new JSDOM(renderToStaticMarkup(<Sprite />)).window.document;
const symbols = new Set([...spriteDoc.querySelectorAll("symbol")].map((s) => s.id));

function stageOf(markup: string, slug: string): HTMLElement {
  const doc = new JSDOM(`<body>${markup}</body>`).window.document;
  const stage = doc.querySelector<HTMLElement>(`[data-scene="${slug}"]`);
  if (!stage) throw new Error(`no [data-scene="${slug}"] root`);
  return stage;
}

function sharedChecks(stage: HTMLElement, project: Project, tier: string, limit: number) {
  it(`is a ${tier}-tier stage inside a size container`, () => {
    expect(stage.dataset.tier).toBe(tier);
    expect(stage.parentElement?.classList.contains("stage-c")).toBe(true);
  });

  it("contains no headings, buttons, links, tables or form fields", () => {
    expect(stage.querySelectorAll(FORBIDDEN)).toHaveLength(0);
  });

  it(`stays within ${limit} elements`, () => {
    expect(stage.querySelectorAll("*").length + 1).toBeLessThanOrEqual(limit);
  });

  it("hides decorative layers, and makes them inert unless they hold an interactive part", () => {
    for (const layer of stage.querySelectorAll(".layer")) {
      if (layer.getAttribute("aria-hidden") !== "true") continue;
      const interactive = layer.querySelector("[data-interactive]") !== null;
      expect(layer.hasAttribute("inert"), layer.className).toBe(!interactive);
    }
  });

  it("names its visual: the screenshot's alt text, or the illustration label", () => {
    if (project.shot) {
      const img = [...stage.querySelectorAll("img")].find((i) => i.getAttribute("src") === project.shot?.src);
      expect(img?.getAttribute("alt")).toBe(project.shot.alt);
      expect(img?.closest('[aria-hidden="true"]')).toBeNull();
    } else {
      expect(stage.getAttribute("role")).toBe("img");
      expect(stage.getAttribute("aria-label")).toBe(project.illustrationLabel);
    }
  });

  it("uses only sprite symbols that exist", () => {
    for (const use of stage.querySelectorAll("use")) {
      expect(symbols.has((use.getAttribute("href") ?? "").slice(1)), use.getAttribute("href") ?? "").toBe(true);
    }
  });

  it("gives every pointer wrapper a strength", () => {
    for (const m of stage.querySelectorAll(".mouse")) expect(Number(m.getAttribute("data-k"))).toBeGreaterThan(0);
  });
}

describe.each(fullProjects)("world scene $slug", (project) => {
  const Scene = fullScenes[project.slug];
  sharedChecks(stageOf(renderToStaticMarkup(<Scene project={project} />), project.slug), project, "full", 300);
});

describe.each(compactProjects)("vignette scene $slug", (project) => {
  const Scene = compactScenes[project.slug];
  sharedChecks(stageOf(renderToStaticMarkup(<Scene project={project} />), project.slug), project, "compact", 120);
});

describe("scene stylesheets", () => {
  const files = [
    ...readdirSync("src/components").filter((f) => f.endsWith(".css")).map((f) => `src/components/${f}`),
    ...readdirSync("src/scenes", { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `src/scenes/${d.name}/scene.css`)
      .filter((f) => existsSync(f)),
  ];

  it("switch grids at the shared STAGE_GRID_SWITCH width", () => {
    const allowed = [`width < ${STAGE_GRID_SWITCH}px`, `width >= ${STAGE_GRID_SWITCH}px`];
    for (const file of files) {
      for (const m of readFileSync(file, "utf8").matchAll(/@container\s+stage\s*\(([^)]*)\)/g)) {
        expect(allowed, file).toContain(m[1].replace(/\s+/g, " ").trim());
      }
    }
  });

  // Scene CSS sits in layer(scenes), which beats layer(components) whatever the specificity, so a scene
  // rule that sets display on a part would show a desktop-only part on the mobile grid (or the reverse).
  // An !important declaration in an earlier layer beats every normal declaration in later layers.
  it("hide the other grid's parts with !important, so no scene's display can show them", () => {
    const css = readFileSync("src/components/stage.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const block = (condition: string) => {
      const start = css.search(new RegExp(`@container\\s+stage\\s*\\(\\s*${condition}\\s*\\)\\s*\\{`));
      if (start < 0) return "";
      let depth = 0;
      for (let i = css.indexOf("{", start); i < css.length; i++) {
        if (css[i] === "{") depth++;
        if (css[i] === "}" && --depth === 0) return css.slice(start, i + 1);
      }
      return "";
    };
    const rule = (text: string, selector: string) =>
      text.match(new RegExp(`(?:^|[}\\s])${selector.replace(/[.]/g, "\\.").replace(/ /g, "\\s+")}\\s*\\{([^}]*)\\}`))?.[1].replace(/\s+/g, " ").trim() ?? "";
    const mobile = block(`width\\s*<\\s*${STAGE_GRID_SWITCH}px`);
    const desktop = block(`width\\s*>=\\s*${STAGE_GRID_SWITCH}px`);
    expect(rule(mobile, ".stage .g-d")).toBe("display: none !important;");
    expect(rule(desktop, ".stage .g-m")).toBe("display: none !important;");
    // The mobile default stays normal, so a .g-m part can still take its own display from scene CSS.
    expect(rule(mobile, ".stage .g-m")).toBe("display: block;");
  });

  it("never use overflow: hidden (it captures view() timelines; use clip)", () => {
    for (const file of files) expect(readFileSync(file, "utf8"), file).not.toMatch(/overflow(-[xy])?\s*:\s*hidden/);
  });
});
