import { Img } from "./Img";
import type { ReactNode } from "react";
import type { Shot } from "@/content/types";

/** A real screenshot in an ink-bezel frame. Lazy by default: every stage is below the hero.
 *  `children` render inside the screen, over the image (for example the POS saved-sale strip). */
export function DeviceFrame({ shot, sizes, className, children }: { shot: Shot; sizes: string; className?: string; children?: ReactNode }) {
  const bar = shot.frame === "browser" || shot.frame === "window";
  return (
    <div className={`device device-${shot.frame}${className ? ` ${className}` : ""}`}>
      <div className="device-screen">
        {bar ? (
          <span className="device-bar" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : null}
        <Img className="device-shot" src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes={sizes} loading="lazy" />
        {children}
      </div>
      {shot.frame === "laptop" ? <span className="device-base" aria-hidden="true" /> : null}
    </div>
  );
}
