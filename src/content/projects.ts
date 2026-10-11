import type { CompactProject, FullProject, Project, Slug } from "./types";

export const fullProjects: FullProject[] = [
  {
    slug: "pos",
    tier: "full",
    layout: "split-start",
    name: "Pig Feeds POS",
    status: "private-client",
    schemaType: "SoftwareApplication",
    summary:
      "A working till and credit ledger for a Philippine pig-feed store, shaped by how the owner separates *benta* (sales), cash received and *utang* (credit).",
    points: [
      "Checkout records the sale and takes the stock off the shelf in one transaction.",
      "Customer passbooks keep every charge, payment and opening balance.",
      "The dashboard keeps *benta* apart from *cash na pumasok*, the cash that actually came in.",
    ],
    varied: {
      kind: "beforeAfter",
      before: "Sales and credit written by hand in a notebook.",
      after: "Every sale, payment and balance in one till, with stock that matches the shelf.",
    },
    tags: ["Next.js", "TypeScript", "Prisma", "SQLite", "Vitest"],
    links: [],
    shot: {
      src: "/work/pos/counter.webp",
      alt: "The Pig Feeds POS counter screen: a walk-in order of two bags of Boar Ration, one Gilt Developer and one Broodsow, total ₱8,040.00, ready to save as a cash sale.",
      width: 1320,
      height: 948,
      frame: "laptop",
    },
  },
  {
    slug: "time-log",
    tier: "full",
    layout: "split-end",
    name: "AGG Doors time-log system",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A Python pipeline that turns free-form Google Chat attendance posts into validated weekly timesheets in Google Drive.",
    points: [
      "Tells physical arrival, login, break, lunch and logout apart.",
      "Handles shared accounts, account migrations, missing events and impossible time orders.",
      "Backs up before every write, then reads the sheet back through the API to prove it.",
    ],
    varied: {
      kind: "flow",
      steps: ["A Chat post says “Login 7:23”.", "The pipeline parses and checks it.", "The row is written, then read back."],
    },
    tags: ["Python", "Google Chat API", "Sheets API", "Drive API", "GitHub Actions"],
    links: [{ kind: "adaptation", href: "https://github.com/WrenzLaylo/MVC-Time-Logs-Automation", label: "Public adaptation" }],
    illustrationLabel:
      "Illustration of the time-log pipeline: chat posts such as Login 7:23 fly into a representative weekly timesheet, which is then read back.",
    caption: "Representative week. Names and times are changed.",
  },
  {
    slug: "service-areas",
    tier: "full",
    layout: "bleed",
    name: "AGG Doors service areas",
    status: "public",
    schemaType: "CreativeWork",
    summary: "WordPress REST API automation that builds and maintains 178 suburb Service Area pages for a Melbourne garage door company.",
    points: [
      "Groups 512 searchable suburbs into regions, with A to Z lists and a region sitemap.",
      "Repoints 357 old suburb links to the new region pages, so old links still land in the right place.",
      "Writes every suburb page from local data, so no two pages read the same.",
    ],
    varied: { kind: "stat", value: "178", label: "suburb pages, none of them boilerplate" },
    tags: ["WordPress", "REST API", "Python", "ACF", "Schema.org"],
    links: [{ kind: "live", href: "https://www.aggdoors.com.au/service-areas/", label: "Live pages" }],
    // Phase 5 (Task 5.1) replaces this with the captured Service Area page screenshot.
    illustrationLabel: "Illustration of the AGG Doors service areas project: a smiling garage door among Melbourne suburb pins.",
  },
  {
    slug: "katiwala",
    tier: "full",
    layout: "split-start",
    name: "Katiwala",
    status: "private-product",
    schemaType: "SoftwareApplication",
    summary: "A Filipino home-services marketplace with separate journeys for customers and service providers.",
    points: [
      "Customers browse services and book in a few steps.",
      "Providers capture their ID and face, and OCR fills the form for them to correct.",
      "New providers wait in a clear pending state until they are verified.",
    ],
    varied: { kind: "flow", steps: ["A provider scans their ID.", "OCR fills the form.", "The account waits until it is verified."] },
    tags: ["Expo", "React Native", "TypeScript", "Prisma"],
    links: [],
    // Phase 5 (Task 5.3) replaces this with real app screens.
    illustrationLabel: "Illustration of Katiwala: a smiling phone surrounded by home-service tools.",
  },
  {
    slug: "stockroom",
    tier: "full",
    layout: "split-end",
    name: "Stockroom API",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A multi-tenant inventory and orders REST API for small shops, built with Java 21 and Spring Boot 4 and designed for Azure.",
    points: [
      "A guarded stock update and sorted row locks, proven by a concurrency test.",
      "Every row carries its shop, and composite foreign keys stop data crossing between shops.",
      "Stateless JWT sign-in with owner and staff roles, documented in Swagger UI.",
    ],
    varied: { kind: "promise", text: "Stock can never go negative, even when two orders arrive at the same moment." },
    tags: ["Java 21", "Spring Boot 4", "PostgreSQL", "Flyway", "JUnit"],
    links: [{ kind: "source", href: "https://github.com/WrenzLaylo/stockroom-api", label: "Source" }],
    // Phase 6 (Task 6.1) replaces this with the Swagger UI capture.
    illustrationLabel: "Illustration of Stockroom API: a smiling cardboard box on a stockroom shelf.",
  },
  {
    slug: "agent-island",
    tier: "full",
    layout: "bleed",
    name: "Agent Island",
    status: "public",
    schemaType: "SoftwareApplication",
    summary:
      "A Dynamic Island-style overlay for Windows that shows what Claude Code, Codex and Hermes are doing and answers their permission prompts.",
    points: [
      "Picks up the terminals you already have open; there is nothing new to launch.",
      "Shows permission prompts in the pill and types your answer into the real session.",
      "Hands anything it should not answer back to the terminal, focused and ready.",
    ],
    varied: {
      kind: "beforeAfter",
      before: "Switch to each terminal to answer every prompt.",
      after: "Answer from the pill, and the reply is typed into the real session.",
    },
    tags: ["Electron", "TypeScript", "Node.js", "Windows"],
    links: [{ kind: "source", href: "https://github.com/WrenzLaylo/Agent-Island", label: "Source" }],
    illustrationLabel:
      "Illustration of Agent Island: a Dynamic Island-style pill on a Windows desktop showing a permission prompt with Allow once, Don't ask again and Deny.",
  },
];

export const compactProjects: CompactProject[] = [
  {
    slug: "everyday-rockstar",
    tier: "compact",
    cell: "wide",
    name: "Everyday Rockstar",
    status: "public",
    schemaType: "WebSite",
    summary: "A coaching and community site with a cinematic editorial look, custom motion and a full reduced-motion version.",
    tags: ["Vite", "JavaScript", "GSAP", "Apache"],
    links: [{ kind: "live", href: "https://everyday-rockstars.com", label: "Live site" }],
    shot: {
      src: "/work/everyday-rockstar/live.webp",
      alt: "The live Everyday Rockstar website, showing its cinematic editorial hero.",
      width: 1440,
      height: 900,
      frame: "browser",
    },
  },
  {
    slug: "lipad",
    tier: "compact",
    cell: "narrow",
    name: "LiPAD",
    status: "public",
    schemaType: "CreativeWork",
    summary: "CRNN and GAN research that deblurs and reads Philippine licence plates.",
    tags: ["TensorFlow", "PyTorch", "CRNN", "GAN"],
    links: [],
    awardId: "ircite-2026",
    illustrationLabel: "Illustration of LiPAD: an invented licence plate turning from blurred to sharp.",
  },
  {
    slug: "keyclick",
    tier: "compact",
    cell: "third",
    name: "KeyClick Automator",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A Windows app that turns keyboard and mouse automation into a visual sequence you can inspect, save and stop safely.",
    tags: ["Python", "PySide6", "Qt Quick", "PyInstaller"],
    links: [
      { kind: "download", href: "https://github.com/WrenzLaylo/KeyClickAutomator/releases/latest", label: "Download for Windows" },
      { kind: "source", href: "https://github.com/WrenzLaylo/KeyClickAutomator", label: "Source" },
    ],
    // Phase 7 (Task 7.2) replaces this with the app window image from the KeyClick repo.
    illustrationLabel: "Illustration of KeyClick Automator: a smiling orange keycap.",
  },
  {
    slug: "med42",
    tier: "compact",
    cell: "third",
    name: "Med42 Clinical Suite",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A clinical workflow with versioned diagnosis APIs, streamed AI responses, review states and audit logs.",
    tags: ["Django REST", "PostgreSQL", "Redis", "React"],
    links: [
      { kind: "live", href: "https://medical-diagnosis-app-two.vercel.app", label: "Live app" },
      { kind: "source", href: "https://github.com/WrenzLaylo/medical-diagnosis-app", label: "Source" },
    ],
    // Phase 7 (Task 7.2) replaces this with a capture of the live app.
    illustrationLabel: "Illustration of Med42 Clinical Suite: a smiling heart.",
  },
  {
    slug: "pesowise",
    tier: "compact",
    cell: "third",
    name: "PesoWise",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A personal spending tracker with sign-in and protected user data.",
    tags: ["Next.js", "TypeScript", "Prisma"],
    links: [{ kind: "live", href: "https://pesowise-umber.vercel.app", label: "Live app" }],
    // Phase 7 (Task 7.2) replaces this with a capture of the live app.
    illustrationLabel: "Illustration of PesoWise: a smiling green wallet.",
  },
];

export function projectBySlug(slug: Slug): Project {
  const found = [...fullProjects, ...compactProjects].find((p) => p.slug === slug);
  if (!found) throw new Error(`unknown project: ${slug}`);
  return found;
}
