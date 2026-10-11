import type { Metadata, Viewport } from "next";
import { Albert_Sans, Gabarito } from "next/font/google";
import { buildMetadata, viewport as siteViewport } from "@/lib/metadata";
import "./globals.css";

// Both are variable fonts: omitting `weight` loads the whole axis. `subsets` decides what is preloaded,
// so this gives exactly three preloads (Gabarito latin, Albert Sans latin, Albert Sans italic latin);
// latin-ext (the ₱ glyph) still loads on demand through its unicode-range.
const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-gabarito", display: "swap" });
// Italic must stay in this same call: a separate call gets another family name and <em> would not use it.
const albert = Albert_Sans({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-albert", display: "swap" });

export const metadata: Metadata = buildMetadata();
export const viewport: Viewport = siteViewport;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${gabarito.variable} ${albert.variable}`}>
      <body>{children}</body>
    </html>
  );
}
