import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Rich, plain } from "@/lib/rich";

const html = (text: string) => renderToStaticMarkup(<Rich text={text} />);

describe("Rich", () => {
  it("renders *phrase* as <em>", () => {
    expect(html("keeps *benta* apart")).toBe("keeps <em>benta</em> apart");
  });

  it("handles several phrases, including phrases with spaces", () => {
    expect(html("*benta* and *cash na pumasok*")).toBe("<em>benta</em> and <em>cash na pumasok</em>");
  });

  it("escapes HTML in plain text", () => {
    expect(html("a < b & c")).toBe("a &lt; b &amp; c");
  });

  it("leaves a lone asterisk as text", () => {
    expect(html("5 * 3")).toBe("5 * 3");
  });
});

describe("plain", () => {
  it("strips the emphasis markers", () => {
    expect(plain("keeps *benta* apart from *cash na pumasok*")).toBe("keeps benta apart from cash na pumasok");
  });
});
