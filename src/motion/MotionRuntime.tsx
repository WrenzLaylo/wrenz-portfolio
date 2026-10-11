"use client";

import { useEffect } from "react";
import { startMotion } from "./engine";
import { registry } from "./registry";

/** The only hand-written client component on the page (spec §6). Renders nothing; starts after hydration. */
export default function MotionRuntime() {
  useEffect(() => startMotion({ doc: document, win: window, registry }), []);
  return null;
}
