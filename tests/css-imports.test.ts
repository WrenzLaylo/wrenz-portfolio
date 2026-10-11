import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

describe("globals.css", () => {
  it("declares the layer order before anything else", () => {
    expect(css.trimStart().startsWith("@layer theme, base, components, scenes, utilities;")).toBe(true);
  });

  it("imports every component stylesheet into the components layer", () => {
    for (const file of readdirSync("src/components").filter((f) => f.endsWith(".css"))) {
      expect(css, file).toContain(`@import "../components/${file}" layer(components);`);
    }
  });

  it("imports every scene stylesheet into the scenes layer", () => {
    if (!existsSync("src/scenes")) return;
    for (const dir of readdirSync("src/scenes", { withFileTypes: true }).filter((d) => d.isDirectory())) {
      if (!existsSync(`src/scenes/${dir.name}/scene.css`)) continue;
      expect(css, dir.name).toContain(`@import "../scenes/${dir.name}/scene.css" layer(scenes);`);
    }
  });
});
