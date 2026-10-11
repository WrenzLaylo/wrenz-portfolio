import type { ReactNode } from "react";
import type { Slug } from "@/content/types";

const INK = "#1F1B24";

/** One shared eye (#s-eye in the sprite): an ink pupil with a white highlight, radius 5.5 at size 12. */
function Eye({ x, y, size = 12 }: { x: number; y: number; size?: number }) {
  return <use href="#s-eye" x={x - size / 2} y={y - size / 2} width={size} height={size} />;
}

function Smile({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />;
}

const ART: Record<Slug, { viewBox: string; body: ReactNode }> = {
  pos: {
    viewBox: "0 0 120 112",
    body: (
      <>
        <path d="M24 32L30 8L48 26Z" fill="#E7739F" stroke="#E7739F" strokeWidth="6" strokeLinejoin="round" />
        <path d="M96 32L90 8L72 26Z" fill="#E7739F" stroke="#E7739F" strokeWidth="6" strokeLinejoin="round" />
        <circle cx="60" cy="62" r="44" fill="#E7739F" />
        <circle cx="60" cy="57" r="43" fill="#FF9EC4" />
        <ellipse cx="30" cy="68" rx="7" ry="4.5" fill="#FF7FB0" />
        <ellipse cx="90" cy="68" rx="7" ry="4.5" fill="#FF7FB0" />
        <Eye x={43} y={49} />
        <Eye x={77} y={49} />
        <ellipse cx="60" cy="72" rx="18" ry="13" fill="#E7739F" />
        <ellipse cx="54" cy="72" rx="3" ry="4.5" fill={INK} />
        <ellipse cx="66" cy="72" rx="3" ry="4.5" fill={INK} />
        <Smile d="M52 91Q60 97 68 91" />
      </>
    ),
  },
  "time-log": {
    viewBox: "0 0 130 112",
    body: (
      <>
        <path fill="#B9D3F5" transform="translate(0 6)" d="M20 14H110A16 16 0 0 1 126 30V70A16 16 0 0 1 110 86H48L28 104L31 86H20A16 16 0 0 1 4 70V30A16 16 0 0 1 20 14Z" />
        <path fill="#fff" d="M20 14H110A16 16 0 0 1 126 30V70A16 16 0 0 1 110 86H48L28 104L31 86H20A16 16 0 0 1 4 70V30A16 16 0 0 1 20 14Z" />
        <Eye x={50} y={44} size={13} />
        <Eye x={80} y={44} size={13} />
        <path d="M55 58Q65 67 75 58" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </>
    ),
  },
  "service-areas": {
    viewBox: "0 0 120 112",
    body: (
      <>
        <path d="M12 46L60 10L108 46V104H12Z" fill="#FF6A4D" stroke="#FF6A4D" strokeWidth="8" strokeLinejoin="round" />
        <path d="M6 48L60 8L114 48" fill="none" stroke="#D9472B" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="26" y="52" width="68" height="52" rx="6" fill="#FFF8EE" />
        <path d="M30 64H90M30 94H90" stroke="#F2C9BF" strokeWidth="3" />
        <Eye x={47} y={76} />
        <Eye x={73} y={76} />
        <Smile d="M52 86Q60 92 68 86" />
      </>
    ),
  },
  katiwala: {
    viewBox: "0 0 80 120",
    body: (
      <>
        <rect x="8" y="10" width="68" height="106" rx="16" fill="#138F80" />
        <rect x="4" y="4" width="68" height="106" rx="16" fill="#20B2A0" />
        <rect x="12" y="16" width="52" height="74" rx="8" fill="#FFF8EE" />
        <Eye x={30} y={46} size={11} />
        <Eye x={46} y={46} size={11} />
        <Smile d="M31 58Q38 64 45 58" />
        <rect x="28" y="97" width="20" height="5" rx="2.5" fill="#FFF8EE" />
      </>
    ),
  },
  stockroom: {
    viewBox: "0 0 120 110",
    body: (
      <>
        <rect x="12" y="36" width="96" height="70" rx="10" fill="#B97A38" />
        <rect x="12" y="30" width="96" height="68" rx="10" fill="#E3A85E" />
        <path d="M16 32L6 14H52L58 30Z" fill="#B97A38" stroke="#B97A38" strokeWidth="4" strokeLinejoin="round" />
        <path d="M104 32L114 14H68L62 30Z" fill="#B97A38" stroke="#B97A38" strokeWidth="4" strokeLinejoin="round" />
        <rect x="52" y="30" width="16" height="20" fill="#F6E2C2" />
        <Eye x={45} y={64} />
        <Eye x={75} y={64} />
        <Smile d="M52 78Q60 85 68 78" />
      </>
    ),
  },
  "agent-island": {
    viewBox: "0 0 120 112",
    body: (
      <>
        <path d="M60 24V10" stroke="#6A4FE0" strokeWidth="6" strokeLinecap="round" />
        <circle cx="60" cy="9" r="7" fill="#FFC72C" />
        <rect x="2" y="52" width="12" height="28" rx="6" fill="#6A4FE0" />
        <rect x="106" y="52" width="12" height="28" rx="6" fill="#6A4FE0" />
        <rect x="10" y="30" width="100" height="78" rx="24" fill="#6A4FE0" />
        <rect x="10" y="24" width="100" height="78" rx="24" fill="#8B6CFF" />
        <rect x="24" y="40" width="72" height="46" rx="16" fill="#FFF8EE" />
        <Eye x={47} y={60} />
        <Eye x={73} y={60} />
        <Smile d="M52 72Q60 79 68 72" />
      </>
    ),
  },
  "everyday-rockstar": {
    viewBox: "0 0 120 112",
    body: (
      <>
        <path
          transform="translate(0 6)"
          d="M60 6L74.1 38.6L109.5 41.9L82.8 65.4L90.6 100.1L60 82L29.4 100.1L37.2 65.4L10.5 41.9L45.9 38.6Z"
          fill="#E29C0E"
          stroke="#E29C0E"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <path
          d="M60 6L74.1 38.6L109.5 41.9L82.8 65.4L90.6 100.1L60 82L29.4 100.1L37.2 65.4L10.5 41.9L45.9 38.6Z"
          fill="#FFC72C"
          stroke="#FFC72C"
          strokeWidth="8"
          strokeLinejoin="round"
        />
        <Eye x={51} y={57} size={10} />
        <Eye x={69} y={57} size={10} />
        <Smile d="M55 68Q60 73 65 68" />
      </>
    ),
  },
  lipad: {
    viewBox: "0 0 120 84",
    body: (
      <>
        <rect x="6" y="14" width="108" height="64" rx="14" fill="#B6C6DC" />
        <rect x="6" y="8" width="108" height="64" rx="14" fill="#FFFFFF" />
        <rect x="6" y="8" width="108" height="14" rx="7" fill="#4F86F7" />
        <circle cx="20" cy="15" r="3.5" fill="#FFFFFF" />
        <circle cx="100" cy="15" r="3.5" fill="#FFFFFF" />
        <Eye x={47} y={40} />
        <Eye x={73} y={40} />
        <Smile d="M52 54Q60 61 68 54" />
      </>
    ),
  },
  keyclick: {
    viewBox: "0 0 110 110",
    body: (
      <>
        <rect x="8" y="20" width="94" height="84" rx="20" fill="#E06A1F" />
        <rect x="18" y="10" width="74" height="70" rx="16" fill="#FF8A3D" />
        <Eye x={42} y={40} />
        <Eye x={68} y={40} />
        <Smile d="M47 54Q55 61 63 54" />
      </>
    ),
  },
  med42: {
    viewBox: "0 0 120 112",
    body: (
      <>
        <path
          transform="translate(0 6)"
          d="M60 100C22 74 8 54 8 34C8 18 20 6 36 6C47 6 55 12 60 21C65 12 73 6 84 6C100 6 112 18 112 34C112 54 98 74 60 100Z"
          fill="#D94A60"
        />
        <path
          d="M60 100C22 74 8 54 8 34C8 18 20 6 36 6C47 6 55 12 60 21C65 12 73 6 84 6C100 6 112 18 112 34C112 54 98 74 60 100Z"
          fill="#FF6B7F"
        />
        <Eye x={46} y={42} />
        <Eye x={74} y={42} />
        <Smile d="M52 56Q60 63 68 56" />
      </>
    ),
  },
  pesowise: {
    viewBox: "0 0 120 100",
    body: (
      <>
        <rect x="8" y="24" width="104" height="70" rx="18" fill="#2A9A6E" />
        <rect x="8" y="18" width="104" height="70" rx="18" fill="#3DBE8B" />
        <rect x="72" y="38" width="44" height="30" rx="12" fill="#2A9A6E" />
        <circle cx="88" cy="53" r="5" fill="#FFC72C" />
        <Eye x={34} y={46} />
        <Eye x={56} y={46} />
        <Smile d="M39 60Q45 66 51 60" />
      </>
    ),
  },
};

export function Mascot({ slug, className }: { slug: Slug; className?: string }) {
  const art = ART[slug];
  return (
    <svg className={className} viewBox={art.viewBox} aria-hidden="true" focusable="false" data-mascot={slug}>
      {art.body}
    </svg>
  );
}
