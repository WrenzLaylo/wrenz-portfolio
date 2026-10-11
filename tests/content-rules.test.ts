import { describe, expect, it } from "vitest";
import * as glossaryModule from "@/content/glossary";
import * as recognitionModule from "@/content/recognition";
import * as sectionsModule from "@/content/sections";
import * as siteModule from "@/content/site";

// Task 1.2 adds projects, experience, capabilities and routes to this list.
export const contentModules: Record<string, unknown> = {
  site: siteModule,
  sections: sectionsModule,
  recognition: recognitionModule,
  glossary: glossaryModule,
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
});
