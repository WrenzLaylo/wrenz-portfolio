import type { MetadataRoute } from "next";
import { routes } from "@/content/routes";
import { getSiteUrl } from "@/content/site";

/** One entry per indexable route (src/content/routes.ts). No lastModified: it would change on every build. */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = getSiteUrl();
  return routes.map((route) => ({ url: `${url}${route.path}` }));
}
