import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

const doc = new JSDOM(renderToStaticMarkup(<Home />)).window.document;

describe("home page markup", () => {
  it("has exactly one h1, holding the name and the role", () => {
    const h1s = doc.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toContain("Wrenz Laylo, Developer, AI & Automation");
    expect(h1s[0].textContent).toContain("Messy operations in.");
  });

  it("keeps every section anchor", () => {
    for (const id of ["main", "top", "work", "more-work", "capabilities", "experience", "about", "contact"]) {
      expect(doc.getElementById(id), id).not.toBeNull();
    }
  });

  it("nav menu is a popover with an invoker", () => {
    expect(doc.getElementById("nav-menu")?.getAttribute("popover")).toBe("auto");
    expect(doc.querySelector('button[popovertarget="nav-menu"]')).not.toBeNull();
  });

  it("resolves every <use> to a sprite symbol", () => {
    const ids = new Set([...doc.querySelectorAll("symbol")].map((s) => s.id));
    for (const use of doc.querySelectorAll("use")) expect(ids.has((use.getAttribute("href") ?? "").slice(1)), use.getAttribute("href") ?? "").toBe(true);
  });

  it("opens external links with noopener", () => {
    for (const a of doc.querySelectorAll('a[href^="http"]')) {
      expect(a.getAttribute("rel") ?? "", a.getAttribute("href") ?? "").toContain("noopener");
    }
  });

  it("stays within the page DOM budget", () => {
    expect(doc.querySelectorAll("*").length).toBeLessThanOrEqual(2500);
  });

  it("renders one JSON-LD script that parses", () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const data = JSON.parse(scripts[0].textContent ?? "{}");
    expect(data["@graph"][0]).toMatchObject({ "@type": "Person", name: "Wrenz Laylo" });
  });
});
