import { capabilities, stack } from "./capabilities";
import { experience } from "./experience";
import { compactProjects, fullProjects } from "./projects";
import { recognition } from "./recognition";
import { sections } from "./sections";
import { site } from "./site";
import type { Varied } from "./types";

function variedText(v: Varied): string[] {
  switch (v.kind) {
    case "stat":
      return [v.value, v.label];
    case "flow":
      return [...v.steps];
    case "beforeAfter":
      return [v.before, v.after];
    case "promise":
      return [v.text];
    case "quote":
      return [v.text, v.name, v.role];
  }
}

/** Every visible string in page order (nav, hero, worlds, vignettes, capabilities, experience, about, contact,
 *  footer). The gloss test reads it, so first use is judged in the order a reader meets the words. */
export function pageCopy(): string[] {
  return [
    ...site.nav.map((link) => link.label),
    site.name,
    site.role,
    site.slogan.lineOne,
    site.slogan.lineTwo,
    site.lede,
    site.labels.work,
    site.labels.resume,
    sections.work.heading,
    ...fullProjects.flatMap((p) => [
      p.name,
      p.summary,
      ...p.points,
      ...variedText(p.varied),
      ...p.tags,
      ...p.links.map((l) => l.label),
      p.caption ?? "",
      p.shot?.alt ?? "",
      p.illustrationLabel ?? "",
    ]),
    sections.moreWork.heading,
    ...compactProjects.flatMap((p) => [p.name, p.summary, ...p.tags, ...p.links.map((l) => l.label), p.shot?.alt ?? "", p.illustrationLabel ?? ""]),
    sections.capabilities.heading,
    ...capabilities.flatMap((c) => [c.name, c.line]),
    ...stack.flatMap((g) => [g.name, ...g.items]),
    sections.experience.heading,
    ...experience.flatMap((e) => [e.period, e.role, e.org, e.detail, e.body]),
    sections.about.heading,
    ...sections.about.paragraphs,
    ...recognition.flatMap((r) => [r.title, r.detail, r.subject ?? ""]),
    sections.contact.heading,
    sections.contact.line,
    site.labels.email,
    site.email,
    site.labels.footer,
  ].filter((s) => s !== "");
}
