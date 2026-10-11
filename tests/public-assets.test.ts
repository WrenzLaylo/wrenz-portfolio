import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Spec §13 "Weight": nothing unused ships from public/. Screenshots live in public/work/<slug>/.
const ROOT_FILES = ["Wrenz_Laylo-Full-Stack.pdf", "portrait.webp"];

describe("public/", () => {
  it("holds only the résumé and the portrait at its root", () => {
    const files = readdirSync("public").filter((f) => statSync(join("public", f)).isFile());
    expect(files.sort()).toEqual([...ROOT_FILES].sort());
  });
});
