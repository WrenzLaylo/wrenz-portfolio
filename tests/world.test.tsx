import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectLinks } from "@/components/ProjectLinks";
import { VariedBlock } from "@/components/VariedBlock";
import { Work } from "@/components/Work";
import { fullProjects, projectBySlug } from "@/content/projects";
import { site } from "@/content/site";
import type { Slug, Varied } from "@/content/types";

const parse = (markup: string) => new JSDOM(`<body>${markup}</body>`).window.document;
const work = parse(renderToStaticMarkup(<Work />));
const worlds = [...work.querySelectorAll<HTMLElement>("section[data-world]")];

describe("Work", () => {
  it("is section#work, labelled by its h2", () => {
    expect(work.getElementById("work")?.getAttribute("aria-labelledby")).toBe("work-h");
    expect(work.getElementById("work-h")?.tagName).toBe("H2");
    expect(work.getElementById("work-h")?.textContent).toBe("Built around actual operations.");
  });

  it("renders the six worlds in page order with their layouts", () => {
    expect(worlds.map((w) => w.dataset.world)).toEqual(fullProjects.map((p) => p.slug));
    expect(worlds.map((w) => [...w.classList].find((c) => c.startsWith("world-")))).toEqual(fullProjects.map((p) => `world-${p.layout}`));
  });

  it("labels each world by its one h3", () => {
    for (const w of worlds) {
      expect(w.querySelectorAll("h3"), w.dataset.world).toHaveLength(1);
      expect(w.getAttribute("aria-labelledby")).toBe(`${w.dataset.world}-h`);
      expect(w.querySelector("h3")?.id).toBe(`${w.dataset.world}-h`);
    }
  });

  it("builds each tick as the mark plus exactly one text span", () => {
    const items = [...work.querySelectorAll(".w-points li")];
    expect(items).toHaveLength(18);
    for (const li of items) {
      expect(li.children).toHaveLength(2);
      expect(li.children[0].classList.contains("tick")).toBe(true);
      expect(li.children[0].getAttribute("aria-hidden")).toBe("true");
      expect(li.children[1].tagName).toBe("SPAN");
    }
  });

  it("renders *phrase* as <em> inside the tick text, with no stray asterisks", () => {
    const pos = work.querySelector('section[data-world="pos"]') as HTMLElement;
    expect([...pos.querySelectorAll(".w-points li > span:last-child em")].map((e) => e.textContent)).toEqual(["benta", "cash na pumasok"]);
    expect(work.body.textContent).not.toContain("*");
  });

  it("labels every tag list", () => {
    for (const list of work.querySelectorAll(".tags")) expect(list.getAttribute("aria-label")).toBe(site.labels.builtWith);
  });

  it("captions the time-log figure", () => {
    const caption = fullProjects.find((p) => p.slug === "time-log")?.caption;
    expect(work.querySelector('section[data-world="time-log"] figure > figcaption')?.textContent).toBe(caption);
  });

  it("fills each hill edge with the next world's tint, and the last with paper", () => {
    const fills = worlds.map((w) => w.querySelector(":scope > .hill-edge path")?.getAttribute("style"));
    expect(fills).toEqual([...fullProjects.slice(1).map((p) => `fill:var(--color-tint-${p.slug})`), "fill:var(--color-paper)"]);
  });
});

describe("ProjectLinks", () => {
  const links = (slug: Slug) => parse(renderToStaticMarkup(<ProjectLinks project={projectBySlug(slug)} />));

  it("opens public links in a new tab with noopener", () => {
    const anchors = [...links("keyclick").querySelectorAll("a")];
    expect(anchors.map((a) => a.textContent)).toEqual(["Download for Windows", "Source"]);
    for (const a of anchors) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener");
    }
  });

  it("uses the download icon for a download and the arrow otherwise", () => {
    expect([...links("keyclick").querySelectorAll("use")].map((u) => u.getAttribute("href"))).toEqual(["#i-download", "#i-arrow-up-right"]);
  });

  it("shows the private label instead of links", () => {
    expect(links("pos").body.textContent).toBe(site.labels.privateClient);
    expect(links("pos").querySelector("a")).toBeNull();
    expect(links("katiwala").body.textContent).toBe(site.labels.privateProduct);
  });

  it("renders nothing for a public project without links", () => {
    expect(links("lipad").body.innerHTML).toBe("");
  });
});

describe("VariedBlock", () => {
  const cases: Varied[] = [
    { kind: "stat", value: "178", label: "suburb pages" },
    { kind: "flow", steps: ["One step.", "Two steps.", "Three steps."] },
    { kind: "beforeAfter", before: "By hand.", after: "In one till." },
    { kind: "promise", text: "Stock never goes negative." },
    { kind: "quote", text: "It just works.", name: "A. Client", role: "Owner" },
  ];

  it.each(cases)("renders every string of a $kind block", (varied) => {
    const text = parse(renderToStaticMarkup(<VariedBlock varied={varied} />)).body.textContent ?? "";
    const strings = Object.entries(varied)
      .filter(([key]) => key !== "kind")
      .flatMap(([, value]) => value);
    for (const s of strings) expect(text).toContain(s);
  });

  it("labels the before and after halves", () => {
    const text = parse(renderToStaticMarkup(<VariedBlock varied={cases[2]} />)).body.textContent ?? "";
    expect(text).toContain(site.labels.before);
    expect(text).toContain(site.labels.after);
  });
});
