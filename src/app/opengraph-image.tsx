import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// Statically generated at build time (opengraph-image.md). The renderer supports flexbox and absolute
// positioning only, and reads TTF/OTF/WOFF (not woff2, not variable fonts), hence assets/og/.
export const alt = `${site.name}, ${site.role}. ${site.slogan.lineOne} ${site.slogan.lineTwo}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FFF8EE";
const INK = "#1F1B24";
const MUTED = "#5B5566";
const YOLK = "#FFC72C";
const YOLK_SHADE = "#E29C0E";

export default async function OpengraphImage() {
  const [font, portrait] = await Promise.all([
    readFile(join(process.cwd(), "assets/og/Gabarito-ExtraBold.ttf")),
    readFile(join(process.cwd(), "assets/og/portrait-og.jpg"), "base64"),
  ]);
  const { lineOne, lineTwo, highlight } = site.slogan;
  const rest = lineTwo.slice(highlight.length).trim();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, fontFamily: "Gabarito", padding: "0 72px 0 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 660 }}>
          <div style={{ display: "flex", fontSize: 30, color: MUTED }}>{`${site.name}, ${site.role}`}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 68, lineHeight: 1.1, whiteSpace: "nowrap", color: INK, letterSpacing: "-0.025em" }}>
            <div style={{ display: "flex" }}>{lineOne}</div>
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: -6,
                    right: -6,
                    bottom: 6,
                    height: 28,
                    background: YOLK,
                    borderRadius: 8,
                    transform: "rotate(-1.5deg)",
                  }}
                />
                <div style={{ display: "flex" }}>{highlight}</div>
              </div>
              <div style={{ display: "flex", marginLeft: 20 }}>{rest}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", position: "relative", flex: 1, alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 400, height: 400, top: 128, left: 34, borderRadius: 200, background: YOLK_SHADE }} />
          <div style={{ position: "absolute", width: 400, height: 400, top: 116, left: 34, borderRadius: 200, background: YOLK }} />
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
          <img
            src={`data:image/jpeg;base64,${portrait}`}
            width={300}
            height={360}
            alt=""
            style={{
              position: "relative",
              objectFit: "cover",
              border: `8px solid ${PAPER}`,
              borderTopLeftRadius: 150,
              borderTopRightRadius: 150,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
            }}
          />
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Gabarito", data: font, weight: 800, style: "normal" }] },
  );
}
