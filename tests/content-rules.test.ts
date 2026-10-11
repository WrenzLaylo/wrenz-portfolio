import { describe, expect, it } from "vitest";
import * as capabilitiesModule from "@/content/capabilities";
import * as experienceModule from "@/content/experience";
import * as glossaryModule from "@/content/glossary";
import { pageCopy } from "@/content/page-copy";
import * as projectsModule from "@/content/projects";
import * as recognitionModule from "@/content/recognition";
import * as routesModule from "@/content/routes";
import * as sceneTextModule from "@/content/scene-text";
import * as sectionsModule from "@/content/sections";
import * as siteModule from "@/content/site";

export const contentModules: Record<string, unknown> = {
  site: siteModule,
  sections: sectionsModule,
  recognition: recognitionModule,
  glossary: glossaryModule,
  projects: projectsModule,
  experience: experienceModule,
  capabilities: capabilitiesModule,
  routes: routesModule,
  sceneText: sceneTextModule,
};

function* strings(value: unknown, path: string): Generator<[string, string]> {
  if (typeof value === "string") {
    yield [path, value];
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* strings(value[i], `${path}[${i}]`);
  } else if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) yield* strings(inner, `${path}.${key}`);
  }
}

describe("copy rules", () => {
  it("has no em dashes or en dashes in any content string", () => {
    const offenders = Object.entries(contentModules)
      .flatMap(([name, mod]) => [...strings(mod, name)])
      .filter(([, text]) => /[\u2013\u2014]/.test(text))
      .map(([path, text]) => `${path}: ${text}`);
    expect(offenders).toEqual([]);
  });

  it("uses one label per intent", () => {
    expect(siteModule.site.labels.email).toBe("Email me");
    expect(siteModule.site.labels.work).toBe("See the work");
  });

  it("reads the site URL from SITE_URL at call time, without a trailing slash", () => {
    const before = process.env.SITE_URL;
    process.env.SITE_URL = "https://example.test/";
    expect(siteModule.getSiteUrl()).toBe("https://example.test");
    delete process.env.SITE_URL;
    expect(siteModule.getSiteUrl()).toBe("https://wrenz-portfolio.vercel.app");
    if (before !== undefined) process.env.SITE_URL = before;
  });

  it("keeps award wording in one place", () => {
    expect(recognitionModule.recognition.map((r) => r.id)).toEqual(["cum-laude", "ircite-2026", "jpcs-2025", "azure-fundamentals"]);
    expect(recognitionModule.award("ircite-2026").detail).toBe("IRCITE 2026");
  });

  it("glosses each Tagalog phrase once, right after its first use", () => {
    const text = pageCopy().join("\n");
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const { term, gloss } of glossaryModule.glossary) {
      const hits = [...text.matchAll(new RegExp(`\\*?${escape(term)}\\*?`, "g"))];
      expect(hits.length, term).toBeGreaterThan(0);
      const after = (m: RegExpMatchArray) => text.slice((m.index ?? 0) + m[0].length);
      expect(after(hits[0]).startsWith(gloss), `first use of "${term}" must be followed by "${gloss}"`).toBe(true);
      for (const m of hits.slice(1)) expect(after(m).startsWith(gloss), `"${term}" glossed twice`).toBe(false);
    }
  });

  it("uses no other contact or work labels anywhere", () => {
    const rogue = pageCopy().filter((s) =>
      /get in touch|contact me|start a conversation|hire me|view (the )?(work|projects)|see (my )?projects/i.test(s),
    );
    expect(rogue).toEqual([]);
  });
});
