import { afterEach, describe, expect, it } from "vitest";
import { compactProjects, fullProjects } from "@/content/projects";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";

type GraphNode = Record<string, unknown> & { "@type": string };
const graph = () => buildJsonLd()["@graph"] as GraphNode[];
const node = (type: string) => graph().find((n) => n["@type"] === type) as GraphNode;
const BASE = "https://wrenz-portfolio.vercel.app";

describe("buildJsonLd", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("is one schema.org graph of Person, WebSite, ProfilePage and ItemList", () => {
    expect(buildJsonLd()["@context"]).toBe("https://schema.org");
    expect(graph().map((n) => n["@type"])).toEqual(["Person", "WebSite", "ProfilePage", "ItemList"]);
  });

  it("describes Wrenz as a Person", () => {
    expect(node("Person")).toMatchObject({
      "@id": `${BASE}/#person`,
      name: "Wrenz Laylo",
      alternateName: "Wrenz Ivan Laylo",
      jobTitle: "Developer, AI & Automation",
      worksFor: { "@type": "Organization", name: "Managed Virtual Services" },
      alumniOf: { "@type": "CollegeOrUniversity", name: "Angeles University Foundation" },
      address: { "@type": "PostalAddress", addressRegion: "Bataan", addressCountry: "PH" },
      image: `${BASE}/portrait.webp`,
      email: "wrenzivan2004@gmail.com",
      sameAs: ["https://github.com/WrenzLaylo", "https://linkedin.com/in/wrenzlaylo"],
    });
    expect(node("Person").award).toEqual([
      "Cum Laude, BS Computer Science, Data Science",
      "Best Thesis Paper and Presenter, IRCITE 2026 (LiPAD)",
      "1st Place, JPCS Hackathon 2025",
      "Microsoft Certified, Azure Fundamentals",
    ]);
  });

  it("makes the Person the main entity of the profile page", () => {
    expect(node("WebSite")).toMatchObject({ "@id": `${BASE}/#website`, name: "Wrenz Laylo", url: `${BASE}/` });
    expect(node("ProfilePage")).toMatchObject({ url: `${BASE}/`, mainEntity: { "@id": `${BASE}/#person` }, isPartOf: { "@id": `${BASE}/#website` } });
  });

  it("lists the 11 projects in page order with their schema types", () => {
    const list = node("ItemList");
    const items = list.itemListElement as { position: number; item: Record<string, unknown> }[];
    const projects = [...fullProjects, ...compactProjects];
    expect(items).toHaveLength(11);
    expect(list.numberOfItems).toBe(11);
    items.forEach((entry, i) => {
      const p = projects[i];
      expect(entry.position).toBe(i + 1);
      expect(entry.item).toMatchObject({ "@type": p.schemaType, name: p.name, creator: { "@id": `${BASE}/#person` } });
      expect(String(entry.item.description)).not.toContain("*");
      if (p.links[0]) expect(entry.item.url).toBe(p.links[0].href);
      else expect(entry.item).not.toHaveProperty("url");
    });
  });

  it("follows SITE_URL", () => {
    process.env.SITE_URL = "https://example.test";
    expect(node("Person")["@id"]).toBe("https://example.test/#person");
    expect(node("Person").image).toBe("https://example.test/portrait.webp");
  });
});

describe("jsonLdHtml", () => {
  it("contains no raw < anywhere in the real graph", () => {
    expect(jsonLdHtml(buildJsonLd())).not.toContain("<");
  });

  it("escapes a hostile string so it cannot close the script tag, and still parses", () => {
    const hostile = "</script><script>alert(1)</script>";
    const html = jsonLdHtml({ x: hostile });
    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c/script>");
    expect(JSON.parse(html).x).toBe(hostile);
  });
});
