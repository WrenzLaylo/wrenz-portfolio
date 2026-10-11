import type { Capability, StackGroup } from "./types";

export const capabilities: Capability[] = [
  { icon: "stack", name: "Full-stack systems", line: "React and Next.js interfaces backed by Django, REST APIs, PostgreSQL, Redis, Prisma, and SQLite." },
  { icon: "flow-arrow", name: "Business automation", line: "Python workflows that turn messy operational data into validated reports, sheets, files, and scheduled jobs." },
  { icon: "browser", name: "WordPress engineering", line: "Gutenberg, ACF, PHP, REST API, technical SEO, content recovery, redirects, and production-safe changes." },
  { icon: "sparkle", name: "Applied AI", line: "Computer vision, streamed AI services, model evaluation, safety checks, and usable interfaces around AI outputs." },
];

export const stack: StackGroup[] = [
  { name: "Frontend", items: ["React", "Next.js", "React Native", "TypeScript", "Tailwind CSS"] },
  { name: "Backend", items: ["Python", "Django REST Framework", "PostgreSQL", "Redis", "Prisma"] },
  { name: "Platforms", items: ["WordPress", "Google Workspace APIs", "Vercel", "GitHub Actions"] },
  { name: "Quality", items: ["Regression testing", "API read-back", "Mobile QA", "Rollback planning"] },
];
