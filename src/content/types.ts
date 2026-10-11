export type FullSlug = "pos" | "time-log" | "service-areas" | "katiwala" | "stockroom" | "agent-island";
export type CompactSlug = "everyday-rockstar" | "lipad" | "keyclick" | "med42" | "pesowise";
export type Slug = FullSlug | CompactSlug;

export type RecognitionId = "cum-laude" | "ircite-2026" | "jpcs-2025" | "azure-fundamentals";

/** Phosphor bold icons available in the sprite (src/components/Sprite.tsx). */
export type IconName = "check" | "arrow-up-right" | "download" | "list" | "stack" | "flow-arrow" | "browser" | "sparkle";

export type Link = { kind: "live" | "source" | "download" | "adaptation"; href: string; label: string };

export type Shot = {
  src: string; // root-relative path under public/
  alt: string;
  width: number;
  height: number;
  frame: "browser" | "phone" | "window" | "code" | "laptop";
};

export type Varied =
  | { kind: "stat"; value: string; label: string }
  | { kind: "flow"; steps: [string, string, string] }
  | { kind: "beforeAfter"; before: string; after: string }
  | { kind: "promise"; text: string }
  | { kind: "quote"; text: string; name: string; role: string }; // only with a real, approved quote

export interface ProjectBase {
  name: string;
  summary: string; // one sentence; vignettes 20 words max (tested)
  tags: string[]; // 4 max on vignettes, 5 max on worlds (tested)
  links: Link[];
  status: "public" | "private-client" | "private-product";
  /** Exactly one of shot / illustrationLabel is set (tested). */
  shot?: Shot;
  illustrationLabel?: string;
  awardId?: RecognitionId; // points into recognition.ts; never a copy of the award text
  schemaType: "SoftwareApplication" | "WebSite" | "CreativeWork";
}

export interface FullProject extends ProjectBase {
  slug: FullSlug;
  tier: "full";
  layout: "split-start" | "split-end" | "bleed";
  points: [string, string, string];
  varied: Varied;
  caption?: string;
}

export interface CompactProject extends ProjectBase {
  slug: CompactSlug;
  tier: "compact";
  cell: "wide" | "narrow" | "third";
}

export type Project = FullProject | CompactProject;

export type Recognition = { id: RecognitionId; title: string; detail: string; subject?: string };

export type ExperienceEntry = { period: string; role: string; org: string; detail: string; body: string };

export type Capability = { icon: IconName; name: string; line: string };

export type StackGroup = { name: string; items: string[] };

export type NavLink = { href: `#${string}`; label: string };
