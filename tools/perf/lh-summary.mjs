// Summarise a Lighthouse JSON report against spec §12 (mobile lab run). TBT stands in for INP.
import { readFileSync } from "node:fs";

const lh = JSON.parse(readFileSync(process.argv[2], "utf8"));
const a = lh.audits;
const lcp = a["largest-contentful-paint"].numericValue;
const cls = a["cumulative-layout-shift"].numericValue;
const tbt = a["total-blocking-time"].numericValue;
const score = (k) => Math.round((lh.categories[k]?.score ?? 0) * 100);
const lcpEl = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? "?";
const checks = [
  [`LCP ${Math.round(lcp)} ms < 2500`, lcp < 2500],
  [`CLS ${cls.toFixed(3)} < 0.1`, cls < 0.1],
  [`TBT ${Math.round(tbt)} ms < 200`, tbt < 200],
  [`SEO ${score("seo")} = 100`, score("seo") === 100],
  [`Accessibility ${score("accessibility")} >= 95`, score("accessibility") >= 95],
];
for (const [label, ok] of checks) console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
console.log(`Performance ${score("performance")}, Best practices ${score("best-practices")}`);
console.log(`LCP element: ${lcpEl}`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
