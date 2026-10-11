import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compactProjects, fullProjects } from "@/content/projects";
import { recognition } from "@/content/recognition";

const all = [...fullProjects, ...compactProjects];
const words = (s: string) => s.trim().split(/\s+/).length;

describe("projects", () => {
  it("lists the six worlds and five vignettes in page order", () => {
    expect(fullProjects.map((p) => p.slug)).toEqual(["pos", "time-log", "service-areas", "katiwala", "stockroom", "agent-island"]);
    expect(compactProjects.map((p) => p.slug)).toEqual(["everyday-rockstar", "lipad", "keyclick", "med42", "pesowise"]);
  });

  it("has unique slugs and the right tier on each list", () => {
    expect(new Set(all.map((p) => p.slug)).size).toBe(11);
    expect(fullProjects.every((p) => p.tier === "full")).toBe(true);
    expect(compactProjects.every((p) => p.tier === "compact")).toBe(true);
  });

  it("alternates split worlds and breaks them with two full-bleed worlds", () => {
    expect(fullProjects.map((p) => p.layout)).toEqual(["split-start", "split-end", "bleed", "split-start", "split-end", "bleed"]);
  });

  it("gives every world three points and a varied block", () => {
    for (const p of fullProjects) {
      expect(p.points, p.slug).toHaveLength(3);
      expect(p.varied, p.slug).toBeDefined();
      if (p.varied.kind === "flow") expect(p.varied.steps).toHaveLength(3);
    }
  });

  it("keeps vignette summaries to 20 words", () => {
    for (const p of compactProjects) expect(words(p.summary), p.slug).toBeLessThanOrEqual(20);
  });

  it("keeps tag counts within limits", () => {
    for (const p of fullProjects) expect(p.tags.length, p.slug).toBeLessThanOrEqual(5);
    for (const p of compactProjects) expect(p.tags.length, p.slug).toBeLessThanOrEqual(4);
    for (const p of all) expect(p.tags.length, p.slug).toBeGreaterThan(0);
  });

  it("uses absolute https or root-relative links", () => {
    for (const p of all) for (const l of p.links) expect(l.href, p.slug).toMatch(/^(https:\/\/|\/(?!\/))/);
  });

  it("shows links only on public projects, and every public vignette has a link or an award", () => {
    for (const p of all) if (p.status !== "public") expect(p.links, p.slug).toEqual([]);
    for (const p of compactProjects) if (p.status === "public") expect(p.links.length > 0 || Boolean(p.awardId), p.slug).toBe(true);
  });

  it("gives each project exactly one of a screenshot or an illustration label", () => {
    for (const p of all) expect(Boolean(p.shot) !== Boolean(p.illustrationLabel), p.slug).toBe(true);
  });

  it("points every screenshot at a real file, with real alt text and its size", () => {
    for (const p of all) {
      if (!p.shot) continue;
      expect(existsSync(join(process.cwd(), "public", p.shot.src)), p.shot.src).toBe(true);
      expect(p.shot.alt.length, p.slug).toBeGreaterThan(20);
      expect(p.shot.width > 0 && p.shot.height > 0, p.slug).toBe(true);
    }
  });

  it("references only known honours", () => {
    const ids = new Set(recognition.map((r) => r.id));
    for (const p of all) if (p.awardId) expect(ids.has(p.awardId), p.slug).toBe(true);
  });

  it("fills the bento with one wide, one narrow and three thirds, in that order", () => {
    expect(compactProjects.map((p) => p.cell)).toEqual(["wide", "narrow", "third", "third", "third"]);
  });
});
