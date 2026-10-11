import { compactProjects, fullProjects } from "@/content/projects";
import { recognition } from "@/content/recognition";
import { sections } from "@/content/sections";
import { getSiteUrl, site } from "@/content/site";
import type { Project, Recognition } from "@/content/types";
import { plain } from "./rich";

function awardText(r: Recognition): string {
  return r.subject ? `${r.title}, ${r.detail} (${r.subject})` : `${r.title}, ${r.detail}`;
}

function absolute(href: string, base: string): string {
  return href.startsWith("/") ? `${base}${href}` : href;
}

/** The page's structured data as one @graph (spec §13). Built from the content files only. */
export function buildJsonLd(): Record<string, unknown> {
  const url = getSiteUrl();
  const person = `${url}/#person`;
  const website = `${url}/#website`;
  const projects: Project[] = [...fullProjects, ...compactProjects];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": person,
        name: site.name,
        alternateName: site.alternateName,
        jobTitle: site.role,
        description: site.description,
        url: `${url}/`,
        image: `${url}${site.portrait.src}`,
        email: site.email,
        worksFor: { "@type": "Organization", name: site.employer },
        alumniOf: { "@type": "CollegeOrUniversity", name: site.alumniOf },
        // Bataan is a province, so it is the region, not the locality.
        address: { "@type": "PostalAddress", addressRegion: site.location.locality, addressCountry: site.location.country },
        award: recognition.map(awardText),
        sameAs: site.socials.map((s) => s.href),
      },
      { "@type": "WebSite", "@id": website, name: site.name, url: `${url}/`, inLanguage: "en" },
      {
        "@type": "ProfilePage",
        "@id": `${url}/#profile`,
        url: `${url}/`,
        name: `${site.name}, ${site.role}`,
        isPartOf: { "@id": website },
        mainEntity: { "@id": person },
      },
      {
        "@type": "ItemList",
        "@id": `${url}/#work`,
        name: sections.work.heading,
        numberOfItems: projects.length,
        itemListElement: projects.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": p.schemaType,
            name: p.name,
            description: plain(p.summary),
            creator: { "@id": person },
            ...(p.links[0] ? { url: absolute(p.links[0].href, url) } : {}),
          },
        })),
      },
    ],
  };
}

/** JSON for an inline <script type="application/ld+json">. JSON.stringify does not escape `<`, so a
 *  string containing "</script>" could end the tag early; every `<` becomes \u003c (docs/02-guides/json-ld.md). */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
