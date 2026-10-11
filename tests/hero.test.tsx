import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/Hero";
import { fullProjects } from "@/content/projects";
import { site } from "@/content/site";

const doc = new JSDOM(`<body>${renderToStaticMarkup(<Hero />)}</body>`).window.document;
const stage = doc.querySelector<HTMLElement>('[data-scene="hero"]') as HTMLElement;

describe("Hero", () => {
  it("is section#top, labelled by the one h1", () => {
    expect(doc.getElementById("top")?.getAttribute("aria-labelledby")).toBe("hero-h");
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.getElementById("hero-h")?.tagName).toBe("H1");
  });

  it("links the two calls to action to the work and the résumé", () => {
    const [work, resume] = [...doc.querySelectorAll(".cta-row a")];
    expect(work.getAttribute("href")).toBe("#work");
    expect(work.textContent).toBe(site.labels.work);
    expect(resume.getAttribute("href")).toBe(site.resume);
    expect(resume.hasAttribute("download")).toBe(true);
    expect(resume.textContent).toBe(site.labels.resume);
  });

  it("is a hero-tier stage in its own container, outside the world container query", () => {
    expect(stage.dataset.tier).toBe("hero");
    expect(stage.parentElement?.classList.contains("hero-stage-c")).toBe(true);
    expect(stage.closest(".stage-c")).toBeNull();
  });

  it("casts one mascot per world, in page order", () => {
    expect([...stage.querySelectorAll("[data-mascot]")].map((m) => m.getAttribute("data-mascot"))).toEqual(fullProjects.map((p) => p.slug));
  });

  it("loads the portrait eagerly, with its alt text, outside any hidden layer", () => {
    const img = stage.querySelector("img");
    expect(img?.getAttribute("alt")).toBe(site.portrait.alt);
    expect(img?.getAttribute("loading")).toBe("eager");
    expect(img?.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("holds no headings, buttons, links, tables or form fields inside the stage", () => {
    expect(stage.querySelectorAll("h1, h2, h3, h4, h5, h6, button, a, table, th, form, input")).toHaveLength(0);
  });

  it("ends in a hill edge filled with the POS tint", () => {
    expect(doc.querySelector("#top > .hill-edge path")?.getAttribute("style")).toBe("fill:var(--color-tint-pos)");
  });
});

describe("hero.css", () => {
  const css = readFileSync("src/components/hero.css", "utf8");

  it("enters the H1 and the portrait with transform only, never from opacity 0 (LCP candidates)", () => {
    expect(css).toContain("@keyframes hero-rise { from { transform: translateY(24px); } }");
    expect(css).toContain("@keyframes hero-pop { from { transform: scale(0.7); } }");
    expect(css).toMatch(/\.hero \.h1-name \{ animation: hero-rise /);
    expect(css).toMatch(/\.hero \.h1-slogan \{ animation: hero-rise /);
    expect(css).toMatch(/\.hero \.p-pop \{ animation: hero-pop /);
  });

  it("hides nothing behind a preload class", () => {
    expect(css).not.toMatch(/preload/);
  });

  // The scroll-out carries mascots past the viewport edge; any clip margin on the full-width section
  // adds that margin to the page's scroll width (1441 px at 1440).
  it("clips the scroll-out exactly at the section's edge, so it never widens the page", () => {
    expect(css).toMatch(/^\.hero \{[^}]*overflow: clip;/m);
    expect(css).not.toMatch(/overflow-clip-margin/);
  });
});
