import type { Metadata, Viewport } from "next";
import { getSiteUrl, site } from "@/content/site";

/** Site metadata, all derived from the one site-URL value (spec §5, §13). File-based images
 *  (opengraph-image.tsx, apple-icon.tsx, icon.svg) are added by Next; twitter inherits the OG image
 *  because `twitter.images` is left unset (Next's postProcessMetadata fills it from openGraph). */
export function buildMetadata(): Metadata {
  const url = getSiteUrl();
  const title = `${site.name}, ${site.role}`;
  return {
    metadataBase: new URL(url),
    title: { default: title, template: `%s | ${site.name}` },
    description: site.description,
    applicationName: site.name,
    authors: [{ name: site.name, url: `${url}/` }],
    creator: site.name,
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: site.name, locale: "en_PH", url: "/", title, description: site.description },
    twitter: { card: "summary_large_image", title, description: site.description },
    robots: { index: true, follow: true },
  };
}

/** themeColor mirrors --color-paper in globals.css (tests/metadata.test.ts keeps them equal). */
export const viewport: Viewport = { themeColor: "#FFF8EE", colorScheme: "light" };
