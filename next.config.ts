import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // AVIF first, WebP fallback (spec §12). Next 16 requires the allowed qualities to be listed.
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
};

export default nextConfig;
