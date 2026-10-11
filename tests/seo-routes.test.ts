import { afterEach, describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { routes } from "@/content/routes";

describe("robots.txt", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("allows everything and points at the sitemap", () => {
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" }, sitemap: "https://wrenz-portfolio.vercel.app/sitemap.xml" });
  });

  it("follows SITE_URL", () => {
    process.env.SITE_URL = "https://example.test/";
    expect(robots().sitemap).toBe("https://example.test/sitemap.xml");
  });
});

describe("sitemap.xml", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("lists every indexable route, and only those", () => {
    expect(sitemap().map((e) => e.url)).toEqual(routes.map((r) => `https://wrenz-portfolio.vercel.app${r.path}`));
  });

  it("follows SITE_URL", () => {
    process.env.SITE_URL = "https://example.test";
    expect(sitemap().every((e) => e.url.startsWith("https://example.test/"))).toBe(true);
  });

  it("never lists the scene lab", () => {
    expect(sitemap().some((e) => e.url.includes("/dev/"))).toBe(false);
  });
});
