import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import Image from "next/image";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { Img, type ImgProps } from "@/components/Img";
import nextConfig from "../next.config";

// Next's own client <Image>, rendered with this project's image config: the reference markup.
const config = { ...imageConfigDefault, ...nextConfig.images };
const nextImage = (props: ImgProps) =>
  renderToStaticMarkup(
    <ImageConfigContext.Provider value={config}>
      <Image {...props} alt={props.alt} />
    </ImageConfigContext.Provider>,
  );

/** The props an <img> on the page was rendered from. */
function propsOf(img: Element): ImgProps {
  const attr = (name: string) => img.getAttribute(name) ?? undefined;
  const src = new URL(attr("src") ?? "", "http://x").searchParams.get("url") ?? "";
  return {
    src,
    alt: attr("alt") ?? "",
    width: Number(attr("width")),
    height: Number(attr("height")),
    sizes: attr("sizes"),
    className: attr("class"),
    loading: attr("loading") as ImgProps["loading"],
    fetchPriority: attr("fetchpriority") as ImgProps["fetchPriority"],
  };
}

describe("Img, the server-rendered image", () => {
  const images = [...new JSDOM(renderToStaticMarkup(<Home />)).window.document.querySelectorAll("img")];

  it("renders every image on the page exactly as next/image does (srcset, sizes, lazy, decoding, priority)", () => {
    expect(images.length).toBeGreaterThanOrEqual(5);
    for (const img of images) {
      const props = propsOf(img);
      expect(props.src, img.outerHTML).toMatch(/^\/[a-z0-9/_-]+\.(webp|png|jpe?g|avif)$/);
      expect(renderToStaticMarkup(<Img {...props} />), props.src).toBe(nextImage(props));
    }
  });

  it("serves every page image through Next's optimizer at quality 75", () => {
    for (const img of images) {
      expect(img.getAttribute("src")).toMatch(/^\/_next\/image\?url=%2F.+&w=\d+&q=75$/);
      expect(img.getAttribute("srcset")).toContain("&q=75 ");
    }
  });

  it("keeps the hero portrait eager and high priority, and everything else lazy", () => {
    const portrait = images.find((img) => propsOf(img).src === "/portrait.webp");
    expect(portrait?.getAttribute("loading")).toBe("eager");
    expect(portrait?.getAttribute("fetchpriority")).toBe("high");
    for (const img of images.filter((i) => i !== portrait)) expect(img.getAttribute("loading"), img.getAttribute("src") ?? "").toBe("lazy");
  });

  it("matches next/image for sizes without vw, without sizes, and at the largest widths", () => {
    const cases: ImgProps[] = [
      { src: "/work/pos/saved-rail-desk.webp", alt: "", width: 436, height: 950, sizes: "200px", loading: "lazy" },
      { src: "/portrait.webp", alt: "A portrait", width: 600, height: 720 },
      { src: "/work/a b.webp", alt: "x", width: 3000, height: 2000, className: "c" },
      { src: "/work/x.webp", alt: "x", width: 300, height: 200, sizes: "33vw", fetchPriority: "low" },
    ];
    for (const props of cases) expect(renderToStaticMarkup(<Img {...props} />)).toBe(nextImage(props));
  });
});

describe("no client image component", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [path] : [];
    });

  it("no source file imports next/image at runtime (its client component costs ~6 KB of JS; use Img)", () => {
    const offenders = files("src").filter((file) => {
      const code = readFileSync(file, "utf8");
      return (
        /^\s*import\s+(?!type\b)[^;]*?from\s+["']next\/(image|legacy\/image|dist\/client\/image-component|dist\/shared\/lib\/image-external)["']/m.test(code) ||
        /(?:require|import)\(\s*["']next\/(image|legacy\/image)["']\s*\)/.test(code)
      );
    });
    expect(offenders).toEqual([]);
  });
});
