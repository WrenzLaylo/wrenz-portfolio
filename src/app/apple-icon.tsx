import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// Generated at build time instead of a committed PNG (spec clarification 13). iOS rounds the corners.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const font = await readFile(join(process.cwd(), "assets/og/Gabarito-ExtraBold.ttf"));
  const initials = site.name
    .split(" ")
    .map((word) => word[0])
    .join("");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFC72C",
          color: "#1F1B24",
          fontFamily: "Gabarito",
          fontSize: 92,
          letterSpacing: "-0.04em",
        }}
      >
        {initials}
      </div>
    ),
    { ...size, fonts: [{ name: "Gabarito", data: font, weight: 800, style: "normal" }] },
  );
}
