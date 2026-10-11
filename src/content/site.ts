import type { NavLink } from "./types";

export const site = {
  name: "Wrenz Laylo",
  alternateName: "Wrenz Ivan Laylo",
  role: "Developer, AI & Automation",
  slogan: { lineOne: "Messy operations in.", lineTwo: "Reliable systems out.", highlight: "Reliable" },
  lede: "I map the rules first: who can do what, what can fail, how we prove it. Then I build it.",
  description:
    "Wrenz Laylo builds business systems, Python automation, WordPress engineering and applied AI around real operations. Based in Bataan, Philippines.",
  email: "wrenzivan2004@gmail.com",
  resume: "/Wrenz_Laylo-Full-Stack.pdf",
  employer: "Managed Virtual Services",
  alumniOf: "Angeles University Foundation",
  location: { locality: "Bataan", country: "PH" },
  socials: [
    { label: "GitHub", href: "https://github.com/WrenzLaylo" },
    { label: "LinkedIn", href: "https://linkedin.com/in/wrenzlaylo" },
  ],
  portrait: { src: "/portrait.webp", alt: "Wrenz Ivan Laylo in graduation attire", width: 600, height: 720 },
  nav: [
    { href: "#work", label: "Work" },
    { href: "#experience", label: "Experience" },
    { href: "#about", label: "About" },
  ] satisfies readonly NavLink[],
  labels: {
    skip: "Skip to content",
    primaryNav: "Primary",
    openMenu: "Menu",
    email: "Email me",
    work: "See the work",
    resume: "Download résumé",
    builtWith: "Built with",
    privateClient: "Private client project",
    privateProduct: "Private product",
    before: "Before",
    after: "After",
    backToTop: "Back to top",
    footer: "Designed and built by Wrenz Laylo.",
  },
} as const;

/** The one site-URL config value (spec §5). Read at call time so tests and builds can change it. */
export function getSiteUrl(): string {
  return (process.env.SITE_URL ?? "https://wrenz-portfolio.vercel.app").replace(/\/+$/, "");
}
