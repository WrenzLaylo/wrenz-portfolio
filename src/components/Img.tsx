// Next's optimized <img> markup, rendered on the server. next/image's <Image> is a client component, so
// every page that uses it ships ~6 KB gzipped of client JS (spec §12 counts it against the 150 KB
// budget), even though this page never changes an image after load. This renders the same <img> the
// component server-renders: the same srcset of /_next/image optimizer URLs (AVIF or WebP from the
// optimizer, quality 75), sizes, width and height, lazy or eager loading, fetchPriority and
// decoding="async". The only behaviour left behind is the client component's error handler, which shows
// the alt text if a file fails to load.
//
// The settings are Next 16's defaults plus next.config.ts's `images` (formats only change what the
// optimizer serves, not the markup). tests/img.test.tsx renders every image on the page with next/image
// as well and fails if the markup differs, so a Next upgrade or a next.config.ts change is caught.

const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const ALL_SIZES = [32, 48, 64, 96, 128, 256, 384, ...DEVICE_SIZES]; // imageSizes + deviceSizes, ascending
const QUALITY = 75;

export type ImgProps = {
  /** A public path, e.g. "/work/pos/counter.webp". */
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
};

/** The widths next/image offers (getWidths in next/dist/shared/lib/get-img-props.js): with `sizes`, every
 *  size from the smallest vw share of the smallest device width up; without, the 1x and 2x sizes. */
function widths(width: number, sizes?: string): { list: number[]; kind: "w" | "x" } {
  if (sizes) {
    const vw = [...sizes.matchAll(/(^|\s)(1?\d?\d)vw/g)].map((m) => Number(m[2]));
    if (!vw.length) return { list: ALL_SIZES, kind: "w" };
    return { list: ALL_SIZES.filter((s) => s >= DEVICE_SIZES[0] * Math.min(...vw) * 0.01), kind: "w" };
  }
  const pick = (w: number) => ALL_SIZES.find((s) => s >= w) ?? ALL_SIZES[ALL_SIZES.length - 1];
  return { list: [...new Set([pick(width), pick(width * 2)])], kind: "x" };
}

/** next/image's default loader. With a deployment id (skew protection) Next pins the URL to it. */
function optimized(src: string, width: number) {
  const dpl = process.env.NEXT_DEPLOYMENT_ID;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}${dpl ? `&dpl=${dpl}` : ""}`;
}

/** A server-rendered image with next/image's markup and no client JavaScript. Lazy unless `loading="eager"`. */
export function Img({ src, alt, width, height, sizes, className, loading, fetchPriority }: ImgProps) {
  const { list, kind } = widths(width, sizes);
  return (
    // Attributes in next/image's order (src last, so Safari does not fetch it before srcset and sizes).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      fetchPriority={fetchPriority}
      loading={loading ?? "lazy"}
      width={width}
      height={height}
      decoding="async"
      data-nimg="1"
      className={className}
      style={{ color: "transparent" }}
      sizes={sizes}
      srcSet={list.map((w, i) => `${optimized(src, w)} ${kind === "w" ? w : i + 1}${kind}`).join(", ")}
      src={optimized(src, list[list.length - 1])}
    />
  );
}
