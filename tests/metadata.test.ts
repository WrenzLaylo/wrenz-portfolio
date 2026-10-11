import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { buildMetadata, viewport } from "@/lib/metadata";

describe("buildMetadata", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("sets the default title, a template for child pages, and the description", () => {
    const m = buildMetadata();
    expect(m.title).toEqual({ default: "Wrenz Laylo, Developer, AI & Automation", template: "%s | Wrenz Laylo" });
    expect(m.description).toBe(site.description);
  });

  it("derives metadataBase from SITE_URL, read at call time", () => {
    expect(String(buildMetadata().metadataBase)).toBe("https://wrenz-portfolio.vercel.app/");
    process.env.SITE_URL = "https://example.test";
    expect(String(buildMetadata().metadataBase)).toBe("https://example.test/");
  });

  it("is canonical at the root and carries no keywords", () => {
    const m = buildMetadata();
    expect(m.alternates).toEqual({ canonical: "/" });
    expect(m.keywords).toBeUndefined();
  });

  it("describes the site for social cards", () => {
    const m = buildMetadata();
    expect(m.openGraph).toMatchObject({ type: "website", siteName: "Wrenz Laylo", locale: "en_PH", url: "/" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("credits the author and allows indexing", () => {
    const m = buildMetadata();
    expect(m.authors).toEqual([{ name: "Wrenz Laylo", url: "https://wrenz-portfolio.vercel.app/" }]);
    expect(m.robots).toEqual({ index: true, follow: true });
  });
});

describe("viewport", () => {
  it("uses the paper token as the theme colour and a light scheme", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const paper = css.match(/--color-paper:\s*(#[0-9A-Fa-f]{6})/)?.[1];
    expect(viewport.themeColor).toBe(paper);
    expect(viewport.colorScheme).toBe("light");
  });
});
