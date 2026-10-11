# Portfolio redesign, Spec 1: design system, motion engine, home page, technical SEO

- **Date:** 2026-10-11 (revised the same day after the Fable 5.1 review)
- **Status:** APPROVED by Wrenz 2026-10-11 (after the Fable 5.1 review, verdict: approve with fixes, was applied)
- **Scope:** Spec 1 of 2. Spec 2 (the `/work/[slug]` case-study pages) is written after this one and
  builds on the components defined here.
- **Inputs:** `HANDOFF.md` (repo root, untracked; decisions, rejected rounds, the Fable SEO audit) and the
  approved slice prototype at `C:\Users\OASIS\scratch-portfolio\slice\` (its `README.md` holds the
  measured performance rules). The slice is the visual reference. Its code is not shipped as is.

## 1. Goal and success criteria

Rebuild the one-page portfolio at `wrenz-portfolio.vercel.app` in the approved direction: a light,
colourful, playful but professional page where every project is a real screenshot in a device frame,
surrounded by an animated sticker-flat SVG scene in its own colour world, with parallax. It must serve
recruiters and freelance clients equally, and it must fix the SEO gaps found in the Fable audit.

Success means all of the following, measured as described in Section 14:

1. **Smooth on Wrenz's laptop** (i7-8550U, Intel UHD 620, real Chrome): 60 fps at 1x CPU, with the frame
   budgets in Section 12.
2. **Fast on a phone:** LCP < 2.5 s on Lighthouse mobile (simulated 4G), CLS < 0.1, INP < 200 ms.
3. **Complete without JavaScript** and with `prefers-reduced-motion: reduce`: every word, link, image and
   the finished frame of every scene are present.
4. **SEO P0 and P1 items done** (Section 13): robots, sitemap, OG image, JSON-LD, one H1 with name and
   role, mock UI hidden from assistive tech.
5. **Wrenz approves it** on the Vercel preview of the `redesign` branch.

## 2. Fixed decisions

These were settled in brainstorming (2026-10-09 to 2026-10-11) and are not reopened by this spec.

- **Stack stays:** Next 16.2.12 (App Router), React 19.2.4, Tailwind 4, GSAP 3.15 (replaced by the Web
  Animations API on 2026-10-11, see "Decisions after approval" below), Vercel. This Next differs
  from older versions: read `node_modules/next/dist/docs/` before using any API (`AGENTS.md`).
- **Architecture is approach A:** the server renders all page and scene markup. Idle loops and parallax
  are CSS. One small client runtime loads per-scene GSAP choreography on demand. (Changed in review: the
  ScrollTrigger fallback for browsers without CSS scroll timelines is dropped; those browsers get no
  parallax. See Section 11.)
- **Light theme only.** No dark mode. `color-scheme: light`.
- **No Three.js, WebGL, Lenis or scroll hijacking.** Native scroll only.
- **Fresh identity:** retire navy + lime, IBM Plex and the dossier card. Keep the plain, concrete copy
  voice and the Filipino specifics.
- **Two specs.** This one covers the design system, the motion engine, the home page and technical SEO.
- **Home = 6 full worlds + 5 compact vignettes.**
- **Domain-agnostic:** the site URL is one config value.
- **Experience:** "Developer, AI & Automation · Managed Virtual Services", with AGG Doors (Melbourne) as the
  client. The "Freelance" and "Self-employed" rows are removed.
- **Portrait:** keep the current crop on its dark studio backdrop (no cut-out).
- **Every project has a mascot.** All mascots share the pig's face grammar.

### Decisions after approval

- **2026-10-11, at the Phase 3 gate (Wrenz): GSAP is replaced by the Web Animations API.** Wrenz chose
  "Rewrite on WAAPI" after the gate found the cause of its 4x frame misses: on this page every frame in which
  GSAP changes a transform or opacity on the main thread makes Chrome re-layerize the whole page (about 9 ms
  per frame at 4x CPU), and GSAP's 27 KB put the page over the 150 KB JS budget. The choreographies now call
  `element.animate()` with transform and opacity keyframes through `src/motion/waapi.ts` (GSAP's eases as
  cubic-béziers or exact keyframes, never `linear()`), so they run on the compositor. The `gsap` package is
  removed, `SceneEnv` has no `gsap`, and the runtime loads only the world's choreography chunk. Read "GSAP"
  as "the Web Animations API" in the stack line above, the architecture line, Section 6, Section 11 (Rule 3,
  the contract and runtime step 2) and the Section 12 JS row. Two deliberate differences from the GSAP
  timelines: the time-log total appears in one step instead of counting up (every text change costs a
  re-layerization), and the POS loops start when the legs settle (1.35 s) instead of at 1.1 s. Measured on
  the same laptop (Task 3.7a): full re-layerizations during the wheel scroll fall from 224 to 40 at
  1440 / 4x and from 217 to 37 at 390 / 4x; the POS entrance from 28 to 5, the time-log entrance from 233
  to 18, a pig hop at 390 from about 227 to 26 per 4 s. JS by load + 2 s falls from 180.9 to 148.9 KB
  gzipped together with the next decision. The 4x frame budgets at 1440 still miss; the remaining costs
  are listed in the Task 3.7a report.
- **2026-10-11, same task: images render without next/image's client component.** `next/image` is a client
  component worth about 5.9 KB gzipped, which kept the page over 150 KB once GSAP was gone. A server
  component, `src/components/Img.tsx`, renders the identical `<img>` markup: the same srcset of `/_next/image`
  optimizer URLs (AVIF, then WebP, quality 75), sizes, width and height, lazy or eager loading and
  `fetchPriority`. A test compares its markup with `next/image` for every image on the page and fails on
  any runtime import of `next/image`. Read "`next/image`" in Sections 6, 7 and 12 as this component.

## 3. Page structure

In order, top to bottom:

| # | Section | Anchor | Layout family |
|---|---|---|---|
| 1 | Nav (sticky) | | single bar |
| 2 | Hero, the "cast" | `#top` | asymmetric split: copy left, portrait + 6 mascots right |
| 3 | Work: 6 full worlds | `#work` | split zigzag, broken by two full-bleed worlds |
| 4 | More work: 5 vignettes | `#more-work` | 5-cell bento |
| 5 | Capabilities | `#capabilities` | list + pill clusters on plain paper |
| 6 | Experience | `#experience` | vertical timeline |
| 7 | About | `#about` | text column + sticker sheet |
| 8 | Contact | `#contact` | centred closing band |
| 9 | Footer | | single row |

World order: **Pig Feeds POS, AGG Doors time-log, AGG Doors service areas, Katiwala, Stockroom API,
Agent Island.** Worlds 1, 2, 4 and 5 are splits (copy and stage side by side, alternating sides). Worlds 3
and 6 are full-bleed (the scene spans the width and the copy sits over a calm part of it), so no more than
two splits run in a row.

The existing anchors `#work`, `#experience`, `#about` and `#contact` keep their names.

**Retired from the current site:** the dossier card, the "PRODUCTION LOOP 01—03" strip, the
"01 / BUSINESS SYSTEM" index labels, split section headers (big headline left, small paragraph right),
kicker labels over every section, the div-built fake UIs, and the hero meta strip (its facts move to About).

## 4. Design system

Carried from the slice (Fable 5.1 art direction), now as Tailwind 4 `@theme` tokens in `globals.css`.

**Colour**

| Token | Value | Use |
|---|---|---|
| `--paper` | `#FFF8EE` | page background |
| `--ink` | `#1F1B24` | text, faces, device bezels |
| `--muted` | `#5B5566` | secondary text (passes 4.5:1 on paper) |
| `--yolk` / `--yolk-shade` | `#FFC72C` / `#E29C0E` | the single site accent. Fill only, never text |
| `--focus` | `#1F5EFF` | focus ring (3 px, 3 px offset) |

**World colours.** Each full world has a tint (lightness 88 to 91) and one saturated stage colour.
Adjacent worlds never share a hue family. Families in page order: green (POS), blue (time-log), coral
(service areas), teal (Katiwala), lilac (Stockroom), rose (Agent Island). POS and time-log use the slice's
values (`--pos-tint #D9F2CF`, `--grass #86D96F`; `--time-tint #D6E9FF`, `--clock #9CC5FF`,
`--avatar #1F5EFF`). Fable sets the other four when each world is built, and every text-on-tint pair is
checked for 4.5:1. All tints are global tokens (`--tint-<slug>`) because the hill edge at the bottom of
each world is filled with the next world's tint. Vignette tints follow the same rule within the grid.

**Type.** Gabarito (display) and Albert Sans (body) through `next/font/google`, which downloads the files at
build time and serves them from the site's own origin. Two calls, each with `subsets: ["latin"]`:
`Gabarito` (variable weight) and `Albert_Sans` with `style: ["normal", "italic"]` (variable weight). The
`subsets` option only decides what is preloaded: every subset's `@font-face` is still emitted with its
`unicode-range`, so the latin-ext files (which hold the ₱ glyph) load on demand. That gives exactly
**three preloads**: Gabarito latin, Albert Sans normal latin, Albert Sans italic latin. Italic must stay in the
same `Albert_Sans` call; a separate call gets a different hashed family name and `<em>` would not use it.

| Role | Size (desktop / mobile) | Font |
|---|---|---|
| Slogan in H1 | clamp(44px, 5vw, 68px) | Gabarito 800 |
| h2 | 56 / 36 | Gabarito 800 |
| Project h3 | 36 / 26 | Gabarito 800 |
| Body | 18 / 17, line-height 1.55 | Albert Sans 400 |

Nothing renders below 12 px, including text inside scenes. Headings use `text-wrap: balance`. Body
paragraphs are capped at 65ch.

**Shape.** Radii 8, 16 and 32 px, plus pill for buttons and tags. Device frames have an ink bezel.

**Illustration.** Sticker-flat: two tones per object (a fill plus a shade about 20% darker underneath), no
outlines, no gradients, no filters. Ink only for faces and small details. One flat ellipse shadow at 12%
ink under grounded objects. Repeated parts (clouds, ticks, the shared mascot face) are defined once and
reused with `<use>`. Backdrop layers that never animate are plain `.svg` files loaded with `<img>`.

**Icons.** Phosphor (bold weight), inlined as SVG by the server. No other icon family.

**Copy rules** (enforced by tests where marked):
- Zero em dashes and en dashes in visible copy, including alt text (tested).
- Each Tagalog word is glossed once on first use, for example *benta* (sales), *utang* (credit) (tested).
- No eyebrow labels, no section numbers, no scroll cues, no version labels.
- One label per intent: "Email me" is the only contact label; "See the work" the only work label.
- No invented numbers or quotes. Every stat and every before/after line comes from a real source and is
  confirmed by Wrenz in the content PR.

## 5. Content model

All copy lives in typed data files. Components never hold copy.

```
src/content/
  site.ts          name, alternateName, role, email, socials, résumé path, location, url
  projects.ts      the 11 projects
  experience.ts    timeline entries
  capabilities.ts  the four capabilities + the stack groups
  recognition.ts   the four honours, each with an id; the ONE source of award wording (About stickers,
                   the LiPAD badge and the JSON-LD `award` all read from it)
  routes.ts        the list of indexable routes (Spec 1: "/" only; Spec 2 adds /work/*)
```

`site.url` is read once: `process.env.SITE_URL ?? "https://wrenz-portfolio.vercel.app"`. It is a server-only
value. Canonical, OG, sitemap, robots and JSON-LD all derive from it.

Copy strings use one inline convention: `*word*` renders as `<em>word</em>`. Nothing else is parsed. A
glossary in `content/glossary.ts` registers every Tagalog phrase with the exact gloss that must follow its
first use, for example `benta` → `(sales)`, `utang` → `(credit)`, `cash na pumasok` → `, the cash that
actually came in`.

```ts
export type FullSlug = "pos" | "time-log" | "service-areas" | "katiwala" | "stockroom" | "agent-island";
export type CompactSlug = "keyclick" | "med42" | "everyday-rockstar" | "lipad" | "pesowise";

type Link = { kind: "live" | "source" | "download" | "adaptation"; href: string; label: string };
type Shot = { src: string; alt: string; width: number; height: number; frame: "browser" | "phone" | "window" | "code" };
type Varied =
  | { kind: "stat"; value: string; label: string }
  | { kind: "flow"; steps: [string, string, string] }
  | { kind: "beforeAfter"; before: string; after: string }
  | { kind: "promise"; text: string }
  | { kind: "quote"; text: string; name: string; role: string }; // only with a real, approved quote

interface ProjectBase {
  name: string;
  summary: string;            // one sentence; vignettes 20 words max (tested)
  tags: string[];             // 4 max on vignettes, 5 max on worlds
  links: Link[];
  status: "public" | "private-client" | "private-product"; // private ones show "Private client project" / "Private product"
  shot?: Shot;
  awardId?: RecognitionId;    // points into recognition.ts; never a copy of the award text
  schemaType: "SoftwareApplication" | "WebSite" | "CreativeWork";
}
export interface FullProject extends ProjectBase {
  slug: FullSlug; tier: "full"; layout: "split-start" | "split-end" | "bleed";
  points: [string, string, string]; varied: Varied;
}
export interface CompactProject extends ProjectBase {
  slug: CompactSlug; tier: "compact"; cell: "wide" | "narrow" | "third";
}
```

`projects.ts` exports `fullProjects: FullProject[]` and `compactProjects: CompactProject[]` in page order.
They drive the worlds, the vignettes, the hero cast order, the JSON-LD ItemList and, in Spec 2, the case
study routes. Scene components and choreography loaders are registered in `Record<FullSlug, ...>` and
`Record<CompactSlug, ...>` maps, so a project without a scene fails the type check.

Draft copy for every project is in Appendix A.

## 6. Code layout

```
src/app/
  layout.tsx            fonts, metadata, viewport
  page.tsx              composes the sections, renders JSON-LD, mounts <MotionRuntime/>
  globals.css           layer order, Tailwind import, every scene.css import, @theme tokens, base styles,
                        shared motion keyframes
  robots.ts  sitemap.ts  opengraph-image.tsx (exports alt, size, contentType)  icon.svg  apple-icon.png
  dev/scenes/[id]/page.tsx   scene lab (Section 14), only built when SCENE_LAB=1
src/components/         server components: Nav, Hero, World, Vignette, MoreWork, Capabilities,
                        Experience, About, Contact, Footer, DeviceFrame, VariedBlock, Mascot, HillEdge, Rich
src/scenes/<slug>/      Scene.tsx (markup) + scene.css (world tokens, loops, parallax) + choreo.ts (full worlds only)
src/scenes/index.ts     Record<FullSlug, Scene> and Record<CompactSlug, Scene>
src/motion/
  MotionRuntime.tsx     "use client"; the only hand-written client component on the page (next/image's
                        own client code also ships and counts toward the JS budget)
  registry.ts           Record<FullSlug, () => Promise<{ default: Choreo }>> with literal import() calls
  types.ts              Choreo, SceneEnv
src/lib/                jsonld.ts (graph builder), rich.tsx (the *em* renderer)
tools/perf/             the slice's measurement tools, ported (Section 14)
```

Scene CSS files are plain global CSS, imported **only from `globals.css`**, never from `Scene.tsx`, so their
order is fixed. A CSS layer's priority is set by where the layer name first appears, so `globals.css` opens
with an order statement before anything else:

```css
@layer theme, base, components, scenes, utilities;
@import "tailwindcss";
@import "../scenes/pos/scene.css" layer(scenes);
/* ...one explicit line per scene, full worlds then vignettes (no globs) */
```

A content test fails if a `src/scenes/*/scene.css` file is missing from that list. Selectors are scoped under
`[data-scene="<slug>"]`.
Parts that choreography or CSS targets carry `data-part="<name>"`. CSS Modules are not used, because the
runtime and the choreography address parts by stable names.

## 7. The hero

- **Copy** (from the slice): H1 = "Wrenz Laylo, Developer, AI & Automation" plus the slogan "Messy operations
  in. Reliable systems out." inside the same H1. Lede: "I map the rules first: who can do what, what can
  fail, how we prove it. Then I build it." CTAs: "See the work" (to `#work`) and "Download résumé"
  (relative `/Wrenz_Laylo-Full-Stack.pdf`).
- **Stage:** the yolk blob, the portrait in its arch, and six mascots, one per full world: chat bubble
  (time-log), garage door (service areas), pig (POS), phone (Katiwala), box (Stockroom), and a new bot
  (Agent Island) replacing the slice's KeyClick keycap.
- **Nothing above the fold waits for JavaScript.** The hero entrance is CSS keyframes with `both` fill. The
  slogan and the portrait enter with transform only, never from opacity 0, so they count for LCP at first
  paint. There is no preload class that hides content. The portrait is `next/image` with
  `fetchPriority="high"` and `loading="eager"` (the `priority` prop is deprecated in Next 16). Lighthouse
  reports which element is the LCP: if it is the portrait at 1440, switch the portrait to `preload` (the
  docs' case for an LCP hero image) and measure again.
- **Height:** the hero fills `min-height: calc(100dvh - 64px)` (the sticky nav is 64 px), so the CTAs sit
  above the fold.
- **Idle bobs and the scroll-out** are CSS (the scroll-out uses a named `view-timeline`). The bobs start
  after the entrance by `animation-delay`. If `anim_raw.py` shows those bobs failing to composite, the
  runtime adds `.ready` to start them instead (loops only, never the entrance).
- The hero has no choreography file. Pointer parallax applies to it on desktop (Section 11).

## 8. The full worlds

**Anatomy** (server-rendered, `<section aria-labelledby>` per world):

- A full-width band on the world's tint, ending in an SVG hill edge filled with the next world's tint (the
  last world's edge uses the paper colour).
- **Copy:** the project name (h3), the summary, three ticks, the varied block, tags, and links. Private
  projects show "Private client project" or "Private product" (from `status`) in place of links. There is
  no "Case study" button in Spec 1; Spec 2 adds it. Each tick is an `<li>` holding the tick mark and **one**
  `<span>` with the text, so inline `<em>` never becomes its own flex or grid item (the current site's
  `.project-points li {display:flex}` bug).
- **Stage:** the real screenshot in a device frame, the animated scene around it, and the mascot. Three
  depth layers: background shapes, then device and scene, then foreground pieces. Objects are placed on the
  slice's design grid with inline custom properties (`--x --y --w` on desktop, `--mx --my --mw` on mobile)
  against the stage's design width (`--dw`, `--mdw`).
- **Accessibility and indexing:** the scene and any HTML mock UI are `aria-hidden="true"` and `inert`. Because
  `aria-hidden` does not stop search engines reading the markup, scenes contain **no** `h1`-`h6`, `button`,
  `a`, `table`, `th`, `form` or `input` elements: mock UI is built from `div` and `span` only (the time-log
  sheet included). The screenshot is the one meaningful image and has real alt text. A test renders each
  scene and fails on any of those elements.
- **Full-bleed worlds** (service areas, Agent Island) put the copy on a paper-coloured panel over a calm
  region of the scene, so the text never sits on moving parts.

**Varied block per world** (one each, so the worlds do not read as a template):

| World | Kind | Source of the content |
|---|---|---|
| Pig Feeds POS | beforeAfter | the owner's notebook, as described in the POS specs (confirmed by Wrenz 2026-10-11) |
| AGG Doors time-log | flow | the pipeline itself |
| AGG Doors service areas | stat | 178 suburb pages, all with unique copy |
| Katiwala | flow | the provider verification flow |
| Stockroom API | promise | the README's promise line |
| Agent Island | beforeAfter | the README |

**Scenes** (POS and time-log are approved; the others are the direction, refined with Fable as each is built):

| World | Visual | Scene |
|---|---|---|
| Pig Feeds POS | POS counter screenshot from the TEST database, browser frame | The pig walks in and eats pellets pouring from a feed sack. The screen runs its 6 s story: an order, 4 coins into the jar, "Cash sale saved" on the rail, then back. The saved-sale overlay covers only the rail strip. Hover or tap the pig and it hops. |
| AGG Doors time-log | the anonymised "A. Santos" week table (not a real sheet), with the caption "Representative week. Names and times are changed." | Chat bubbles fly into the sheet grid, rows tick in, clock hands sweep. |
| AGG Doors service areas | a real public Service Area page from aggdoors.com.au, browser frame | Suburb pins pop up across a simplified Melbourne map, and a garage door rolls up to reveal the page. |
| Katiwala | real app screens, phone frame | Tools (wrench, brush, plug) bounce in around the phone, and verification ticks land. |
| Stockroom API | a real Swagger UI (springdoc) capture, browser frame | Boxes stack onto shelves while a request returns "200 OK". |
| Agent Island | a designed panel built from the README's described states (idle pill, permission prompt with "Allow once / Don't ask again / Deny", "Continue in Terminal"). The app is never launched by an agent, because it types into live terminals. If Wrenz makes a real capture himself, it replaces the panel. | Three bots pass a JSON note into a Dynamic-Island pill, which expands to show the prompt choices. |

**Breakpoints** (page layout): mobile < 768 px, tablet 768 to 1023 px, desktop ≥ 1024 px. **Worlds stack**
(stage above copy, including the two full-bleed worlds) **below 1024 px**, and sit side by side or
full-bleed from 1024 px.

**Scene grids follow the stage, not the viewport.** Scene objects are sized in units of the stage's design
width, so a narrow stage shrinks scene text. Each `.stage` is `container-type: inline-size`, and the scene
switches to its mobile grid (`--mx --my --mw`, desktop-only parts dropped) with
`@container (max-width: 700px)`. This keeps scene text at 12 px or more at every width; `shoot.py` checks it
at 390, 820, 1024 and 1440. Pointer parallax never runs on the mobile grid.

## 9. The compact vignettes

- **Section:** plain h2 (no eyebrow), then a 5-cell grid with exactly five cells.
- **Desktop** (6 columns): row 1 = Everyday Rockstar (`wide`, 4 columns) + LiPAD (`narrow`, 2); row 2 =
  KeyClick, Med42, PesoWise (`third`, 2 each). **Tablet:** 2 columns, Everyday Rockstar spans both.
  **Mobile:** one column.
- **Each cell:** its own tint, a small scene with its mascot, the name (h3), a one-sentence summary (20 words
  max), up to 4 tags, the main link, and "Source" where the code is public. No whole-card click areas.
- **Visuals:**

| Vignette | Visual | Scene |
|---|---|---|
| Everyday Rockstar | the existing live-site screenshot | a star burst |
| LiPAD | scene only, plus the award badge (text from `recognition.ts`) | an invented licence plate (not a dataset image) turns from blurred to sharp: an opacity crossfade between two prepared images, never an animated `filter: blur` |
| KeyClick Automator | a real app window image from its repo or a still capture (the live app is never driven with synthetic input) | keys press themselves, a cursor clicks |
| Med42 Clinical Suite | a capture of the live app | a heartbeat line |
| PesoWise | a capture of the live app | pesos drop into a wallet |

- **Motion is CSS only.** No choreography files and no GSAP for vignettes. Loops run from the start (the
  vignettes are never hidden, so the "started while invisible" trap does not apply); the runtime pauses
  them off-screen. The entrance is a scroll-driven transform (`animation-timeline: view()`,
  `animation-range: entry`). Browsers without scroll timelines simply show the vignettes in place.
  Hover or keyboard focus plays one extra beat, which carries no information.

## 10. The other sections

- **Nav:** sticky, 64 px, solid paper background, no `backdrop-filter`. Wordmark "Wrenz Laylo", links Work,
  Experience, About, and the "Email me" button (`mailto:`). Below 768 px the links move into a menu opened
  by a button using the Popover API (the `popover` attribute plus React's `popoverTarget` prop), which gives
  toggling, Escape and light dismiss with no React state. The runtime adds one delegated listener that hides
  the popover when a link inside it is tapped. In a browser without the Popover API the links render inline
  under the bar; that is the accepted fallback. Touch targets are at least 44 px.
- **Capabilities:** h2 "One developer, four useful angles." Plain paper, no scene: a breather between the
  worlds and the timeline. Left: the four capabilities as a stacked list (Phosphor icon, name, one line), no
  cards. Right: the stack as four pill groups (Frontend, Backend, Platforms, Quality). Copy from the current
  site, minus the "01" to "04" numbers.
- **Experience:** h2 "Production work, not coursework dressed up." A vertical timeline:
  1. 2026 - present. Developer, AI & Automation · Managed Virtual Services. Client: AGG Doors, Melbourne.
     Body: production WordPress engineering, technical SEO, Python automation, Google Workspace APIs,
     verified live changes.
  2. 2026. Full-Stack Developer / AI Engineer Intern · eBiZolution. Healthcare portal. Body from the current
     site.

  The timeline line draws as the section scrolls (scroll-driven `scaleY`, transform only).
- **About:** h2 "I care about the handoff between "it runs" and "it's reliable."" A text column (AUF,
  BS Computer Science majoring in Data Science, Cum Laude, based in Bataan, Philippines, then the second
  paragraph from the current site, plus GitHub and LinkedIn links) beside a sheet of four flat stickers
  rendered from `recognition.ts`: Cum Laude (BS Computer Science, Data Science); Best Thesis Paper and
  Presenter, IRCITE 2026 (LiPAD); 1st Place, JPCS Hackathon 2025; Microsoft Certified: Azure Fundamentals.
  The portrait is not repeated.
- **Contact:** h2 "Have a workflow that has outgrown its spreadsheet?" A centred band on yolk with ink text.
  One line: "I'm open to full-time roles and freelance projects in business systems, automation, WordPress
  and applied AI." The "Email me" button, and the address `wrenzivan2004@gmail.com` as selectable text.
  The six hero mascots peek over the band's top edge with CSS bobs (the same SVG components, reused).
- **Footer:** "Designed and built by Wrenz Laylo.", GitHub, LinkedIn, "Back to top".

## 11. The motion engine

**Rule 1: the server sends the end state.** Every entrance animates *from* a start state *to* the markup as
rendered. With no JavaScript, or with reduced motion, the page is complete and still.

**Rule 2: CSS does everything that repeats or follows the scroll** (all inside
`@media (prefers-reduced-motion: no-preference)`):
- Idle loops, transform and opacity only. Several cycles are packed into one long iteration, because every
  iteration boundary wakes the main thread (slice: pellets = 6 falls per 3 s, tail = 8 wags per 4 s).
- World loops start only when the runtime adds `.live` to the scene root, after the entrance has revealed
  the parts. An animation that starts while its element is at opacity 0 or inside a hidden ancestor runs on
  the main thread for good.
- Parallax and the hero scroll-out use CSS scroll-driven animations (`view()` and named `view-timeline`),
  inside `@supports (animation-timeline: view())`. There is no JavaScript fallback (runtime step 6).
- Cards and stages use `overflow: clip`, never `overflow: hidden` (which creates a scroll container and
  captures the children's `view()` timelines).
- Moving parts that change often are separate HTML-level layers, not changes inside one big SVG (the pig is
  tail, body and head as separate elements, with the jaw inside the head).

**Rule 3: GSAP only does one-shot choreography and short interactions.** Per-frame tweens of SVG internals
are banned. (2026-10-11: the Web Animations API does this job instead of GSAP; see Section 2, "Decisions
after approval".)

**The choreography contract.** The start state must be applied while the world is still off-screen. An
IntersectionObserver callback arrives a frame after the edge has already painted, so a choreography that
first sets its start state "on entry" would show the end state, snap to the start state, then animate.
The slice avoids this with `gsap.set` at init (scenes.js 149-153, 230-236). So a choreography is
**prepared** as soon as its module is ready, and **entered** later:

```ts
export type SceneEnv = {
  gsap: typeof import("gsap").gsap;
  mobile: boolean;       // the stage is on its mobile grid (container width ≤ 700 px)
  pointer: boolean;      // matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)")
  skipEntrance: boolean; // true when the scene was already visible when its module arrived
};
export type Scene = { enter(): void; cleanup(): void };
// prepare: applies the start state only when !env.skipEntrance, wires interactions, returns the handle
export type Choreo = (root: HTMLElement, env: SceneEnv) => Scene;
```

`enter()` plays the entrance (or does nothing when skipping) and then adds `.live`. `cleanup()` kills its
tweens, removes listeners and any elements it appended, and restores the server end state.

The contract does not depend on GSAP beyond `env.gsap`, so a choreography can be rewritten with the Web
Animations API without touching the runtime. That is the first lever if the 4x CPU budget fails.

**The runtime** (`MotionRuntime.tsx`, `"use client"`, renders nothing, mounted once by `page.tsx`):
1. Starts in `useEffect`, after hydration. If reduced motion is set, it only installs the nav listener.
2. One `IntersectionObserver` watches every `[data-scene]`. When a world is within 50% of a viewport of the
   screen, it starts `Promise.all([import("gsap"), registry[slug]()])`, so exactly one GSAP chunk exists.
   As soon as both resolve it calls the choreography (prepare), with `skipEntrance` true if the world is
   already visible at that moment.
3. When a prepared world enters the viewport it calls `enter()`. A world prepared with `skipEntrance`
   gets `enter()` at once, which just adds `.live`: no snap back to the start state.
4. When any scene (world or vignette) leaves the viewport, it gets `.paused`; it loses the class on
   re-entry. `.paused` sets `animation-play-state: paused` **only on time-based loops** (elements marked
   `.loop`). Scroll-driven animations (parallax, the hero scroll-out, vignette entrances, the timeline
   line) are never paused, because pausing them desyncs them from the scroll and they jump on re-entry.
5. **Pointer parallax** on desktop only (`env.pointer`: a fine hovering pointer and a viewport at least
   1024 px wide): one `pointermove` listener; on each animation frame it writes `transform` to the `.mouse`
   wrappers of visible scenes, with no layout reads. It switches itself off for the session when more than
   25% of pointer frames take longer than 24 ms.
6. **No scroll-driven fallback.** Where `animation-timeline` is unsupported, there is no parallax, no hero
   scroll-out and no vignette entrance: those elements simply sit in place. ScrollTrigger is not used at
   all (its UMD build runs a permanent rAF loop, and the browsers that would need it are the weakest
   devices). One-shot entrances and loops still run there.
7. **Cleanup:** on unmount it disconnects observers, removes listeners, runs every choreography cleanup
   (including removing elements a choreography appended), and removes `.live`, `.paused` and `.ready`.
   Spec 2 soft-navigates back to `/`, so a second mount must behave like the first.

`cacheComponents` stays off, so hidden trees are not kept alive.

## 12. Performance budget

Checked before every visual PR (Section 14). A PR that misses a budget does not merge until it is fixed or
Wrenz accepts the miss in writing on the PR.

| Measure | Budget |
|---|---|
| Frames, 1x CPU, 1440×900 and 390×844 | 60 fps in every phase; wheel scroll through the whole page: ≤ 10 frames over 25 ms per ~300 |
| Frames, 4x CPU throttle | idle scenes ≥ 57 fps; wheel scroll ≤ 60 frames over 25 ms per ~300 |
| JavaScript | all JS transferred by load + 2 s idle, no scrolling, at 390×844: ≤ 150 KB gzipped (today ~243 KB). This includes next/image's client code and GSAP + the POS choreography, which load at once on a phone because the POS world sits inside the 50% pre-load margin |
| Each choreography chunk | ≤ 8 KB gzipped |
| HTML document (including the inline RSC payload) | ≤ 80 KB gzipped |
| DOM | ≤ 300 elements per world stage, ≤ 120 per vignette, ≤ 2,500 for the whole page (the slice measured 109 to 183 per stage, 511 in total, 7.6 KB gzipped). Every element is sent twice (HTML + the inline RSC payload), which is why this is tight |
| Images | AVIF then WebP through `next/image` (`images.formats: ["image/avif", "image/webp"]` in `next.config.ts`), with width and height; default quality 75 (Next 16 only allows qualities listed in `images.qualities`, default `[75]`); everything below the hero lazy-loads |
| LCP / CLS / INP | < 2.5 s (Lighthouse mobile) / < 0.1 / < 200 ms |

If the HTML budget is close and LCP is marginal, try `experimental.inlineCss` and measure.

## 13. Technical SEO

**Metadata** (`layout.tsx`): `metadataBase` from `site.url`; title template `%s | Wrenz Laylo` with the
default title "Wrenz Laylo, Developer, AI & Automation"; a description; `alternates.canonical: "/"`;
`openGraph` with `siteName`, `type: "website"`, `locale: "en_PH"`; `twitter.card: "summary_large_image"`;
`authors`. `keywords` is removed. `export const viewport = { themeColor: "#FFF8EE" }`.

**Metadata files:**
- `robots.ts`: allow all, `sitemap: ${site.url}/sitemap.xml`.
- `sitemap.ts`: one entry per item in `content/routes.ts`.
- `opengraph-image.tsx`: `ImageResponse` from `next/og`, 1200×630 PNG, generated at build time: name, role,
  slogan, the yolk blob and the portrait. It exports `alt`, `size` and `contentType` (an `.alt.txt` file only
  pairs with static image files). The OG renderer cannot read woff2 or variable fonts, so one static
  Gabarito ExtraBold TTF (OFL) is committed for this file only, and the portrait is read from a committed
  JPEG crop (do not rely on the renderer decoding WebP).
- `icon.svg` and `apple-icon.png` (180×180): "WL" in Gabarito 800 on yolk.

**JSON-LD:** one `<script type="application/ld+json">` in `page.tsx` holding an `@graph`, built by
`lib/jsonld.ts` from the content files, serialised with `<` replaced by `\u003c`:
- `Person` (`@id` = `${site.url}/#person`): name "Wrenz Laylo", alternateName "Wrenz Ivan Laylo", jobTitle,
  `worksFor` Organization "Managed Virtual Services", `alumniOf` CollegeOrUniversity "Angeles University
  Foundation", `award` (the four honours), `address` (Bataan, PH), `image` (the portrait), `email`,
  `sameAs` (GitHub, LinkedIn).
- `WebSite` (`name`, `url`) and `ProfilePage` (`mainEntity` = the Person).
- `ItemList` of the 11 projects in page order. Each `ListItem` holds the project's `schemaType` with name,
  description and its main link. Spec 2 points these at the case-study URLs.

**On the page:** one H1 with name and role; an h2 per section; an h3 per project; mock UI `aria-hidden` and
`inert`; real alt text on screenshots; external links `rel="noopener"`.

**Weight:** three font preloads (down from six; Section 4). Shrink `katiwala-logo.png` (594 KB source for a 58 px
render) or drop it if the new design does not use it. Delete `public/motion.js` (dead code) and the unused
create-next-app SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).

**Not in Spec 1:** the case-study OG images and `CreativeWork` pages (Spec 2); Search Console verification
(waits for the real domain).

## 14. Testing

**In GitHub Actions on every PR** (`.github/workflows/ci.yml`, new): `npm ci`, `eslint`, `tsc --noEmit`,
`vitest run`, `next build`.

**Vitest** (new dev dependency), with tests for:
- **Content integrity:** slugs are unique; every full project has three points and a varied block; vignette
  summaries are 20 words or fewer; tag limits; links are absolute `https:` URLs or root-relative paths; no
  em or en dash in any string in `src/content/`; the first use of each phrase in `glossary.ts` is followed by
  exactly its registered gloss; every `src/scenes/*/scene.css` is imported in `globals.css`.
- **Scene markup:** each scene renders without `h1`-`h6`, `button`, `a`, `table`, `th`, `form` or `input`.
- **JSON-LD:** the output parses, contains the Person, WebSite, ProfilePage and an ItemList of 11 items, and
  has no raw `<`.
- **Robots and sitemap:** URLs are built from `site.url`, and changing `SITE_URL` changes all of them.
- **The `*em*` renderer.**

**On real hardware** (this laptop, real Chrome via Playwright `channel="chrome"`, run with `py -3.11 -I`,
against `next build && next start`), before every visual PR, results pasted into the PR:
- **Scene lab:** `/dev/scenes/[id]` renders one scene alone. It is fully static: `generateStaticParams`
  returns every slug when the build ran with `SCENE_LAB=1` and `[]` otherwise, and `dynamicParams = false`.
  So on Vercel (no `SCENE_LAB`) the route has no pages, creates no function, returns 404, and is not in the
  sitemap.
- **Ported slice tools** in `tools/perf/`: `perf.py` (rAF frame timing per phase, 1x and 4x CPU),
  `smooth.py` (Chrome's presented and dropped frame counts), `who.py` (what wakes the main thread),
  `anim_raw.py` (which animations failed to composite and why), `shoot.py` (screenshots every 0.6 viewport,
  flags text under 12 px and horizontal overflow), plus a new `budget.py` (JS, HTML and DOM counts against
  Section 12).
- **Lighthouse** mobile run for LCP, CLS and INP (TBT as the lab proxy for INP).
- **Accessibility:** an axe-core scan injected by the Playwright tools; a keyboard-only pass (skip link,
  nav, menu, every link reachable, visible focus); a reduced-motion pass; a JavaScript-disabled pass.
- **Screenshots at 1:1** at 390×844, 820×1180, 1024×768 and 1440×900, checked for overlaps, scene text under
  12 px and unreadable text.
- **Fable 5.1 design critique** after every visual phase on those screenshots, sorted into MUST-FIX and
  NICE-TO-HAVE. MUST-FIX items are fixed before the phase closes.

## 15. Delivery

1. PR #1 (KeyClick) is merged into `master` (done 2026-10-11, e0e96de). Its copy then moves into `projects.ts`
   as a vignette.
2. An integration branch `redesign` is created from `master`. Every task gets its own branch and a PR into
   `redesign`, with its own Vercel preview. Wrenz reviews each PR on GitHub. Nothing reaches `master` (the
   live site) until the final `redesign` to `master` PR, which Wrenz merges.
3. Phase order (the implementation plan details the tasks). The order puts a complete, reviewable page on the
   preview as early as possible (after Phase 4), then fills in the remaining worlds:
   0. Tooling: `.superpowers/` in `.gitignore`, `HANDOFF.md` moved into `docs/`, Vitest, CI, the ported perf
      tools, the scene lab
   1. Foundation: tokens, fonts, the content model and copy files, layout shell, nav, the runtime
   2. SEO: metadata, robots, sitemap, OG image, icons, JSON-LD, and their tests
   3. Hero, Pig Feeds POS and time-log (ported from the slice)
   4. Capabilities, Experience, About, Contact, footer
   5. AGG Doors service areas and Katiwala (two new scenes, each designed with Fable)
   6. Stockroom API and Agent Island (two new scenes, each designed with Fable)
   7. The five vignettes
   8. Final performance, SEO and accessibility pass

   Phases 5 and 6 each design two new scenes from scratch with a Fable critique round, so they are the
   longest phases.
4. Commits and PRs carry no Claude co-author lines or footers.

## 16. Asset capture and safety

| Asset | Source | Rule |
|---|---|---|
| POS screenshots | already captured in `slice/assets/` from the TEST database | No writes to `C:\Users\OASIS\Documents\POS\prisma\dev.db`. New captures follow `slice/tools/pos_saved.py`: server actions are fulfilled in the browser and never reach the server. Verify the db hash is unchanged. |
| Service Area page | public aggdoors.com.au pages | read-only screenshot |
| Katiwala screens | the app (see the Katiwala handover docs) | screens with test data only |
| Stockroom Swagger UI | the local app (Temurin 21, local Postgres) | local only; nothing is deployed to Azure for this |
| Agent Island | a designed panel from the README states | an agent never launches the app (it types into live terminals); only Wrenz may make a real capture |
| KeyClick | its repo images or a still capture | never drive the app with synthetic mouse or keyboard input |
| Med42, PesoWise | the live public apps | read-only screenshots, no sign-ups with real data |
| Portrait | the slice's `portrait.webp` | unchanged crop |

Processes: only stop process IDs we started ourselves. Never stop processes by name.

## 17. Out of scope

- The `/work/[slug]` case-study pages, their OG images and `CreativeWork` JSON-LD (Spec 2).
- Dark mode, a blog, analytics, a contact form.
- Buying or wiring a custom domain and Search Console.

## Appendix A: draft copy

Drafts follow the copy rules. Wrenz confirmed the facts below on 2026-10-11 (POS before line, service areas
numbers and tags, Katiwala points, the vignette heading). Any new fact added later is confirmed in its PR;
anything he does not confirm is cut, not guessed.

**Section headings:** Work: "Built around actual operations." More work: "Smaller builds, same habits."

### Full worlds

**Pig Feeds POS** (status `private-client`). Tags: Next.js, TypeScript, Prisma, SQLite, Vitest.
- Summary: A working till and credit ledger for a Philippine pig-feed store, shaped by how the owner
  separates *benta* (sales), cash received and *utang* (credit).
- Points: Checkout records the sale and takes the stock off the shelf in one transaction. / Customer
  passbooks keep every charge, payment and opening balance. / The dashboard keeps *benta* apart from
  *cash na pumasok*, the cash that actually came in.
- Before/after: Before: sales and credit written by hand in a notebook. After: every sale,
  payment and balance in one till, with stock that matches the shelf.

**AGG Doors time-log** (status `public`, via the public adaptation). Tags: Python, Google Chat API, Sheets API, Drive API, GitHub
Actions. Link: Public adaptation (github.com/WrenzLaylo/MVC-Time-Logs-Automation).
- Summary: A Python pipeline that turns free-form Google Chat attendance posts into validated weekly
  timesheets in Google Drive.
- Points: Tells physical arrival, login, break, lunch and logout apart. / Handles shared accounts, account
  migrations, missing events and impossible time orders. / Backs up before every write, then reads the sheet
  back through the API to prove it.
- Flow: A Chat post says "Login 7:23". / The pipeline parses and checks it. / The row is written, then read
  back.

**AGG Doors service areas** (status `public`: client work on live public pages). Tags: WordPress, REST API, Python, ACF, Schema.org.
Link: Live pages (aggdoors.com.au).
- Summary: WordPress REST API automation that builds and maintains 178 suburb Service Area pages for a
  Melbourne garage door company.
- Points: Groups 512 searchable suburbs into regions, with A to Z lists and a region sitemap. / Repoints 357
  old suburb links to the new region pages, so old links still land in the right place. / Writes every suburb page from local data,
  so no two pages read the same.
- Stat: 178, "suburb pages, none of them boilerplate".

**Katiwala** (status `private-product`, in active development). Tags: Expo, React Native, TypeScript, Prisma.
- Summary: A Filipino home-services marketplace with separate journeys for customers and service providers.
- Points: Customers browse services and book in a few steps. / Providers capture their ID and face, and OCR
  fills the form for them to correct. / New providers wait in a clear pending state until they are verified.
- Flow: A provider scans their ID. / OCR fills the form. / The account waits until it is verified.

**Stockroom API** (status `public`). Tags: Java 21, Spring Boot 4, PostgreSQL, Flyway, JUnit. Link: Source
(github.com/WrenzLaylo/stockroom-api).
- Summary: A multi-tenant inventory and orders REST API for small shops, built with Java 21 and Spring Boot
  4 and designed for Azure.
- Points: A guarded stock update and sorted row locks, proven by a concurrency test. / Every row carries its
  shop, and composite foreign keys stop data crossing between shops. / Stateless JWT sign-in with owner and
  staff roles, documented in Swagger UI.
- Promise: Stock can never go negative, even when two orders arrive at the same moment.

**Agent Island** (status `public`). Tags: Electron, TypeScript, Node.js, Windows. Link: Source
(github.com/WrenzLaylo/Agent-Island).
- Summary: A Dynamic Island-style overlay for Windows that shows what Claude Code, Codex and Hermes are
  doing and answers their permission prompts.
- Points: Picks up the terminals you already have open; there is nothing new to launch. / Shows permission
  prompts in the pill and types your answer into the real session. / Hands anything it should not answer
  back to the terminal, focused and ready.
- Before/after: Before: switch to each terminal to answer every prompt. After: answer from the pill, and the
  reply is typed into the real session.

### Vignettes

| Vignette | Summary | Tags | Links |
|---|---|---|---|
| Everyday Rockstar | A coaching and community site with a cinematic editorial look, custom motion and a full reduced-motion version. | Vite, JavaScript, GSAP, Apache | Live site |
| LiPAD | CRNN and GAN research that deblurs and reads Philippine licence plates. | TensorFlow, PyTorch, CRNN, GAN | none (award badge) |
| KeyClick Automator | A Windows app that turns keyboard and mouse automation into a visual sequence you can inspect, save and stop safely. | Python, PySide6, Qt Quick, PyInstaller | Download for Windows, Source |
| Med42 Clinical Suite | A clinical workflow with versioned diagnosis APIs, streamed AI responses, review states and audit logs. | Django REST, PostgreSQL, Redis, React | Live app, Source |
| PesoWise | A personal spending tracker with sign-in and protected user data. | Next.js, TypeScript, Prisma | Live app |

## Appendix B: review log

**Fable 5.1, 2026-10-11. Verdict: approve with fixes.** Every item was accepted and applied in this
revision:

| # | Finding | Where it landed |
|---|---|---|
| 1 | `subsets` only controls preloading; a separate italic call breaks `<em>` | §4 Type (one Albert Sans call, `subsets: ["latin"]`, three preloads), §13 |
| 2 | Start state applied on entry causes a visible snap | §11 contract (prepare, then `enter()`), runtime steps 2-3 |
| 3 | DOM budgets could not fit the HTML budget | §12 (300 / 120 / 2,500) |
| 4 | `.paused` must not touch scroll-driven animations | §11 runtime step 4 |
| 5 | ScrollTrigger fallback costs the weakest devices a permanent rAF loop | §2, §11 Rule 2 + step 6 (no fallback; no parallax there) |
| 6 | Breakpoints let scene text drop under 12 px | §8 (worlds stack below 1024; container-query scene grids), §14 widths |
| 7 | `.alt.txt` pairs only with static OG images; WebP in the OG renderer | §6, §13 |
| 8 | `@layer scenes` could land below Tailwind | §6 (layer order statement, explicit imports from `globals.css`) |
| 9 | Fake headings, buttons and tables inside scenes | §8, §14 test |
| 10 | Inline `<em>` as a flex item (current-site bug) | §8 ticks |
| 11 | Agent Island capture risk | §8, §16 (designed panel; only Wrenz captures) |
| 12 | Phase order and an explicit tooling phase | §15 |
| 13-21 | next/image client code in the JS budget; AVIF config; LCP `preload` check; static scene lab; `popoverTarget` + fallback; hero height; three-value `status`; one source for award text; gloss test format; 1024 px parallax gate | §6, §7, §10, §12, §5, §14, §11 |

**Wrenz, 2026-10-11. Verdict: approved.**

- Accepted dropping the ScrollTrigger fallback: browsers without CSS scroll timelines get no parallax (§2, §11).
- Confirmed the Appendix A facts: the POS before line, the service areas numbers and tags, the Katiwala points,
  and "Smaller builds, same habits."
- One correction from the fact check: the 357 redirects already existed in Rank Math and were repointed to the
  region pages, not added. The service areas point now says "Repoints".
- PR #1 (KeyClick) merged into `master` (e0e96de), completing delivery step 1.
