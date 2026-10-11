// Spec §12: each choreography chunk <= 8 KB gzipped. Run after `next build`.
// Expected choreographies come from src/motion/registry.ts (each `import("@/scenes/<name>/choreo")`);
// each choreo's handle carries the literal name "choreo:<name>", which survives minification.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const LIMIT = 8 * 1024;
const registry = "src/motion/registry.ts";
const expected = existsSync(registry)
  ? [...new Set([...readFileSync(registry, "utf8").matchAll(/import\("@\/scenes\/([a-z0-9-]+)\/choreo"\)/g)].map((m) => m[1]))]
  : [];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".js") ? [p] : [];
  });

const found = new Map();
for (const file of walk(".next/static/chunks")) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/["'`]choreo:([a-z0-9-]+)["'`]/g)) found.set(m[1], { file, gz: gzipSync(src).length });
}

let failed = false;
for (const name of expected) {
  const hit = found.get(name);
  if (!hit) {
    console.log(`MISSING choreo:${name} (no chunk contains its name)`);
    failed = true;
    continue;
  }
  const sharedWith = expected.filter((other) => other !== name && found.get(other)?.file === hit.file);
  if (sharedWith.length) console.log(`WARN choreo:${name} shares its chunk with ${sharedWith.join(", ")}: the size below is the whole shared file`);
  const kb = (hit.gz / 1024).toFixed(1);
  const ok = hit.gz <= LIMIT;
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "OVER"} choreo:${name} ${kb} KB gz  ${hit.file}`);
}
console.log(expected.length ? (failed ? "FAIL" : "PASS") : "no choreographies registered yet: PASS");
process.exit(failed ? 1 : 0);
