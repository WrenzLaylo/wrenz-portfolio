import Image from "next/image";
import { sceneText } from "@/content/scene-text";
import type { FullProject } from "@/content/types";
import { cssVars, type Grid, type Place, place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID: Grid = { dw: 820, dh: 620, mdw: 358, mdh: 340 };
const SCREEN_SIZES = "(min-width: 1300px) 560px, (min-width: 1024px) 50vw, 90vw";
const COIN: Place = { x: 500, y: 404, w: 30, mx: 170, my: 226, mw: 20 };
const BURST: Place = { x: 368, y: 428, w: 30, mx: 196, my: 226, mw: 20 };

// --i staggers the pour, --dr is the sideways drift share. The last three pour on the desktop grid only.
const PELLETS = [
  { x: 156, w: 11, mw: 6, dr: 0.2 },
  { x: 155, w: 13, mw: 7, dr: 0.75 },
  { x: 156, w: 11, mw: 6, dr: 0.4 },
  { x: 155, w: 13, mw: 7, dr: 0.95 },
  { x: 156, w: 11, mw: 6, dr: 0.1 },
  { x: 155, w: 13, dr: 0.6 },
  { x: 156, w: 11, dr: 0.3 },
  { x: 155, w: 13, dr: 0.85 },
];

// The slice drew the legs as strokes inside the body SVG; here each is an HTML element (percent of the
// pig's 300 × 220 body box) so the walk-in rotates layers, not SVG internals.
const LEGS = [
  { side: "leg-b", left: "46.667%", top: "68.182%", height: "25.455%" },
  { side: "leg-a", left: "76.667%", top: "67.273%", height: "25.455%" },
  { side: "leg-a", left: "38%", top: "69.091%", height: "26.364%" },
  { side: "leg-b", left: "68%", top: "69.091%", height: "26.364%" },
];

function Coin({ at, burst, index }: { at: Place; burst?: boolean; index?: number }) {
  return (
    <div
      className={burst ? "coin coin-burst pos" : "coin pos loop"}
      data-part={burst ? "burst" : undefined}
      style={place(at, index === undefined ? {} : { "--i": index })}
    >
      <div className={burst ? "coin-y" : "coin-y loop"}>
        <span>{sceneText.pos.peso}</span>
      </div>
    </div>
  );
}

export function PosScene({ project }: { project: FullProject }) {
  const { shot } = project;
  if (!shot) throw new Error("the POS world needs its screenshot");
  return (
    <Stage slug="pos" tier="full" grid={GRID}>
      <Layer depth="bg">
        <svg className="hill hill-far" viewBox="0 0 820 300" preserveAspectRatio="none">
          <path d="M-40 42C120 -18 300 0 430 34C570 70 700 4 860 20V300H-40Z" fill="#B4E5A0" />
        </svg>
        <svg className="pos" style={place({ x: 206, y: 18, w: 18, mx: 20, my: 8, mw: 10 })} viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="9" fill="#FF9EC4" />
        </svg>
        <svg className="pos g-d" style={place({ x: 16, y: 268, w: 36 })} viewBox="0 0 36 30">
          <path d="M18 0L36 30H0Z" fill="#4F86F7" />
        </svg>
        <svg className="cloud pos loop" style={place({ x: 60, y: 56, w: 150, mx: 24, my: 20, mw: 70 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="cloud pos loop g-d" style={place({ x: 6, y: 170, w: 96 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>

      <Layer depth="mid" decorative={false}>
        <div className="pos" data-part="laptop" style={place({ x: 228, y: 12, w: 572, mx: 34, my: 16, mw: 292 })}>
          <div className="device device-laptop">
            <div className="device-screen">
              <Image className="device-shot shot-d" src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes={SCREEN_SIZES} loading="lazy" />
              <Image className="device-shot shot-m" src="/work/pos/rail.webp" alt={shot.alt} width={600} height={400} sizes="90vw" loading="lazy" />
              {/* Only the order rail changes when the sale is saved, so the overlay is just that strip. */}
              <div className="screen-saved loop" aria-hidden="true">
                <Image className="shot-d" src="/work/pos/saved-rail-desk.webp" alt="" width={436} height={950} sizes="200px" loading="lazy" />
                <Image className="shot-m" src="/work/pos/rail-saved.webp" alt="" width={600} height={400} sizes="90vw" loading="lazy" />
              </div>
            </div>
            <span className="device-base" aria-hidden="true" />
          </div>
        </div>
      </Layer>

      <Layer depth="fg" interactive>
        <svg className="hill hill-near" viewBox="0 0 820 240" preserveAspectRatio="none">
          <path d="M-40 40C150 -6 360 20 520 40C660 58 760 20 860 28V240H-40Z" fill="#86D96F" />
        </svg>

        {[0, 1, 2, 3].map((i) => (
          <Coin key={i} at={COIN} index={i} />
        ))}

        <div className="jar pos loop" style={place({ x: 662, y: 446, w: 100, mx: 296, my: 262, mw: 52 })}>
          <svg viewBox="0 0 100 130">
            <ellipse cx="50" cy="126" rx="42" ry="4" fill="#1F1B24" opacity=".12" />
            <rect x="8" y="26" width="84" height="98" rx="20" fill="#BFE0F2" />
            <rect x="8" y="26" width="76" height="92" rx="20" fill="#E6F5FF" />
            <circle cx="30" cy="102" r="12" fill="#FFC72C" stroke="#E29C0E" strokeWidth="3" />
            <circle cx="56" cy="104" r="12" fill="#FFC72C" stroke="#E29C0E" strokeWidth="3" />
            <circle cx="44" cy="86" r="12" fill="#FFC72C" stroke="#E29C0E" strokeWidth="3" />
            <rect x="12" y="16" width="76" height="16" rx="8" fill="#BFE0F2" />
            <circle cx="50" cy="58" r="15" fill="#FFC72C" />
            <text className="g-d" x="50" y="64.5" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="800" fontSize="18" fill="#1F1B24">
              {sceneText.pos.peso}
            </text>
          </svg>
        </div>

        <div className="sack pos loop" data-part="sack" style={place({ x: 36, y: 372, w: 150, mx: 4, my: 239, mw: 72 })}>
          <svg viewBox="0 0 150 190">
            <path d="M24 44C12 100 10 150 18 180C60 190 100 190 136 180C142 150 140 100 128 44Z" fill="#B97A38" />
            <path d="M24 44C12 100 10 150 18 176C56 184 96 184 122 176C128 140 126 100 118 44Z" fill="#E3A85E" />
            <ellipse cx="74" cy="44" rx="54" ry="15" fill="#B97A38" />
            <ellipse cx="74" cy="44" rx="42" ry="9" fill="#8C5A2B" />
            <rect x="34" y="88" width="78" height="58" rx="10" fill="#FFF8EE" />
            <text className="g-d" x="73" y="116" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="800" fontSize="19" fill="#1F1B24">
              {sceneText.pos.sackLabel}
            </text>
            <text className="g-d" x="73" y="135" textAnchor="middle" style={{ fontFamily: "var(--font-display)" }} fontWeight="700" fontSize="13" fill="#5B5566">
              {sceneText.pos.sackWeight}
            </text>
          </svg>
        </div>

        {PELLETS.map((p, i) => (
          <i
            key={i}
            className={p.mw === undefined ? "pellet pos loop g-d" : "pellet pos loop"}
            style={place(
              p.mw === undefined ? { x: p.x, y: 464, w: p.w } : { x: p.x, y: 464, w: p.w, mx: 60, my: 284, mw: p.mw },
              { "--i": i, "--dr": p.dr },
            )}
          />
        ))}

        <div className="pig pos" data-part="pig" data-interactive style={place({ x: 246, y: 430, w: 270, mx: 126, my: 228, mw: 152 })}>
          <div className="pig-inner" data-part="pig-inner">
            <i className="pig-shadow" />
            {LEGS.map((leg, i) => (
              <i key={i} className={`pig-leg ${leg.side}`} style={cssVars({ "--l": leg.left, "--t": leg.top, "--h": leg.height })} />
            ))}
            <svg className="pig-body" viewBox="0 0 300 220">
              <ellipse cx="182" cy="126" rx="98" ry="60" fill="#E7739F" />
              <ellipse cx="180" cy="116" rx="100" ry="62" fill="#FF9EC4" />
            </svg>
            <svg className="pig-tail loop" viewBox="266 70 34 40">
              <path d="M276 104C296 98 300 80 288 78C278 76 278 92 292 92" fill="none" stroke="#E7739F" strokeWidth="7" strokeLinecap="round" />
            </svg>
            <div className="pig-head loop" data-part="pig-head">
              <svg viewBox="0 10 150 150">
                <g className="pig-ear">
                  <path d="M110 60L128 26L140 68Z" fill="#E7739F" stroke="#E7739F" strokeWidth="8" strokeLinejoin="round" />
                </g>
                <circle cx="92" cy="106" r="54" fill="#E7739F" />
                <circle cx="90" cy="100" r="54" fill="#FF9EC4" />
                <g className="pig-ear">
                  <path d="M68 56L70 20L98 48Z" fill="#E7739F" stroke="#E7739F" strokeWidth="8" strokeLinejoin="round" />
                </g>
                <ellipse cx="116" cy="122" rx="9" ry="6" fill="#FF7FB0" />
                <g className="pig-eye">
                  <circle cx="72" cy="88" r="11" fill="#fff" />
                  <g className="pig-pupil">
                    <circle cx="70" cy="89" r="6.5" fill="#1F1B24" />
                    <circle cx="72" cy="86.5" r="2.2" fill="#fff" />
                  </g>
                </g>
                <g className="pig-eye">
                  <circle cx="106" cy="86" r="11" fill="#fff" />
                  <g className="pig-pupil">
                    <circle cx="104" cy="87" r="6.5" fill="#1F1B24" />
                    <circle cx="106" cy="84.5" r="2.2" fill="#fff" />
                  </g>
                </g>
                <ellipse cx="44" cy="116" rx="26" ry="20" fill="#E7739F" />
                <ellipse cx="36" cy="114" rx="3.8" ry="5.8" fill="#1F1B24" />
                <ellipse cx="52" cy="114" rx="3.8" ry="5.8" fill="#1F1B24" />
              </svg>
              <svg className="pig-jaw loop" viewBox="38 134 44 18">
                <path d="M44 140Q58 152 76 140" fill="none" stroke="#1F1B24" strokeWidth="4.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="trough pos" style={place({ x: 150, y: 540, w: 190, mx: 66, my: 296, mw: 96 })}>
          <svg viewBox="0 0 190 58">
            <ellipse cx="95" cy="54" rx="88" ry="4" fill="#1F1B24" opacity=".12" />
            <path d="M14 16Q30 0 48 10Q64 -2 84 8Q102 -4 120 8Q138 0 154 10Q166 4 176 16Z" fill="#8C5A2B" />
            <path d="M0 14H190L176 54H14Z" fill="#3A6AD4" />
            <path d="M0 14H190L180 46H10Z" fill="#4F86F7" />
            <rect x="-2" y="9" width="194" height="11" rx="5.5" fill="#3A6AD4" />
          </svg>
        </div>

        {[0, 1, 2].map((i) => (
          <Coin key={`burst-${i}`} at={BURST} burst />
        ))}
      </Layer>
    </Stage>
  );
}
