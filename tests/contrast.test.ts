import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const start = css.indexOf("@theme static");
const theme = css.slice(start, css.indexOf("}", start));
const tokens = Object.fromEntries([...theme.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const backgrounds = Object.keys(tokens).filter((k) => k === "paper" || k.startsWith("tint-") || k.startsWith("sky-"));

describe("text contrast on every background token", () => {
  it("finds the tokens", () => {
    expect(backgrounds.length).toBeGreaterThanOrEqual(14);
  });

  it.each(backgrounds)("%s keeps ink and muted text at 4.5:1 or more", (bg) => {
    expect(ratio(tokens.ink, tokens[bg])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tokens.muted, tokens[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps ink text readable on the yolk contact band", () => {
    expect(ratio(tokens.ink, tokens.yolk)).toBeGreaterThanOrEqual(4.5);
  });
});
