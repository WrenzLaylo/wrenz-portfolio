// Summarise a Lighthouse JSON report against spec §12 (mobile lab run). TBT stands in for INP.
import { readFileSync } from "node:fs";

const lh = JSON.parse(readFileSync(process.argv[2], "utf8"));
const a = lh.audits;
const lcp = a["largest-contentful-paint"].numericValue;
const cls = a["cumulative-layout-shift"].numericValue;
const tbt = a["total-blocking-time"].numericValue;
const score = (k) => Math.round((lh.categories[k]?.score ?? 0) * 100);
// Lighthouse 13 dropped the `largest-contentful-paint-element` audit: the element and its subparts are
// items of `lcp-breakdown-insight` (a `node` item and a `table` of subparts). Older reports keep the old path.
const breakdown = a["lcp-breakdown-insight"]?.details?.items ?? [];
const node = breakdown.find((item) => item.type === "node") ?? a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node;
const lcpEl = node ? `${node.selector ?? node.snippet}${node.nodeLabel ? ` "${node.nodeLabel}"` : ""}` : "?";
const parts = breakdown.find((item) => item.type === "table")?.items ?? [];
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
// The subparts come from the observed (unthrottled) trace; the LCP above is Lantern's simulated value.
if (parts.length) console.log(`LCP subparts (observed): ${parts.map((p) => `${p.label} ${Math.round(p.duration)} ms`).join(", ")}`);
const m = a.metrics?.details?.items?.[0];
if (m) console.log(`Observed: first paint ${Math.round(m.observedFirstPaint)} ms, FCP ${Math.round(m.observedFirstContentfulPaint)} ms, LCP ${Math.round(m.observedLargestContentfulPaint)} ms, DCL ${Math.round(m.observedDomContentLoaded)} ms`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
