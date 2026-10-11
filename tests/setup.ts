import { createElement } from "react";
import { vi } from "vitest";

// next/image needs the Next runtime config; in unit tests a plain <img> with the same core props is enough.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    createElement("img", {
      src: String(props.src),
      alt: props.alt,
      width: props.width,
      height: props.height,
      className: props.className,
      sizes: props.sizes,
      loading: props.loading,
    }),
}));
