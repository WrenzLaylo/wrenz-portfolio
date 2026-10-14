import { describe, expect, it } from "vitest";
import { Capabilities } from "@/components/Capabilities";
import { Experience } from "@/components/Experience";
import { capabilities, stack } from "@/content/capabilities";
import { experience } from "@/content/experience";
import { sections } from "@/content/sections";
import { renderDoc, strayText } from "./helpers";

function labelledSection(doc: Document, id: string, heading: string) {
  const section = doc.getElementById(id);
  expect(section?.tagName).toBe("SECTION");
  expect(section?.getAttribute("aria-labelledby")).toBe(`${id}-h`);
  const h2 = doc.getElementById(`${id}-h`);
  expect(h2?.tagName).toBe("H2");
  expect(h2?.textContent).toBe(heading);
}

describe("Capabilities", () => {
  const doc = renderDoc(<Capabilities />);

  it("is the capabilities section, labelled by its h2", () => {
    labelledSection(doc, "capabilities", sections.capabilities.heading);
  });

  it("lists the four capabilities in order, each with its Phosphor icon", () => {
    const items = [...doc.querySelectorAll(".cap")];
    expect(items.map((li) => li.querySelector("h3")?.textContent)).toEqual(capabilities.map((c) => c.name));
    expect(items.map((li) => li.querySelector(".cap-line")?.textContent)).toEqual(capabilities.map((c) => c.line));
    items.forEach((li, i) => expect(li.querySelector("use")?.getAttribute("href")).toBe(`#i-${capabilities[i].icon}`));
  });

  it("groups the stack into pills, with no 01 to 04 numbering", () => {
    const groups = [...doc.querySelectorAll(".stack-group")];
    expect(groups.map((g) => g.querySelector("h3")?.textContent)).toEqual(stack.map((g) => g.name));
    groups.forEach((g, i) => expect([...g.querySelectorAll(".pills li")].map((li) => li.textContent)).toEqual(stack[i].items));
    expect(doc.body.textContent).not.toMatch(/\b0[1-4]\b/);
  });

  it("holds no copy of its own", () => {
    expect(strayText(doc)).toEqual([]);
  });
});

describe("Experience", () => {
  const doc = renderDoc(<Experience />);

  it("is the experience section, labelled by its h2", () => {
    labelledSection(doc, "experience", sections.experience.heading);
  });

  it("shows each role in order with its period, employer, detail and body", () => {
    const items = [...doc.querySelectorAll(".tl-item")];
    expect(items).toHaveLength(experience.length);
    items.forEach((li, i) => {
      expect(li.querySelector(".tl-period")?.textContent).toBe(experience[i].period);
      expect(li.querySelector("h3")?.textContent).toBe(experience[i].role);
      expect(li.querySelector(".tl-org")?.textContent).toBe(experience[i].org);
      expect(li.querySelector(".tl-detail")?.textContent).toBe(experience[i].detail);
      expect(li.querySelector(".tl-body")?.textContent).toBe(experience[i].body);
    });
  });

  it("names Managed Virtual Services and has no freelance rows", () => {
    expect(doc.body.textContent).toContain("Managed Virtual Services");
    expect(doc.body.textContent).not.toMatch(/Freelance|Self-employed/);
  });

  it("draws the line as a decorative element", () => {
    expect(doc.querySelector(".timeline-line")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("holds no copy of its own", () => {
    expect(strayText(doc)).toEqual([]);
  });
});
