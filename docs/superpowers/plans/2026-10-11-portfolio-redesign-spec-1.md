# Portfolio Redesign, Spec 1: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the one-page portfolio in the approved direction (sticker-flat colour worlds around real screenshots, CSS-first motion, technical SEO) on an integration branch `redesign`, ending in one PR from `redesign` to `master` that Wrenz merges.

**Architecture:** Server Components render every word and the finished frame of every scene, so the page is complete without JavaScript. Idle loops and parallax are CSS (compositor thread). One client component, `MotionRuntime`, starts a framework-free engine (`src/motion/engine.ts`) that pauses off-screen loops and, for the six full worlds only, lazy-loads GSAP plus that world's choreography, *prepares* it while the world is off-screen and *enters* it on view. All copy lives in typed files under `src/content/`, which also drive JSON-LD, the sitemap and the scene registries.

**Tech Stack:** Next 16.2.12 (App Router, Turbopack), React 19.2.4, TypeScript 5.9, Tailwind CSS 4.3 (`@theme static` tokens, plain CSS files in cascade layers), GSAP 3.15 (dynamic import only, never ScrollTrigger), Vitest 3 + jsdom, Python 3.11 + Playwright driving real Chrome for performance checks, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md` (approved by Wrenz 2026-10-11). Executors read the spec section a task names before starting it. The plan argues from the spec; where they differ, the "Spec clarifications" section below says why.

**Visual reference:** the approved slice prototype in `C:\Users\OASIS\scratch-portfolio\slice\` (`index.html`, `styles.css`, `scenes.js`, `README.md`). Tasks port its art and motion with the changes listed in each task. Its code is not copied wholesale.

---

## Global Constraints

Every task's requirements include this section. Values are copied from the spec.

- **Stack is fixed:** Next 16.2.12, React 19.2.4, Tailwind 4, GSAP 3.15, Vercel. This Next differs from older versions: read the relevant file in `node_modules/next/dist/docs/` before using any Next API (`AGENTS.md`). `params` is a Promise. `priority` on `next/image` is deprecated (use `fetchPriority="high"` + `loading="eager"`, or `preload`). `images.qualities` is required (`[75]`).
- **Light theme only.** `color-scheme: light`. No dark mode.
- **No Three.js, WebGL, Lenis, scroll hijacking or ScrollTrigger.** Native scroll only.
- **Colour tokens:** paper `#FFF8EE`, ink `#1F1B24`, muted `#5B5566`, yolk `#FFC72C` / yolk-shade `#E29C0E` (fill only, never text), focus `#1F5EFF` (3 px ring, 3 px offset). POS: tint `#D9F2CF`, grass `#86D96F`. Time-log: tint `#D6E9FF`, clock `#9CC5FF`, avatar `#1F5EFF`. Adjacent worlds never share a hue family. Every text-on-tint pair is at least 4.5:1.
- **Type:** Gabarito (display) and Albert Sans (body) via `next/font/google`, exactly **three font preloads**. Slogan clamp(44px, 5vw, 68px) Gabarito 800; h2 56/36; project h3 36/26; body 18/17 line-height 1.55. **Nothing renders below 12 px, including scene text.** Headings `text-wrap: balance`; body paragraphs max 65ch.
- **Shape:** radii 8, 16, 32 px, plus pill for buttons and tags. Device frames have an ink bezel.
- **Illustration:** sticker-flat, two tones per object (fill + ~20% darker shade underneath), no outlines, gradients or filters. Ink only for faces and small details. One flat ellipse shadow at 12% ink under grounded objects.
- **Icons:** Phosphor bold only, inlined by the server.
- **Copy rules:** zero em dashes (U+2014) and en dashes (U+2013) in visible copy and alt text (tested); each Tagalog phrase glossed once on first use (tested); no eyebrow labels, section numbers, scroll cues or version labels; "Email me" is the only contact label and "See the work" the only work label; no invented numbers or quotes.
- **Components hold no copy.** Every visible string comes from `src/content/`.
- **Motion rules:** the server sends the end state; CSS runs everything that repeats or follows the scroll (transform and opacity only, inside `prefers-reduced-motion: no-preference`); GSAP only does one-shot choreography and short interactions; per-frame tweens of SVG internals are banned; world loops start only after `.live`; `overflow: clip`, never `overflow: hidden`, on cards and stages.
- **Scene markup:** decorative layers are `aria-hidden="true"`; scenes contain no `h1`-`h6`, `button`, `a`, `table`, `th`, `form` or `input` elements (tested).
- **Breakpoints:** mobile < 768 px, tablet 768 to 1023 px, desktop ≥ 1024 px. Worlds stack (stage above copy) below 1024 px.
- **Performance budget (spec §12):** 60 fps in every phase at 1x CPU at 1440×900 and 390×844, wheel scroll ≤ 10 frames over 25 ms per ~300; at 4x CPU idle scenes ≥ 57 fps and wheel scroll ≤ 60 frames over 25 ms per ~300; JS by load + 2 s idle at 390×844 ≤ 150 KB gzipped; each choreography chunk ≤ 8 KB gzipped; HTML document ≤ 80 KB gzipped; DOM ≤ 300 elements per world stage, ≤ 120 per vignette, ≤ 2,500 per page; LCP < 2.5 s (Lighthouse mobile), CLS < 0.1, INP < 200 ms. A PR that misses a budget does not merge until it is fixed or Wrenz accepts the miss in writing on the PR.
- **Images:** `next/image` with width and height, AVIF then WebP, quality 75; everything below the hero lazy-loads.
- **Commits and PRs carry no Claude co-author lines and no "Generated with Claude Code" footers.** (Wrenz's standing rule; it overrides any tool default.)
- **Processes:** only stop process IDs we started ourselves. Never stop processes by name.
- **Asset safety (spec §16):** no writes to `C:\Users\OASIS\Documents\POS\prisma\dev.db`; Agent Island is never launched by an agent; KeyClick is never driven with synthetic input; Med42 and PesoWise captures are read-only with no sign-ups using real data.
- **Tooling:** Python is `py -3.11 -I`; Playwright uses `channel="chrome"` (real Chrome at `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`). There is no PIL; `ffmpeg` is on PATH.

## Spec clarifications (decisions this plan makes)

The spec is approved. These points fill gaps or fix contradictions found while planning. Each names the task that implements it. Fable and Wrenz review them with the plan.

1. **Scene grid switch is 760 px, not 700 px** (spec §8). At an 820 px tablet viewport the stacked stage is 740 px wide; with the desktop grid (design width 820) the smallest scene text (13 design px) would render at 11.7 px, under the 12 px floor. 820 × 12 / 13 = 757, so world scenes switch to their mobile grid with `@container stage (width < 760px)`. The value lives in one constant, `STAGE_GRID_SWITCH = 760` (`src/scenes/grid.ts`), and a test checks that every scene CSS file uses the same literal. (Task 1.4)
2. **The hero's grid follows the viewport, not the stage.** The hero stage holds no text, and its two compositions match the hero's two layouts (split from 768 px, stacked below), so it switches with `@media (max-width: 767px)` like the slice. (Task 3.2) (Changed 2026-10-11 at the Phase 3 gate, Task 3.7: the hero layout now splits from 1024 px and stacks below; the stage still switches compositions at 767 px, so tablets get the stacked layout with the desktop cast. See the spec's "Decisions after approval".)
3. **`inert` is not used on a layer that holds an interactive mascot.** `inert` disables hit-testing, which would stop the pig's hover/tap hop (spec §8). Such layers are `aria-hidden="true"` only and the mascot carries `data-interactive`. Scenes contain no focusable elements anyway (tested). Every other decorative layer is `aria-hidden="true"` and `inert`. (Tasks 1.4, 3.3)
4. **The POS frame is the slice's laptop**, which Wrenz approved, so `Shot.frame` gains `"laptop"`. (Tasks 1.1, 3.3)
5. **Art direction by stage, not viewport.** The POS world needs a different screenshot on its mobile grid. `<picture>` media queries follow the viewport, so both images are rendered with `loading="lazy"` and the inactive one is `display: none` through the container query (lazy images that are not displayed are not fetched). (Task 3.3)
6. **Names.** The spec's choreography handle type `Scene` becomes `SceneHandle`, and scene components are `FullScene` / `CompactScene`, to avoid two different `Scene` types. `SceneHandle` also carries `name: "choreo:<folder>"`: a string literal inside the returned object survives minification, so `tools/perf/chunks.mjs` can find each choreography's chunk and check the 8 KB budget. (Tasks 1.4, 1.5)
7. **Worlds without a screenshot get an accessible name.** `ProjectBase` gains `illustrationLabel?: string`; each project has exactly one of `shot` or `illustrationLabel` (tested), and the stage of an illustration-only project is `role="img"` with that label. Time-log, Agent Island and LiPAD keep theirs; the others get a screenshot in their scene phase. `FullProject` also gains `caption?: string` (the time-log "Representative week" line). (Tasks 1.1, 1.2)
8. **The engine is framework-free.** `MotionRuntime.tsx` only calls `startMotion()` from `src/motion/engine.ts` in an effect, so the runtime contract is unit-tested in jsdom. The engine also handles two cases the spec does not mention: a stage whose width changes (rotation, window resize) is cleaned up and re-prepared on its new grid, and a choreography that fails to load leaves the server end state untouched. (Task 1.5)
9. **Pause gating covers every animated stage.** The hero stage (`data-scene="hero"`) and the contact mascot strip (`data-scene="contact"`) carry `data-scene` so their CSS loops pause off-screen; only full-world slugs are in the choreography registry. (Tasks 1.5, 3.2, 4.2)
10. **The scene lab moves from Phase 0 to Phase 1**, because it needs the scene registry. (Task 1.6)
11. **Copy files beyond the spec's list:** `src/content/sections.ts` (section headings and the About and Contact text), `src/content/glossary.ts` (spec §5 names it) and `src/content/page-copy.ts` (all copy in page order, for the gloss test). The About paragraph adds "based in Bataan, Philippines" as spec §10 asks, and the timeline period reads "2026 to present" (no dash). (Tasks 1.1, 1.2)
12. **Component styles are plain CSS files in `src/components/*.css`,** imported from `globals.css` into `layer(components)`, the same way scene CSS is imported into `layer(scenes)`. A test fails if one is missing from `globals.css`. Tailwind supplies the tokens (`@theme static`), preflight and the occasional utility (`sr-only`). (Task 1.3)
13. **The apple icon is generated** by `src/app/apple-icon.tsx` (ImageResponse, 180×180) instead of a committed PNG, because this laptop has no image tooling; it is statically generated at build time like a file. `favicon.ico` (the create-next-app default) is deleted. (Task 2.4)
14. **Delivery order:** PR #2 (spec) and this plan's PR merge into `master` before Phase 0 cuts `redesign` from `master`, so both documents travel with the code. (Task 0.1)
15. **Basic scenes until a world is designed.** Phase 1 registers a shared basic world scene and a basic vignette scene for every slug (mascot plus screenshot if one exists), so the type-checked registries are complete from the start and the page is reviewable after Phase 4. Phases 3, 5, 6 and 7 replace them one by one. (Task 1.4)
16. **Interim tints.** Phase 1 sets interim tints for worlds 3 to 6 and the five vignettes (right hue family, lightness 88 to 91); Fable sets the final value when each scene is designed, and the contrast test re-checks it. (Task 1.3)
17. **One SVG-internal flourish is kept.** The POS pig's ear flick and double blink (0.3 s once every 6.5 s) are WAAPI tweens on SVG `<g>` elements inside the head layer, carried from the approved slice. They are the only SVG-internal animation on the page (spec §11 Rule 3 bans per-frame SVG tweens), are guarded by `typeof el.animate === "function"`, and must measure under 2 ms of main-thread time per cycle at 4x CPU (`who.py pos 4`); otherwise they are deleted. (Task 3.4)
18. **Contact's top edge is straight**, not a hill edge: the six mascots peek over it (spec §10), and a hill would hide them. (Task 4.2)
19. **`icon.svg` draws "WL" with strokes**, not Gabarito text: a favicon cannot load a web font, so text would fall back to a system font. (Task 2.4)
20. **The OG image's yolk shape is a circle**, not the hero's blob path, because the OG renderer (Satori) supports only a subset of CSS and SVG; the portrait, name, role and slogan are as specified. (Task 2.4)

## Review Focus

Inputs and conditions the spec implies but no feature test exercises, most likely first. Each line names the test that pins it and the task that owns it.

1. **A window resize or phone rotation that moves a stage across the 760 px grid switch after its choreography was prepared.** Expected: the world shows its end state on the new grid with distances recomputed, no stale pixel offsets, loops still running. Pinned by `engine.test.ts › re-prepares a stage whose width changes` (Task 1.5).
2. **The page opened already scrolled** (an anchor link such as `/#contact`, a refresh mid-page, back-forward restore). Expected: worlds already on screen show their finished frame at once and start their loops; nothing snaps back to a start state. Pinned by `engine.test.ts › skips the entrance for a stage visible when its module arrives` (Task 1.5).
3. **A slow or failed chunk load** (4G, a deploy that removed an old chunk). Expected: a world whose module arrives late is prepared off-screen and entered when scrolled back to; a world whose module fails stays in its server end state with no error thrown. Pinned by `engine.test.ts › leaves the end state alone when a module fails to load` and `› enters a world prepared off-screen when it scrolls into view` (Task 1.5).
4. **A second mount of the runtime** (React Strict Mode in development mounts effects twice; Spec 2 will soft-navigate back to `/`). Expected: no doubled listeners, no leftover `.live`, `.paused`, `.ready` or appended chips, and the second mount behaves like the first. Pinned by `engine.test.ts › stops cleanly and starts again` (Task 1.5) and `choreo-contract.test.ts › cleanup restores the server markup` (Tasks 1.5, 3.4, 3.6, 5.x, 6.x).
5. **The mobile menu used for navigation:** a link tapped inside the open menu, or a browser without the Popover API. Expected: the menu closes and the page lands on the section below the sticky bar; without the Popover API the links show inline under the bar and the toggle is hidden. Pinned by `engine.test.ts › closes the nav popover after a link tap, even with reduced motion` (Task 1.5) and `page.test.tsx › nav menu is a popover with an invoker` (Task 1.3).

---

## Conventions (shared by every task)

### Delivery protocol

- **Branches.** `redesign` is the integration branch (created in Task 0.1). Each task runs on its own branch cut from the latest `redesign`, named `rd/<task>-<slug>` (for example `rd/1.5-motion-engine`), and opens a PR into `redesign`: `gh pr create --base redesign --title "<task title>" --body "<summary + verification output>"`.
- **Review.** A fresh reviewer checks each task PR against this plan and the spec. The review is posted on the PR (`gh pr review <N> --comment --body-file <file>` or `gh pr comment`). Fixes are pushed to the same branch. Then the PR is merged with a merge commit: `gh pr merge <N> --merge --delete-branch`.
- **Phase sign-off.** A phase ends with its verification task. Wrenz checks the `redesign` Vercel preview and signs off before the next phase starts. The final `redesign` to `master` PR (Task 8.4) is merged by Wrenz only.
- **Commits.** Small and frequent, imperative subject lines, no co-author trailers or tool footers.
- **Start of every task:** `git fetch origin && git checkout redesign && git pull --ff-only && git checkout -b rd/<task>-<slug>`.

### Commands (Git Bash on Windows, repo root `C:\Users\OASIS\Downloads\wrenz-portfolio`)

| What | Command |
|---|---|
| Unit tests (once) | `npm test -- --run` |
| One test file | `npx vitest run tests/<file>` |
| Lint / types | `npm run lint` / `npx tsc --noEmit` |
| Production build | `npm run build` |
| Start the built site (records its PID) | `py -3.11 -I tools/perf/serve.py start` (port 3000) |
| Stop only that server | `py -3.11 -I tools/perf/serve.py stop` |
| Build with the scene lab | `SCENE_LAB=1 npm run build` |

### File map (final state after Phase 8)

```
.github/workflows/ci.yml           CI: lint, types, unit tests, build, chunk budget
vitest.config.mts                  Vitest (node by default, jsdom per file)
next.config.ts                     images.formats/qualities, turbopack root
assets/og/                         Gabarito-ExtraBold.ttf + portrait-og.jpg (read by OG image + apple icon only)
public/portrait.webp               hero portrait (slice crop, 600×720)
public/work/<slug>/*.webp          screenshots per project
src/app/layout.tsx                 fonts, metadata, viewport
src/app/page.tsx                   composes the page, JSON-LD, Sprite, MotionRuntime
src/app/globals.css                layer order, Tailwind, every component + scene CSS import, @theme tokens, base
src/app/robots.ts sitemap.ts opengraph-image.tsx apple-icon.tsx icon.svg
src/app/dev/scenes/[id]/page.tsx   scene lab (only built with SCENE_LAB=1)
src/content/                       types.ts site.ts sections.ts projects.ts experience.ts capabilities.ts
                                   recognition.ts glossary.ts routes.ts page-copy.ts
src/lib/rich.tsx                   *em* renderer (Rich, rich, plain)
src/lib/jsonld.ts                  JSON-LD @graph builder + safe serialiser
src/lib/metadata.ts                Metadata / Viewport builders
src/components/                    Nav Footer Icon Sprite ExtLink Mascot DeviceFrame HillEdge World VariedBlock
                                   ProjectLinks Hero MoreWork Vignette Capabilities Experience About Contact
                                   + one .css file per group (base nav shell stage world hero sections vignettes)
src/scenes/grid.ts                 STAGE_GRID_SWITCH, Grid, Place, place(), cssVars()
src/scenes/Stage.tsx               Stage + Layer
src/scenes/index.ts                fullScenes / compactScenes registries
src/scenes/basic/                  BasicWorld.tsx BasicVignette.tsx choreo.ts scene.css
src/scenes/<slug>/                 Scene.tsx + scene.css (+ choreo.ts for full worlds)
src/motion/types.ts                Gsap, SceneEnv, SceneHandle, Choreo
src/motion/engine.ts               startMotion()
src/motion/pointer.ts              startPointer()
src/motion/frame-gate.ts           createFrameGate()
src/motion/registry.ts             Record<FullSlug, ChoreoLoader>
src/motion/MotionRuntime.tsx       "use client" wrapper
tests/                             *.test.ts(x) (Vitest) + setup.ts + helpers.ts
tools/perf/                        serve.py perf.py smooth.py who.py anim_raw.py shoot.py budget.py a11y.py
                                   chunks.mjs README.md
```

### DOM and CSS naming contract

Everything that CSS, the engine or a choreography addresses by name:

| Name | Where | Meaning |
|---|---|---|
| `.stage-c` | wrapper of every world and vignette stage | the size container: `container: stage / inline-size` |
| `.stage` + `data-scene="<slug>"` + `data-tier="full\|compact\|hero\|strip"` | stage root | the design-grid box; the engine observes every `[data-scene]` |
| `--dw --dh --mdw --mdh` | inline on `.stage` | design width/height on the desktop and mobile grids |
| `--u` | set by CSS on `.stage` | one design pixel: `calc(100cqw / var(--dw))` (mobile: `--mdw`) |
| `.layer.layer-bg / -mid / -fg` | stage children | depth layers (parallax targets) |
| `.mouse[data-k]` | only child of each layer | pointer-parallax wrapper; `data-k` is its strength |
| `.pos` + `--x --y --w` (+ `--mx --my --mw`) | positioned objects | placement in design px on each grid |
| `.g-d` / `.g-m` | any object | shown only on the desktop / mobile grid |
| `data-part="<name>"` | objects a choreography or CSS targets | stable part names |
| `data-interactive` | an object with pointer interaction | its layer must not be `inert` |
| `.loop` | every element with a time-based CSS loop | paused by `[data-scene].paused .loop` |
| `.live` | stage root, added by a choreography's `enter()` | world loops run only under `.live` |
| `.paused` | stage root, added by the engine off-screen | pauses `.loop` animations |
| `.ready` | hero root, only if Task 3.2 needs it | starts hero bobs after the entrance |

### CSS layering

`src/app/globals.css` starts with `@layer theme, base, components, scenes, utilities;` before anything else, then `@import "tailwindcss";`, then one `@import "../components/<name>.css" layer(components);` line per component CSS file, then one `@import "../scenes/<slug>/scene.css" layer(scenes);` line per scene (basic first, then full worlds in page order, then vignettes). Scene selectors are scoped under `[data-scene="<slug>"]`. CSS Modules are not used. `tests/css-imports.test.ts` fails if a CSS file under `src/components/` or `src/scenes/` is missing from `globals.css`.

### Cross-phase contracts

Names and numbers that several phases rely on. A task that needs to change one updates this list in its PR description.

**Page composition (final, after Phase 4)**, in `src/app/page.tsx`:

```tsx
<>
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />
  <Sprite />
  <a className="skip" href="#main">{site.labels.skip}</a>
  <Nav />
  <main id="main" tabIndex={-1}>
    <Hero />          {/* Task 3.2: section#top, data-scene="hero" */}
    <Work />          {/* Task 3.1: section#work = heading band + the six <World>s */}
    <MoreWork />      {/* Task 4.3: section#more-work = the bento of <Vignette>s */}
    <Capabilities />  {/* Task 4.1 */}
    <Experience />    {/* Task 4.1 */}
    <About />         {/* Task 4.2 */}
    <Contact />       {/* Task 4.2: the yolk band, mascot strip data-scene="contact" */}
  </main>
  <Footer />
  <MotionRuntime />
</>
```

Phase 2 adds the JSON-LD line (`buildJsonLd(): Record<string, unknown>` and `jsonLdHtml(data: unknown): string` from `src/lib/jsonld.ts`). Phase 3 replaces the shell hero with `<Hero />` and the shell `#work` section with `<Work />`. Phase 4 replaces the remaining shell sections.

**Colour bands and hill edges.** The hero is paper and ends in a hill edge filled with `--color-tint-pos`. `<Work />` opens with a heading band on the POS tint. Each `<World>` is a band on `--color-tint-<slug>` and ends in a hill edge filled with the next world's tint; the last world's edge uses paper. More work, Capabilities, Experience and About sit on paper. Contact is a yolk band.

**World layouts and stage grids** (Task 3.1 builds them; Phases 3, 5 and 6 design scenes for them):

| Layout | Stage width | Desktop grid | Mobile grid (stage < 760 px) | Smallest scene text |
|---|---|---|---|---|
| `split-start` / `split-end` (POS, time-log, Katiwala, Stockroom) | the figure column (820 px at 1440) | 820 × 620 | 358 × (scene's choice, 300 to 440) | 13 design px desktop, 12 mobile |
| `bleed` (service areas, Agent Island) | the full band width, edge to edge | 1280 × 720 | 358 × (scene's choice, 360 to 460) | 21 design px desktop, 12 mobile |
| vignette (Task 4.3 / Phase 7) | the bento cell's stage | one grid only, 400 × 260 unless the scene says otherwise | none | 12 × 400 / narrowest stage width, rounded up |

The smallest-text column comes from the 760 px switch: the narrowest desktop-grid stage is 760 px wide, so design px × 760 / design width must be at least 12 (820 → 13, 1280 → 21). On a `bleed` world from 1024 px wide, the copy sits on a paper panel over the left part of the stage, so **bleed scenes keep the desktop region x < 560 free of moving parts**; below 1024 px the stage stacks above the copy like every world.

**Animated stages outside the registry:** the hero stage (`data-scene="hero"`, `data-tier="hero"`) and the contact mascot strip (`data-scene="contact"`, `data-tier="strip"`) have no choreography. Their loops are scoped CSS that does not wait for `.live` (hero bobs start after the entrance by `animation-delay`), and the engine still pauses them off-screen.

### Fable critique brief (used by every verification task)

Dispatch with the Agent tool, `model: "fable"`, after the screenshots exist:

```
You are the design critic for Wrenz Laylo's portfolio redesign. Read the approved spec
(docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md, especially §4 design system and §8-§10)
and use the design-taste-frontend and ui-ux-pro-max skills as your lenses. Look at these screenshots at 1:1
(do not judge from scaled-down views): <list of PNG paths at 1440 and 390, plus 820 and 1024 when the
phase changed layout>. Phase under review: <phase name and what changed>.
Return two lists. MUST-FIX: problems a recruiter or client would notice or that break the spec (legibility,
text under 12 px, overlaps, contrast, broken sticker-flat rules, a scene reading as clip art, layout
breaks, motion that hides content). NICE-TO-HAVE: polish. For each item: the screenshot, the exact
element, what is wrong, and the concrete fix (values, not adjectives). Do not propose WebGL, scroll
hijacking, dark mode, or anything the spec rules out.
```

Every MUST-FIX item is fixed before the phase closes. NICE-TO-HAVE items are listed in the PR for Wrenz to pick.

### Tests

Vitest runs in `node` by default. A file that needs a DOM starts with `// @vitest-environment jsdom`. `tests/setup.ts` replaces `next/image` with a plain `<img>`. Server components are rendered with `renderToStaticMarkup` from `react-dom/server` and inspected with `JSDOM`.

---

## Verification gate (run at the end of every visual phase: 3, 4, 5, 6, 7, 8)

The phase's last task runs all of it against `npm run build` + `tools/perf/serve.py start`, pastes the results into its PR, and fixes failures before asking Wrenz to sign off.

1. **CI green** on the PR (lint, types, unit tests, build, `chunks.mjs`).
2. **Frames:** `py -3.11 -I tools/perf/perf.py 1440 900 1 --check`, `... 1440 900 4 --check`, `... 390 844 1 --mobile --check`, `... 390 844 4 --mobile --check`. All four print `PASS`.
3. **Compositing:** `py -3.11 -I tools/perf/anim_raw.py` lists no `compositeFailed` animation except ones explained in the PR.
4. **Budgets:** `py -3.11 -I tools/perf/budget.py` prints `PASS` (JS, HTML, DOM).
5. **Lighthouse mobile:** `npx -y lighthouse@13 http://127.0.0.1:3000/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=tools/perf/out/lh.json --chrome-flags="--headless=new"`, then `node tools/perf/lh-summary.mjs tools/perf/out/lh.json`: LCP < 2500 ms, CLS < 0.1, TBT < 200 ms, SEO 100, accessibility ≥ 95.
6. **Accessibility:** `py -3.11 -I tools/perf/a11y.py` (axe-core: zero serious or critical), plus a keyboard-only pass (skip link, nav, menu at 390 px, every link reachable, visible focus), a reduced-motion pass (`shoot.py ... --rm`) and a JavaScript-disabled pass (`shoot.py ... --nojs`): every word, link, image and scene end frame present.
7. **Screenshots at 1:1:** `shoot.py` at 390×844, 820×1180, 1024×768, 1440×900. Its check prints no text under 12 px and no horizontal overflow. Look at every image at 1:1 for overlaps and unreadable text.
8. **Fable 5.1 design critique** (subagent, `model: "fable"`) of the 1440 and 390 screenshots, using the `design-taste-frontend` and `ui-ux-pro-max` lenses, sorted into MUST-FIX and NICE-TO-HAVE. MUST-FIX items are fixed (new commits on the phase branch, gate re-run) before the phase closes.
9. **Wrenz signs off** on the `redesign` Vercel preview.

---

# Phase 0: Tooling

Goal: the integration branch exists, the repo is tidy, tests run locally and in CI, and the slice's measurement tools work against `next start`. Nothing visible changes.

### Task 0.1: Integration branch, repo hygiene and the Vitest harness

**Files:**
- Modify: `.gitignore`
- Move: `HANDOFF.md` (untracked, repo root) → `docs/HANDOFF.md` (tracked)
- Modify: `package.json` (scripts, devDependencies)
- Create: `vitest.config.mts`, `tests/setup.ts`, `src/lib/rich.tsx`, `tests/rich.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `src/lib/rich.tsx` exports `rich(text: string): ReactNode[]`, `Rich({ text }: { text: string }): JSX.Element`, `plain(text: string): string`. Copy strings mark emphasis as `*phrase*`; nothing else is parsed. Also `npm test` (Vitest, node environment, `@/` alias to `src/`, `next/image` mocked).

- [ ] **Step 1: Check the documents are on master**

Run: `gh pr list --repo WrenzLaylo/wrenz-portfolio --state merged --base master --limit 10`
Expected: both PR #2 (Spec 1) and the plan PR are listed. If either is still open, stop and ask Wrenz to merge it (or for permission to merge it). Do not continue without both on `master`.

- [ ] **Step 2: Create the integration branch**

```bash
git fetch origin
git checkout master && git pull --ff-only
git checkout -b redesign
git push -u origin redesign
git checkout -b rd/0.1-tooling-base
```

- [ ] **Step 3: Ignore local tool output**

Append to `.gitignore`:

```gitignore

# brainstorm companion files, perf tool output
.superpowers/
tools/perf/out/
.perf-server.pid
__pycache__/
```

- [ ] **Step 4: Move the handoff into docs**

```bash
mv HANDOFF.md docs/HANDOFF.md
```

Then replace its `## RESUME HERE` block (everything from that heading down to `## Earlier state`) with:

```markdown
## RESUME HERE

Implementation is under way on the `redesign` branch, following
`docs/superpowers/plans/2026-10-11-portfolio-redesign-spec-1.md`. Progress = the task PRs merged into
`redesign` (`gh pr list --base redesign --state all`). Pick the first plan task without a merged PR.
Everything below this block is history from the design stage.
```

- [ ] **Step 5: Install the test toolchain**

```bash
npm install -D vitest@5 @vitejs/plugin-react@6 jsdom@30 @types/jsdom@30 @types/node@22
```

Expected: installs without `ERESOLVE` errors. (`@types/node` moves from 20 to 22 because Vitest 5 lists `^22 || >=24` as a peer, and CI and this laptop both run Node 22.)

Add the test script to `package.json` `"scripts"`:

```json
    "test": "vitest"
```

- [ ] **Step 6: Configure Vitest**

Create `vitest.config.mts`:

```ts
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
  },
});
```

Create `tests/setup.ts`:

```ts
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
```

- [ ] **Step 7: Write the failing test for the `*em*` renderer**

Create `tests/rich.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Rich, plain } from "@/lib/rich";

const html = (text: string) => renderToStaticMarkup(<Rich text={text} />);

describe("Rich", () => {
  it("renders *phrase* as <em>", () => {
    expect(html("keeps *benta* apart")).toBe("keeps <em>benta</em> apart");
  });

  it("handles several phrases, including phrases with spaces", () => {
    expect(html("*benta* and *cash na pumasok*")).toBe("<em>benta</em> and <em>cash na pumasok</em>");
  });

  it("escapes HTML in plain text", () => {
    expect(html("a < b & c")).toBe("a &lt; b &amp; c");
  });

  it("leaves a lone asterisk as text", () => {
    expect(html("5 * 3")).toBe("5 * 3");
  });
});

describe("plain", () => {
  it("strips the emphasis markers", () => {
    expect(plain("keeps *benta* apart from *cash na pumasok*")).toBe("keeps benta apart from cash na pumasok");
  });
});
```

- [ ] **Step 8: Run it and watch it fail**

Run: `npx vitest run tests/rich.test.tsx`
Expected: FAIL, `Failed to resolve import "@/lib/rich"`.

- [ ] **Step 9: Implement the renderer**

Create `src/lib/rich.tsx`:

```tsx
import type { ReactNode } from "react";

// The only inline convention in copy strings: *phrase* becomes <em>phrase</em>. Nothing else is parsed.
const EMPHASIS = /\*([^*]+)\*/g;

export function rich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(EMPHASIS)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    out.push(<em key={key++}>{match[1]}</em>);
    last = start + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Rich({ text }: { text: string }) {
  return <>{rich(text)}</>;
}

/** The same text without markers, for alt text, meta descriptions and JSON-LD. */
export function plain(text: string): string {
  return text.replace(EMPHASIS, "$1");
}
```

- [ ] **Step 10: Run the tests and lint**

Run: `npx vitest run && npm run lint && npx tsc --noEmit`
Expected: `5 passed`, lint and tsc silent.

- [ ] **Step 11: Commit, open the PR, review, merge**

```bash
git add .gitignore docs/HANDOFF.md package.json package-lock.json vitest.config.mts tests/setup.ts tests/rich.test.tsx src/lib/rich.tsx
git commit -m "Add the redesign tooling base: Vitest, the *em* renderer, docs handoff"
git push -u origin rd/0.1-tooling-base
gh pr create --base redesign --title "0.1 Tooling base: Vitest and the *em* renderer" --body "Task 0.1 of the Spec 1 plan. Vitest harness (node env, @ alias, next/image mock), src/lib/rich.tsx with tests, HANDOFF moved to docs/, .superpowers/ ignored."
```

Then follow the delivery protocol (review on the PR, fixes, `gh pr merge <N> --merge --delete-branch`).

### Task 0.2: Continuous integration

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm test` (Task 0.1), `tools/perf/chunks.mjs` (Task 0.3; the CI step is added there).
- Produces: a `CI / verify` check on every PR and on pushes to `master` and `redesign`.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [master, redesign]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test -- --run
      - run: npm run build
```

- [ ] **Step 2: Prove it locally first**

Run: `npm ci && npm run lint && npx tsc --noEmit && npm test -- --run && npm run build`
Expected: every command exits 0 (the build downloads Google Fonts, so it needs the network).

- [ ] **Step 3: Commit and open the PR**

```bash
git add .github/workflows/ci.yml
git commit -m "Run lint, types, unit tests and the build in CI"
git push -u origin rd/0.2-ci
gh pr create --base redesign --title "0.2 CI workflow" --body "Task 0.2. Lint, tsc, vitest, next build on every PR and on pushes to master and redesign."
```

- [ ] **Step 4: Watch the first run**

Run: `gh pr checks --watch`
Expected: `verify` passes. If it fails, read the log (`gh run view --log-failed`), fix on this branch, push again. Then review and merge per the protocol.

### Task 0.3: Port the measurement tools

The slice's tools (`C:\Users\OASIS\scratch-portfolio\slice\tools\`) hard-code `http://127.0.0.1:3110/index.html` and element ids. This task ports them to the Next build on port 3000, addresses stages by `[data-scene]`, adds the budget, accessibility, Lighthouse-summary and chunk-size checks the spec asks for, and gives `perf.py` a `--check` mode with the spec §12 thresholds. Until Phase 3 there are no stages, so every tool must skip missing stages instead of crashing.

**Files:**
- Create: `tools/perf/common.py`, `serve.py`, `perf.py`, `smooth.py`, `who.py`, `anim_raw.py`, `shoot.py`, `budget.py`, `a11y.py`, `chunks.mjs`, `lh-summary.mjs`, `README.md`
- Modify: `package.json` (devDependency `axe-core`), `.github/workflows/ci.yml` (chunk check step)

**Interfaces:**
- Consumes: the page served by `next start` on `127.0.0.1:3000`; later, `[data-scene="<slug>"]` and `[data-tier]` on stage roots (Task 1.4) and the `"choreo:<name>"` handle names (Task 1.5).
- Produces: the commands used by every verification gate: `serve.py start|stop`, `perf.py W H THROTTLE [--mobile] [--check]`, `smooth.py`, `who.py SLUG THROTTLE`, `anim_raw.py`, `shoot.py OUT W H [--rm] [--nojs]`, `budget.py`, `a11y.py`, `node tools/perf/chunks.mjs`, `node tools/perf/lh-summary.mjs FILE`.

- [ ] **Step 1: Install axe-core**

```bash
npm install -D axe-core@4
```

- [ ] **Step 2: Shared helpers**

Create `tools/perf/common.py`:

```python
"""Shared settings for the perf tools. Each tool adds this folder to sys.path itself,
because `py -I` (isolated mode) does not put the script's folder on sys.path."""
import os

BASE_URL = os.environ.get("PERF_URL", "http://127.0.0.1:3000/")
FULL = ["pos", "time-log", "service-areas", "katiwala", "stockroom", "agent-island"]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)

TOP_OF = "(sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + scrollY : null; }"


def sel(slug):
    return f'[data-scene="{slug}"]'


async def park(pg, slug, frac=0.15):
    """Scroll so the stage's top sits `frac` of a viewport below the top edge. False if absent."""
    top = await pg.evaluate(TOP_OF, sel(slug))
    if top is None:
        return False
    # behavior "instant": a page-level scroll-behavior must never turn a park into a smooth scroll
    await pg.evaluate("(y) => window.scrollTo({ top: y, behavior: 'instant' })", top - await pg.evaluate("innerHeight") * frac)
    return True


async def wheel_to_bottom(pg, step=100, pause=40):
    total = await pg.evaluate("document.documentElement.scrollHeight - innerHeight")
    while await pg.evaluate("scrollY") < total - 5:
        await pg.mouse.wheel(0, step)
        await pg.wait_for_timeout(pause)


async def wheel_to_top(pg, step=100, pause=40):
    while await pg.evaluate("scrollY") > 5:
        await pg.mouse.wheel(0, -step)
        await pg.wait_for_timeout(pause)
```

- [ ] **Step 3: The server helper**

Create `tools/perf/serve.py`:

```python
"""Start or stop `next start` on 127.0.0.1:3000 for the perf tools.
usage: py -3.11 -I tools/perf/serve.py start|stop
It only ever stops the PID it started (kept in .perf-server.pid). Never stop processes by name."""
import pathlib
import subprocess
import sys
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
PIDFILE = ROOT / ".perf-server.pid"
URL = "http://127.0.0.1:3000/"


def start():
    if PIDFILE.exists():
        sys.exit(f"{PIDFILE.name} exists (pid {PIDFILE.read_text().strip()}): run `serve.py stop` first")
    if not (ROOT / ".next" / "BUILD_ID").exists():
        sys.exit("no production build: run `npm run build` first")
    nxt = ROOT / "node_modules" / "next" / "dist" / "bin" / "next"
    proc = subprocess.Popen(
        ["node", str(nxt), "start", "-p", "3000", "-H", "127.0.0.1"],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
    )
    PIDFILE.write_text(str(proc.pid))
    for _ in range(60):
        try:
            urllib.request.urlopen(URL, timeout=2)
            print(f"up: {URL} (pid {proc.pid})")
            return
        except Exception:
            time.sleep(0.5)
    stop()
    sys.exit("server did not answer within 30 s")


def stop():
    if not PIDFILE.exists():
        print("no .perf-server.pid: nothing to stop")
        return
    pid = PIDFILE.read_text().strip()
    # /T ends the child tree of OUR pid only (node spawned by us).
    subprocess.run(["taskkill", "/PID", pid, "/T", "/F"], check=False)
    PIDFILE.unlink()
    print(f"stopped pid {pid}")


if __name__ == "__main__":
    {"start": start, "stop": stop}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()
```

- [ ] **Step 4: Frame timing with a pass/fail check**

Create `tools/perf/perf.py` (port of the slice's `perf.py`; phases are now hero idle, scroll down, one park per full world present, scroll up):

```python
"""Real-Chrome rAF frame timing per phase, optional CDP CPU throttle, optional budget check.
usage: py -3.11 -I tools/perf/perf.py WIDTH HEIGHT THROTTLE [DPR] [--mobile] [--check]"""
import asyncio
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL, FULL, OUT, park, wheel_to_bottom, wheel_to_top  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

W, H, THR = int(sys.argv[1]), int(sys.argv[2]), float(sys.argv[3])
DPR = float(sys.argv[4]) if len(sys.argv) > 4 and not sys.argv[4].startswith("--") else 1
MOBILE = "--mobile" in sys.argv
CHECK = "--check" in sys.argv

REC = r"""
() => {
  window.__f = []; window.__mark = 'load';
  const tick = (t) => { window.__f.push([t, window.__mark]); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
"""


def stats(ts):
    d = sorted(b - a for a, b in zip(ts, ts[1:]))
    if not d:
        return {}
    q = lambda p: round(d[min(len(d) - 1, int(p * len(d)))], 1)
    span = ts[-1] - ts[0]
    over25 = sum(1 for x in d if x > 25)
    return {"frames": len(d), "fps": round(len(d) / (span / 1000), 1), "p50": q(.5), "p95": q(.95), "max": round(d[-1], 1),
            "over25": over25, "over25_per300": round(over25 * 300 / len(d), 1)}


def verdict(phases):
    """Spec §12. 1x: 60 fps everywhere (>= 58 allows timer noise), scroll <= 10 late frames per ~300.
    4x: idle phases >= 57 fps, scroll <= 60 late frames per ~300."""
    fails = []
    for name, s in phases.items():
        if not s:
            continue
        scrolling = name.startswith("scroll")
        if THR <= 1:
            if s["fps"] < 58:
                fails.append(f"{name}: {s['fps']} fps < 58")
            if scrolling and s["over25_per300"] > 10:
                fails.append(f"{name}: {s['over25_per300']} late frames per 300 > 10")
        elif scrolling:
            if s["over25_per300"] > 60:
                fails.append(f"{name}: {s['over25_per300']} late frames per 300 > 60")
        elif s["fps"] < 57:
            fails.append(f"{name}: {s['fps']} fps < 57")
    return fails


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=False, args=["--window-position=0,0"])
        ctx = await b.new_context(viewport={"width": W, "height": H}, device_scale_factor=DPR, is_mobile=MOBILE, has_touch=MOBILE)
        pg = await ctx.new_page()
        cdp = await ctx.new_cdp_session(pg)
        await pg.goto(BASE_URL, wait_until="networkidle")
        if THR > 1:
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": THR})
        await pg.evaluate(REC)
        mark = lambda m: pg.evaluate("(m) => { window.__mark = m; }", m)
        await pg.mouse.move(W * 0.7, H * 0.5)

        order = ["hero-idle"]
        await mark("hero-idle")
        for i in range(20):
            await pg.mouse.move(W * (0.5 + 0.3 * ((i % 4) / 3)), H * (0.4 + 0.2 * ((i % 3) / 2)), steps=4)
            await pg.wait_for_timeout(150)

        order.append("scroll-down")
        await mark("scroll-down")
        await wheel_to_bottom(pg)
        await pg.wait_for_timeout(600)

        for slug in FULL:
            await mark("between")
            if not await park(pg, slug):
                continue
            await pg.wait_for_timeout(2500)
            name = f"park-{slug}"
            order.append(name)
            await mark(name)
            for i in range(25):
                await pg.mouse.move(W * (0.3 + 0.5 * ((i % 5) / 4)), H * (0.3 + 0.4 * ((i % 3) / 2)), steps=4)
                await pg.wait_for_timeout(160)

        order.append("scroll-up")
        await mark("scroll-up")
        await wheel_to_top(pg)
        await pg.wait_for_timeout(600)
        await mark("end")
        frames = await pg.evaluate("window.__f")
        await b.close()

    phases = {ph: stats([t for t, m in frames if m == ph]) for ph in order}
    out = {"viewport": f"{W}x{H}@{DPR}", "throttle": THR, "mobile": MOBILE, "phases": phases}
    tag = f"perf-{W}-{int(THR)}{'-m' if MOBILE else ''}"
    pathlib.Path(OUT, f"{tag}.json").write_text(json.dumps(out, indent=1))
    print(json.dumps(out, indent=1))
    if CHECK:
        fails = verdict(phases)
        print("PASS" if not fails else "FAIL\n  " + "\n  ".join(fails))
        sys.exit(1 if fails else 0)


asyncio.run(main())
```

- [ ] **Step 5: Chrome's own frame counts, main-thread wake-ups, compositing failures**

Create `tools/perf/smooth.py` as a copy of `C:\Users\OASIS\scratch-portfolio\slice\tools\smooth.py` with these changes, and nothing else:
1. Replace the `URL = ...` line with the `sys.path.insert` + `from common import BASE_URL, park` lines used in `perf.py` Step 4, and use `BASE_URL` in `pg.goto`.
2. Replace the two lines that compute `y` from `document.getElementById('pos-stage')` and scroll to it with `await park(pg, "pos")`.

Create `tools/perf/who.py` as a copy of the slice's `who.py` with these changes:
1. Usage line: `usage: py -3.11 -I tools/perf/who.py SLUG THROTTLE [--scroll|--mouse] [--q=QUERY]`; `STAGE` becomes `SLUG = sys.argv[1]`.
2. Import `BASE_URL, park` from `common` (same lines as `perf.py`); `URL = BASE_URL + (the --q value or "")`.
3. Replace the `y = ...getElementById(...)` line and its `scrollTo` with: `if not await park(pg, SLUG): sys.exit(f"no stage {SLUG} on the page")` (keep `await pg.mouse.move(5, 5)` before it).

Create `tools/perf/anim_raw.py`:

```python
"""Which CSS/WAAPI animations failed to run on the compositor, and why (Chromium compositeFailed bitmask).
usage: py -3.11 -I tools/perf/anim_raw.py [SLUG ...]   (default: hero + every full world present)"""
import asyncio
import collections
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL, FULL, park  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

SLUGS = [a for a in sys.argv[1:] if not a.startswith("--")] or ["hero", *FULL]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=False)
        pg = await (await b.new_context(viewport={"width": 1440, "height": 900})).new_page()
        cdp = await pg.context.new_cdp_session(pg)
        ev = []
        done = asyncio.get_event_loop().create_future()
        cdp.on("Tracing.dataCollected", lambda e: ev.extend(e["value"]))
        cdp.on("Tracing.tracingComplete", lambda e: done.done() or done.set_result(1))
        await cdp.send("Tracing.start", {"categories": "devtools.timeline,disabled-by-default-devtools.timeline", "transferMode": "ReportEvents"})
        await pg.goto(BASE_URL, wait_until="networkidle")
        for slug in SLUGS:
            if await park(pg, slug):
                await pg.wait_for_timeout(5000)
        await cdp.send("Tracing.end")
        await done
        await b.close()
    byid = collections.defaultdict(list)
    for e in ev:
        if e.get("name") == "Animation":
            byid[(e.get("id2") or {}).get("local") or e.get("id")].append(e)
    out = collections.Counter()
    for es in byid.values():
        name, fail = None, None
        for e in es:
            d = (e.get("args") or {}).get("data") or {}
            name = name or d.get("name") or d.get("nodeName")
            if "compositeFailed" in d:
                fail = d["compositeFailed"]
            if not name and e.get("args"):
                name = json.dumps(e["args"])[:120]
        out[(name, fail)] += 1
    bad = [(k, n) for k, n in out.items() if k[1]]
    for (name, fail), n in out.most_common(60):
        print(n, name, f"compositeFailed={fail}" if fail else "")
    print(f"\n{len(bad)} animation name(s) failed to composite" if bad else "\nall animations composited")


asyncio.run(main())
```

- [ ] **Step 6: Screenshots plus the 12 px and overflow checks**

Create `tools/perf/shoot.py`:

```python
"""Screenshots every 0.6 viewport + checks: text under 12 px (page and scene text, scenes included)
and horizontal overflow. Writes PNGs to OUTDIR.
usage: py -3.11 -I tools/perf/shoot.py OUTDIR WIDTH HEIGHT [--wait MS] [--rm] [--nojs] [--headed]"""
import asyncio
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

out, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
RM, NOJS, HEADED = "--rm" in sys.argv, "--nojs" in sys.argv, "--headed" in sys.argv
WAIT = int(sys.argv[sys.argv.index("--wait") + 1]) if "--wait" in sys.argv else 2600
pathlib.Path(out).mkdir(parents=True, exist_ok=True)

CHECK = r"""
() => {
  const vw = innerWidth, res = { scrollW: document.documentElement.scrollWidth, vw, small: [], offscreen: [] };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.closest('.sr-only')) continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const scene = el.closest('[data-scene]');
    const where = scene ? 'scene:' + scene.dataset.scene : 'page';
    const fs = parseFloat(cs.fontSize);
    if (fs < 12) res.small.push(`${where} ${el.tagName} ${fs.toFixed(1)}px "${el.textContent.trim().slice(0, 30)}"`);
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > vw + 1 || r.left < -1) && !el.closest('.stage'))
      res.offscreen.push(`${where} ${el.tagName} ${Math.round(r.left)}..${Math.round(r.right)} "${el.textContent.trim().slice(0, 30)}"`);
  }
  return res;
}
"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=not HEADED)
        ctx = await b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1,
                                  reduced_motion="reduce" if RM else "no-preference",
                                  java_script_enabled=not NOJS, has_touch=W < 768, is_mobile=W < 768)
        pg = await ctx.new_page()
        logs = []
        pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
        pg.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))
        await pg.goto(BASE_URL, wait_until="networkidle")
        await pg.wait_for_timeout(WAIT)
        total = await pg.evaluate("document.documentElement.scrollHeight")
        tag = f"{W}{'-rm' if RM else ''}{'-nojs' if NOJS else ''}"
        y, i, checks = 0, 0, []
        while y < total:
            await pg.evaluate("(y) => window.scrollTo({ top: y, behavior: 'instant' })", y)
            await pg.wait_for_timeout(WAIT)
            await pg.screenshot(path=f"{out}/s-{tag}-{i:02d}.png")
            checks.append(await pg.evaluate(CHECK))
            y += int(H * 0.6)
            i += 1
        small = sorted({s for c in checks for s in c["small"]})
        offscreen = sorted({s for c in checks for s in c["offscreen"]})
        report = {"shots": i, "scrollW": checks[-1]["scrollW"], "vw": W, "small": small, "offscreen": offscreen, "logs": logs}
        print(json.dumps(report, indent=1))
        ok = not small and not offscreen and checks[-1]["scrollW"] <= W and not any(l.startswith(("error", "pageerror")) for l in logs)
        print("PASS" if ok else "FAIL")
        await b.close()
        sys.exit(0 if ok else 1)


asyncio.run(main())
```

- [ ] **Step 7: The budget check**

Create `tools/perf/budget.py`:

```python
"""Spec §12 budgets at 390x844: JS transferred by load + 2 s idle (no scrolling) <= 150 KB gz,
HTML document <= 80 KB gz, DOM <= 2,500 elements, <= 300 per world stage, <= 120 per vignette.
usage: py -3.11 -I tools/perf/budget.py"""
import asyncio
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL, OUT  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

LIMITS = {"js_kb": 150, "html_kb": 80, "dom": 2500, "full": 300, "compact": 120}

DOM = r"""
() => ({
  total: document.querySelectorAll('*').length,
  stages: [...document.querySelectorAll('[data-scene]')].map(s => ({
    slug: s.dataset.scene, tier: s.dataset.tier || '', count: s.querySelectorAll('*').length + 1 })),
})
"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=True)
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=3)
        pg = await ctx.new_page()
        cdp = await ctx.new_cdp_session(pg)
        await cdp.send("Network.enable")
        types, sizes = {}, {}
        cdp.on("Network.responseReceived", lambda e: types.__setitem__(e["requestId"], (e["type"], e["response"]["url"])))
        cdp.on("Network.loadingFinished", lambda e: sizes.__setitem__(e["requestId"], e["encodedDataLength"]))
        await pg.goto(BASE_URL, wait_until="load")
        await pg.wait_for_timeout(2000)
        dom = await pg.evaluate(DOM)
        await b.close()
    scripts = [(types[r][1], sizes[r]) for r in sizes if r in types and types[r][0] == "Script"]
    js = sum(s for _, s in scripts) / 1024
    html = sum(sizes[r] for r in sizes if r in types and types[r][0] == "Document") / 1024
    fails = []
    if js > LIMITS["js_kb"]:
        fails.append(f"JS {js:.1f} KB > {LIMITS['js_kb']} KB")
    if html > LIMITS["html_kb"]:
        fails.append(f"HTML {html:.1f} KB > {LIMITS['html_kb']} KB")
    if dom["total"] > LIMITS["dom"]:
        fails.append(f"DOM {dom['total']} > {LIMITS['dom']}")
    for s in dom["stages"]:
        limit = LIMITS.get(s["tier"])
        if limit and s["count"] > limit:
            fails.append(f"stage {s['slug']} ({s['tier']}) {s['count']} > {limit}")
    report = {"js_kb": round(js, 1), "html_kb": round(html, 1), "dom": dom,
              "scripts": sorted(((u.split('/')[-1], round(s / 1024, 1)) for u, s in scripts), key=lambda x: -x[1])}
    pathlib.Path(OUT, "budget.json").write_text(json.dumps(report, indent=1))
    print(json.dumps(report, indent=1))
    print("PASS" if not fails else "FAIL\n  " + "\n  ".join(fails))
    sys.exit(1 if fails else 0)


asyncio.run(main())
```

- [ ] **Step 8: The accessibility scan**

Create `tools/perf/a11y.py`:

```python
"""axe-core scan at 1440x900 and 390x844 (plus reduced motion). Fails on serious or critical violations.
usage: py -3.11 -I tools/perf/a11y.py"""
import asyncio
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

AXE = pathlib.Path(__file__).resolve().parents[2] / "node_modules" / "axe-core" / "axe.min.js"


async def scan(b, w, h, rm):
    ctx = await b.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce" if rm else "no-preference")
    pg = await ctx.new_page()
    await pg.goto(BASE_URL, wait_until="networkidle")
    await pg.wait_for_timeout(1500)
    await pg.add_script_tag(path=str(AXE))
    res = await pg.evaluate("async () => (await axe.run(document, { resultTypes: ['violations'] })).violations"
                            ".map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help,"
                            " first: v.nodes[0] && v.nodes[0].target.join(' ') }))")
    await ctx.close()
    return res


async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=True)
        for w, h, rm in [(1440, 900, False), (390, 844, False), (390, 844, True)]:
            res = await scan(b, w, h, rm)
            print(f"== {w}x{h}{' reduced-motion' if rm else ''}: {len(res)} violation type(s)")
            for v in res:
                print(f"  [{v['impact']}] {v['id']} x{v['n']}: {v['help']} ({v['first']})")
                bad += v["impact"] in ("serious", "critical")
        await b.close()
    print("PASS" if not bad else f"FAIL: {bad} serious/critical")
    sys.exit(1 if bad else 0)


asyncio.run(main())
```

- [ ] **Step 9: Choreography chunk sizes and the Lighthouse summary (Node)**

Create `tools/perf/chunks.mjs`:

```js
// Spec §12: each choreography chunk <= 8 KB gzipped. Run after `next build`.
// Expected choreographies come from src/motion/registry.ts (each `import("@/scenes/<name>/choreo")`);
// each choreo's handle carries the literal name "choreo:<name>", which survives minification.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const LIMIT = 8 * 1024;
const registry = "src/motion/registry.ts";
const expected = existsSync(registry)
  ? [...new Set([...readFileSync(registry, "utf8").matchAll(/import\("@\/scenes\/([a-z0-9-]+)\/choreo"\)/g)].map((m) => m[1]))]
  : [];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".js") ? [p] : [];
  });

const found = new Map();
for (const file of walk(".next/static/chunks")) {
  const src = readFileSync(file, "utf8");
  // registerPlugin is a GSAP core method name; it survives minification, so it marks a chunk that holds GSAP.
  const gsapInside = src.includes("registerPlugin");
  for (const m of src.matchAll(/["'`]choreo:([a-z0-9-]+)["'`]/g)) found.set(m[1], { file, gz: gzipSync(src).length, gsapInside });
}

let failed = false;
for (const name of expected) {
  const hit = found.get(name);
  if (!hit) {
    console.log(`MISSING choreo:${name} (no chunk contains its name)`);
    failed = true;
    continue;
  }
  const sharedWith = expected.filter((other) => other !== name && found.get(other)?.file === hit.file);
  if (sharedWith.length) console.log(`WARN choreo:${name} shares its chunk with ${sharedWith.join(", ")}: the size below is the whole shared file`);
  if (hit.gsapInside) {
    console.log(`FAIL choreo:${name} is bundled with GSAP: GSAP must stay its own dynamic import (src/motion/MotionRuntime.tsx)`);
    failed = true;
  }
  const kb = (hit.gz / 1024).toFixed(1);
  const ok = hit.gz <= LIMIT;
  failed ||= !ok;
  console.log(`${ok ? "ok  " : "OVER"} choreo:${name} ${kb} KB gz  ${hit.file}`);
}
console.log(expected.length ? (failed ? "FAIL" : "PASS") : "no choreographies registered yet: PASS");
process.exit(failed ? 1 : 0);
```

Create `tools/perf/lh-summary.mjs`:

```js
// Summarise a Lighthouse JSON report against spec §12 (mobile lab run). TBT stands in for INP.
import { readFileSync } from "node:fs";

const lh = JSON.parse(readFileSync(process.argv[2], "utf8"));
const a = lh.audits;
const lcp = a["largest-contentful-paint"].numericValue;
const cls = a["cumulative-layout-shift"].numericValue;
const tbt = a["total-blocking-time"].numericValue;
const score = (k) => Math.round((lh.categories[k]?.score ?? 0) * 100);
const lcpEl = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? "?";
const checks = [
  [`LCP ${Math.round(lcp)} ms < 2500`, lcp < 2500],
  [`CLS ${cls.toFixed(3)} < 0.1`, cls < 0.1],
  [`TBT ${Math.round(tbt)} ms < 200`, tbt < 200],
  [`SEO ${score("seo")} = 100`, score("seo") === 100],
  [`Accessibility ${score("accessibility")} >= 95`, score("accessibility") >= 95],
];
for (const [label, ok] of checks) console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
console.log(`Performance ${score("performance")}, Best practices ${score("best-practices")}`);
console.log(`LCP element: ${lcpEl}`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
```

- [ ] **Step 10: Document the tools**

Create `tools/perf/README.md`:

```markdown
# Measurement tools

Ported from the approved slice (`C:\Users\OASIS\scratch-portfolio\slice\tools\`). They measure the
production build in **real Chrome** on this laptop. Run Python with `py -3.11 -I`. Output goes to
`tools/perf/out/` (git-ignored).

1. `npm run build`
2. `py -3.11 -I tools/perf/serve.py start` (stops only its own PID with `serve.py stop`)

| Tool | What it checks |
|---|---|
| `perf.py W H THROTTLE [--mobile] [--check]` | rAF frame timing: hero idle, wheel scroll down, park in each full world, scroll up; `--check` applies spec §12 |
| `smooth.py THROTTLE [W H] [--mobile]` | Chrome's presented/dropped frame counts and main-thread time |
| `who.py SLUG THROTTLE [--scroll\|--mouse]` | what wakes the main thread while parked in one stage |
| `anim_raw.py [SLUG ...]` | animations that failed to composite, with Chromium's reason bitmask |
| `shoot.py OUT W H [--rm] [--nojs]` | screenshots every 0.6 viewport, text under 12 px (scenes included), horizontal overflow, console errors |
| `budget.py` | JS / HTML / DOM budgets at 390×844 |
| `a11y.py` | axe-core at 1440 and 390 (and reduced motion) |
| `node tools/perf/chunks.mjs` | each choreography chunk ≤ 8 KB gz (also runs in CI) |
| `node tools/perf/lh-summary.mjs FILE` | Lighthouse mobile JSON against LCP / CLS / TBT / SEO / accessibility |

Set `PERF_URL` to measure another URL (for example a Vercel preview).
```

- [ ] **Step 11: Add the chunk check to CI**

In `.github/workflows/ci.yml`, after `- run: npm run build`, add:

```yaml
      - run: node tools/perf/chunks.mjs
```

- [ ] **Step 12: Smoke-run every tool against the current page**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/perf.py 1440 900 1
py -3.11 -I tools/perf/shoot.py tools/perf/out/smoke 1440 900 --wait 800
py -3.11 -I tools/perf/budget.py
py -3.11 -I tools/perf/a11y.py
py -3.11 -I tools/perf/anim_raw.py
node tools/perf/chunks.mjs
py -3.11 -I tools/perf/serve.py stop
```

Expected: every tool runs to the end without a Python traceback. `perf.py` lists `hero-idle`, `scroll-down`, `scroll-up` only (no stages yet). `chunks.mjs` prints `no choreographies registered yet: PASS`. The current page may FAIL `budget.py` or `shoot.py` (it is the old design): that is expected and is not fixed here; paste the outputs into the PR as the "before" baseline. `serve.py stop` prints `stopped pid ...`.

- [ ] **Step 13: Commit and open the PR**

```bash
git add tools/perf package.json package-lock.json .github/workflows/ci.yml
git commit -m "Port the slice's measurement tools to the Next build and add budget checks"
git push -u origin rd/0.3-perf-tools
gh pr create --base redesign --title "0.3 Measurement tools" --body "Task 0.3. Ported perf/smooth/who/anim_raw/shoot, added serve, budget, a11y, chunks and lh-summary. Baseline outputs of the current page below."
```

Paste the Step 12 outputs into the PR body (`gh pr edit <N> --body-file ...`), then review and merge per the protocol.

---

# Phase 1: Foundation

Goal: the content layer, the design tokens and fonts, the page shell with the real nav and footer, the stage system with basic scenes for all eleven projects, the motion engine, and the scene lab. After this phase the `redesign` preview shows the new type, colours and nav with every section heading in place.

Read spec §4, §5, §6, §10 (Nav, Footer) and §11 before starting.

### Task 1.1: Content types and the site copy

**Files:**
- Create: `src/content/types.ts`, `src/content/site.ts`, `src/content/sections.ts`, `src/content/recognition.ts`, `src/content/glossary.ts`
- Test: `tests/content-rules.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by every later task):
  - `src/content/types.ts`: `FullSlug`, `CompactSlug`, `Slug`, `RecognitionId`, `IconName`, `Link`, `Shot`, `Varied`, `ProjectBase`, `FullProject`, `CompactProject`, `Project`, `Recognition`, `ExperienceEntry`, `Capability`, `StackGroup`, `NavLink` (exact definitions below).
  - `site` (object, `as const`) and `getSiteUrl(): string` from `src/content/site.ts`.
  - `sections` from `src/content/sections.ts`; `recognition: Recognition[]` and `award(id: RecognitionId): Recognition` from `recognition.ts`; `glossary` from `glossary.ts`.

- [ ] **Step 1: Write the types**

Create `src/content/types.ts`:

```ts
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
```

- [ ] **Step 2: Write the failing rules test**

Create `tests/content-rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import * as glossaryModule from "@/content/glossary";
import * as recognitionModule from "@/content/recognition";
import * as sectionsModule from "@/content/sections";
import * as siteModule from "@/content/site";

// Task 1.2 adds projects, experience, capabilities and routes to this list.
export const contentModules: Record<string, unknown> = {
  site: siteModule,
  sections: sectionsModule,
  recognition: recognitionModule,
  glossary: glossaryModule,
};

function* strings(value: unknown, path: string): Generator<[string, string]> {
  if (typeof value === "string") {
    yield [path, value];
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* strings(value[i], `${path}[${i}]`);
  } else if (value && typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) yield* strings(inner, `${path}.${key}`);
  }
}

describe("copy rules", () => {
  it("has no em dashes or en dashes in any content string", () => {
    const offenders = Object.entries(contentModules)
      .flatMap(([name, mod]) => [...strings(mod, name)])
      .filter(([, text]) => /[\u2013\u2014]/.test(text))
      .map(([path, text]) => `${path}: ${text}`);
    expect(offenders).toEqual([]);
  });

  it("uses one label per intent", () => {
    expect(siteModule.site.labels.email).toBe("Email me");
    expect(siteModule.site.labels.work).toBe("See the work");
  });

  it("reads the site URL from SITE_URL at call time, without a trailing slash", () => {
    const before = process.env.SITE_URL;
    process.env.SITE_URL = "https://example.test/";
    expect(siteModule.getSiteUrl()).toBe("https://example.test");
    delete process.env.SITE_URL;
    expect(siteModule.getSiteUrl()).toBe("https://wrenz-portfolio.vercel.app");
    if (before !== undefined) process.env.SITE_URL = before;
  });

  it("keeps award wording in one place", () => {
    expect(recognitionModule.recognition.map((r) => r.id)).toEqual(["cum-laude", "ircite-2026", "jpcs-2025", "azure-fundamentals"]);
    expect(recognitionModule.award("ircite-2026").detail).toBe("IRCITE 2026");
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run tests/content-rules.test.ts`
Expected: FAIL, `Failed to resolve import "@/content/glossary"`.

- [ ] **Step 4: Write the copy files**

Create `src/content/site.ts`:

```ts
import type { NavLink } from "./types";

export const site = {
  name: "Wrenz Laylo",
  alternateName: "Wrenz Ivan Laylo",
  role: "Developer, AI & Automation",
  slogan: { lineOne: "Messy operations in.", lineTwo: "Reliable systems out.", highlight: "Reliable" },
  lede: "I map the rules first: who can do what, what can fail, how we prove it. Then I build it.",
  description:
    "Wrenz Laylo builds business systems, Python automation, WordPress engineering and applied AI around real operations. Based in Bataan, Philippines.",
  email: "wrenzivan2004@gmail.com",
  resume: "/Wrenz_Laylo-Full-Stack.pdf",
  employer: "Managed Virtual Services",
  alumniOf: "Angeles University Foundation",
  location: { locality: "Bataan", country: "PH" },
  socials: [
    { label: "GitHub", href: "https://github.com/WrenzLaylo" },
    { label: "LinkedIn", href: "https://linkedin.com/in/wrenzlaylo" },
  ],
  portrait: { src: "/portrait.webp", alt: "Wrenz Ivan Laylo in graduation attire", width: 600, height: 720 },
  nav: [
    { href: "#work", label: "Work" },
    { href: "#experience", label: "Experience" },
    { href: "#about", label: "About" },
  ] satisfies readonly NavLink[],
  labels: {
    skip: "Skip to content",
    primaryNav: "Primary",
    openMenu: "Menu",
    email: "Email me",
    work: "See the work",
    resume: "Download résumé",
    builtWith: "Built with",
    privateClient: "Private client project",
    privateProduct: "Private product",
    before: "Before",
    after: "After",
    backToTop: "Back to top",
    footer: "Designed and built by Wrenz Laylo.",
  },
} as const;

/** The one site-URL config value (spec §5). Read at call time so tests and builds can change it. */
export function getSiteUrl(): string {
  return (process.env.SITE_URL ?? "https://wrenz-portfolio.vercel.app").replace(/\/+$/, "");
}
```

Create `src/content/sections.ts`:

```ts
export const sections = {
  work: { id: "work", heading: "Built around actual operations." },
  moreWork: { id: "more-work", heading: "Smaller builds, same habits." },
  capabilities: { id: "capabilities", heading: "One developer, four useful angles." },
  experience: { id: "experience", heading: "Production work, not coursework dressed up." },
  about: {
    id: "about",
    heading: "I care about the handoff between “it runs” and “it’s reliable.”",
    paragraphs: [
      "I’m a Computer Science graduate of Angeles University Foundation, majoring in Data Science, and I graduated Cum Laude. I’m based in Bataan, Philippines, and I work across software development, automation, WordPress and applied AI.",
      "My strongest work usually starts where the requirements get messy: old spreadsheets, inconsistent user input, account migrations, production content, or an AI output that still needs safety and review.",
    ],
  },
  contact: {
    id: "contact",
    heading: "Have a workflow that has outgrown its spreadsheet?",
    line: "I’m open to full-time roles and freelance projects in business systems, automation, WordPress and applied AI.",
  },
} as const;
```

Create `src/content/recognition.ts`:

```ts
import type { Recognition, RecognitionId } from "./types";

/** The ONE source of award wording: About stickers, the LiPAD badge and JSON-LD `award` all read it. */
export const recognition: Recognition[] = [
  { id: "cum-laude", title: "Cum Laude", detail: "BS Computer Science, Data Science" },
  { id: "ircite-2026", title: "Best Thesis Paper and Presenter", detail: "IRCITE 2026", subject: "LiPAD" },
  { id: "jpcs-2025", title: "1st Place", detail: "JPCS Hackathon 2025" },
  { id: "azure-fundamentals", title: "Microsoft Certified", detail: "Azure Fundamentals" },
];

export function award(id: RecognitionId): Recognition {
  const found = recognition.find((r) => r.id === id);
  if (!found) throw new Error(`unknown recognition id: ${id}`);
  return found;
}
```

Create `src/content/glossary.ts`:

```ts
/** Every Tagalog phrase in the copy, with the exact gloss that must follow its first use (tested). */
export const glossary = [
  { term: "benta", gloss: " (sales)" },
  { term: "utang", gloss: " (credit)" },
  { term: "cash na pumasok", gloss: ", the cash that actually came in" },
] as const;
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/content-rules.test.ts && npx tsc --noEmit`
Expected: `4 passed`; tsc silent.

- [ ] **Step 6: Commit and open the PR**

```bash
git add src/content tests/content-rules.test.ts
git commit -m "Add the content types and the site, section, award and glossary copy"
git push -u origin rd/1.1-content-types
gh pr create --base redesign --title "1.1 Content types and site copy" --body "Task 1.1. Typed content model (spec §5 + clarifications 4 and 7), site/sections/recognition/glossary copy, copy-rule tests."
```

Review and merge per the protocol.

### Task 1.2: Project, experience and capability copy

**Files:**
- Create: `src/content/projects.ts`, `src/content/experience.ts`, `src/content/capabilities.ts`, `src/content/routes.ts`, `src/content/page-copy.ts`
- Create (assets): `public/portrait.webp`, `public/work/pos/counter.webp`, `public/work/pos/rail.webp`, `public/work/pos/saved-rail-desk.webp`, `public/work/pos/rail-saved.webp`, `public/work/everyday-rockstar/live.webp`
- Modify: `tests/content-rules.test.ts` (more modules, the gloss test)
- Test: `tests/content-integrity.test.ts`

**Interfaces:**
- Consumes: types and copy from Task 1.1.
- Produces: `fullProjects: FullProject[]` and `compactProjects: CompactProject[]` (page order) and `projectBySlug(slug: Slug): Project` from `projects.ts`; `experience: ExperienceEntry[]`; `capabilities: Capability[]` and `stack: StackGroup[]`; `routes: readonly { path: string }[]`; `pageCopy(): string[]` (every visible string in page order).

- [ ] **Step 1: Copy the approved assets in**

```bash
mkdir -p public/work/pos public/work/everyday-rockstar
cp /c/Users/OASIS/scratch-portfolio/slice/assets/portrait.webp public/portrait.webp
cp /c/Users/OASIS/scratch-portfolio/slice/assets/pos-counter.webp public/work/pos/counter.webp
cp /c/Users/OASIS/scratch-portfolio/slice/assets/pos-rail.webp public/work/pos/rail.webp
cp /c/Users/OASIS/scratch-portfolio/slice/assets/pos-saved-rail-desk.webp public/work/pos/saved-rail-desk.webp
cp /c/Users/OASIS/scratch-portfolio/slice/assets/pos-rail-saved.webp public/work/pos/rail-saved.webp
cp public/everyday-rockstar-live.webp public/work/everyday-rockstar/live.webp
```

(The old root-level images stay until Task 2.5 deletes them, because the old page still uses them until Task 1.3.)

- [ ] **Step 2: Write the failing integrity test**

Create `tests/content-integrity.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compactProjects, fullProjects } from "@/content/projects";
import { recognition } from "@/content/recognition";

const all = [...fullProjects, ...compactProjects];
const words = (s: string) => s.trim().split(/\s+/).length;

describe("projects", () => {
  it("lists the six worlds and five vignettes in page order", () => {
    expect(fullProjects.map((p) => p.slug)).toEqual(["pos", "time-log", "service-areas", "katiwala", "stockroom", "agent-island"]);
    expect(compactProjects.map((p) => p.slug)).toEqual(["everyday-rockstar", "lipad", "keyclick", "med42", "pesowise"]);
  });

  it("has unique slugs and the right tier on each list", () => {
    expect(new Set(all.map((p) => p.slug)).size).toBe(11);
    expect(fullProjects.every((p) => p.tier === "full")).toBe(true);
    expect(compactProjects.every((p) => p.tier === "compact")).toBe(true);
  });

  it("alternates split worlds and breaks them with two full-bleed worlds", () => {
    expect(fullProjects.map((p) => p.layout)).toEqual(["split-start", "split-end", "bleed", "split-start", "split-end", "bleed"]);
  });

  it("gives every world three points and a varied block", () => {
    for (const p of fullProjects) {
      expect(p.points, p.slug).toHaveLength(3);
      expect(p.varied, p.slug).toBeDefined();
      if (p.varied.kind === "flow") expect(p.varied.steps).toHaveLength(3);
    }
  });

  it("keeps vignette summaries to 20 words", () => {
    for (const p of compactProjects) expect(words(p.summary), p.slug).toBeLessThanOrEqual(20);
  });

  it("keeps tag counts within limits", () => {
    for (const p of fullProjects) expect(p.tags.length, p.slug).toBeLessThanOrEqual(5);
    for (const p of compactProjects) expect(p.tags.length, p.slug).toBeLessThanOrEqual(4);
    for (const p of all) expect(p.tags.length, p.slug).toBeGreaterThan(0);
  });

  it("uses absolute https or root-relative links", () => {
    for (const p of all) for (const l of p.links) expect(l.href, p.slug).toMatch(/^(https:\/\/|\/(?!\/))/);
  });

  it("shows links only on public projects, and every public vignette has a link or an award", () => {
    for (const p of all) if (p.status !== "public") expect(p.links, p.slug).toEqual([]);
    for (const p of compactProjects) if (p.status === "public") expect(p.links.length > 0 || Boolean(p.awardId), p.slug).toBe(true);
  });

  it("gives each project exactly one of a screenshot or an illustration label", () => {
    for (const p of all) expect(Boolean(p.shot) !== Boolean(p.illustrationLabel), p.slug).toBe(true);
  });

  it("points every screenshot at a real file, with real alt text and its size", () => {
    for (const p of all) {
      if (!p.shot) continue;
      expect(existsSync(join(process.cwd(), "public", p.shot.src)), p.shot.src).toBe(true);
      expect(p.shot.alt.length, p.slug).toBeGreaterThan(20);
      expect(p.shot.width > 0 && p.shot.height > 0, p.slug).toBe(true);
    }
  });

  it("references only known honours", () => {
    const ids = new Set(recognition.map((r) => r.id));
    for (const p of all) if (p.awardId) expect(ids.has(p.awardId), p.slug).toBe(true);
  });

  it("fills the bento with one wide, one narrow and three thirds, in that order", () => {
    expect(compactProjects.map((p) => p.cell)).toEqual(["wide", "narrow", "third", "third", "third"]);
  });
});
```

- [ ] **Step 3: Extend the rules test with the new modules and the gloss test**

In `tests/content-rules.test.ts`, add these imports at the top:

```ts
import * as capabilitiesModule from "@/content/capabilities";
import * as experienceModule from "@/content/experience";
import { pageCopy } from "@/content/page-copy";
import * as projectsModule from "@/content/projects";
import * as routesModule from "@/content/routes";
```

replace the `contentModules` object with:

```ts
export const contentModules: Record<string, unknown> = {
  site: siteModule,
  sections: sectionsModule,
  recognition: recognitionModule,
  glossary: glossaryModule,
  projects: projectsModule,
  experience: experienceModule,
  capabilities: capabilitiesModule,
  routes: routesModule,
};
```

and add these tests inside `describe("copy rules", ...)`:

```ts
  it("glosses each Tagalog phrase once, right after its first use", () => {
    const text = pageCopy().join("\n");
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const { term, gloss } of glossaryModule.glossary) {
      const hits = [...text.matchAll(new RegExp(`\\*?${escape(term)}\\*?`, "g"))];
      expect(hits.length, term).toBeGreaterThan(0);
      const after = (m: RegExpMatchArray) => text.slice((m.index ?? 0) + m[0].length);
      expect(after(hits[0]).startsWith(gloss), `first use of "${term}" must be followed by "${gloss}"`).toBe(true);
      for (const m of hits.slice(1)) expect(after(m).startsWith(gloss), `"${term}" glossed twice`).toBe(false);
    }
  });

  it("uses no other contact or work labels anywhere", () => {
    const rogue = pageCopy().filter((s) =>
      /get in touch|contact me|start a conversation|hire me|view (the )?(work|projects)|see (my )?projects/i.test(s),
    );
    expect(rogue).toEqual([]);
  });
```

- [ ] **Step 4: Run them and watch them fail**

Run: `npx vitest run tests/content-integrity.test.ts tests/content-rules.test.ts`
Expected: FAIL, `Failed to resolve import "@/content/projects"`.

- [ ] **Step 5: Write the project copy**

Create `src/content/projects.ts` (copy from spec Appendix A, confirmed by Wrenz 2026-10-11; the service areas redirect point says "Repoints"):

```ts
import type { CompactProject, FullProject, Project, Slug } from "./types";

export const fullProjects: FullProject[] = [
  {
    slug: "pos",
    tier: "full",
    layout: "split-start",
    name: "Pig Feeds POS",
    status: "private-client",
    schemaType: "SoftwareApplication",
    summary:
      "A working till and credit ledger for a Philippine pig-feed store, shaped by how the owner separates *benta* (sales), cash received and *utang* (credit).",
    points: [
      "Checkout records the sale and takes the stock off the shelf in one transaction.",
      "Customer passbooks keep every charge, payment and opening balance.",
      "The dashboard keeps *benta* apart from *cash na pumasok*, the cash that actually came in.",
    ],
    varied: {
      kind: "beforeAfter",
      before: "Sales and credit written by hand in a notebook.",
      after: "Every sale, payment and balance in one till, with stock that matches the shelf.",
    },
    tags: ["Next.js", "TypeScript", "Prisma", "SQLite", "Vitest"],
    links: [],
    shot: {
      src: "/work/pos/counter.webp",
      alt: "The Pig Feeds POS counter screen: a walk-in order of two bags of Boar Ration, one Gilt Developer and one Broodsow, total ₱8,040.00, ready to save as a cash sale.",
      width: 1320,
      height: 948,
      frame: "laptop",
    },
  },
  {
    slug: "time-log",
    tier: "full",
    layout: "split-end",
    name: "AGG Doors time-log system",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A Python pipeline that turns free-form Google Chat attendance posts into validated weekly timesheets in Google Drive.",
    points: [
      "Tells physical arrival, login, break, lunch and logout apart.",
      "Handles shared accounts, account migrations, missing events and impossible time orders.",
      "Backs up before every write, then reads the sheet back through the API to prove it.",
    ],
    varied: {
      kind: "flow",
      steps: ["A Chat post says “Login 7:23”.", "The pipeline parses and checks it.", "The row is written, then read back."],
    },
    tags: ["Python", "Google Chat API", "Sheets API", "Drive API", "GitHub Actions"],
    links: [{ kind: "adaptation", href: "https://github.com/WrenzLaylo/MVC-Time-Logs-Automation", label: "Public adaptation" }],
    illustrationLabel:
      "Illustration of the time-log pipeline: chat posts such as Login 7:23 fly into a representative weekly timesheet, which is then read back.",
    caption: "Representative week. Names and times are changed.",
  },
  {
    slug: "service-areas",
    tier: "full",
    layout: "bleed",
    name: "AGG Doors service areas",
    status: "public",
    schemaType: "CreativeWork",
    summary: "WordPress REST API automation that builds and maintains 178 suburb Service Area pages for a Melbourne garage door company.",
    points: [
      "Groups 512 searchable suburbs into regions, with A to Z lists and a region sitemap.",
      "Repoints 357 old suburb links to the new region pages, so old links still land in the right place.",
      "Writes every suburb page from local data, so no two pages read the same.",
    ],
    varied: { kind: "stat", value: "178", label: "suburb pages, none of them boilerplate" },
    tags: ["WordPress", "REST API", "Python", "ACF", "Schema.org"],
    links: [{ kind: "live", href: "https://www.aggdoors.com.au/service-areas/", label: "Live pages" }],
    // Phase 5 (Task 5.1) replaces this with the captured Service Area page screenshot.
    illustrationLabel: "Illustration of the AGG Doors service areas project: a smiling garage door among Melbourne suburb pins.",
  },
  {
    slug: "katiwala",
    tier: "full",
    layout: "split-start",
    name: "Katiwala",
    status: "private-product",
    schemaType: "SoftwareApplication",
    summary: "A Filipino home-services marketplace with separate journeys for customers and service providers.",
    points: [
      "Customers browse services and book in a few steps.",
      "Providers capture their ID and face, and OCR fills the form for them to correct.",
      "New providers wait in a clear pending state until they are verified.",
    ],
    varied: { kind: "flow", steps: ["A provider scans their ID.", "OCR fills the form.", "The account waits until it is verified."] },
    tags: ["Expo", "React Native", "TypeScript", "Prisma"],
    links: [],
    // Phase 5 (Task 5.3) replaces this with real app screens.
    illustrationLabel: "Illustration of Katiwala: a smiling phone surrounded by home-service tools.",
  },
  {
    slug: "stockroom",
    tier: "full",
    layout: "split-end",
    name: "Stockroom API",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A multi-tenant inventory and orders REST API for small shops, built with Java 21 and Spring Boot 4 and designed for Azure.",
    points: [
      "A guarded stock update and sorted row locks, proven by a concurrency test.",
      "Every row carries its shop, and composite foreign keys stop data crossing between shops.",
      "Stateless JWT sign-in with owner and staff roles, documented in Swagger UI.",
    ],
    varied: { kind: "promise", text: "Stock can never go negative, even when two orders arrive at the same moment." },
    tags: ["Java 21", "Spring Boot 4", "PostgreSQL", "Flyway", "JUnit"],
    links: [{ kind: "source", href: "https://github.com/WrenzLaylo/stockroom-api", label: "Source" }],
    // Phase 6 (Task 6.1) replaces this with the Swagger UI capture.
    illustrationLabel: "Illustration of Stockroom API: a smiling cardboard box on a stockroom shelf.",
  },
  {
    slug: "agent-island",
    tier: "full",
    layout: "bleed",
    name: "Agent Island",
    status: "public",
    schemaType: "SoftwareApplication",
    summary:
      "A Dynamic Island-style overlay for Windows that shows what Claude Code, Codex and Hermes are doing and answers their permission prompts.",
    points: [
      "Picks up the terminals you already have open; there is nothing new to launch.",
      "Shows permission prompts in the pill and types your answer into the real session.",
      "Hands anything it should not answer back to the terminal, focused and ready.",
    ],
    varied: {
      kind: "beforeAfter",
      before: "Switch to each terminal to answer every prompt.",
      after: "Answer from the pill, and the reply is typed into the real session.",
    },
    tags: ["Electron", "TypeScript", "Node.js", "Windows"],
    links: [{ kind: "source", href: "https://github.com/WrenzLaylo/Agent-Island", label: "Source" }],
    illustrationLabel:
      "Illustration of Agent Island: a Dynamic Island-style pill on a Windows desktop showing a permission prompt with Allow once, Don't ask again and Deny.",
  },
];

export const compactProjects: CompactProject[] = [
  {
    slug: "everyday-rockstar",
    tier: "compact",
    cell: "wide",
    name: "Everyday Rockstar",
    status: "public",
    schemaType: "WebSite",
    summary: "A coaching and community site with a cinematic editorial look, custom motion and a full reduced-motion version.",
    tags: ["Vite", "JavaScript", "GSAP", "Apache"],
    links: [{ kind: "live", href: "https://everyday-rockstars.com", label: "Live site" }],
    shot: {
      src: "/work/everyday-rockstar/live.webp",
      alt: "The live Everyday Rockstar website, showing its cinematic editorial hero.",
      width: 1440,
      height: 900,
      frame: "browser",
    },
  },
  {
    slug: "lipad",
    tier: "compact",
    cell: "narrow",
    name: "LiPAD",
    status: "public",
    schemaType: "CreativeWork",
    summary: "CRNN and GAN research that deblurs and reads Philippine licence plates.",
    tags: ["TensorFlow", "PyTorch", "CRNN", "GAN"],
    links: [],
    awardId: "ircite-2026",
    illustrationLabel: "Illustration of LiPAD: an invented licence plate turning from blurred to sharp.",
  },
  {
    slug: "keyclick",
    tier: "compact",
    cell: "third",
    name: "KeyClick Automator",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A Windows app that turns keyboard and mouse automation into a visual sequence you can inspect, save and stop safely.",
    tags: ["Python", "PySide6", "Qt Quick", "PyInstaller"],
    links: [
      { kind: "download", href: "https://github.com/WrenzLaylo/KeyClickAutomator/releases/latest", label: "Download for Windows" },
      { kind: "source", href: "https://github.com/WrenzLaylo/KeyClickAutomator", label: "Source" },
    ],
    // Phase 7 (Task 7.2) replaces this with the app window image from the KeyClick repo.
    illustrationLabel: "Illustration of KeyClick Automator: a smiling orange keycap.",
  },
  {
    slug: "med42",
    tier: "compact",
    cell: "third",
    name: "Med42 Clinical Suite",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A clinical workflow with versioned diagnosis APIs, streamed AI responses, review states and audit logs.",
    tags: ["Django REST", "PostgreSQL", "Redis", "React"],
    links: [
      { kind: "live", href: "https://medical-diagnosis-app-two.vercel.app", label: "Live app" },
      { kind: "source", href: "https://github.com/WrenzLaylo/medical-diagnosis-app", label: "Source" },
    ],
    // Phase 7 (Task 7.2) replaces this with a capture of the live app.
    illustrationLabel: "Illustration of Med42 Clinical Suite: a smiling heart.",
  },
  {
    slug: "pesowise",
    tier: "compact",
    cell: "third",
    name: "PesoWise",
    status: "public",
    schemaType: "SoftwareApplication",
    summary: "A personal spending tracker with sign-in and protected user data.",
    tags: ["Next.js", "TypeScript", "Prisma"],
    links: [{ kind: "live", href: "https://pesowise-umber.vercel.app", label: "Live app" }],
    // Phase 7 (Task 7.2) replaces this with a capture of the live app.
    illustrationLabel: "Illustration of PesoWise: a smiling green wallet.",
  },
];

export function projectBySlug(slug: Slug): Project {
  const found = [...fullProjects, ...compactProjects].find((p) => p.slug === slug);
  if (!found) throw new Error(`unknown project: ${slug}`);
  return found;
}
```

Create `src/content/experience.ts`:

```ts
import type { ExperienceEntry } from "./types";

export const experience: ExperienceEntry[] = [
  {
    period: "2026 to present",
    role: "Developer, AI & Automation",
    org: "Managed Virtual Services",
    detail: "Client: AGG Doors, Melbourne",
    body: "Production WordPress engineering, technical SEO, Python automation, Google Workspace APIs and verified live changes.",
  },
  {
    period: "2026",
    role: "Full-Stack Developer / AI Engineer Intern",
    org: "eBiZolution",
    detail: "Healthcare portal",
    body: "Versioned clinical APIs, approval workflows, SSE-based AI output, PostgreSQL, Redis, JWT sessions, rate limiting, revocation, and audit logging.",
  },
];
```

Create `src/content/capabilities.ts` (copy from the current site, minus the numbers):

```ts
import type { Capability, StackGroup } from "./types";

export const capabilities: Capability[] = [
  { icon: "stack", name: "Full-stack systems", line: "React and Next.js interfaces backed by Django, REST APIs, PostgreSQL, Redis, Prisma, and SQLite." },
  { icon: "flow-arrow", name: "Business automation", line: "Python workflows that turn messy operational data into validated reports, sheets, files, and scheduled jobs." },
  { icon: "browser", name: "WordPress engineering", line: "Gutenberg, ACF, PHP, REST API, technical SEO, content recovery, redirects, and production-safe changes." },
  { icon: "sparkle", name: "Applied AI", line: "Computer vision, streamed AI services, model evaluation, safety checks, and usable interfaces around AI outputs." },
];

export const stack: StackGroup[] = [
  { name: "Frontend", items: ["React", "Next.js", "React Native", "TypeScript", "Tailwind CSS"] },
  { name: "Backend", items: ["Python", "Django REST Framework", "PostgreSQL", "Redis", "Prisma"] },
  { name: "Platforms", items: ["WordPress", "Google Workspace APIs", "Vercel", "GitHub Actions"] },
  { name: "Quality", items: ["Regression testing", "API read-back", "Mobile QA", "Rollback planning"] },
];
```

Create `src/content/routes.ts`:

```ts
/** Indexable routes. Spec 1: the home page only. Spec 2 adds /work/<slug>. Drives sitemap.ts. */
export const routes: readonly { path: string }[] = [{ path: "/" }];
```

Create `src/content/page-copy.ts`:

```ts
import { capabilities, stack } from "./capabilities";
import { experience } from "./experience";
import { compactProjects, fullProjects } from "./projects";
import { recognition } from "./recognition";
import { sections } from "./sections";
import { site } from "./site";
import type { Varied } from "./types";

function variedText(v: Varied): string[] {
  switch (v.kind) {
    case "stat":
      return [v.value, v.label];
    case "flow":
      return [...v.steps];
    case "beforeAfter":
      return [v.before, v.after];
    case "promise":
      return [v.text];
    case "quote":
      return [v.text, v.name, v.role];
  }
}

/** Every visible string in page order (nav, hero, worlds, vignettes, capabilities, experience, about, contact,
 *  footer). The gloss test reads it, so first use is judged in the order a reader meets the words. */
export function pageCopy(): string[] {
  return [
    ...site.nav.map((link) => link.label),
    site.name,
    site.role,
    site.slogan.lineOne,
    site.slogan.lineTwo,
    site.lede,
    site.labels.work,
    site.labels.resume,
    sections.work.heading,
    ...fullProjects.flatMap((p) => [
      p.name,
      p.summary,
      ...p.points,
      ...variedText(p.varied),
      ...p.tags,
      ...p.links.map((l) => l.label),
      p.caption ?? "",
      p.shot?.alt ?? "",
      p.illustrationLabel ?? "",
    ]),
    sections.moreWork.heading,
    ...compactProjects.flatMap((p) => [p.name, p.summary, ...p.tags, ...p.links.map((l) => l.label), p.shot?.alt ?? "", p.illustrationLabel ?? ""]),
    sections.capabilities.heading,
    ...capabilities.flatMap((c) => [c.name, c.line]),
    ...stack.flatMap((g) => [g.name, ...g.items]),
    sections.experience.heading,
    ...experience.flatMap((e) => [e.period, e.role, e.org, e.detail, e.body]),
    sections.about.heading,
    ...sections.about.paragraphs,
    ...recognition.flatMap((r) => [r.title, r.detail, r.subject ?? ""]),
    sections.contact.heading,
    sections.contact.line,
    site.labels.email,
    site.email,
    site.labels.footer,
  ].filter((s) => s !== "");
}
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all tests pass (content-integrity 12, content-rules 6, rich 5); tsc and lint silent.

- [ ] **Step 7: Commit and open the PR**

```bash
git add src/content tests public/portrait.webp public/work
git commit -m "Add the project, experience and capability copy with integrity tests"
git push -u origin rd/1.2-project-copy
gh pr create --base redesign --title "1.2 Project, experience and capability copy" --body "Task 1.2. All 11 projects from Appendix A (facts confirmed by Wrenz 2026-10-11), experience, capabilities, routes, page-order copy, the POS and portrait assets from the slice. Integrity + gloss tests."
```

Review and merge per the protocol.

### Task 1.3: Tokens, fonts, base styles and the page shell

This task replaces the old page. Afterwards the preview shows the new fonts and colours, the sticky nav with its mobile menu, the hero heading, every section heading at its anchor, and the footer.

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/globals.css` (rewrite), `src/app/page.tsx` (rewrite), `next.config.ts`
- Delete: `src/app/MotionEffects.tsx`
- Create: `src/components/Icon.tsx`, `src/components/Sprite.tsx`, `src/components/ExtLink.tsx`, `src/components/Nav.tsx`, `src/components/HeroHeading.tsx`, `src/components/Footer.tsx`, `src/components/base.css`, `src/components/nav.css`, `src/components/hero.css`, `src/components/sections.css`
- Test: `tests/css-imports.test.ts`, `tests/contrast.test.ts`, `tests/page.test.tsx`

**Interfaces:**
- Consumes: `site`, `sections` (Task 1.1), `IconName` (Task 1.1).
- Produces:
  - `<Icon name={IconName} className?={string} />`: a 256-unit Phosphor icon drawn from the sprite with `<use href="#i-<name>">`, `aria-hidden`.
  - `<Sprite />`: one hidden `<svg>` with `<symbol>`s `i-check`, `i-arrow-up-right`, `i-download`, `i-list`, `i-stack`, `i-flow-arrow`, `i-browser`, `i-sparkle`, `s-cloud` (viewBox 0 0 110 60) and `s-eye` (viewBox -6 -6 12 12). Rendered once per page (and by the scene lab).
  - `<ExtLink href className? children />`: `<a target="_blank" rel="noopener">`.
  - `<Nav />`, `<Footer />`, `<HeroHeading />` (the H1 with name, role and slogan).
  - CSS classes: `.wrap`, `.skip`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.text-link`, `.icon`, `.section`, `.section-h`, `.h1-name`, `.h1-slogan`, `.hl`, `.mark`, `.lede`, `.cta-row`.
  - Tokens (CSS custom properties from `@theme static`): `--color-paper`, `--color-ink`, `--color-muted`, `--color-white`, `--color-yolk`, `--color-yolk-shade`, `--color-focus`, `--color-tint-<slug>` for all 11 slugs, `--color-sky-pos`, `--color-sky-time-log`, `--color-grass`, `--color-clock`, `--color-avatar`, `--color-sheet-line`, `--color-sheets-green`, `--color-coral`, `--font-display`, `--font-body`, `--radius-sm`, `--radius-md`, `--radius-lg`.

- [ ] **Step 1: Write the failing tests**

Create `tests/css-imports.test.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

describe("globals.css", () => {
  it("declares the layer order before anything else", () => {
    expect(css.trimStart().startsWith("@layer theme, base, components, scenes, utilities;")).toBe(true);
  });

  it("imports every component stylesheet into the components layer", () => {
    for (const file of readdirSync("src/components").filter((f) => f.endsWith(".css"))) {
      expect(css, file).toContain(`@import "../components/${file}" layer(components);`);
    }
  });

  it("imports every scene stylesheet into the scenes layer", () => {
    if (!existsSync("src/scenes")) return;
    for (const dir of readdirSync("src/scenes", { withFileTypes: true }).filter((d) => d.isDirectory())) {
      if (!existsSync(`src/scenes/${dir.name}/scene.css`)) continue;
      expect(css, dir.name).toContain(`@import "../scenes/${dir.name}/scene.css" layer(scenes);`);
    }
  });
});
```

Create `tests/contrast.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const start = css.indexOf("@theme static");
const theme = css.slice(start, css.indexOf("}", start));
const tokens = Object.fromEntries([...theme.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const backgrounds = Object.keys(tokens).filter((k) => k === "paper" || k.startsWith("tint-") || k.startsWith("sky-"));

describe("text contrast on every background token", () => {
  it("finds the tokens", () => {
    expect(backgrounds.length).toBeGreaterThanOrEqual(14);
  });

  it.each(backgrounds)("%s keeps ink and muted text at 4.5:1 or more", (bg) => {
    expect(ratio(tokens.ink, tokens[bg])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(tokens.muted, tokens[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps ink text readable on the yolk contact band", () => {
    expect(ratio(tokens.ink, tokens.yolk)).toBeGreaterThanOrEqual(4.5);
  });
});
```

Create `tests/page.test.tsx`:

```tsx
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

const doc = new JSDOM(renderToStaticMarkup(<Home />)).window.document;

describe("home page markup", () => {
  it("has exactly one h1, holding the name and the role", () => {
    const h1s = doc.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toContain("Wrenz Laylo, Developer, AI & Automation");
    expect(h1s[0].textContent).toContain("Messy operations in.");
  });

  it("keeps every section anchor", () => {
    for (const id of ["main", "top", "work", "more-work", "capabilities", "experience", "about", "contact"]) {
      expect(doc.getElementById(id), id).not.toBeNull();
    }
  });

  it("nav menu is a popover with an invoker", () => {
    expect(doc.getElementById("nav-menu")?.getAttribute("popover")).toBe("auto");
    expect(doc.querySelector('button[popovertarget="nav-menu"]')).not.toBeNull();
  });

  it("resolves every <use> to a sprite symbol", () => {
    const ids = new Set([...doc.querySelectorAll("symbol")].map((s) => s.id));
    for (const use of doc.querySelectorAll("use")) expect(ids.has((use.getAttribute("href") ?? "").slice(1)), use.getAttribute("href") ?? "").toBe(true);
  });

  it("opens external links with noopener", () => {
    for (const a of doc.querySelectorAll('a[href^="http"]')) {
      expect(a.getAttribute("rel") ?? "", a.getAttribute("href") ?? "").toContain("noopener");
    }
  });

  it("stays within the page DOM budget", () => {
    expect(doc.querySelectorAll("*").length).toBeLessThanOrEqual(2500);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run tests/css-imports.test.ts tests/contrast.test.ts tests/page.test.tsx`
Expected: FAIL: css-imports (no layer statement), contrast (no `@theme static`), page (old page has no `#nav-menu` and uses `next/image` props the mock ignores, or fails on missing anchors).

- [ ] **Step 3: Fonts and layout**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Albert_Sans, Gabarito } from "next/font/google";
import "./globals.css";

// Both are variable fonts: omitting `weight` loads the whole axis. `subsets` decides what is preloaded,
// so this gives exactly three preloads (Gabarito latin, Albert Sans latin, Albert Sans italic latin);
// latin-ext (the ₱ glyph) still loads on demand through its unicode-range.
const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-gabarito", display: "swap" });
// Italic must stay in this same call: a separate call gets another family name and <em> would not use it.
const albert = Albert_Sans({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-albert", display: "swap" });

// Interim metadata: Task 2.1 replaces it with buildMetadata().
export const metadata: Metadata = {
  metadataBase: new URL("https://wrenz-portfolio.vercel.app"),
  title: "Wrenz Laylo, Developer, AI & Automation",
  description:
    "Wrenz Laylo builds business systems, Python automation, WordPress engineering and applied AI around real operations. Based in Bataan, Philippines.",
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${gabarito.variable} ${albert.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Replace `next.config.ts` with:

```ts
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
```

- [ ] **Step 4: Tokens and base styles**

Replace `src/app/globals.css` with:

```css
@layer theme, base, components, scenes, utilities;
@import "tailwindcss";
@import "../components/base.css" layer(components);
@import "../components/nav.css" layer(components);
@import "../components/hero.css" layer(components);
@import "../components/sections.css" layer(components);

/* `static` emits every token even though plain CSS (not utilities) uses most of them. */
@theme static {
  --color-paper: #FFF8EE;
  --color-ink: #1F1B24;
  --color-muted: #5B5566;
  --color-white: #FFFFFF;
  --color-yolk: #FFC72C;
  --color-yolk-shade: #E29C0E;
  --color-focus: #1F5EFF;

  /* World tints (lightness 88-91). Adjacent worlds never share a hue family. Each world's hill edge is
     filled with the next world's tint, so all tints are global. */
  --color-tint-pos: #D9F2CF;
  --color-tint-time-log: #D6E9FF;
  /* Interim tints (right hue family). Fable sets the final value when the scene is designed (Phases 5-7). */
  --color-tint-service-areas: #FFE2D9;
  --color-tint-katiwala: #CDEFEA;
  --color-tint-stockroom: #E7E0FF;
  --color-tint-agent-island: #FFDDE8;
  --color-tint-everyday-rockstar: #FFF0C7;
  --color-tint-lipad: #DCEAF7;
  --color-tint-keyclick: #FFE4CF;
  --color-tint-med42: #FFDFE3;
  --color-tint-pesowise: #D6F3E2;

  /* Scene colours carried from the slice */
  --color-sky-pos: #EFFAEA;
  --color-grass: #86D96F;
  --color-sky-time-log: #EDF5FF;
  --color-clock: #9CC5FF;
  --color-avatar: #1F5EFF;
  --color-sheet-line: #DCE3EE;
  --color-sheets-green: #137A47;
  --color-coral: #FF6A4D;

  --font-display: var(--font-gabarito), "Albert Sans", system-ui, sans-serif;
  --font-body: var(--font-albert), system-ui, sans-serif;

  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 32px;
}

@layer base {
  html {
    color-scheme: light;
    -webkit-text-size-adjust: 100%;
    scroll-padding-top: 80px; /* the sticky nav is 64 px */
  }
  body {
    background: var(--color-paper);
    color: var(--color-ink);
    font: 400 18px/1.55 var(--font-body);
    overflow-x: clip;
  }
  h1, h2, h3 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  p { max-width: 65ch; text-wrap: pretty; }
  a { color: inherit; }
  :focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 3px;
    border-radius: 6px;
  }
  @media (max-width: 767px) {
    body { font-size: 17px; }
  }
}
```

- [ ] **Step 5: Component styles**

Create `src/components/base.css`:

```css
.wrap { width: min(1280px, 100% - 80px); margin-inline: auto; }
.skip {
  position: absolute; left: 16px; top: -60px; z-index: 50;
  background: var(--color-ink); color: var(--color-paper);
  padding: 10px 16px; border-radius: var(--radius-sm); text-decoration: none;
}
.skip:focus { top: 12px; }
.sprite { position: absolute; width: 0; height: 0; }
.icon { width: 18px; height: 18px; flex: none; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  min-height: 52px; padding: 0 24px; border-radius: 999px; border: 2px solid var(--color-ink);
  font: 700 16px/1 var(--font-display); text-decoration: none; white-space: nowrap;
  transition: transform .18s cubic-bezier(.2, .8, .2, 1), box-shadow .18s cubic-bezier(.2, .8, .2, 1);
}
.btn-primary { background: var(--color-ink); color: var(--color-paper); }
.btn-secondary { background: var(--color-white); color: var(--color-ink); }
.btn:hover { transform: translateY(-2px); box-shadow: 0 4px 0 var(--color-ink); }
.btn:active { transform: translateY(1px); box-shadow: 0 0 0 var(--color-ink); }
.btn-sm { min-height: 44px; padding: 0 18px; font-size: 15px; }

.text-link {
  display: inline-flex; align-items: center; gap: 6px; min-height: 44px;
  font-weight: 600; text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 5px;
  text-decoration-color: var(--link-line, var(--color-yolk));
}
.text-link .icon { width: 16px; height: 16px; }

@media (max-width: 767px) {
  .wrap { width: calc(100% - 32px); }
}
@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
}
```

Create `src/components/nav.css`:

```css
.nav { position: sticky; top: 0; z-index: 40; height: 64px; background: var(--color-paper); }
.nav-bar { height: 100%; display: flex; align-items: center; gap: 28px; }
.wordmark { margin-right: auto; font: 800 22px/1 var(--font-display); letter-spacing: -0.02em; text-decoration: none; }
.nav-menu a { font-weight: 600; font-size: 16px; text-decoration: none; padding: 12px 0; }
.nav-menu a:hover { text-decoration: underline; text-decoration-thickness: 3px; text-decoration-color: var(--color-yolk); text-underline-offset: 6px; }
.nav-toggle {
  display: none; width: 44px; height: 44px; border-radius: 999px; border: 2px solid var(--color-ink);
  background: var(--color-white); color: var(--color-ink); align-items: center; justify-content: center; cursor: pointer;
}
.nav-toggle .icon { width: 22px; height: 22px; }

/* Desktop: the popover element is shown inline. Author styles beat the UA's [popover] rules. */
@media (min-width: 768px) {
  .nav-menu {
    display: flex; gap: 28px; position: static; inset: auto; width: auto; height: auto;
    margin: 0; padding: 0; border: 0; background: none; color: inherit; overflow: visible;
  }
}

/* Mobile: the links live in a popover opened by the toggle (toggling, Escape and light dismiss are built in). */
@media (max-width: 767px) {
  .nav-bar { gap: 10px; }
  .wordmark { font-size: 20px; }
  .nav-toggle { display: inline-flex; }
  .nav-menu:popover-open {
    display: flex; flex-direction: column; position: fixed; inset: 64px 16px auto auto; width: 220px;
    margin: 0; padding: 8px; border: 2px solid var(--color-ink); border-radius: var(--radius-md);
    background: var(--color-white); color: var(--color-ink);
  }
  .nav-menu a { display: flex; align-items: center; min-height: 48px; padding: 12px 14px; }
}

/* No Popover API: the links render inline under the bar (accepted fallback, spec §10). */
@supports not selector(:popover-open) {
  .nav { height: auto; }
  .nav-bar { flex-wrap: wrap; padding-block: 10px; }
  .nav-toggle { display: none !important; }
  .nav-menu { display: flex; gap: 20px; order: 3; flex-basis: 100%; }
}
```

Create `src/components/hero.css` (text styles only; Task 3.2 adds the stage and motion):

```css
.hero { position: relative; }
.hero-copy { padding: 72px 0; }
.hero h1 { display: grid; gap: 18px; }
.h1-name { display: block; font: 600 20px/1.3 var(--font-body); letter-spacing: 0; color: var(--color-muted); }
.h1-slogan { display: block; font: 800 clamp(44px, 5vw, 68px)/1.04 var(--font-display); letter-spacing: -0.025em; }
.h1-slogan .line { display: block; }
.hl { position: relative; display: inline-block; z-index: 0; }
.mark {
  position: absolute; left: -6px; right: -6px; bottom: 0.06em; height: 0.42em; z-index: -1;
  background: var(--color-yolk); border-radius: var(--radius-sm); transform: rotate(-1.5deg); transform-origin: 0 50%;
}
.lede { margin-top: 24px; font-size: 20px; line-height: 1.5; max-width: 34ch; color: var(--color-muted); }
.cta-row { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 14px; }

@media (max-width: 767px) {
  .hero-copy { padding: 40px 0; }
  .hero h1 { gap: 12px; }
  .h1-name { font-size: 16px; }
  .h1-slogan { font-size: min(40px, 9.5vw); }
  .lede { margin-top: 16px; font-size: 17px; }
  .cta-row { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 12px; }
  .cta-row .btn { width: 100%; }
}
```

Create `src/components/sections.css` (Task 4.x adds the section bodies):

```css
.section { padding: 96px 0; }
.section-h { font: 800 56px/1.02 var(--font-display); max-width: 18ch; }

.footer { padding: 32px 0 40px; border-top: 2px solid var(--color-ink); }
.footer-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 28px; }
.footer-row p { font-size: 15px; color: var(--color-muted); }
.footer-links { display: flex; flex-wrap: wrap; gap: 4px 24px; }
.footer-links a { display: inline-flex; align-items: center; min-height: 44px; font-weight: 600; font-size: 15px; }

@media (max-width: 1180px) {
  .section-h { font-size: 46px; }
}
@media (max-width: 767px) {
  .section { padding: 64px 0; }
  .section-h { font-size: 36px; }
}
```

- [ ] **Step 6: Icon, sprite and link components**

Create `src/components/Sprite.tsx`:

```tsx
// One hidden SVG holding every repeated drawing. Everything else references it with <use href="#id">,
// so each icon, cloud and mascot eye is defined once (spec §4 "defined once and reused with <use>").
// Phosphor bold paths, 256-unit viewBox.
const ICONS: Record<string, string> = {
  check: "M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z",
  "arrow-up-right": "M204,64V168a12,12,0,0,1-24,0V93L72.49,200.49a12,12,0,0,1-17-17L163,76H88a12,12,0,0,1,0-24H192A12,12,0,0,1,204,64Z",
  download:
    "M228,144v64a12,12,0,0,1-12,12H40a12,12,0,0,1-12-12V144a12,12,0,0,1,24,0v52H204V144a12,12,0,0,1,24,0Zm-108.49,8.49a12,12,0,0,0,17,0l40-40a12,12,0,0,0-17-17L140,115V32a12,12,0,0,0-24,0v83L96.49,95.51a12,12,0,0,0-17,17Z",
  list: "M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128ZM40,76H216a12,12,0,0,0,0-24H40a12,12,0,0,0,0,24ZM216,180H40a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24Z",
  stack:
    "M234.36,170A12,12,0,0,1,230,186.37l-96,56a12,12,0,0,1-12.1,0l-96-56a12,12,0,0,1,12.09-20.74l90,52.48L218,165.63A12,12,0,0,1,234.36,170ZM218,117.63,128,170.11,38.05,117.63A12,12,0,0,0,26,138.37l96,56a12,12,0,0,0,12.1,0l96-56A12,12,0,0,0,218,117.63ZM20,80a12,12,0,0,1,6-10.37l96-56a12.06,12.06,0,0,1,12.1,0l96,56a12,12,0,0,1,0,20.74l-96,56a12,12,0,0,1-12.1,0l-96-56A12,12,0,0,1,20,80Zm35.82,0L128,122.11,200.18,80,128,37.89Z",
  "flow-arrow":
    "M248.49,71.51l-32-32a12,12,0,0,0-17,17L211,68h-3c-52,0-64.8,30.71-75.08,55.38-8.82,21.17-15.45,37.05-42.75,40.09a44,44,0,1,0,.28,24.08c43.34-3.87,55.07-32,64.63-54.93C164.9,109,172,92,208,92h3l-11.52,11.51a12,12,0,0,0,17,17l32-32A12,12,0,0,0,248.49,71.51ZM48,196a20,20,0,1,1,20-20A20,20,0,0,1,48,196Z",
  browser: "M216,36H40A20,20,0,0,0,20,56V200a20,20,0,0,0,20,20H216a20,20,0,0,0,20-20V56A20,20,0,0,0,216,36Zm-4,24V84H44V60ZM44,196V108H212v88Z",
  sparkle:
    "M199,125.31l-49.88-18.39L130.69,57a19.92,19.92,0,0,0-37.38,0L74.92,106.92,25,125.31a19.92,19.92,0,0,0,0,37.38l49.88,18.39L93.31,231a19.92,19.92,0,0,0,37.38,0l18.39-49.88L199,162.69a19.92,19.92,0,0,0,0-37.38Zm-63.38,35.16a12,12,0,0,0-7.11,7.11L112,212.28l-16.47-44.7a12,12,0,0,0-7.11-7.11L43.72,144l44.7-16.47a12,12,0,0,0,7.11-7.11L112,75.72l16.47,44.7a12,12,0,0,0,7.11,7.11L180.28,144ZM140,40a12,12,0,0,1,12-12h12V16a12,12,0,0,1,24,0V28h12a12,12,0,0,1,0,24H188V64a12,12,0,0,1-24,0V52H152A12,12,0,0,1,140,40ZM252,88a12,12,0,0,1-12,12h-4v4a12,12,0,0,1-24,0v-4h-4a12,12,0,0,1,0-24h4V72a12,12,0,0,1,24,0v4h4A12,12,0,0,1,252,88Z",
};

export function Sprite() {
  return (
    <svg className="sprite" aria-hidden="true" focusable="false">
      {Object.entries(ICONS).map(([name, d]) => (
        <symbol key={name} id={`i-${name}`} viewBox="0 0 256 256">
          <path d={d} fill="currentColor" />
        </symbol>
      ))}
      <symbol id="s-cloud" viewBox="0 0 110 60">
        <circle cx="30" cy="38" r="18" fill="#fff" />
        <circle cx="56" cy="28" r="24" fill="#fff" />
        <circle cx="84" cy="38" r="18" fill="#fff" />
        <rect x="12" y="38" width="90" height="18" rx="9" fill="#fff" />
      </symbol>
      <symbol id="s-eye" viewBox="-6 -6 12 12">
        <circle r="5.5" fill="#1F1B24" />
        <circle cx="2" cy="-2" r="1.8" fill="#fff" />
      </symbol>
    </svg>
  );
}
```

Create `src/components/Icon.tsx`:

```tsx
import type { IconName } from "@/content/types";

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className ? `icon ${className}` : "icon"} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  );
}
```

Create `src/components/ExtLink.tsx`:

```tsx
import type { ReactNode } from "react";

export function ExtLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener">
      {children}
    </a>
  );
}
```

- [ ] **Step 7: Nav, hero heading and footer**

Create `src/components/Nav.tsx`:

```tsx
import { site } from "@/content/site";
import { Icon } from "./Icon";

// The mobile menu is a native popover: toggling, Escape and light dismiss need no React state.
// The motion engine closes it after a link tap (Task 1.5).
export function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-bar">
        <a className="wordmark" href="#top">
          {site.name}
        </a>
        <nav id="nav-menu" className="nav-menu" popover="auto" aria-label={site.labels.primaryNav}>
          {site.nav.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="btn btn-primary btn-sm" href={`mailto:${site.email}`}>
          {site.labels.email}
        </a>
        <button className="nav-toggle" type="button" popoverTarget="nav-menu" aria-label={site.labels.openMenu}>
          <Icon name="list" />
        </button>
      </div>
    </header>
  );
}
```

Create `src/components/HeroHeading.tsx`:

```tsx
import { site } from "@/content/site";

// One H1 holding name, role and slogan (spec §7, SEO P1). The yolk mark under "Reliable" is decorative.
export function HeroHeading() {
  const { lineOne, lineTwo, highlight } = site.slogan;
  const rest = lineTwo.slice(highlight.length);
  return (
    <h1 id="hero-h">
      <span className="h1-name">
        {site.name}, {site.role}
      </span>{" "}
      <span className="h1-slogan">
        <span className="line">{lineOne}</span>{" "}
        <span className="line">
          <span className="hl">
            <span className="mark" aria-hidden="true" />
            {highlight}
          </span>
          {rest}
        </span>
      </span>
    </h1>
  );
}
```

Create `src/components/Footer.tsx`:

```tsx
import { site } from "@/content/site";
import { ExtLink } from "./ExtLink";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-row">
        <p>{site.labels.footer}</p>
        <div className="footer-links">
          {site.socials.map((s) => (
            <ExtLink key={s.href} href={s.href}>
              {s.label}
            </ExtLink>
          ))}
          <a href="#top">{site.labels.backToTop}</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 8: The page shell**

Delete the old motion component: `git rm src/app/MotionEffects.tsx`.

Replace `src/app/page.tsx` with:

```tsx
import { Footer } from "@/components/Footer";
import { HeroHeading } from "@/components/HeroHeading";
import { Icon } from "@/components/Icon";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import { sections } from "@/content/sections";
import { site } from "@/content/site";

// Shell: Task 3.2 replaces the hero section, Tasks 3.x add the worlds, Phase 4 fills the other sections.
const shellSections = [sections.work, sections.moreWork, sections.capabilities, sections.experience, sections.about, sections.contact];

export default function Home() {
  return (
    <>
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <section id="top" className="hero" aria-labelledby="hero-h">
          <div className="wrap hero-copy">
            <HeroHeading />
            <p className="lede">{site.lede}</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#work">
                {site.labels.work}
                <Icon name="arrow-up-right" />
              </a>
              <a className="btn btn-secondary" href={site.resume} download>
                {site.labels.resume}
                <Icon name="download" />
              </a>
            </div>
          </div>
        </section>
        {shellSections.map((s) => (
          <section key={s.id} id={s.id} className="section" aria-labelledby={`${s.id}-h`}>
            <div className="wrap">
              <h2 id={`${s.id}-h`} className="section-h">
                {s.heading}
              </h2>
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 9: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (css-imports 3, contrast 16, page 6, plus the earlier files). If a contrast case fails, darken nothing: lighten the failing interim tint by a few points of lightness until ink and muted both clear 4.5:1, and note the new value in the PR.

- [ ] **Step 10: Check the build, the three font preloads and the page at 1:1**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
curl -s http://127.0.0.1:3000/ | grep -o '<link rel="preload"[^>]*as="font"[^>]*>' | wc -l
py -3.11 -I tools/perf/shoot.py tools/perf/out/1.3 1440 900 --wait 600
py -3.11 -I tools/perf/shoot.py tools/perf/out/1.3 390 844 --wait 600
py -3.11 -I tools/perf/serve.py stop
```

Expected: the preload count prints `3`. Both `shoot.py` runs print `PASS`. Open the first two screenshots of each width at 1:1: Gabarito headings, Albert Sans body, paper background, the yolk mark under "Reliable", the nav bar with "Email me", and at 390 the menu button. Then open `http://127.0.0.1:3000/` in Chrome at 390 px wide (DevTools device mode), tap the menu button, tap "About": the menu stays open until Task 1.5 (expected), and the page scrolls to About below the sticky bar.

- [ ] **Step 11: Commit and open the PR**

```bash
git add -A src/app src/components next.config.ts tests
git commit -m "Replace the old page with the new tokens, fonts, nav, hero heading and footer"
git push -u origin rd/1.3-shell
gh pr create --base redesign --title "1.3 Tokens, fonts and the page shell" --body "Task 1.3. Gabarito + Albert Sans (3 preloads), @theme static tokens with interim tints, layer order, base/nav/hero/sections CSS, sprite + icons, popover nav, H1, footer. Old page and MotionEffects removed."
```

Paste the preload count and the `shoot.py` summaries into the PR. Review and merge per the protocol.

### Task 1.4: Stage system, mascots and basic scenes

**Files:**
- Create: `src/scenes/grid.ts`, `src/scenes/Stage.tsx`, `src/scenes/index.ts`, `src/scenes/basic/BasicWorld.tsx`, `src/scenes/basic/BasicVignette.tsx`, `src/scenes/basic/scene.css`
- Create: `src/components/Mascot.tsx`, `src/components/DeviceFrame.tsx`, `src/components/stage.css`, `src/components/device.css`
- Modify: `src/app/globals.css` (three imports)
- Test: `tests/scenes.test.tsx`

**Interfaces:**
- Consumes: `FullProject`, `CompactProject`, `Shot`, `Slug` (Task 1.1); `fullProjects`, `compactProjects` (Task 1.2); `<Sprite />` symbols `s-cloud`, `s-eye` (Task 1.3).
- Produces:
  - `src/scenes/grid.ts`: `STAGE_GRID_SWITCH = 760`; `type Grid = { dw: number; dh: number; mdw: number; mdh: number }`; `type Place = { x: number; y: number; w: number; mx?: number; my?: number; mw?: number }`; `cssVars(vars: Record<\`--${string}\`, string | number>): CSSProperties`; `place(p: Place, extra?: Record<\`--${string}\`, string | number>): CSSProperties`.
  - `src/scenes/Stage.tsx`: `<Stage slug tier grid label? className? children>` (renders `.stage-c > .stage[data-scene][data-tier]`, `role="img"` + `aria-label` when `label` is given); `<Layer depth="bg"|"mid"|"fg" decorative?=true interactive?=false children>` (renders `.layer.layer-<depth>[aria-hidden][inert] > .mouse[data-k]`, k = bg 0.02, mid 0.012, fg 0.035).
  - `<Mascot slug={Slug} className? />`: the sticker-flat mascot for every project (inline SVG, eyes from `#s-eye`).
  - `<DeviceFrame shot={Shot} sizes={string} className? children? />`: `.device.device-<frame> > .device-screen` (ink bezel, title-bar dots for browser and window) holding a lazy `next/image`; `children` render inside the screen (overlays); laptops add `.device-base`.
  - `src/scenes/index.ts`: `type FullScene = ComponentType<{ project: FullProject }>`, `type CompactScene = ComponentType<{ project: CompactProject }>`, `fullScenes: Record<FullSlug, FullScene>`, `compactScenes: Record<CompactSlug, CompactScene>`. All entries are `BasicWorld` / `BasicVignette` until their phase.
  - CSS: the stage system (`.stage-c`, `.stage`, `.layer`, `.mouse`, `.pos`, `.g-d`, `.g-m`), the shared loops (`.bob.loop`, `.cloud.loop`, keyframes `bob` and `drift`), `.paused` gating, and `view()` parallax on `.layer-bg` / `.layer-fg`.

- [ ] **Step 1: Write the failing scene test**

Create `tests/scenes.test.tsx`:

```tsx
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sprite } from "@/components/Sprite";
import { compactProjects, fullProjects } from "@/content/projects";
import type { Project } from "@/content/types";
import { compactScenes, fullScenes } from "@/scenes";
import { STAGE_GRID_SWITCH } from "@/scenes/grid";

const FORBIDDEN = "h1, h2, h3, h4, h5, h6, button, a, table, th, form, input";
const spriteDoc = new JSDOM(renderToStaticMarkup(<Sprite />)).window.document;
const symbols = new Set([...spriteDoc.querySelectorAll("symbol")].map((s) => s.id));

function stageOf(markup: string, slug: string): HTMLElement {
  const doc = new JSDOM(`<body>${markup}</body>`).window.document;
  const stage = doc.querySelector<HTMLElement>(`[data-scene="${slug}"]`);
  if (!stage) throw new Error(`no [data-scene="${slug}"] root`);
  return stage;
}

function sharedChecks(stage: HTMLElement, project: Project, tier: string, limit: number) {
  it(`is a ${tier}-tier stage inside a size container`, () => {
    expect(stage.dataset.tier).toBe(tier);
    expect(stage.parentElement?.classList.contains("stage-c")).toBe(true);
  });

  it("contains no headings, buttons, links, tables or form fields", () => {
    expect(stage.querySelectorAll(FORBIDDEN)).toHaveLength(0);
  });

  it(`stays within ${limit} elements`, () => {
    expect(stage.querySelectorAll("*").length + 1).toBeLessThanOrEqual(limit);
  });

  it("hides decorative layers, and makes them inert unless they hold an interactive part", () => {
    for (const layer of stage.querySelectorAll(".layer")) {
      if (layer.getAttribute("aria-hidden") !== "true") continue;
      const interactive = layer.querySelector("[data-interactive]") !== null;
      expect(layer.hasAttribute("inert"), layer.className).toBe(!interactive);
    }
  });

  it("names its visual: the screenshot's alt text, or the illustration label", () => {
    if (project.shot) {
      const img = [...stage.querySelectorAll("img")].find((i) => i.getAttribute("src") === project.shot?.src);
      expect(img?.getAttribute("alt")).toBe(project.shot.alt);
      expect(img?.closest('[aria-hidden="true"]')).toBeNull();
    } else {
      expect(stage.getAttribute("role")).toBe("img");
      expect(stage.getAttribute("aria-label")).toBe(project.illustrationLabel);
    }
  });

  it("uses only sprite symbols that exist", () => {
    for (const use of stage.querySelectorAll("use")) {
      expect(symbols.has((use.getAttribute("href") ?? "").slice(1)), use.getAttribute("href") ?? "").toBe(true);
    }
  });

  it("gives every pointer wrapper a strength", () => {
    for (const m of stage.querySelectorAll(".mouse")) expect(Number(m.getAttribute("data-k"))).toBeGreaterThan(0);
  });
}

describe.each(fullProjects)("world scene $slug", (project) => {
  const Scene = fullScenes[project.slug];
  sharedChecks(stageOf(renderToStaticMarkup(<Scene project={project} />), project.slug), project, "full", 300);
});

describe.each(compactProjects)("vignette scene $slug", (project) => {
  const Scene = compactScenes[project.slug];
  sharedChecks(stageOf(renderToStaticMarkup(<Scene project={project} />), project.slug), project, "compact", 120);
});

describe("scene stylesheets", () => {
  const files = [
    ...readdirSync("src/components").filter((f) => f.endsWith(".css")).map((f) => `src/components/${f}`),
    ...readdirSync("src/scenes", { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `src/scenes/${d.name}/scene.css`)
      .filter((f) => existsSync(f)),
  ];

  it("switch grids at the shared STAGE_GRID_SWITCH width", () => {
    for (const file of files) {
      for (const m of readFileSync(file, "utf8").matchAll(/@container\s+stage\s*\(([^)]*)\)/g)) {
        expect(m[1].replace(/\s+/g, " ").trim(), file).toBe(`width < ${STAGE_GRID_SWITCH}px`);
      }
    }
  });

  it("never use overflow: hidden (it captures view() timelines; use clip)", () => {
    for (const file of files) expect(readFileSync(file, "utf8"), file).not.toMatch(/overflow(-[xy])?\s*:\s*hidden/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/scenes.test.tsx`
Expected: FAIL, `Failed to resolve import "@/scenes"`.

- [ ] **Step 3: The grid helpers and the stage components**

Create `src/scenes/grid.ts`:

```ts
import type { CSSProperties } from "react";

/** Below this stage width (px) world scenes use their mobile grid (spec §8 + clarification 1).
 *  Every `@container stage (width < 760px)` must use this literal (tests/scenes.test.tsx). */
export const STAGE_GRID_SWITCH = 760;

/** A stage's design size on its desktop grid (dw × dh) and mobile grid (mdw × mdh), in design px. */
export type Grid = { dw: number; dh: number; mdw: number; mdh: number };

/** Where an object sits on the desktop grid, and optionally on the mobile grid. */
export type Place = { x: number; y: number; w: number; mx?: number; my?: number; mw?: number };

type Vars = Record<`--${string}`, string | number>;

/** Inline custom properties. React passes numbers through unchanged for custom properties. */
export function cssVars(vars: Vars): CSSProperties {
  return vars as CSSProperties;
}

export function place(p: Place, extra: Vars = {}): CSSProperties {
  const vars: Vars = { "--x": p.x, "--y": p.y, "--w": p.w, ...extra };
  if (p.mx !== undefined) vars["--mx"] = p.mx;
  if (p.my !== undefined) vars["--my"] = p.my;
  if (p.mw !== undefined) vars["--mw"] = p.mw;
  return cssVars(vars);
}
```

Create `src/scenes/Stage.tsx`:

```tsx
import type { ReactNode } from "react";
import { cssVars, type Grid } from "./grid";

type Tier = "full" | "compact" | "hero" | "strip";
type Depth = "bg" | "mid" | "fg";

const POINTER_STRENGTH: Record<Depth, number> = { bg: 0.02, mid: 0.012, fg: 0.035 };

/** Root of every animated stage. `.stage-c` is the size container (`@container stage`); `.stage` is the
 *  design-grid box the motion engine observes. Illustration-only stages pass `label` (role="img"). */
export function Stage({
  slug,
  tier,
  grid,
  label,
  className,
  children,
}: {
  slug: string;
  tier: Tier;
  grid: Grid;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="stage-c">
      <div
        className={className ? `stage ${className}` : "stage"}
        data-scene={slug}
        data-tier={tier}
        role={label ? "img" : undefined}
        aria-label={label}
        style={cssVars({ "--dw": grid.dw, "--dh": grid.dh, "--mdw": grid.mdw, "--mdh": grid.mdh })}
      >
        {children}
      </div>
    </div>
  );
}

/** A depth layer. Decorative layers are aria-hidden and inert. The layer that holds the meaningful
 *  screenshot passes decorative={false}. A layer whose mascot reacts to the pointer passes interactive:
 *  inert would disable its hit-testing (spec clarification 3). */
export function Layer({
  depth,
  decorative = true,
  interactive = false,
  children,
}: {
  depth: Depth;
  decorative?: boolean;
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`layer layer-${depth}`} aria-hidden={decorative || undefined} inert={(decorative && !interactive) || undefined}>
      <div className="mouse" data-k={POINTER_STRENGTH[depth]}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Mascots and device frames**

Create `src/components/Mascot.tsx`. The pig, chat bubble, garage door, phone, box and keycap are the slice's hero mascots (`slice/index.html` lines 75-97) with each eye's two circles replaced by one `<use href="#s-eye">`; the bot, star, licence plate, heart and wallet are new and follow the same face grammar. Phases 6 and 7 may refine the new ones with Fable.

```tsx
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
```

Create `src/components/DeviceFrame.tsx`:

```tsx
import Image from "next/image";
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
        <Image className="device-shot" src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes={sizes} loading="lazy" />
        {children}
      </div>
      {shot.frame === "laptop" ? <span className="device-base" aria-hidden="true" /> : null}
    </div>
  );
}
```

- [ ] **Step 5: Basic scenes and the registries**

Create `src/scenes/basic/BasicWorld.tsx`:

```tsx
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import type { FullProject } from "@/content/types";
import { place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 820, dh: 620, mdw: 358, mdh: 340 };

/** Interim world scene (spec clarification 15): clouds, the screenshot if there is one, and the mascot. */
export function BasicWorld({ project }: { project: FullProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="full" grid={GRID} label={shot ? undefined : project.illustrationLabel} className="basic">
      <Layer depth="bg">
        <svg className="pos cloud loop" style={place({ x: 60, y: 56, w: 150, mx: 24, my: 20, mw: 70 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="pos cloud loop g-d" style={place({ x: 610, y: 40, w: 110 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={place({ x: 150, y: 70, w: 520, mx: 24, my: 28, mw: 310 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 520px, 90vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        <div
          className="pos"
          data-part="mascot"
          style={shot ? place({ x: 620, y: 400, w: 170, mx: 262, my: 238, mw: 84 }) : place({ x: 300, y: 180, w: 220, mx: 104, my: 80, mw: 150 })}
        >
          <div className="bob loop">
            <Mascot slug={project.slug} />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/basic/BasicVignette.tsx`:

```tsx
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import type { CompactProject } from "@/content/types";
import { place } from "../grid";
import { Layer, Stage } from "../Stage";

// One grid at every width: vignettes are always narrow, so they scale instead of switching grids.
const GRID = { dw: 400, dh: 260, mdw: 400, mdh: 260 };

/** Interim vignette scene (spec clarification 15). Phase 7 replaces each with its designed scene. */
export function BasicVignette({ project }: { project: CompactProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="compact" grid={GRID} label={shot ? undefined : project.illustrationLabel} className="basic">
      <Layer depth="bg">
        <svg className="pos cloud loop" style={place({ x: 24, y: 24, w: 90 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={place({ x: 40, y: 30, w: 300 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 560px, 90vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        <div className="pos" data-part="mascot" style={shot ? place({ x: 300, y: 160, w: 84 }) : place({ x: 140, y: 60, w: 120 })}>
          <div className="bob loop">
            <Mascot slug={project.slug} />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/basic/scene.css`:

```css
/* Shared by every basic (interim) scene; replaced scene by scene in Phases 3, 5, 6 and 7. */
.stage.basic { background: rgb(255 255 255 / 0.55); }
```

Create `src/scenes/index.ts`:

```ts
import type { ComponentType } from "react";
import type { CompactProject, CompactSlug, FullProject, FullSlug } from "@/content/types";
import { BasicVignette } from "./basic/BasicVignette";
import { BasicWorld } from "./basic/BasicWorld";

export type FullScene = ComponentType<{ project: FullProject }>;
export type CompactScene = ComponentType<{ project: CompactProject }>;

/** One scene per project: a missing entry fails the type check (spec §5).
 *  Phases 3, 5, 6 and 7 swap each basic scene for the designed one. */
export const fullScenes: Record<FullSlug, FullScene> = {
  pos: BasicWorld,
  "time-log": BasicWorld,
  "service-areas": BasicWorld,
  katiwala: BasicWorld,
  stockroom: BasicWorld,
  "agent-island": BasicWorld,
};

export const compactScenes: Record<CompactSlug, CompactScene> = {
  "everyday-rockstar": BasicVignette,
  lipad: BasicVignette,
  keyclick: BasicVignette,
  med42: BasicVignette,
  pesowise: BasicVignette,
};
```

- [ ] **Step 6: Stage and device styles**

Create `src/components/stage.css`:

```css
/* Stage system (spec §8). Objects sit on a design grid; --u is one design px of the active grid. */
.stage-c { container: stage / inline-size; }
.stage {
  position: relative;
  overflow: clip; /* never hidden: that would capture the layers' view() timelines */
  border-radius: var(--radius-lg);
  aspect-ratio: var(--dw) / var(--dh);
  --u: calc(100cqw / var(--dw));
}
.layer, .mouse { position: absolute; inset: 0; }
.layer { will-change: transform; }
.layer-fg { pointer-events: none; }
[data-interactive] { pointer-events: auto; cursor: pointer; }
.pos { position: absolute; left: calc(var(--x) * var(--u)); top: calc(var(--y) * var(--u)); width: calc(var(--w) * var(--u)); }
.pos > svg, .pos > img, .bob > svg { display: block; width: 100%; height: auto; }
.g-m { display: none; }

/* The mobile grid follows the stage's own width, not the viewport (spec §8, clarification 1). */
@container stage (width < 760px) {
  .stage { aspect-ratio: var(--mdw) / var(--mdh); --u: calc(100cqw / var(--mdw)); border-radius: 24px; }
  .stage .pos {
    left: calc(var(--mx, var(--x)) * var(--u));
    top: calc(var(--my, var(--y)) * var(--u));
    width: calc(var(--mw, var(--w)) * var(--u));
  }
  .stage .g-d { display: none; }
  .stage .g-m { display: block; }
}

@media (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  .mouse { will-change: transform; }
}

/* Off-screen the engine adds .paused. Only time-based loops pause: pausing a scroll-driven animation
   would desync it from the scroll position (spec §11 step 4). */
[data-scene].paused .loop { animation-play-state: paused !important; }
/* Off-screen stages also give their compositor layers back: fewer layers to layerize on every frame. */
[data-scene].paused .layer, [data-scene].paused .mouse { will-change: auto; }

@keyframes bob {
  0% { transform: translateY(0) rotate(0deg); animation-timing-function: ease-in-out; }
  25% { transform: translateY(var(--by, -8px)) rotate(var(--br, 3deg)); animation-timing-function: ease-in-out; }
  50% { transform: translateY(0) rotate(0deg); animation-timing-function: ease-in-out; }
  75% { transform: translateY(var(--by, -8px)) rotate(var(--br, 3deg)); animation-timing-function: ease-in-out; }
  100% { transform: translateY(0) rotate(0deg); }
}
@keyframes drift { to { transform: translateX(16px); } }

@media (prefers-reduced-motion: no-preference) {
  /* Shared loops start under .live, after the entrance has shown their elements. Two bob cycles per
     iteration: every iteration boundary wakes the main thread. */
  .live .bob.loop { animation: bob calc(var(--bd, 1.7s) * 4) linear var(--bdl, 0s) infinite; }
  .live .cloud.loop { animation: drift 9s ease-in-out infinite alternate; }
  .live .cloud.loop + .cloud.loop { animation-duration: 11s; animation-direction: alternate-reverse; }

  /* Parallax on native scroll. Where scroll timelines are unsupported, layers simply sit still. */
  @supports (animation-timeline: view()) {
    .stage { --pb: min(80px, 9vh); --pf: min(32px, 3.5vh); }
    .stage > .layer-bg { animation: par-bg linear both; animation-timeline: view(); animation-range: cover; }
    .stage > .layer-fg { animation: par-fg linear both; animation-timeline: view(); animation-range: cover; }
    @container stage (width < 760px) {
      .stage { --pb: min(40px, 5vh); --pf: 0px; }
    }
  }
}
@keyframes par-bg { from { transform: translateY(calc(var(--pb) * -1)); } to { transform: translateY(var(--pb)); } }
@keyframes par-fg { from { transform: translateY(var(--pf)); } to { transform: translateY(calc(var(--pf) * -1)); } }
```

Create `src/components/device.css`:

```css
/* Device frames scale with the stage's design unit (--u); outside a stage they fall back to 1px. */
.device { position: relative; }
.device-screen {
  position: relative; background: var(--color-ink);
  padding: calc(10 * var(--u, 1px)); border-radius: calc(30 * var(--u, 1px));
}
.device-shot { display: block; width: 100%; height: auto; border-radius: calc(18 * var(--u, 1px)); background: #F4F0E6; }
.device-bar { display: flex; align-items: center; gap: calc(7 * var(--u, 1px)); height: calc(30 * var(--u, 1px)); padding-left: calc(6 * var(--u, 1px)); margin-top: calc(-4 * var(--u, 1px)); }
.device-bar i { width: calc(11 * var(--u, 1px)); aspect-ratio: 1; border-radius: 50%; background: var(--color-paper); }
.device-phone .device-screen { padding: calc(12 * var(--u, 1px)); border-radius: calc(44 * var(--u, 1px)); }
.device-phone .device-shot { border-radius: calc(32 * var(--u, 1px)); }
.device-base {
  position: relative; display: block; width: 110%; margin-left: -5%; height: calc(18 * var(--u, 1px));
  background: #3A3442; border-radius: 0 0 calc(16 * var(--u, 1px)) calc(16 * var(--u, 1px));
}
.device-base::after {
  content: ""; position: absolute; left: 41%; width: 18%; top: 0; height: 45%;
  background: #2A2530; border-radius: 0 0 calc(8 * var(--u, 1px)) calc(8 * var(--u, 1px));
}
```

In `src/app/globals.css`, add after the `sections.css` import:

```css
@import "../components/stage.css" layer(components);
@import "../components/device.css" layer(components);
@import "../scenes/basic/scene.css" layer(scenes);
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass, including 7 checks × 11 scenes and the 2 stylesheet checks in `tests/scenes.test.tsx`.

- [ ] **Step 8: Commit and open the PR**

```bash
git add src/scenes src/components src/app/globals.css tests/scenes.test.tsx
git commit -m "Add the stage system, mascots, device frames and basic scenes for all 11 projects"
git push -u origin rd/1.4-stage-system
gh pr create --base redesign --title "1.4 Stage system and basic scenes" --body "Task 1.4. Container-query design grid (760 px switch, clarification 1), Stage/Layer, 11 mascots, DeviceFrame, basic world and vignette scenes, typed scene registries, scene markup tests (forbidden elements, DOM budgets, aria-hidden/inert, names)."
```

Review and merge per the protocol. (The scenes are not on the page yet; Task 1.6's lab and Task 3.1's worlds show them.)

### Task 1.5: The motion engine

**Files:**
- Create: `src/motion/types.ts`, `src/motion/frame-gate.ts`, `src/motion/pointer.ts`, `src/motion/engine.ts`, `src/motion/registry.ts`, `src/motion/MotionRuntime.tsx`, `src/scenes/basic/choreo.ts`
- Modify: `src/app/page.tsx` (mount the runtime)
- Test: `tests/helpers.ts`, `tests/frame-gate.test.ts`, `tests/engine.test.ts`, `tests/choreo-contract.test.tsx`

**Interfaces:**
- Consumes: `STAGE_GRID_SWITCH` (Task 1.4); `fullProjects` (Task 1.2); `fullScenes` (Task 1.4); `FullSlug` (Task 1.1).
- Produces:
  - `src/motion/types.ts`: `type Gsap = typeof gsap`; `type SceneEnv = { gsap: Gsap; mobile: boolean; pointer: boolean; skipEntrance: boolean }`; `type SceneHandle = { name: string; enter(): void; cleanup(): void }`; `type Choreo = (root: HTMLElement, env: SceneEnv) => SceneHandle`; `type ChoreoLoader = () => Promise<{ default: Choreo }>`.
  - **The choreography contract** every `choreo.ts` follows (spec §11): calling the default export *prepares*: it applies the start state only when `!env.skipEntrance`, wires interactions and returns the handle. `handle.name` is the literal `"choreo:<folder>"`. `enter()` plays the entrance (or nothing when skipping) and then adds `.live` to the root. `cleanup()` kills its tweens, removes its listeners and any elements it appended, removes custom properties it set on the root, clears the inline `transform`, `opacity` and `visibility` it set (never `clearProps: "all"`, which would wipe the server's placement variables), and removes `.live`.
  - `startMotion(deps: EngineDeps): () => void` with `EngineDeps = { doc: Document; win: Window & typeof globalThis; registry: Readonly<Partial<Record<string, ChoreoLoader>>>; loadGsap: () => Promise<{ gsap: Gsap }> }`.
  - `startPointer(win, stages, isActive): () => void`; `createFrameGate(options?)` with `.record(frameMs): "ok" | "off"`.
  - `registry: Record<FullSlug, ChoreoLoader>` (literal `import()` per world; all `@/scenes/basic/choreo` for now).
  - `<MotionRuntime />` (default export, `"use client"`, renders nothing).
  - Test helpers in `tests/helpers.ts`: `FakeIO`, `FakeRO`, `fakeWindow(opts)`, `mountStages(...slugs)`, `setWidth(el, px)`, `flush()`, `finishAllTweens(gsap)`.

- [ ] **Step 1: Write the test helpers**

Create `tests/helpers.ts`:

```ts
import type { gsap as Gsap } from "gsap";

export class FakeIO {
  static all: FakeIO[] = [];
  readonly targets = new Set<Element>();
  disconnected = false;
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    FakeIO.all.push(this);
  }
  observe(target: Element) { this.targets.add(target); }
  unobserve(target: Element) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); this.disconnected = true; }
  takeRecords() { return []; }
  /** Deliver one entry, as the browser would, if the target is still observed. */
  fire(target: Element, isIntersecting: boolean) {
    if (!this.targets.has(target)) return;
    this.callback([{ target, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

export class FakeRO {
  static all: FakeRO[] = [];
  readonly targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) { FakeRO.all.push(this); }
  observe(target: Element) { this.targets.add(target); }
  unobserve(target: Element) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
  fire() { this.callback([], this as unknown as ResizeObserver); }
}

export type TestWindow = Window & typeof globalThis & {
  emit(type: string, init?: Record<string, number>): void;
  runFrames(count: number, stepMs?: number): void;
  listenerCount(type: string): number;
};

/** A window stand-in with fake observers, synchronous timers and manual animation frames. */
export function fakeWindow(opts: { reduced?: boolean; pointer?: boolean } = {}): TestWindow {
  FakeIO.all = [];
  FakeRO.all = [];
  const listeners = new Map<string, Set<EventListener>>();
  let frames: FrameRequestCallback[] = [];
  let now = 1000;
  const win = {
    matchMedia: (query: string) => ({
      matches: query.includes("reduce") ? Boolean(opts.reduced) : query.includes("pointer: fine") ? Boolean(opts.pointer) : false,
    }),
    IntersectionObserver: FakeIO,
    ResizeObserver: FakeRO,
    setTimeout: (fn: () => void) => { fn(); return 1; },
    clearTimeout: () => {},
    requestAnimationFrame: (fn: FrameRequestCallback) => { frames.push(fn); return frames.length; },
    cancelAnimationFrame: () => {},
    innerWidth: 1440,
    innerHeight: 900,
    addEventListener: (type: string, fn: EventListener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(fn);
    },
    removeEventListener: (type: string, fn: EventListener) => { listeners.get(type)?.delete(fn); },
    emit: (type: string, init: Record<string, number> = {}) => {
      for (const fn of listeners.get(type) ?? []) fn(init as unknown as Event);
    },
    runFrames: (count: number, stepMs = 16) => {
      for (let i = 0; i < count; i++) {
        const due = frames;
        frames = [];
        now += stepMs;
        for (const fn of due) fn(now);
      }
    },
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
  };
  return win as unknown as TestWindow;
}

/** Stages as the server renders them, plus the nav popover with one link. */
export function mountStages(...slugs: string[]): HTMLElement[] {
  document.body.innerHTML =
    slugs
      .map(
        (slug) =>
          `<div class="stage-c"><div class="stage" data-scene="${slug}" data-tier="full">` +
          `<div class="layer layer-bg"><div class="mouse" data-k="0.02"></div></div></div></div>`,
      )
      .join("") + `<nav id="nav-menu" popover="auto"><a href="#about">About</a></nav>`;
  const stages = slugs.map((slug) => document.querySelector<HTMLElement>(`[data-scene="${slug}"]`) as HTMLElement);
  for (const stage of stages) setWidth(stage, 820);
  return stages;
}

export function setWidth(el: HTMLElement, width: number) {
  el.getBoundingClientRect = () => ({ width, height: 600, top: 0, left: 0, right: width, bottom: 600, x: 0, y: 0, toJSON() {} }) as DOMRect;
}

export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Jump every running GSAP animation to its end, firing callbacks; repeats for animations those callbacks start. */
export function finishAllTweens(gsap: typeof Gsap) {
  for (let round = 0; round < 20; round++) {
    const running = gsap.globalTimeline.getChildren(false, true, true).filter((a) => a.progress() < 1);
    if (running.length === 0) return;
    for (const animation of running) animation.progress(1);
  }
}
```

- [ ] **Step 2: Write the failing frame-gate test**

Create `tests/frame-gate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createFrameGate } from "@/motion/frame-gate";

const run = (frames: number[]) => {
  const gate = createFrameGate();
  return frames.map((ms) => gate.record(ms));
};

describe("createFrameGate", () => {
  it("stays on while frames are fast", () => {
    expect(run(Array(80).fill(16)).every((r) => r === "ok")).toBe(true);
  });

  it("switches off when more than 25% of a 40-frame window is slow", () => {
    const result = run([...Array(29).fill(16), ...Array(11).fill(30)]);
    expect(result.at(-1)).toBe("off");
  });

  it("stays on at exactly 25% slow", () => {
    const result = run([...Array(30).fill(16), ...Array(10).fill(30)]);
    expect(result.at(-1)).toBe("ok");
  });

  it("judges each window on its own", () => {
    const result = run([...Array(30).fill(16), ...Array(10).fill(30), ...Array(40).fill(16)]);
    expect(result.every((r) => r === "ok")).toBe(true);
  });
});
```

- [ ] **Step 3: Write the failing engine test**

Create `tests/engine.test.ts`:

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { startMotion } from "@/motion/engine";
import type { Choreo, ChoreoLoader, SceneEnv } from "@/motion/types";
import { FakeIO, FakeRO, fakeWindow, flush, mountStages, setWidth } from "./helpers";

const gsapStub = { gsap: {} as SceneEnv["gsap"] };
const NEAR = "50% 0px 50% 0px";
const ENTER = "0px 0px -15% 0px";
const observer = (rootMargin?: string) => FakeIO.all.find((o) => o.options.rootMargin === rootMargin) as FakeIO;

function recorder() {
  const envs: SceneEnv[] = [];
  const handles: { enter: Mock; cleanup: Mock }[] = [];
  const choreo: Choreo = (root, env) => {
    envs.push(env);
    const handle = {
      name: "choreo:test",
      enter: vi.fn(() => root.classList.add("live")),
      cleanup: vi.fn(() => root.classList.remove("live")),
    };
    handles.push(handle);
    return handle;
  };
  const loader = vi.fn<ChoreoLoader>(async () => ({ default: choreo }));
  return { envs, handles, loader };
}

function start(opts: { reduced?: boolean; pointer?: boolean } = {}, registry: Record<string, ChoreoLoader> = {}) {
  const win = fakeWindow(opts);
  const loadGsap = vi.fn(async () => gsapStub);
  const stop = startMotion({ doc: document, win, registry, loadGsap });
  return { win, loadGsap, stop };
}

describe("startMotion", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("closes the nav popover after a link tap, even with reduced motion", () => {
    mountStages("pos");
    const menu = document.getElementById("nav-menu") as HTMLElement;
    menu.hidePopover = vi.fn();
    const { stop } = start({ reduced: true });
    document.querySelector<HTMLAnchorElement>("#nav-menu a")?.click();
    expect(menu.hidePopover).toHaveBeenCalledOnce();
    expect(FakeIO.all).toHaveLength(0);
    stop();
  });

  it("loads only registered scenes, once, when they come within half a viewport", async () => {
    const [pos, hero] = mountStages("pos", "hero");
    const r = recorder();
    const { loadGsap } = start({}, { pos: r.loader });
    observer(NEAR).fire(hero, true);
    observer(NEAR).fire(pos, true);
    observer(NEAR).fire(pos, true);
    await flush();
    expect(r.loader).toHaveBeenCalledOnce();
    expect(loadGsap).toHaveBeenCalledOnce();
    expect(r.envs).toHaveLength(1);
  });

  it("enters a world prepared off-screen when it scrolls into view", async () => {
    const [pos] = mountStages("pos");
    const r = recorder();
    start({}, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    expect(r.envs[0].skipEntrance).toBe(false);
    expect(r.handles[0].enter).not.toHaveBeenCalled();
    observer(ENTER).fire(pos, true);
    observer(ENTER).fire(pos, true);
    expect(r.handles[0].enter).toHaveBeenCalledOnce();
    expect(pos.classList.contains("live")).toBe(true);
  });

  it("skips the entrance for a stage visible when its module arrives", async () => {
    const [pos] = mountStages("pos");
    const r = recorder();
    start({}, { pos: r.loader });
    observer(undefined).fire(pos, true);
    observer(NEAR).fire(pos, true);
    await flush();
    expect(r.envs[0].skipEntrance).toBe(true);
    expect(r.handles[0].enter).toHaveBeenCalledOnce();
  });

  it("tells the choreography which grid and pointer it is on", async () => {
    const [pos] = mountStages("pos");
    setWidth(pos, 500);
    const r = recorder();
    start({ pointer: true }, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    expect(r.envs[0].mobile).toBe(true);
    expect(r.envs[0].pointer).toBe(true);
  });

  it("pauses loops off-screen and resumes them on screen, for every stage", () => {
    const [pos, hero] = mountStages("pos", "hero");
    start({}, {});
    observer(undefined).fire(pos, false);
    observer(undefined).fire(hero, false);
    expect(pos.classList.contains("paused")).toBe(true);
    expect(hero.classList.contains("paused")).toBe(true);
    observer(undefined).fire(pos, true);
    expect(pos.classList.contains("paused")).toBe(false);
  });

  it("leaves the end state alone when a module fails to load", async () => {
    const [pos] = mountStages("pos");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = vi.fn<ChoreoLoader>(async () => {
      throw new Error("chunk 404");
    });
    start({}, { pos: failing });
    observer(NEAR).fire(pos, true);
    await flush();
    observer(ENTER).fire(pos, true);
    expect(pos.classList.contains("live")).toBe(false);
    expect(pos.getAttribute("style")).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("re-prepares a stage whose width changes", async () => {
    const [pos] = mountStages("pos");
    const r = recorder();
    start({}, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    observer(ENTER).fire(pos, true);
    FakeRO.all[0].fire(); // same width: nothing happens
    expect(r.envs).toHaveLength(1);
    setWidth(pos, 500);
    FakeRO.all[0].fire();
    expect(r.handles[0].cleanup).toHaveBeenCalledOnce();
    expect(r.envs).toHaveLength(2);
    expect(r.envs[1]).toMatchObject({ mobile: true, skipEntrance: true });
    expect(r.handles[1].enter).toHaveBeenCalledOnce();
    expect(pos.classList.contains("live")).toBe(true);
  });

  it("never prepares after stop, even if the module arrives later", async () => {
    const [pos] = mountStages("pos");
    const r = recorder();
    let release: () => void = () => {};
    const slow = vi.fn<ChoreoLoader>(() => new Promise((resolve) => { release = () => resolve(r.loader()); }));
    const { stop } = start({}, { pos: slow });
    observer(NEAR).fire(pos, true);
    stop();
    release();
    await flush();
    await flush();
    expect(r.envs).toHaveLength(0);
  });

  it("stops cleanly and starts again", async () => {
    const [pos] = mountStages("pos");
    const menu = document.getElementById("nav-menu") as HTMLElement;
    menu.hidePopover = vi.fn();
    const r = recorder();
    const first = start({}, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    observer(ENTER).fire(pos, true);
    observer(undefined).fire(pos, false);
    first.stop();
    expect(r.handles[0].cleanup).toHaveBeenCalledOnce();
    expect([...pos.classList]).toEqual(["stage"]);
    expect(FakeIO.all.every((o) => o.disconnected)).toBe(true);
    document.querySelector<HTMLAnchorElement>("#nav-menu a")?.click();
    expect(menu.hidePopover).not.toHaveBeenCalled();

    const second = start({}, { pos: r.loader });
    observer(NEAR).fire(pos, true);
    await flush();
    observer(ENTER).fire(pos, true);
    expect(r.handles[1].enter).toHaveBeenCalledOnce();
    expect(pos.classList.contains("live")).toBe(true);
    second.stop();
  });

  it("moves only visible desktop-grid stages with the pointer", () => {
    const [pos, time] = mountStages("pos", "time-log");
    const { win, stop } = start({ pointer: true }, {});
    observer(undefined).fire(pos, true);
    observer(undefined).fire(time, false);
    win.emit("pointermove", { clientX: 1440, clientY: 900 });
    win.runFrames(5);
    const moved = (stage: HTMLElement) => (stage.querySelector(".mouse") as HTMLElement).style.transform;
    expect(moved(pos)).toMatch(/^translate3d\(/);
    expect(moved(time)).toBe("");
    stop();
    expect(moved(pos)).toBe("");
    expect(win.listenerCount("pointermove")).toBe(0);
  });
});
```

- [ ] **Step 4: Run both and watch them fail**

Run: `npx vitest run tests/frame-gate.test.ts tests/engine.test.ts`
Expected: FAIL, `Failed to resolve import "@/motion/frame-gate"` and `"@/motion/engine"`.

- [ ] **Step 5: Implement types, frame gate and pointer parallax**

Create `src/motion/types.ts`:

```ts
import type { gsap } from "gsap";

export type Gsap = typeof gsap;

export type SceneEnv = {
  gsap: Gsap;
  mobile: boolean; // the stage is on its mobile grid (width < STAGE_GRID_SWITCH)
  pointer: boolean; // (hover: hover) and (pointer: fine) and (min-width: 1024px)
  skipEntrance: boolean; // the scene was already visible when its module arrived
};

/** `name` is the literal "choreo:<folder>"; tools/perf/chunks.mjs finds each chunk by it. */
export type SceneHandle = { name: string; enter(): void; cleanup(): void };

/** Calling a choreography prepares it (spec §11): start state only when !skipEntrance, interactions wired. */
export type Choreo = (root: HTMLElement, env: SceneEnv) => SceneHandle;

export type ChoreoLoader = () => Promise<{ default: Choreo }>;
```

Create `src/motion/frame-gate.ts`:

```ts
/** Counts slow frames in fixed windows. Pointer parallax switches itself off for the session when more
 *  than `maxSlowRatio` of a window's frames take longer than `slowMs` (spec §11 step 5). */
export function createFrameGate({ windowSize = 40, slowMs = 24, maxSlowRatio = 0.25 } = {}) {
  let seen = 0;
  let slow = 0;
  return {
    record(frameMs: number): "ok" | "off" {
      seen++;
      if (frameMs > slowMs) slow++;
      if (seen < windowSize) return "ok";
      const off = slow / seen > maxSlowRatio;
      seen = 0;
      slow = 0;
      return off ? "off" : "ok";
    },
  };
}
```

Create `src/motion/pointer.ts`:

```ts
import { createFrameGate } from "./frame-gate";

type Mover = { el: HTMLElement; stage: HTMLElement; k: number; x: number; y: number };

const LIMIT = 18; // px
const EASE = 0.12;

/** Desktop pointer parallax: one pointermove listener; each animation frame writes `transform` to the
 *  `.mouse[data-k]` wrappers of active stages. Write-only: no layout reads per frame (the viewport centre
 *  is cached and refreshed on resize). Switches itself off for the session when frames run long. */
export function startPointer(win: Window, stages: HTMLElement[], isActive: (stage: HTMLElement) => boolean): () => void {
  const movers: Mover[] = stages.flatMap((stage) =>
    Array.from(stage.querySelectorAll<HTMLElement>(".mouse[data-k]"), (el) => ({ el, stage, k: Number(el.dataset.k), x: 0, y: 0 })),
  );
  const gate = createFrameGate();
  const clamp = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v));
  let cx = win.innerWidth / 2;
  let cy = win.innerHeight / 2;
  let px = cx;
  let py = cy;
  let raf = 0;
  let last = 0;
  let off = false;

  const reset = () => {
    for (const m of movers) {
      m.el.style.transform = "";
      m.x = 0;
      m.y = 0;
    }
  };

  const step = (now: number) => {
    raf = 0;
    if (off) return;
    if (last && now - last < 100 && gate.record(now - last) === "off") {
      off = true;
      reset();
      return;
    }
    last = now;
    const dx = px - cx;
    const dy = py - cy;
    let moving = false;
    for (const m of movers) {
      if (!isActive(m.stage)) continue;
      const tx = clamp(dx * m.k);
      const ty = clamp(dy * m.k);
      m.x += (tx - m.x) * EASE;
      m.y += (ty - m.y) * EASE;
      if (Math.abs(tx - m.x) > 0.05 || Math.abs(ty - m.y) > 0.05) moving = true;
      else {
        m.x = tx;
        m.y = ty;
      }
      m.el.style.transform = `translate3d(${m.x.toFixed(2)}px,${m.y.toFixed(2)}px,0)`;
    }
    if (moving) raf = win.requestAnimationFrame(step);
    else last = 0;
  };

  const onMove = (event: Event) => {
    if (off) return;
    px = (event as PointerEvent).clientX;
    py = (event as PointerEvent).clientY;
    if (!raf) raf = win.requestAnimationFrame(step);
  };
  const onResize = () => {
    cx = win.innerWidth / 2;
    cy = win.innerHeight / 2;
  };

  win.addEventListener("pointermove", onMove, { passive: true });
  win.addEventListener("resize", onResize);
  return () => {
    win.removeEventListener("pointermove", onMove);
    win.removeEventListener("resize", onResize);
    if (raf) win.cancelAnimationFrame(raf);
    reset();
  };
}
```

- [ ] **Step 6: Implement the engine**

Create `src/motion/engine.ts`:

```ts
import { STAGE_GRID_SWITCH } from "@/scenes/grid";
import { startPointer } from "./pointer";
import type { Choreo, ChoreoLoader, Gsap, SceneHandle } from "./types";

export type EngineDeps = {
  doc: Document;
  win: Window & typeof globalThis;
  registry: Readonly<Partial<Record<string, ChoreoLoader>>>;
  loadGsap: () => Promise<{ gsap: Gsap }>;
};

type Rec = {
  stage: HTMLElement;
  loader: ChoreoLoader;
  loading: boolean;
  choreo?: Choreo;
  handle?: SceneHandle;
  entered: boolean;
  width: number;
};

const NEAR = "50% 0px 50% 0px"; // start loading within half a viewport (spec §11 step 2)
const ENTER = "0px 0px -15% 0px"; // play the entrance once the stage is 15% of a viewport into view
const STATE_CLASSES = ["live", "paused", "ready"];

/** Starts the page's motion and returns a stop function that undoes everything (spec §11). */
export function startMotion({ doc, win, registry, loadGsap }: EngineDeps): () => void {
  const teardown: Array<() => void> = [];
  const stop = () => {
    for (const fn of teardown.splice(0).reverse()) fn();
  };

  // Mobile menu: close the popover after a link inside it is tapped. Installed even with reduced motion.
  const onClick = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]");
    const menu = link?.closest<HTMLElement>("[popover]");
    if (!menu || typeof menu.hidePopover !== "function") return;
    try {
      menu.hidePopover();
    } catch {
      // already closed
    }
  };
  doc.addEventListener("click", onClick);
  teardown.push(() => doc.removeEventListener("click", onClick));

  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) return stop;

  const stages = Array.from(doc.querySelectorAll<HTMLElement>("[data-scene]"));
  const visible = new Set<HTMLElement>();
  const onMobileGrid = new Map<HTMLElement, boolean>();
  const recs = new Map<HTMLElement, Rec>();
  const pointer = win.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)").matches;
  const widthOf = (el: HTMLElement) => el.getBoundingClientRect().width;
  let gsap: Gsap | undefined;
  let disposed = false;

  for (const stage of stages) {
    onMobileGrid.set(stage, widthOf(stage) < STAGE_GRID_SWITCH);
    const loader = registry[stage.dataset.scene ?? ""];
    if (loader) recs.set(stage, { stage, loader, loading: false, entered: false, width: 0 });
  }

  const prepare = (rec: Rec) => {
    if (!rec.choreo || !gsap) return;
    const skipEntrance = rec.entered || visible.has(rec.stage);
    rec.width = widthOf(rec.stage);
    rec.handle = rec.choreo(rec.stage, { gsap, mobile: rec.width < STAGE_GRID_SWITCH, pointer, skipEntrance });
    if (skipEntrance) {
      rec.entered = true;
      rec.handle.enter();
    }
  };

  // Visible at all: drives .paused for every stage (worlds, vignettes, hero, contact strip).
  const visibility = new win.IntersectionObserver((entries) => {
    for (const entry of entries) {
      const stage = entry.target as HTMLElement;
      if (entry.isIntersecting) visible.add(stage);
      else visible.delete(stage);
      stage.classList.toggle("paused", !entry.isIntersecting);
    }
  });

  // Near: load GSAP + the world's choreography, then prepare it.
  const near = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const rec = recs.get(entry.target as HTMLElement);
        if (!entry.isIntersecting || !rec || rec.loading) continue;
        rec.loading = true;
        near.unobserve(rec.stage);
        Promise.all([loadGsap(), rec.loader()]).then(
          ([g, mod]) => {
            if (disposed) return;
            gsap = g.gsap;
            rec.choreo = mod.default;
            prepare(rec);
          },
          (error: unknown) => {
            console.warn(`[motion] ${rec.stage.dataset.scene}: choreography failed to load, keeping the static scene`, error);
          },
        );
      }
    },
    { rootMargin: NEAR },
  );

  // In view: play the entrance of a prepared world.
  const enter = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const rec = recs.get(entry.target as HTMLElement);
        if (!entry.isIntersecting || !rec?.handle || rec.entered) continue;
        rec.entered = true;
        rec.handle.enter();
      }
    },
    { rootMargin: ENTER },
  );

  for (const stage of stages) {
    visibility.observe(stage);
    if (recs.has(stage)) {
      near.observe(stage);
      enter.observe(stage);
    }
  }

  // Width changes (rotation, resize) can cross the grid switch, and choreographies measure in pixels:
  // clean up and prepare again on the new size. A world already entered keeps its end state.
  let timer = 0;
  const resize = new win.ResizeObserver(() => {
    win.clearTimeout(timer);
    timer = win.setTimeout(() => {
      for (const stage of stages) onMobileGrid.set(stage, widthOf(stage) < STAGE_GRID_SWITCH);
      for (const rec of recs.values()) {
        if (!rec.handle || Math.abs(widthOf(rec.stage) - rec.width) < 1) continue;
        rec.handle.cleanup();
        rec.handle = undefined;
        prepare(rec);
      }
    }, 200);
  });
  for (const stage of stages) resize.observe(stage);

  if (pointer) teardown.push(startPointer(win, stages, (stage) => visible.has(stage) && !onMobileGrid.get(stage)));

  teardown.push(() => {
    disposed = true;
    visibility.disconnect();
    near.disconnect();
    enter.disconnect();
    resize.disconnect();
    win.clearTimeout(timer);
    for (const rec of recs.values()) rec.handle?.cleanup();
    for (const stage of stages) stage.classList.remove(...STATE_CLASSES);
  });
  return stop;
}
```

- [ ] **Step 7: Run the engine tests**

Run: `npx vitest run tests/frame-gate.test.ts tests/engine.test.ts`
Expected: `4 passed` and `11 passed`.

- [ ] **Step 8: Write the failing choreography contract test**

Create `tests/choreo-contract.test.tsx`:

```tsx
// @vitest-environment jsdom
import { gsap } from "gsap";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { registry } from "@/motion/registry";
import type { SceneEnv } from "@/motion/types";
import { fullScenes } from "@/scenes";
import { finishAllTweens, setWidth } from "./helpers";

/** What a choreography may change: classes, inline transform/opacity/visibility, appended elements, leaf
 *  text and custom properties on the root. Cleanup must restore all of it. */
function snapshot(root: HTMLElement) {
  return [root, ...root.querySelectorAll<HTMLElement>("*")].map((el) => ({
    tag: el.tagName,
    cls: el.getAttribute("class") ?? "",
    transform: el.style?.transform ?? "",
    opacity: el.style?.opacity ?? "",
    visibility: el.style?.visibility ?? "",
    vars: el === root ? Array.from(root.style).filter((p) => p.startsWith("--")).sort().join(",") : "",
    text: el.childElementCount ? "" : (el.textContent ?? ""),
  }));
}

describe.each(fullProjects)("choreography for $slug", (project) => {
  const Scene = fullScenes[project.slug];
  const markup = renderToStaticMarkup(<Scene project={project} />);
  const mount = (mobile: boolean) => {
    document.body.innerHTML = markup;
    const root = document.querySelector<HTMLElement>(`[data-scene="${project.slug}"]`) as HTMLElement;
    setWidth(root, mobile ? 358 : 820);
    return root;
  };
  const env = (skipEntrance: boolean, mobile: boolean): SceneEnv => ({ gsap, mobile, pointer: false, skipEntrance });

  for (const mobile of [false, true]) {
    const grid = mobile ? "mobile" : "desktop";

    it(`${grid}: names its handle choreo:<folder>`, async () => {
      const choreo = (await registry[project.slug]()).default;
      const handle = choreo(mount(mobile), env(true, mobile));
      expect(handle.name).toMatch(/^choreo:[a-z0-9-]+$/);
      handle.cleanup();
    });

    it(`${grid}: changes nothing when skipping the entrance, and enter() adds .live`, async () => {
      const root = mount(mobile);
      const before = snapshot(root);
      const handle = (await registry[project.slug]()).default(root, env(true, mobile));
      expect(snapshot(root)).toEqual(before);
      handle.enter();
      expect(root.classList.contains("live")).toBe(true);
      handle.cleanup();
      expect(snapshot(root)).toEqual(before);
    });

    it(`${grid}: plays the entrance to .live, and cleanup restores the server markup`, async () => {
      const root = mount(mobile);
      const before = snapshot(root);
      const handle = (await registry[project.slug]()).default(root, env(false, mobile));
      handle.enter();
      finishAllTweens(gsap);
      expect(root.classList.contains("live")).toBe(true);
      handle.cleanup();
      expect(snapshot(root)).toEqual(before);
    });
  }
});
```

- [ ] **Step 9: Run it and watch it fail**

Run: `npx vitest run tests/choreo-contract.test.tsx`
Expected: FAIL, `Failed to resolve import "@/motion/registry"`.

- [ ] **Step 10: The basic choreography, the registry and the runtime**

Create `src/scenes/basic/choreo.ts`:

```ts
import type { Choreo } from "@/motion/types";

/** Interim entrance for worlds still on the basic scene: the mascot pops up, then the loops start. */
const choreo: Choreo = (root, { gsap, skipEntrance }) => {
  const mascot = root.querySelector<HTMLElement>('[data-part="mascot"]');
  if (mascot && !skipEntrance) gsap.set(mascot, { y: 48, scale: 0.6 });

  return {
    name: "choreo:basic",
    enter() {
      if (!mascot || skipEntrance) {
        root.classList.add("live");
        return;
      }
      gsap.to(mascot, { y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)", onComplete: () => root.classList.add("live") });
    },
    cleanup() {
      if (mascot) {
        gsap.killTweensOf(mascot);
        gsap.set(mascot, { clearProps: "transform" });
      }
      root.classList.remove("live");
    },
  };
};

export default choreo;
```

Create `src/motion/registry.ts`:

```ts
import type { FullSlug } from "@/content/types";
import type { ChoreoLoader } from "./types";

/** One literal import() per world, so each choreography is its own small chunk (spec §6).
 *  Worlds still on the basic scene share the basic choreography until their phase replaces it. */
export const registry: Record<FullSlug, ChoreoLoader> = {
  pos: () => import("@/scenes/basic/choreo"),
  "time-log": () => import("@/scenes/basic/choreo"),
  "service-areas": () => import("@/scenes/basic/choreo"),
  katiwala: () => import("@/scenes/basic/choreo"),
  stockroom: () => import("@/scenes/basic/choreo"),
  "agent-island": () => import("@/scenes/basic/choreo"),
};
```

Create `src/motion/MotionRuntime.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { startMotion } from "./engine";
import { registry } from "./registry";

/** The only hand-written client component on the page (spec §6). Renders nothing; starts after hydration. */
export default function MotionRuntime() {
  useEffect(() => startMotion({ doc: document, win: window, registry, loadGsap: () => import("gsap") }), []);
  return null;
}
```

In `src/app/page.tsx`, add the import `import MotionRuntime from "@/motion/MotionRuntime";` and render `<MotionRuntime />` as the last child of the fragment, after `<Footer />`.

- [ ] **Step 11: Run everything**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass, including 36 choreography contract checks (6 worlds × 2 grids × 3).

- [ ] **Step 12: Check the chunk and the menu in the real build**

```bash
npm run build && node tools/perf/chunks.mjs
py -3.11 -I tools/perf/serve.py start
```

Expected: `ok   choreo:basic ... KB gz`, no `WARN` or `FAIL` line, and `PASS` (the chunk holds the basic choreography, not GSAP). Then in Chrome at 390 px (DevTools device mode) on `http://127.0.0.1:3000/`: open the menu, tap "About": the menu closes and About sits below the sticky bar. Press the menu button, then Escape: it closes. Then `py -3.11 -I tools/perf/serve.py stop`.

- [ ] **Step 13: Commit and open the PR**

```bash
git add src/motion src/scenes/basic/choreo.ts src/app/page.tsx tests
git commit -m "Add the motion engine, pointer parallax, the choreography registry and the runtime"
git push -u origin rd/1.5-motion-engine
gh pr create --base redesign --title "1.5 Motion engine" --body "Task 1.5. Framework-free engine (prepare off-screen, enter on view, pause off-screen, resize re-prepare, load-failure safe, stop/start clean), pointer parallax with the frame gate, registry with literal imports, MotionRuntime, choreography contract tests. Review Focus 1-5 pinned here."
```

Review and merge per the protocol.

### Task 1.6: The scene lab

**Files:**
- Create: `src/app/dev/scenes/[id]/page.tsx`, `src/components/lab.css`
- Modify: `src/app/globals.css` (one import)

**Interfaces:**
- Consumes: `fullProjects`, `compactProjects` (Task 1.2); `fullScenes`, `compactScenes` (Task 1.4); `<Sprite />` (Task 1.3); `<MotionRuntime />` (Task 1.5).
- Produces: `/dev/scenes/<slug>` (only when built with `SCENE_LAB=1`): one scene alone at three widths (820, 600, 358 px) on its tint, with the runtime running. `labIds()` is the list of ids; Task 3.2 adds `"hero"`.

- [ ] **Step 1: The lab page**

Create `src/app/dev/scenes/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sprite } from "@/components/Sprite";
import { compactProjects, fullProjects } from "@/content/projects";
import MotionRuntime from "@/motion/MotionRuntime";
import { compactScenes, fullScenes } from "@/scenes";
import { cssVars } from "@/scenes/grid";

// Fully static (spec §14): without SCENE_LAB=1 there are no params, so every path 404s and no function is made.
export const dynamicParams = false;
export const metadata: Metadata = { robots: { index: false, follow: false } };

const WIDTHS = [820, 600, 358];

function labIds(): string[] {
  return [...fullProjects, ...compactProjects].map((p) => p.slug);
}

export function generateStaticParams() {
  return process.env.SCENE_LAB === "1" ? labIds().map((id) => ({ id })) : [];
}

export default async function SceneLab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const full = fullProjects.find((p) => p.slug === id);
  const compact = compactProjects.find((p) => p.slug === id);
  if (!full && !compact) notFound();
  const render = () => {
    if (full) {
      const Scene = fullScenes[full.slug];
      return <Scene project={full} />;
    }
    const Scene = compactScenes[compact!.slug];
    return <Scene project={compact!} />;
  };
  return (
    <main className="lab" style={cssVars({ "--tint": `var(--color-tint-${id})` })}>
      <Sprite />
      {WIDTHS.map((w) => (
        <div key={w} className="lab-frame" style={{ width: w }}>
          {render()}
        </div>
      ))}
      <MotionRuntime />
    </main>
  );
}
```

Create `src/components/lab.css`:

```css
/* Scene lab only (/dev/scenes/<id>, built with SCENE_LAB=1). */
.lab { min-height: 100dvh; padding: 48px 24px; display: grid; justify-items: center; gap: 64px; background: var(--tint, var(--color-paper)); }
.lab-frame { max-width: 100%; }
```

In `src/app/globals.css`, add after the `device.css` import:

```css
@import "../components/lab.css" layer(components);
```

- [ ] **Step 2: Prove the lab exists only with SCENE_LAB=1**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/dev/scenes/pos
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/dev/scenes/nope
py -3.11 -I tools/perf/serve.py stop
npm run build
py -3.11 -I tools/perf/serve.py start
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/dev/scenes/pos
curl -s http://127.0.0.1:3000/sitemap.xml | grep -c dev || true
py -3.11 -I tools/perf/serve.py stop
```

Expected: `200`, `404`, then `404`. (The sitemap arrives in Task 2.2; until then the last line prints `0`.) Before the second build, open `http://127.0.0.1:3000/dev/scenes/pos` in Chrome during the first server run: three basic POS stages (820 wide desktop grid, 600 and 358 on the mobile grid), the mascots pop in and bob, and the clouds drift.

- [ ] **Step 3: Run the tests, commit and open the PR**

```bash
npx vitest run && npx tsc --noEmit && npm run lint
git add src/app/dev src/components/lab.css src/app/globals.css
git commit -m "Add the static scene lab, built only with SCENE_LAB=1"
git push -u origin rd/1.6-scene-lab
gh pr create --base redesign --title "1.6 Scene lab" --body "Task 1.6. /dev/scenes/<id> renders one scene at 820/600/358 px with the runtime; generateStaticParams returns [] unless SCENE_LAB=1 and dynamicParams=false, so production has no lab pages (verified 200/404/404)."
```

Review and merge per the protocol. Phase 1 has no visual gate (the page is still the shell); Wrenz may look at the preview for type and colour.

---

# Phase 2: Technical SEO

Goal: every SEO P0 and P1 item from spec §13 that does not need the finished page: metadata from the one site-URL value, `robots.txt`, `sitemap.xml`, the JSON-LD graph, the OG image and icons, and the dead-weight files gone. Nothing visible changes on the page except the browser tab icon. Lighthouse SEO 100 is checked in Phase 4's gate, once the page is complete.

Read spec §5 (`site.url`), §13 and §14 (JSON-LD, robots and sitemap tests) before starting. Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`, `.../04-functions/generate-viewport.md`, `.../03-file-conventions/01-metadata/` (all files) and `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`.

### Task 2.1: Metadata and viewport from the site config

**Files:**
- Create: `src/lib/metadata.ts`
- Modify: `src/app/layout.tsx`
- Test: `tests/metadata.test.ts`

**Interfaces:**
- Consumes: `site`, `getSiteUrl()` (Task 1.1).
- Produces: `buildMetadata(): Metadata` and `viewport: Viewport` from `src/lib/metadata.ts`. `layout.tsx` exports `metadata = buildMetadata()` and `viewport`. The default title is `"Wrenz Laylo, Developer, AI & Automation"`; the template `"%s | Wrenz Laylo"` only applies to child segments (Spec 2's `/work/<slug>` pages), not to `app/page.tsx` in the same segment (generate-metadata.md, "title.template").

- [ ] **Step 1: Write the failing test**

Create `tests/metadata.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { site } from "@/content/site";
import { buildMetadata, viewport } from "@/lib/metadata";

describe("buildMetadata", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("sets the default title, a template for child pages, and the description", () => {
    const m = buildMetadata();
    expect(m.title).toEqual({ default: "Wrenz Laylo, Developer, AI & Automation", template: "%s | Wrenz Laylo" });
    expect(m.description).toBe(site.description);
  });

  it("derives metadataBase from SITE_URL, read at call time", () => {
    expect(String(buildMetadata().metadataBase)).toBe("https://wrenz-portfolio.vercel.app/");
    process.env.SITE_URL = "https://example.test";
    expect(String(buildMetadata().metadataBase)).toBe("https://example.test/");
  });

  it("is canonical at the root and carries no keywords", () => {
    const m = buildMetadata();
    expect(m.alternates).toEqual({ canonical: "/" });
    expect(m.keywords).toBeUndefined();
  });

  it("describes the site for social cards", () => {
    const m = buildMetadata();
    expect(m.openGraph).toMatchObject({ type: "website", siteName: "Wrenz Laylo", locale: "en_PH", url: "/" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("credits the author and allows indexing", () => {
    const m = buildMetadata();
    expect(m.authors).toEqual([{ name: "Wrenz Laylo", url: "https://wrenz-portfolio.vercel.app/" }]);
    expect(m.robots).toEqual({ index: true, follow: true });
  });
});

describe("viewport", () => {
  it("uses the paper token as the theme colour and a light scheme", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const paper = css.match(/--color-paper:\s*(#[0-9A-Fa-f]{6})/)?.[1];
    expect(viewport.themeColor).toBe(paper);
    expect(viewport.colorScheme).toBe("light");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/metadata.test.ts`
Expected: FAIL, `Failed to resolve import "@/lib/metadata"`.

- [ ] **Step 3: Implement the builders**

Create `src/lib/metadata.ts`:

```ts
import type { Metadata, Viewport } from "next";
import { getSiteUrl, site } from "@/content/site";

/** Site metadata, all derived from the one site-URL value (spec §5, §13). File-based images
 *  (opengraph-image.tsx, apple-icon.tsx, icon.svg) are added by Next; twitter inherits the OG image
 *  because `twitter.images` is left unset (Next's postProcessMetadata fills it from openGraph). */
export function buildMetadata(): Metadata {
  const url = getSiteUrl();
  const title = `${site.name}, ${site.role}`;
  return {
    metadataBase: new URL(url),
    title: { default: title, template: `%s | ${site.name}` },
    description: site.description,
    applicationName: site.name,
    authors: [{ name: site.name, url: `${url}/` }],
    creator: site.name,
    alternates: { canonical: "/" },
    openGraph: { type: "website", siteName: site.name, locale: "en_PH", url: "/", title, description: site.description },
    twitter: { card: "summary_large_image", title, description: site.description },
    robots: { index: true, follow: true },
  };
}

/** themeColor mirrors --color-paper in globals.css (tests/metadata.test.ts keeps them equal). */
export const viewport: Viewport = { themeColor: "#FFF8EE", colorScheme: "light" };
```

- [ ] **Step 4: Use them in the layout**

Replace `src/app/layout.tsx` with:

```tsx
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
```

- [ ] **Step 5: Run the tests and check the rendered head**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (metadata 6 new).

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
curl -s http://127.0.0.1:3000/ | grep -o -E '<title>[^<]*</title>|<meta name="(description|theme-color|color-scheme|keywords)"[^>]*>|<link rel="canonical"[^>]*>|<meta property="og:(site_name|locale|type|url)"[^>]*>|<meta name="twitter:card"[^>]*>'
py -3.11 -I tools/perf/serve.py stop
```

Expected: `<title>Wrenz Laylo, Developer, AI &amp; Automation</title>`, the description, `theme-color` `#FFF8EE`, `color-scheme` `light`, the canonical on `https://wrenz-portfolio.vercel.app`, `og:site_name`, `og:locale` `en_PH`, `og:type` `website`, `og:url`, `twitter:card` `summary_large_image`, and **no** `keywords` line. (The `SITE_URL` behaviour is proven by the unit test.)

- [ ] **Step 6: Commit and open the PR**

```bash
git add src/lib/metadata.ts src/app/layout.tsx tests/metadata.test.ts
git commit -m "Build metadata and viewport from the site config"
git push -u origin rd/2.1-metadata
gh pr create --base redesign --title "2.1 Metadata and viewport" --body "Task 2.1. buildMetadata() and viewport from site + getSiteUrl(): title default + template, canonical, openGraph (siteName, en_PH), twitter summary_large_image, authors, no keywords, themeColor via export const viewport. Head output pasted below."
```

Paste the Step 5 grep output into the PR. Review and merge per the protocol.

### Task 2.2: robots.txt and sitemap.xml

**Files:**
- Create: `src/app/robots.ts`, `src/app/sitemap.ts`
- Test: `tests/seo-routes.test.ts`

**Interfaces:**
- Consumes: `getSiteUrl()` (Task 1.1), `routes` (Task 1.2).
- Produces: `/robots.txt` (allow all, `Sitemap:` line) and `/sitemap.xml` (one `<url>` per entry in `src/content/routes.ts`). Both are cached route handlers, generated at build time (robots.md and sitemap.md: "cached by default unless it uses a Request-time API"), so `SITE_URL` is read at build time.

- [ ] **Step 1: Write the failing test**

Create `tests/seo-routes.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { routes } from "@/content/routes";

describe("robots.txt", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("allows everything and points at the sitemap", () => {
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" }, sitemap: "https://wrenz-portfolio.vercel.app/sitemap.xml" });
  });

  it("follows SITE_URL", () => {
    process.env.SITE_URL = "https://example.test/";
    expect(robots().sitemap).toBe("https://example.test/sitemap.xml");
  });
});

describe("sitemap.xml", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("lists every indexable route, and only those", () => {
    expect(sitemap().map((e) => e.url)).toEqual(routes.map((r) => `https://wrenz-portfolio.vercel.app${r.path}`));
  });

  it("follows SITE_URL", () => {
    process.env.SITE_URL = "https://example.test";
    expect(sitemap().every((e) => e.url.startsWith("https://example.test/"))).toBe(true);
  });

  it("never lists the scene lab", () => {
    expect(sitemap().some((e) => e.url.includes("/dev/"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/seo-routes.test.ts`
Expected: FAIL, `Failed to resolve import "@/app/robots"`.

- [ ] **Step 3: Implement both routes**

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
```

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { routes } from "@/content/routes";
import { getSiteUrl } from "@/content/site";

/** One entry per indexable route (src/content/routes.ts). No lastModified: it would change on every build. */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = getSiteUrl();
  return routes.map((route) => ({ url: `${url}${route.path}` }));
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (5 new).

- [ ] **Step 5: Check the served files**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
curl -s http://127.0.0.1:3000/robots.txt
curl -s http://127.0.0.1:3000/sitemap.xml
py -3.11 -I tools/perf/serve.py stop
```

Expected:

```
User-Agent: *
Allow: /

Sitemap: https://wrenz-portfolio.vercel.app/sitemap.xml
```

and a sitemap with exactly one `<loc>https://wrenz-portfolio.vercel.app/</loc>`.

- [ ] **Step 6: Commit and open the PR**

```bash
git add src/app/robots.ts src/app/sitemap.ts tests/seo-routes.test.ts
git commit -m "Add robots.txt and sitemap.xml built from the site URL"
git push -u origin rd/2.2-robots-sitemap
gh pr create --base redesign --title "2.2 robots.txt and sitemap.xml" --body "Task 2.2. Both from getSiteUrl(); the sitemap lists src/content/routes.ts only (the scene lab never appears). Served output pasted below."
```

Paste the Step 5 output into the PR. Review and merge per the protocol.

### Task 2.3: The JSON-LD graph

**Files:**
- Create: `src/lib/jsonld.ts`
- Modify: `src/app/page.tsx` (the script line), `tests/page.test.tsx` (one test)
- Test: `tests/jsonld.test.ts`

**Interfaces:**
- Consumes: `site`, `getSiteUrl()`, `sections`, `recognition`, `fullProjects`, `compactProjects` (Tasks 1.1, 1.2); `plain()` (Task 0.1).
- Produces: `buildJsonLd(): Record<string, unknown>` (`{ "@context": "https://schema.org", "@graph": [Person, WebSite, ProfilePage, ItemList] }`) and `jsonLdHtml(data: unknown): string` from `src/lib/jsonld.ts`. The page renders `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />` as the first child of its fragment (Cross-phase contracts). Node ids: `${url}/#person`, `${url}/#website`, `${url}/#profile`, `${url}/#work`. Award strings are `"<title>, <detail>"`, plus `" (<subject>)"` when the honour has a subject (the About sticker wording, spec §10).

- [ ] **Step 1: Write the failing test**

Create `tests/jsonld.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { compactProjects, fullProjects } from "@/content/projects";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";

type GraphNode = Record<string, unknown> & { "@type": string };
const graph = () => buildJsonLd()["@graph"] as GraphNode[];
const node = (type: string) => graph().find((n) => n["@type"] === type) as GraphNode;
const BASE = "https://wrenz-portfolio.vercel.app";

describe("buildJsonLd", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("is one schema.org graph of Person, WebSite, ProfilePage and ItemList", () => {
    expect(buildJsonLd()["@context"]).toBe("https://schema.org");
    expect(graph().map((n) => n["@type"])).toEqual(["Person", "WebSite", "ProfilePage", "ItemList"]);
  });

  it("describes Wrenz as a Person", () => {
    expect(node("Person")).toMatchObject({
      "@id": `${BASE}/#person`,
      name: "Wrenz Laylo",
      alternateName: "Wrenz Ivan Laylo",
      jobTitle: "Developer, AI & Automation",
      worksFor: { "@type": "Organization", name: "Managed Virtual Services" },
      alumniOf: { "@type": "CollegeOrUniversity", name: "Angeles University Foundation" },
      address: { "@type": "PostalAddress", addressRegion: "Bataan", addressCountry: "PH" },
      image: `${BASE}/portrait.webp`,
      email: "wrenzivan2004@gmail.com",
      sameAs: ["https://github.com/WrenzLaylo", "https://linkedin.com/in/wrenzlaylo"],
    });
    expect(node("Person").award).toEqual([
      "Cum Laude, BS Computer Science, Data Science",
      "Best Thesis Paper and Presenter, IRCITE 2026 (LiPAD)",
      "1st Place, JPCS Hackathon 2025",
      "Microsoft Certified, Azure Fundamentals",
    ]);
  });

  it("makes the Person the main entity of the profile page", () => {
    expect(node("WebSite")).toMatchObject({ "@id": `${BASE}/#website`, name: "Wrenz Laylo", url: `${BASE}/` });
    expect(node("ProfilePage")).toMatchObject({ url: `${BASE}/`, mainEntity: { "@id": `${BASE}/#person` }, isPartOf: { "@id": `${BASE}/#website` } });
  });

  it("lists the 11 projects in page order with their schema types", () => {
    const list = node("ItemList");
    const items = list.itemListElement as { position: number; item: Record<string, unknown> }[];
    const projects = [...fullProjects, ...compactProjects];
    expect(items).toHaveLength(11);
    expect(list.numberOfItems).toBe(11);
    items.forEach((entry, i) => {
      const p = projects[i];
      expect(entry.position).toBe(i + 1);
      expect(entry.item).toMatchObject({ "@type": p.schemaType, name: p.name, creator: { "@id": `${BASE}/#person` } });
      expect(String(entry.item.description)).not.toContain("*");
      if (p.links[0]) expect(entry.item.url).toBe(p.links[0].href);
      else expect(entry.item).not.toHaveProperty("url");
    });
  });

  it("follows SITE_URL", () => {
    process.env.SITE_URL = "https://example.test";
    expect(node("Person")["@id"]).toBe("https://example.test/#person");
    expect(node("Person").image).toBe("https://example.test/portrait.webp");
  });
});

describe("jsonLdHtml", () => {
  it("contains no raw < anywhere in the real graph", () => {
    expect(jsonLdHtml(buildJsonLd())).not.toContain("<");
  });

  it("escapes a hostile string so it cannot close the script tag, and still parses", () => {
    const hostile = "</script><script>alert(1)</script>";
    const html = jsonLdHtml({ x: hostile });
    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c/script>");
    expect(JSON.parse(html).x).toBe(hostile);
  });
});
```

Add this test to `tests/page.test.tsx`, inside `describe("home page markup", ...)`:

```tsx
  it("renders one JSON-LD script that parses", () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const data = JSON.parse(scripts[0].textContent ?? "{}");
    expect(data["@graph"][0]).toMatchObject({ "@type": "Person", name: "Wrenz Laylo" });
  });
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run tests/jsonld.test.ts tests/page.test.tsx`
Expected: FAIL, `Failed to resolve import "@/lib/jsonld"`.

- [ ] **Step 3: Implement the graph builder**

Create `src/lib/jsonld.ts`:

```ts
import { compactProjects, fullProjects } from "@/content/projects";
import { recognition } from "@/content/recognition";
import { sections } from "@/content/sections";
import { getSiteUrl, site } from "@/content/site";
import type { Project, Recognition } from "@/content/types";
import { plain } from "./rich";

function awardText(r: Recognition): string {
  return r.subject ? `${r.title}, ${r.detail} (${r.subject})` : `${r.title}, ${r.detail}`;
}

function absolute(href: string, base: string): string {
  return href.startsWith("/") ? `${base}${href}` : href;
}

/** The page's structured data as one @graph (spec §13). Built from the content files only. */
export function buildJsonLd(): Record<string, unknown> {
  const url = getSiteUrl();
  const person = `${url}/#person`;
  const website = `${url}/#website`;
  const projects: Project[] = [...fullProjects, ...compactProjects];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": person,
        name: site.name,
        alternateName: site.alternateName,
        jobTitle: site.role,
        description: site.description,
        url: `${url}/`,
        image: `${url}${site.portrait.src}`,
        email: site.email,
        worksFor: { "@type": "Organization", name: site.employer },
        alumniOf: { "@type": "CollegeOrUniversity", name: site.alumniOf },
        // Bataan is a province, so it is the region, not the locality.
        address: { "@type": "PostalAddress", addressRegion: site.location.locality, addressCountry: site.location.country },
        award: recognition.map(awardText),
        sameAs: site.socials.map((s) => s.href),
      },
      { "@type": "WebSite", "@id": website, name: site.name, url: `${url}/`, inLanguage: "en" },
      {
        "@type": "ProfilePage",
        "@id": `${url}/#profile`,
        url: `${url}/`,
        name: `${site.name}, ${site.role}`,
        isPartOf: { "@id": website },
        mainEntity: { "@id": person },
      },
      {
        "@type": "ItemList",
        "@id": `${url}/#work`,
        name: sections.work.heading,
        numberOfItems: projects.length,
        itemListElement: projects.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": p.schemaType,
            name: p.name,
            description: plain(p.summary),
            creator: { "@id": person },
            ...(p.links[0] ? { url: absolute(p.links[0].href, url) } : {}),
          },
        })),
      },
    ],
  };
}

/** JSON for an inline <script type="application/ld+json">. JSON.stringify does not escape `<`, so a
 *  string containing "</script>" could end the tag early; every `<` becomes \u003c (docs/02-guides/json-ld.md). */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
```

- [ ] **Step 4: Render it on the page**

Replace `src/app/page.tsx` with (the Phase 1 shell plus the JSON-LD line as the first child):

```tsx
import { Footer } from "@/components/Footer";
import { HeroHeading } from "@/components/HeroHeading";
import { Icon } from "@/components/Icon";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";
import MotionRuntime from "@/motion/MotionRuntime";

// Shell: Task 3.2 replaces the hero section, Tasks 3.x add the worlds, Phase 4 fills the other sections.
const shellSections = [sections.work, sections.moreWork, sections.capabilities, sections.experience, sections.about, sections.contact];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <section id="top" className="hero" aria-labelledby="hero-h">
          <div className="wrap hero-copy">
            <HeroHeading />
            <p className="lede">{site.lede}</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#work">
                {site.labels.work}
                <Icon name="arrow-up-right" />
              </a>
              <a className="btn btn-secondary" href={site.resume} download>
                {site.labels.resume}
                <Icon name="download" />
              </a>
            </div>
          </div>
        </section>
        {shellSections.map((s) => (
          <section key={s.id} id={s.id} className="section" aria-labelledby={`${s.id}-h`}>
            <div className="wrap">
              <h2 id={`${s.id}-h`} className="section-h">
                {s.heading}
              </h2>
            </div>
          </section>
        ))}
      </main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
```


- [ ] **Step 5: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (jsonld 7 new, page 7).

- [ ] **Step 6: Check the served script**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
curl -s http://127.0.0.1:3000/ | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const m=s.match(/<script type=\"application\/ld\+json\">([^]*?)<\/script>/);const g=JSON.parse(m[1])['@graph'];console.log(g.map(n=>n['@type']).join(' '), g[3].itemListElement.length);})"
py -3.11 -I tools/perf/serve.py stop
```

Expected: `Person WebSite ProfilePage ItemList 11`.

- [ ] **Step 7: Commit and open the PR**

```bash
git add src/lib/jsonld.ts src/app/page.tsx tests/jsonld.test.ts tests/page.test.tsx
git commit -m "Add the JSON-LD graph: Person, WebSite, ProfilePage and the project ItemList"
git push -u origin rd/2.3-jsonld
gh pr create --base redesign --title "2.3 JSON-LD graph" --body "Task 2.3. One @graph from the content files (Person with award wording from recognition.ts, WebSite, ProfilePage, ItemList of 11), serialised with < escaped as \\u003c. Served output checked."
```

Review and merge per the protocol.

### Task 2.4: OG image, apple icon and favicon

**Files:**
- Create: `assets/og/Gabarito-ExtraBold.ttf`, `assets/og/OFL.txt`, `assets/og/portrait-og.jpg`
- Create: `src/app/opengraph-image.tsx`, `src/app/apple-icon.tsx`, `src/app/icon.svg`
- Delete: `src/app/favicon.ico`

**Interfaces:**
- Consumes: `site` (Task 1.1); `public/portrait.webp` (Task 1.2).
- Produces: `/opengraph-image` (1200×630 PNG, statically generated at build), the `og:image` / `twitter:image` tags (with width, height, alt, type), `/apple-icon` (180×180 PNG, `<link rel="apple-touch-icon">`), `/icon.svg` (`<link rel="icon" type="image/svg+xml" sizes="any">`). `assets/og/` holds the only files the OG renderer reads: it cannot read woff2 or variable fonts, and the portrait is a committed JPEG rather than WebP (spec §13).

- [ ] **Step 1: Fetch the static Gabarito ExtraBold TTF and its licence**

Google Fonts serves a static TTF instance of a single weight to a user agent that does not support woff2:

```bash
mkdir -p assets/og
TTF_URL=$(curl -s -A "Mozilla/4.0" "https://fonts.googleapis.com/css2?family=Gabarito:wght@800" | grep -o 'https://fonts.gstatic.com/[^)]*\.ttf')
echo "$TTF_URL"
curl -s -o assets/og/Gabarito-ExtraBold.ttf "$TTF_URL"
curl -s -o assets/og/OFL.txt "https://raw.githubusercontent.com/google/fonts/main/ofl/gabarito/OFL.txt"
file assets/og/Gabarito-ExtraBold.ttf
head -3 assets/og/OFL.txt
```

Expected: one `https://fonts.gstatic.com/s/gabarito/...ttf` URL, `TrueType Font data`, and the OFL header (`Copyright ... The Gabarito Project Authors`). The OFL text travels with the font because the repo is public.

- [ ] **Step 2: Make the JPEG portrait crop**

```bash
ffmpeg -y -v error -i public/portrait.webp -q:v 3 assets/og/portrait-og.jpg
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 assets/og/portrait-og.jpg
ls -l assets/og/portrait-og.jpg
```

Expected: `mjpeg,600,720` and a file well under 100 KB (the OG bundle limit is 500 KB including the font).

- [ ] **Step 3: The OG image**

Create `src/app/opengraph-image.tsx`:

```tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// Statically generated at build time (opengraph-image.md). The renderer supports flexbox and absolute
// positioning only, and reads TTF/OTF/WOFF (not woff2, not variable fonts), hence assets/og/.
export const alt = `${site.name}, ${site.role}. ${site.slogan.lineOne} ${site.slogan.lineTwo}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FFF8EE";
const INK = "#1F1B24";
const MUTED = "#5B5566";
const YOLK = "#FFC72C";
const YOLK_SHADE = "#E29C0E";

export default async function OpengraphImage() {
  const [font, portrait] = await Promise.all([
    readFile(join(process.cwd(), "assets/og/Gabarito-ExtraBold.ttf")),
    readFile(join(process.cwd(), "assets/og/portrait-og.jpg"), "base64"),
  ]);
  const { lineOne, lineTwo, highlight } = site.slogan;
  const rest = lineTwo.slice(highlight.length).trim();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: PAPER, fontFamily: "Gabarito", padding: "0 72px 0 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 660 }}>
          <div style={{ display: "flex", fontSize: 30, color: MUTED }}>{`${site.name}, ${site.role}`}</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 78, lineHeight: 1.04, color: INK, letterSpacing: "-0.025em" }}>
            <div style={{ display: "flex" }}>{lineOne}</div>
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: -6,
                    right: -6,
                    bottom: 8,
                    height: 32,
                    background: YOLK,
                    borderRadius: 8,
                    transform: "rotate(-1.5deg)",
                  }}
                />
                <div style={{ display: "flex" }}>{highlight}</div>
              </div>
              <div style={{ display: "flex", marginLeft: 20 }}>{rest}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", position: "relative", flex: 1, alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 400, height: 400, top: 128, left: 34, borderRadius: 200, background: YOLK_SHADE }} />
          <div style={{ position: "absolute", width: 400, height: 400, top: 116, left: 34, borderRadius: 200, background: YOLK }} />
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img> */}
          <img
            src={`data:image/jpeg;base64,${portrait}`}
            width={300}
            height={360}
            alt=""
            style={{
              position: "relative",
              objectFit: "cover",
              border: `8px solid ${PAPER}`,
              borderTopLeftRadius: 150,
              borderTopRightRadius: 150,
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
            }}
          />
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Gabarito", data: font, weight: 800, style: "normal" }] },
  );
}
```

- [ ] **Step 4: The apple icon and the SVG favicon**

Create `src/app/apple-icon.tsx`:

```tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/content/site";

// Generated at build time instead of a committed PNG (spec clarification 13). iOS rounds the corners.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const font = await readFile(join(process.cwd(), "assets/og/Gabarito-ExtraBold.ttf"));
  const initials = site.name
    .split(" ")
    .map((word) => word[0])
    .join("");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFC72C",
          color: "#1F1B24",
          fontFamily: "Gabarito",
          fontSize: 92,
          letterSpacing: "-0.04em",
        }}
      >
        {initials}
      </div>
    ),
    { ...size, fonts: [{ name: "Gabarito", data: font, weight: 800, style: "normal" }] },
  );
}
```

Create `src/app/icon.svg` (strokes, not text, so it never depends on a web font; sticker-flat shade under the yolk square):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="0" y="4" width="64" height="60" rx="16" fill="#E29C0E"/>
  <rect x="0" y="0" width="64" height="60" rx="16" fill="#FFC72C"/>
  <path d="M11 18L17 42L24 25L31 42L37 18M45 18V42H54" fill="none" stroke="#1F1B24" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

Delete the create-next-app favicon: `git rm src/app/favicon.ico`.

- [ ] **Step 5: Build and check every tag and image**

```bash
npx tsc --noEmit && npm run lint && npm run build
py -3.11 -I tools/perf/serve.py start
curl -s http://127.0.0.1:3000/ | grep -o -E '<meta property="og:image[^>]*>|<meta name="twitter:(card|image)[^>]*>|<link rel="(apple-touch-icon|icon)"[^>]*>'
curl -s -o tools/perf/out/og.png http://127.0.0.1:3000/opengraph-image
curl -s -o tools/perf/out/apple-icon.png http://127.0.0.1:3000/apple-icon
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 tools/perf/out/og.png
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height -of csv=p=0 tools/perf/out/apple-icon.png
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:3000/icon.svg
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/favicon.ico
py -3.11 -I tools/perf/serve.py stop
```

Expected:
- tags: `og:image` (URL on `https://wrenz-portfolio.vercel.app/opengraph-image?...`), `og:image:alt`, `og:image:type` `image/png`, `og:image:width` `1200`, `og:image:height` `630`, `twitter:card` `summary_large_image`, `twitter:image` (the same URL), `apple-touch-icon` with `sizes="180x180"`, `icon` with `type="image/svg+xml"` and `sizes="any"`.
- `png,1200,630` and `png,180,180`.
- `200 image/svg+xml`, then `404` for the deleted favicon.

If `twitter:image` is missing, create `src/app/twitter-image.tsx` containing only `export { default, alt, size, contentType } from "./opengraph-image";`, rebuild and re-run this step.

Open `tools/perf/out/og.png` and `tools/perf/out/apple-icon.png` at 1:1: name and role in muted Gabarito, the two slogan lines in ink with the yolk mark under "Reliable", the yolk circle with its darker shade under it, the portrait in its arch with a paper border, nothing clipped. The apple icon is "WL" centred on yolk.

- [ ] **Step 6: Commit and open the PR**

```bash
git add assets/og src/app/opengraph-image.tsx src/app/apple-icon.tsx src/app/icon.svg
git commit -m "Add the generated OG image and apple icon, and an SVG favicon"
git push -u origin rd/2.4-og-icons
gh pr create --base redesign --title "2.4 OG image and icons" --body "Task 2.4. opengraph-image.tsx (1200x630, static Gabarito TTF + JPEG portrait from assets/og/), apple-icon.tsx (180x180), icon.svg (stroke WL, no web font), favicon.ico removed. Head tags and image sizes checked; og.png attached."
```

Attach `tools/perf/out/og.png` to the PR (drag it into a PR comment) so the reviewer sees it at 1:1. Review and merge per the protocol.

### Task 2.5: Dead weight, and the Phase 2 check

**Files:**
- Delete: `public/motion.js`, `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`, `public/katiwala-logo.png`, `public/keyclick-automator-logo.png`, `public/wrenz-laylo.jpg`, `public/wrenz-laylo-graduation.webp`, `public/everyday-rockstar-live.webp`
- Test: `tests/public-assets.test.ts`

**Interfaces:**
- Consumes: the asset paths in `src/content/` (Tasks 1.1, 1.2).
- Produces: a `public/` root holding only `Wrenz_Laylo-Full-Stack.pdf` and `portrait.webp` (screenshots live under `public/work/`), enforced by a test.

- [ ] **Step 1: Write the failing test**

Create `tests/public-assets.test.ts`:

```ts
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Spec §13 "Weight": nothing unused ships from public/. Screenshots live in public/work/<slug>/.
const ROOT_FILES = ["Wrenz_Laylo-Full-Stack.pdf", "portrait.webp"];

describe("public/", () => {
  it("holds only the résumé and the portrait at its root", () => {
    const files = readdirSync("public").filter((f) => statSync(join("public", f)).isFile());
    expect(files.sort()).toEqual([...ROOT_FILES].sort());
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/public-assets.test.ts`
Expected: FAIL, the received list also contains `everyday-rockstar-live.webp`, `file.svg`, `globe.svg`, `katiwala-logo.png`, `keyclick-automator-logo.png` (added to `master` by PR #1; `--ignore-unmatch` below covers a checkout without it), `motion.js`, `next.svg`, `vercel.svg`, `window.svg`, `wrenz-laylo-graduation.webp` and `wrenz-laylo.jpg`.

- [ ] **Step 3: Prove nothing references them, then delete them**

```bash
grep -rn -E "motion\.js|file\.svg|globe\.svg|next\.svg|vercel\.svg|window\.svg|katiwala-logo|keyclick-automator-logo|wrenz-laylo\.jpg|wrenz-laylo-graduation|everyday-rockstar-live" src tests next.config.ts || echo "no references"
git rm --ignore-unmatch public/motion.js public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg public/katiwala-logo.png public/keyclick-automator-logo.png public/wrenz-laylo.jpg public/wrenz-laylo-graduation.webp public/everyday-rockstar-live.webp
```

Expected: `no references`, then 11 `rm` lines. If the grep prints a line, that file is still used: fix the reference first (it should point at `public/work/...` or `public/portrait.webp`), then delete.

- [ ] **Step 4: Prove GSAP is only loaded dynamically**

```bash
grep -rn -E "from \"gsap|require\(\"gsap|ScrollTrigger" src | grep -v "import type" || echo "gsap: dynamic import only"
grep -rn 'import("gsap")' src
```

Expected: `gsap: dynamic import only`, then exactly one line: `src/motion/MotionRuntime.tsx: ... import("gsap") ...`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass.

- [ ] **Step 6: Phase 2 check against the production build**

```bash
npm run build
node tools/perf/chunks.mjs
py -3.11 -I tools/perf/serve.py start
curl -s http://127.0.0.1:3000/robots.txt
curl -s http://127.0.0.1:3000/sitemap.xml | grep -o "<loc>[^<]*</loc>"
curl -s http://127.0.0.1:3000/ | grep -c 'application/ld+json'
curl -s http://127.0.0.1:3000/ | grep -o '<link rel="preload"[^>]*as="font"[^>]*>' | wc -l
for f in motion.js next.svg katiwala-logo.png; do curl -s -o /dev/null -w "$f %{http_code}\n" http://127.0.0.1:3000/$f; done
py -3.11 -I tools/perf/budget.py
py -3.11 -I tools/perf/serve.py stop
```

Expected: `chunks.mjs` PASS; robots with the `Sitemap:` line; one `<loc>`; `1` JSON-LD script; `3` font preloads; `404` for each deleted file; `budget.py` prints its JSON (the page is still the shell, so the JS and HTML numbers are the floor the later phases build on; paste them into the PR).

- [ ] **Step 7: Commit and open the PR**

```bash
git add tests/public-assets.test.ts
git commit -m "Remove unused public files and guard the public root"
git push -u origin rd/2.5-dead-weight
gh pr create --base redesign --title "2.5 Dead weight and the Phase 2 check" --body "Task 2.5. Deleted motion.js, the create-next-app SVGs, the 594 KB Katiwala logo and the old root images; test keeps public/ root to the résumé and portrait. GSAP is dynamic-import only. Phase 2 check output below."
```

Paste the Step 4 and Step 6 output into the PR. Review and merge per the protocol. Phase 2 has no visual gate; Lighthouse SEO is measured in Task 4.4.

---

# Phase 3: Hero, Pig Feeds POS and time-log

Goal: the page gains its first finished visuals, ported from the approved slice: the six world bands (with their copy, ticks, varied blocks, tags, links and hill edges), the hero "cast", the Pig Feeds POS world and the AGG Doors time-log world with their choreographies. The other four worlds keep their basic scenes until Phases 5 and 6. The phase ends with the first full verification gate.

Read spec §7, §8 and §11 and the slice (`C:\Users\OASIS\scratch-portfolio\slice\index.html`, `styles.css`, `scenes.js`) before starting. Port the art and the motion; do not copy the slice's preload class, its `<table>` sheet, its ScrollTrigger fallback or its `gsap.matchMedia` wrapper.

### Task 3.1: The Work section and the world bands

**Files:**
- Create: `src/components/Work.tsx`, `src/components/World.tsx`, `src/components/VariedBlock.tsx`, `src/components/ProjectLinks.tsx`, `src/components/HillEdge.tsx`, `src/components/world.css`
- Modify: `src/scenes/basic/BasicWorld.tsx` (bleed worlds get the bleed grid), `src/app/globals.css` (one import), `src/app/page.tsx` (`<Work />` replaces the shell `#work` section)
- Test: `tests/world.test.tsx`

**Interfaces:**
- Consumes: `fullProjects`, `projectBySlug` (Task 1.2); `site.labels` (Task 1.1); `Rich` (Task 0.1); `Icon`, `ExtLink` (Task 1.3); `fullScenes`, `cssVars`, `place`, `Stage`, `Layer` (Task 1.4); `sections.work` (Task 1.1).
- Produces:
  - `<Work />`: `section#work.work[aria-labelledby="work-h"]` = `div.work-head` (POS tint, `h2#work-h.section-h`) followed by one `<World>` per full project.
  - `<World project={FullProject} next={string} index={number} />`: `section.world.world-<layout>[data-world=<slug>][aria-labelledby=<slug>-h]` with inline `--tint: var(--color-tint-<slug>)`; children `div.world-grid` (inside `.wrap` for split layouts, full width for `bleed`) holding `div.w-copy` (h3 `#<slug>-h`, `p.w-summary`, `ul.w-points`, `<VariedBlock>`, `ul.tags`, `<ProjectLinks>`) and `figure.w-fig` (the scene, then `figcaption.caption` when the project has a caption); then `<HillEdge fill={next} variant={index % 3}>`.
  - `<VariedBlock varied={Varied} />`: `p.varied.varied-stat` / `ol.varied.varied-flow` / `dl.varied.varied-ba` / `p.varied.varied-promise` / `figure.varied.varied-quote`.
  - `<ProjectLinks project={Project} />`: `div.link-row` of `a.text-link` (external links through `ExtLink`, root-relative ones as plain `<a>`; the icon is `download` for `kind: "download"`, otherwise `arrow-up-right`), or `p.link-row.note` with `site.labels.privateClient` / `site.labels.privateProduct`, or nothing for a public project without links.
  - `<HillEdge fill={string} variant?={0 | 1 | 2} />`: `svg.hill-edge` (1440 × 72 viewBox, `preserveAspectRatio="none"`, `aria-hidden`), absolutely positioned at the bottom of its band; the path's inline style is `fill:<fill>`.
  - Per-world accents in `world.css`: `[data-world="<slug>"] { --tick; --link-line }` (POS grass, time-log clock; interim values for the other four, which Phases 5 and 6 replace).
  - Bleed panel classes (used by Phases 5 and 6): from 1024 px `.world-bleed .w-copy` is a paper panel `width: min(440px, 40%)` over the stage's left side, starting at the page's content edge; scenes keep design x < 560 calm (Cross-phase contracts).

- [ ] **Step 1: Write the failing test**

Create `tests/world.test.tsx`:

```tsx
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectLinks } from "@/components/ProjectLinks";
import { VariedBlock } from "@/components/VariedBlock";
import { Work } from "@/components/Work";
import { fullProjects, projectBySlug } from "@/content/projects";
import { site } from "@/content/site";
import type { Slug, Varied } from "@/content/types";

const parse = (markup: string) => new JSDOM(`<body>${markup}</body>`).window.document;
const work = parse(renderToStaticMarkup(<Work />));
const worlds = [...work.querySelectorAll<HTMLElement>("section[data-world]")];

describe("Work", () => {
  it("is section#work, labelled by its h2", () => {
    expect(work.getElementById("work")?.getAttribute("aria-labelledby")).toBe("work-h");
    expect(work.getElementById("work-h")?.tagName).toBe("H2");
    expect(work.getElementById("work-h")?.textContent).toBe("Built around actual operations.");
  });

  it("renders the six worlds in page order with their layouts", () => {
    expect(worlds.map((w) => w.dataset.world)).toEqual(fullProjects.map((p) => p.slug));
    expect(worlds.map((w) => [...w.classList].find((c) => c.startsWith("world-")))).toEqual(fullProjects.map((p) => `world-${p.layout}`));
  });

  it("labels each world by its one h3", () => {
    for (const w of worlds) {
      expect(w.querySelectorAll("h3"), w.dataset.world).toHaveLength(1);
      expect(w.getAttribute("aria-labelledby")).toBe(`${w.dataset.world}-h`);
      expect(w.querySelector("h3")?.id).toBe(`${w.dataset.world}-h`);
    }
  });

  it("builds each tick as the mark plus exactly one text span", () => {
    const items = [...work.querySelectorAll(".w-points li")];
    expect(items).toHaveLength(18);
    for (const li of items) {
      expect(li.children).toHaveLength(2);
      expect(li.children[0].classList.contains("tick")).toBe(true);
      expect(li.children[0].getAttribute("aria-hidden")).toBe("true");
      expect(li.children[1].tagName).toBe("SPAN");
    }
  });

  it("renders *phrase* as <em> inside the tick text, with no stray asterisks", () => {
    const pos = work.querySelector('section[data-world="pos"]') as HTMLElement;
    expect([...pos.querySelectorAll(".w-points li > span:last-child em")].map((e) => e.textContent)).toEqual(["benta", "cash na pumasok"]);
    expect(work.body.textContent).not.toContain("*");
  });

  it("labels every tag list", () => {
    for (const list of work.querySelectorAll(".tags")) expect(list.getAttribute("aria-label")).toBe(site.labels.builtWith);
  });

  it("captions the time-log figure", () => {
    const caption = fullProjects.find((p) => p.slug === "time-log")?.caption;
    expect(work.querySelector('section[data-world="time-log"] figure > figcaption')?.textContent).toBe(caption);
  });

  it("fills each hill edge with the next world's tint, and the last with paper", () => {
    const fills = worlds.map((w) => w.querySelector(":scope > .hill-edge path")?.getAttribute("style"));
    expect(fills).toEqual([...fullProjects.slice(1).map((p) => `fill:var(--color-tint-${p.slug})`), "fill:var(--color-paper)"]);
  });
});

describe("ProjectLinks", () => {
  const links = (slug: Slug) => parse(renderToStaticMarkup(<ProjectLinks project={projectBySlug(slug)} />));

  it("opens public links in a new tab with noopener", () => {
    const anchors = [...links("keyclick").querySelectorAll("a")];
    expect(anchors.map((a) => a.textContent)).toEqual(["Download for Windows", "Source"]);
    for (const a of anchors) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener");
    }
  });

  it("uses the download icon for a download and the arrow otherwise", () => {
    expect([...links("keyclick").querySelectorAll("use")].map((u) => u.getAttribute("href"))).toEqual(["#i-download", "#i-arrow-up-right"]);
  });

  it("shows the private label instead of links", () => {
    expect(links("pos").body.textContent).toBe(site.labels.privateClient);
    expect(links("pos").querySelector("a")).toBeNull();
    expect(links("katiwala").body.textContent).toBe(site.labels.privateProduct);
  });

  it("renders nothing for a public project without links", () => {
    expect(links("lipad").body.innerHTML).toBe("");
  });
});

describe("VariedBlock", () => {
  const cases: Varied[] = [
    { kind: "stat", value: "178", label: "suburb pages" },
    { kind: "flow", steps: ["One step.", "Two steps.", "Three steps."] },
    { kind: "beforeAfter", before: "By hand.", after: "In one till." },
    { kind: "promise", text: "Stock never goes negative." },
    { kind: "quote", text: "It just works.", name: "A. Client", role: "Owner" },
  ];

  it.each(cases)("renders every string of a $kind block", (varied) => {
    const text = parse(renderToStaticMarkup(<VariedBlock varied={varied} />)).body.textContent ?? "";
    const strings = Object.entries(varied)
      .filter(([key]) => key !== "kind")
      .flatMap(([, value]) => value);
    for (const s of strings) expect(text).toContain(s);
  });

  it("labels the before and after halves", () => {
    const text = parse(renderToStaticMarkup(<VariedBlock varied={cases[2]} />)).body.textContent ?? "";
    expect(text).toContain(site.labels.before);
    expect(text).toContain(site.labels.after);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/world.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/ProjectLinks"`.

- [ ] **Step 3: The small components**

Create `src/components/HillEdge.tsx`:

```tsx
// The three hill edges from the slice. Each band ends in one, filled with the NEXT band's colour,
// so the next world appears to rise into this one (spec §8).
const EDGES = [
  "M0 72V44C220 6 470 -4 720 26C960 54 1200 66 1440 22V72Z",
  "M0 72V26C260 64 520 70 760 40C1000 10 1220 4 1440 34V72Z",
  "M0 72V40C240 8 500 4 740 30C980 56 1220 60 1440 20V72Z",
] as const;

export function HillEdge({ fill, variant = 0 }: { fill: string; variant?: 0 | 1 | 2 }) {
  return (
    <svg className="hill-edge" viewBox="0 0 1440 72" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={EDGES[variant]} style={{ fill }} />
    </svg>
  );
}
```

Create `src/components/ProjectLinks.tsx`:

```tsx
import { site } from "@/content/site";
import type { Project } from "@/content/types";
import { ExtLink } from "./ExtLink";
import { Icon } from "./Icon";

export function ProjectLinks({ project }: { project: Project }) {
  if (project.status === "private-client") return <p className="link-row note">{site.labels.privateClient}</p>;
  if (project.status === "private-product") return <p className="link-row note">{site.labels.privateProduct}</p>;
  if (project.links.length === 0) return null;
  return (
    <div className="link-row">
      {project.links.map((link) => {
        const body = (
          <>
            {link.label}
            <Icon name={link.kind === "download" ? "download" : "arrow-up-right"} />
          </>
        );
        return link.href.startsWith("/") ? (
          <a key={link.href} href={link.href} className="text-link">
            {body}
          </a>
        ) : (
          <ExtLink key={link.href} href={link.href} className="text-link">
            {body}
          </ExtLink>
        );
      })}
    </div>
  );
}
```

Create `src/components/VariedBlock.tsx`:

```tsx
import { site } from "@/content/site";
import type { Varied } from "@/content/types";
import { Rich } from "@/lib/rich";

/** The one block per world that keeps the worlds from reading as a template (spec §8). */
export function VariedBlock({ varied }: { varied: Varied }) {
  switch (varied.kind) {
    case "stat":
      return (
        <p className="varied varied-stat">
          <strong className="stat-value">{varied.value}</strong> <span className="stat-label">{varied.label}</span>
        </p>
      );
    case "flow":
      return (
        <ol className="varied varied-flow">
          {varied.steps.map((step) => (
            <li key={step}>
              <Rich text={step} />
            </li>
          ))}
        </ol>
      );
    case "beforeAfter":
      return (
        <dl className="varied varied-ba">
          <div>
            <dt>{site.labels.before}</dt>
            <dd>
              <Rich text={varied.before} />
            </dd>
          </div>
          <div>
            <dt>{site.labels.after}</dt>
            <dd>
              <Rich text={varied.after} />
            </dd>
          </div>
        </dl>
      );
    case "promise":
      return (
        <p className="varied varied-promise">
          <Rich text={varied.text} />
        </p>
      );
    case "quote":
      return (
        <figure className="varied varied-quote">
          <blockquote>
            <p>
              <Rich text={varied.text} />
            </p>
          </blockquote>
          <figcaption>
            {varied.name}, {varied.role}
          </figcaption>
        </figure>
      );
  }
}
```

- [ ] **Step 4: World and Work**

Create `src/components/World.tsx`:

```tsx
import { site } from "@/content/site";
import type { FullProject } from "@/content/types";
import { Rich } from "@/lib/rich";
import { fullScenes } from "@/scenes";
import { cssVars } from "@/scenes/grid";
import { HillEdge } from "./HillEdge";
import { Icon } from "./Icon";
import { ProjectLinks } from "./ProjectLinks";
import { VariedBlock } from "./VariedBlock";

/** One project world (spec §8): a band on the world's tint, copy beside (or over) the stage, and a hill
 *  edge filled with `next`, the following band's colour. DOM order keeps the h3 first; CSS moves the
 *  stage above the copy when the layout stacks below 1024 px. */
export function World({ project, next, index }: { project: FullProject; next: string; index: number }) {
  const Scene = fullScenes[project.slug];
  const headingId = `${project.slug}-h`;
  return (
    <section
      className={`world world-${project.layout}`}
      data-world={project.slug}
      aria-labelledby={headingId}
      style={cssVars({ "--tint": `var(--color-tint-${project.slug})` })}
    >
      <div className={project.layout === "bleed" ? "world-grid" : "wrap world-grid"}>
        <div className="w-copy">
          <h3 id={headingId}>{project.name}</h3>
          <p className="w-summary">
            <Rich text={project.summary} />
          </p>
          <ul className="w-points">
            {project.points.map((point) => (
              <li key={point}>
                <span className="tick" aria-hidden="true">
                  <Icon name="check" />
                </span>
                <span>
                  <Rich text={point} />
                </span>
              </li>
            ))}
          </ul>
          <VariedBlock varied={project.varied} />
          <ul className="tags" aria-label={site.labels.builtWith}>
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <ProjectLinks project={project} />
        </div>
        <figure className="w-fig">
          <Scene project={project} />
          {project.caption ? <figcaption className="caption">{project.caption}</figcaption> : null}
        </figure>
      </div>
      <HillEdge fill={next} variant={(index % 3) as 0 | 1 | 2} />
    </section>
  );
}
```

Create `src/components/Work.tsx`:

```tsx
import { fullProjects } from "@/content/projects";
import { sections } from "@/content/sections";
import { World } from "./World";

/** The six full worlds, opened by the section heading on the POS tint (Cross-phase contracts). */
export function Work() {
  return (
    <section id={sections.work.id} className="work" aria-labelledby="work-h">
      <div className="work-head">
        <div className="wrap">
          <h2 id="work-h" className="section-h">
            {sections.work.heading}
          </h2>
        </div>
      </div>
      {fullProjects.map((project, index) => {
        const following = fullProjects[index + 1];
        return (
          <World
            key={project.slug}
            project={project}
            index={index}
            next={following ? `var(--color-tint-${following.slug})` : "var(--color-paper)"}
          />
        );
      })}
    </section>
  );
}
```

- [ ] **Step 5: World styles**

Create `src/components/world.css`:

```css
/* The Work section and the project worlds (spec §8). */
.work-head { background: var(--color-tint-pos); padding-top: 72px; }

.world { position: relative; background: var(--tint); padding: 72px 0 144px; --tick: var(--color-yolk); }
.work-head + .world { padding-top: 56px; }

/* Per-world accents: tick discs and link underlines (decoration only, never text). */
[data-world="pos"] { --tick: var(--color-grass); --link-line: var(--color-grass); }
[data-world="time-log"] { --tick: var(--color-clock); --link-line: var(--color-clock); }
/* Interim accents in each world's hue family; Phases 5 and 6 set the final ones with Fable. */
[data-world="service-areas"] { --tick: #FF9B85; --link-line: #FF9B85; }
[data-world="katiwala"] { --tick: #5FD3C4; --link-line: #5FD3C4; }
[data-world="stockroom"] { --tick: #B9A6FF; --link-line: #B9A6FF; }
[data-world="agent-island"] { --tick: #FF9EBB; --link-line: #FF9EBB; }

/* Copy */
.world h3 { font: 800 36px/1.08 var(--font-display); }
.w-summary { margin-top: 16px; font-size: 18px; line-height: 1.55; color: var(--color-muted); }
.w-points { margin-top: 24px; display: grid; gap: 14px; }
/* Two grid items only: the tick and ONE text span, so inline <em> never becomes its own item. */
.w-points li { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 12px; align-items: start; font-size: 16px; line-height: 1.5; }
.tick { width: 26px; height: 26px; margin-top: -1px; border-radius: 999px; display: grid; place-items: center; background: var(--tick); color: var(--color-ink); }
.tick .icon { width: 14px; height: 14px; }
.tags { margin-top: 22px; display: flex; flex-wrap: wrap; gap: 8px; }
.tags li { background: var(--color-white); border-radius: 999px; padding: 6px 12px; font: 600 13px/1.2 var(--font-body); }
.link-row { margin-top: 24px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 22px; }
.note { font-size: 14px; color: var(--color-muted); }
.w-fig { margin: 0; min-width: 0; }
.caption { margin-top: 12px; max-width: none; font-size: 14px; color: var(--color-muted); text-align: right; }

/* Varied blocks */
.varied { margin-top: 24px; }
.varied-stat { display: flex; align-items: baseline; gap: 12px; }
.stat-value { font: 800 56px/1 var(--font-display); letter-spacing: -0.03em; }
.stat-label { font-size: 16px; line-height: 1.35; color: var(--color-muted); max-width: 22ch; }
.varied-flow { padding: 14px 18px; border-radius: var(--radius-md); background: rgb(255 255 255 / 0.6); }
.varied-flow li { position: relative; padding: 6px 0 6px 28px; font-size: 15px; line-height: 1.45; }
.varied-flow li::before {
  content: ""; position: absolute; left: 4px; top: 12px; width: 12px; height: 12px; border-radius: 50%;
  background: var(--tick); box-shadow: 0 0 0 3px var(--color-white);
}
.varied-flow li + li::after { content: ""; position: absolute; left: 9px; top: -10px; width: 2px; height: 22px; background: rgb(31 27 36 / 0.25); }
.varied-ba { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.varied-ba > div { padding: 14px 16px; border-radius: var(--radius-md); background: rgb(255 255 255 / 0.6); }
.varied-ba > div + div { background: var(--color-white); }
.varied-ba dt { font: 700 14px/1.2 var(--font-display); }
.varied-ba dd { margin: 6px 0 0; font-size: 15px; line-height: 1.45; }
.varied-promise { padding-left: 16px; border-left: 4px solid var(--tick); font: 700 20px/1.35 var(--font-display); }
.varied-quote { margin: 24px 0 0; }
.varied-quote blockquote { margin: 0; font: 700 20px/1.35 var(--font-display); }
.varied-quote figcaption { margin-top: 8px; font-size: 14px; color: var(--color-muted); }

/* The hill edge that closes every band (the hero uses it too). */
.hill-edge { position: absolute; left: 0; bottom: -1px; width: 100%; height: 72px; pointer-events: none; }

/* Split worlds from 1024 px: copy column + stage, alternating sides, copy centred against the stage. */
@media (min-width: 1024px) {
  .world-split-start .world-grid,
  .world-split-end .world-grid { display: grid; column-gap: 60px; align-items: center; }
  .world-split-start .world-grid { grid-template-columns: 400px minmax(0, 1fr); grid-template-areas: "copy fig"; }
  .world-split-end .world-grid { grid-template-columns: minmax(0, 1fr) 400px; grid-template-areas: "fig copy"; }
  .w-copy { grid-area: copy; }
  .w-fig { grid-area: fig; }

  /* Full-bleed worlds: the stage spans the band edge to edge and the copy sits on a paper panel over its
     calm left side (scenes keep design x < 560 free of moving parts). */
  .world-bleed { padding-top: 48px; }
  .world-bleed .world-grid { display: grid; grid-template-areas: "stack"; align-items: center; }
  .world-bleed .w-fig, .world-bleed .w-copy { grid-area: stack; }
  .world-bleed .w-copy {
    position: relative; z-index: 1; justify-self: start; width: min(440px, 40%);
    margin-left: max(40px, calc((100% - 1280px) / 2));
    padding: 32px; border-radius: var(--radius-lg); background: var(--color-paper);
  }
  .world-bleed .w-points li { font-size: 15px; }
  .world-bleed .caption { padding-right: max(40px, calc((100% - 1280px) / 2)); }
}

@media (min-width: 1024px) and (max-width: 1180px) {
  .world-split-start .world-grid { grid-template-columns: 340px minmax(0, 1fr); column-gap: 40px; }
  .world-split-end .world-grid { grid-template-columns: minmax(0, 1fr) 340px; column-gap: 40px; }
  .world h3 { font-size: 32px; }
}

/* Below 1024 px every world stacks with the stage ABOVE the copy (spec §8); DOM order is unchanged. */
@media (max-width: 1023px) {
  .world-grid { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-areas: "fig" "copy"; row-gap: 32px; }
  .w-copy { grid-area: copy; }
  .w-fig { grid-area: fig; }
  .world-bleed { padding-top: 0; }
  .world-bleed .w-copy { width: min(1280px, 100% - 80px); margin-inline: auto; }
  .world-bleed .caption { padding-right: 40px; }
}

/* Bleed stages are edge to edge, so they keep square corners at every width. */
.world-bleed .stage { border-radius: 0; }

@media (max-width: 767px) {
  .work-head { padding-top: 48px; }
  .world { padding: 48px 0 104px; }
  .work-head + .world { padding-top: 32px; }
  .world-bleed { padding-top: 0; }
  .world h3 { font-size: 26px; }
  .w-summary { font-size: 17px; }
  .w-points li { font-size: 15px; }
  .tags li { font-size: 12px; }
  .stat-value { font-size: 44px; }
  .varied-ba { grid-template-columns: 1fr; }
  .world-bleed .w-copy { width: calc(100% - 32px); }
  .world-bleed .caption { padding-right: 16px; }
  .caption { text-align: left; font-size: 13px; }
}
```

In `src/app/globals.css`, add after the `device.css` import (before `lab.css`):

```css
@import "../components/world.css" layer(components);
```

- [ ] **Step 6: Give the two bleed worlds the bleed grid in the basic scene**

Replace `src/scenes/basic/BasicWorld.tsx` with (split worlds unchanged; bleed worlds use the 1280 × 720 / 358 × 400 grid from the Cross-phase contracts and keep their moving parts right of design x 560):

```tsx
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import type { FullProject } from "@/content/types";
import { type Grid, place } from "../grid";
import { Layer, Stage } from "../Stage";

const SPLIT: Grid = { dw: 820, dh: 620, mdw: 358, mdh: 340 };
const BLEED: Grid = { dw: 1280, dh: 720, mdw: 358, mdh: 400 };

/** Interim world scene (spec clarification 15): clouds, the screenshot if there is one, and the mascot. */
export function BasicWorld({ project }: { project: FullProject }) {
  const { shot } = project;
  const bleed = project.layout === "bleed";
  const at = bleed
    ? {
        cloudA: place({ x: 640, y: 80, w: 200, mx: 24, my: 20, mw: 70 }),
        cloudB: place({ x: 1040, y: 60, w: 150 }),
        device: place({ x: 640, y: 110, w: 560, mx: 24, my: 40, mw: 310 }),
        mascotWithShot: place({ x: 1060, y: 470, w: 180, mx: 262, my: 290, mw: 84 }),
        mascotAlone: place({ x: 820, y: 220, w: 280, mx: 104, my: 110, mw: 150 }),
      }
    : {
        cloudA: place({ x: 60, y: 56, w: 150, mx: 24, my: 20, mw: 70 }),
        cloudB: place({ x: 610, y: 40, w: 110 }),
        device: place({ x: 150, y: 70, w: 520, mx: 24, my: 28, mw: 310 }),
        mascotWithShot: place({ x: 620, y: 400, w: 170, mx: 262, my: 238, mw: 84 }),
        mascotAlone: place({ x: 300, y: 180, w: 220, mx: 104, my: 80, mw: 150 }),
      };
  return (
    <Stage slug={project.slug} tier="full" grid={bleed ? BLEED : SPLIT} label={shot ? undefined : project.illustrationLabel} className="basic">
      <Layer depth="bg">
        <svg className="pos cloud loop" style={at.cloudA} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="pos cloud loop g-d" style={at.cloudB} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={at.device}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 560px, 90vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        <div className="pos" data-part="mascot" style={shot ? at.mascotWithShot : at.mascotAlone}>
          <div className="bob loop">
            <Mascot slug={project.slug} />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

- [ ] **Step 7: Put the worlds on the page**

Replace `src/app/page.tsx` with (this is the file as Phase 2 left it, with the shell `#work` section replaced by `<Work />`; if Phase 2 placed anything else in the file, keep it):

```tsx
import { Footer } from "@/components/Footer";
import { HeroHeading } from "@/components/HeroHeading";
import { Icon } from "@/components/Icon";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import { Work } from "@/components/Work";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";
import MotionRuntime from "@/motion/MotionRuntime";

// Shell: Task 3.2 replaces the hero section, Phase 4 fills the remaining sections.
const shellSections = [sections.moreWork, sections.capabilities, sections.experience, sections.about, sections.contact];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <section id="top" className="hero" aria-labelledby="hero-h">
          <div className="wrap hero-copy">
            <HeroHeading />
            <p className="lede">{site.lede}</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#work">
                {site.labels.work}
                <Icon name="arrow-up-right" />
              </a>
              <a className="btn btn-secondary" href={site.resume} download>
                {site.labels.resume}
                <Icon name="download" />
              </a>
            </div>
          </div>
        </section>
        <Work />
        {shellSections.map((s) => (
          <section key={s.id} id={s.id} className="section" aria-labelledby={`${s.id}-h`}>
            <div className="wrap">
              <h2 id={`${s.id}-h`} className="section-h">
                {s.heading}
              </h2>
            </div>
          </section>
        ))}
      </main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
```

- [ ] **Step 8: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (world.test.tsx: 18; scenes.test.tsx still passes for the two bleed basic scenes; page.test.tsx still finds one h1 and every anchor).

- [ ] **Step 9: Look at the bands at 1:1**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.1 1440 900 --wait 1200
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.1 1024 768 --wait 1200
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.1 820 1180 --wait 1200
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.1 390 844 --wait 1200
py -3.11 -I tools/perf/serve.py stop
```

Expected: every run prints `PASS` (no text under 12 px, no horizontal overflow). In the screenshots: six tinted bands in order (green, blue, coral, teal, lilac, rose), each ending in a hill of the next colour, the last one in paper; split worlds alternate sides at 1440 and 1024; at 820 and 390 every stage sits above its copy; the two bleed worlds' stages run edge to edge with the copy on a paper panel at 1440 and 1024.

- [ ] **Step 10: Commit and open the PR**

```bash
git add src/components src/scenes/basic/BasicWorld.tsx src/app/globals.css src/app/page.tsx tests/world.test.tsx
git commit -m "Add the Work section and the world bands with ticks, varied blocks, links and hill edges"
git push -u origin rd/3.1-worlds
gh pr create --base redesign --title "3.1 Work section and world bands" --body "Task 3.1. Work + World (split-start/split-end/bleed, stage above copy below 1024), VariedBlock (5 kinds), ProjectLinks, HillEdge, world.css, bleed grid for the basic scene. Screenshots at 1440/1024/820/390 attached."
```

Attach the four first screenshots to the PR. Review and merge per the protocol.

### Task 3.2: The hero "cast"

**Files:**
- Create: `src/components/Hero.tsx`
- Modify: `src/components/hero.css` (rewrite), `src/app/page.tsx` (`<Hero />` replaces the shell hero), `src/motion/engine.ts` (the hero's grid follows the viewport), `src/app/dev/scenes/[id]/page.tsx` (the lab shows the hero)
- Test: `tests/hero.test.tsx`, `tests/engine.test.ts` (one new case)

**Interfaces:**
- Consumes: `HeroHeading`, `Icon` (Task 1.3); `Mascot` (Task 1.4); `Layer`, `cssVars`, `place`, `Place` (Task 1.4); `HillEdge` (Task 3.1); `site`, `fullProjects`; the engine (Task 1.5).
- Produces:
  - `<Hero />`: `section#top.hero[aria-labelledby="hero-h"]` = `div.wrap.hero-grid` (`div.hero-copy` with the H1, `p.lede`, `div.cta-row`) + `<HeroStage />`, then `<HillEdge fill="var(--color-tint-pos)">`.
  - `<HeroStage />`: `div.hero-stage-c > div.hero-stage[data-scene="hero"][data-tier="hero"]` (design grid 620 × 620, mobile 358 × 300, switched by the viewport at 767 px) with three layers: bg (`svg.hero-blob`), mid (`div.p-scroll > div.p-pop > div.portrait > img`, not hidden), fg (six `div.m` mascots, `div.m-pop > div.bob.loop > <Mascot>`).
  - The engine treats `data-tier="hero"` stages as on their mobile grid only when `(max-width: 767px)` matches.
  - Lab id `"hero"`.

- [ ] **Step 1: Write the failing hero test**

Create `tests/hero.test.tsx`:

```tsx
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/Hero";
import { fullProjects } from "@/content/projects";
import { site } from "@/content/site";

const doc = new JSDOM(`<body>${renderToStaticMarkup(<Hero />)}</body>`).window.document;
const stage = doc.querySelector<HTMLElement>('[data-scene="hero"]') as HTMLElement;

describe("Hero", () => {
  it("is section#top, labelled by the one h1", () => {
    expect(doc.getElementById("top")?.getAttribute("aria-labelledby")).toBe("hero-h");
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.getElementById("hero-h")?.tagName).toBe("H1");
  });

  it("links the two calls to action to the work and the résumé", () => {
    const [work, resume] = [...doc.querySelectorAll(".cta-row a")];
    expect(work.getAttribute("href")).toBe("#work");
    expect(work.textContent).toBe(site.labels.work);
    expect(resume.getAttribute("href")).toBe(site.resume);
    expect(resume.hasAttribute("download")).toBe(true);
    expect(resume.textContent).toBe(site.labels.resume);
  });

  it("is a hero-tier stage in its own container, outside the world container query", () => {
    expect(stage.dataset.tier).toBe("hero");
    expect(stage.parentElement?.classList.contains("hero-stage-c")).toBe(true);
    expect(stage.closest(".stage-c")).toBeNull();
  });

  it("casts one mascot per world, in page order", () => {
    expect([...stage.querySelectorAll("[data-mascot]")].map((m) => m.getAttribute("data-mascot"))).toEqual(fullProjects.map((p) => p.slug));
  });

  it("loads the portrait eagerly, with its alt text, outside any hidden layer", () => {
    const img = stage.querySelector("img");
    expect(img?.getAttribute("alt")).toBe(site.portrait.alt);
    expect(img?.getAttribute("loading")).toBe("eager");
    expect(img?.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("holds no headings, buttons, links, tables or form fields inside the stage", () => {
    expect(stage.querySelectorAll("h1, h2, h3, h4, h5, h6, button, a, table, th, form, input")).toHaveLength(0);
  });

  it("ends in a hill edge filled with the POS tint", () => {
    expect(doc.querySelector("#top > .hill-edge path")?.getAttribute("style")).toBe("fill:var(--color-tint-pos)");
  });
});

describe("hero.css", () => {
  const css = readFileSync("src/components/hero.css", "utf8");

  it("enters the H1 and the portrait with transform only, never from opacity 0 (LCP candidates)", () => {
    expect(css).toContain("@keyframes hero-rise { from { transform: translateY(24px); } }");
    expect(css).toContain("@keyframes hero-pop { from { transform: scale(0.7); } }");
    expect(css).toMatch(/\.hero \.h1-name \{ animation: hero-rise /);
    expect(css).toMatch(/\.hero \.h1-slogan \{ animation: hero-rise /);
    expect(css).toMatch(/\.hero \.p-pop \{ animation: hero-pop /);
  });

  it("hides nothing behind a preload class", () => {
    expect(css).not.toMatch(/preload/);
  });
});
```

Add this case inside `describe("startMotion", ...)` in `tests/engine.test.ts`:

```ts
  it("judges the hero's grid by the viewport, so pointer parallax moves it on desktop", () => {
    const [hero] = mountStages("hero");
    hero.dataset.tier = "hero";
    setWidth(hero, 560); // narrower than the 760 px world switch, but the hero follows the viewport
    const { win, stop } = start({ pointer: true }, {});
    observer(undefined).fire(hero, true);
    win.emit("pointermove", { clientX: 1440, clientY: 900 });
    win.runFrames(5);
    expect((hero.querySelector(".mouse") as HTMLElement).style.transform).toMatch(/^translate3d\(/);
    stop();
  });
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run tests/hero.test.tsx tests/engine.test.ts`
Expected: FAIL, `Failed to resolve import "@/components/Hero"`, and the new engine case fails (the 560 px hero counts as mobile, so its `.mouse` has no transform).

- [ ] **Step 3: The hero's grid follows the viewport in the engine**

In `src/motion/engine.ts`, add this line right after the line `const widthOf = (el: HTMLElement) => el.getBoundingClientRect().width;`:

```ts
  // World stages switch grid by their own width; the hero switches by the viewport (spec clarification 2).
  const gridIsMobile = (stage: HTMLElement) =>
    stage.dataset.tier === "hero" ? win.matchMedia("(max-width: 767px)").matches : widthOf(stage) < STAGE_GRID_SWITCH;
```

Then replace `onMobileGrid.set(stage, widthOf(stage) < STAGE_GRID_SWITCH);` (in the first `for (const stage of stages)` loop) with:

```ts
    onMobileGrid.set(stage, gridIsMobile(stage));
```

and replace `for (const stage of stages) onMobileGrid.set(stage, widthOf(stage) < STAGE_GRID_SWITCH);` (inside the resize callback) with:

```ts
      for (const stage of stages) onMobileGrid.set(stage, gridIsMobile(stage));
```

- [ ] **Step 4: The hero component**

Create `src/components/Hero.tsx`:

```tsx
import Image from "next/image";
import { fullProjects } from "@/content/projects";
import { site } from "@/content/site";
import type { FullSlug } from "@/content/types";
import { cssVars, type Place, place } from "@/scenes/grid";
import { Layer } from "@/scenes/Stage";
import { HeroHeading } from "./HeroHeading";
import { HillEdge } from "./HillEdge";
import { Icon } from "./Icon";
import { Mascot } from "./Mascot";

type Cast = { place: Place; vars: Record<`--${string}`, string>; desktopOnly?: boolean };

// Placement and motion values from the slice (index.html lines 75-97). --bd bob period, --bdl bob start
// offset after the entrance, --by/--br bob lift and tilt, --dox/--doy/--or desktop scroll-out,
// --mox/--moy mobile scroll-out, --tilt the resting tilt. The slice's keycap slot holds the Agent Island bot.
const CAST: Record<FullSlug, Cast> = {
  pos: {
    place: { x: 58, y: 466, w: 140, mx: 6, my: 204, mw: 86 },
    vars: { "--bd": "1.5s", "--bdl": "0.7s", "--by": "-10px", "--br": "4deg", "--dox": "-120px", "--doy": "220px", "--or": "-12deg", "--mox": "-50px", "--moy": "130px", "--tilt": "-4deg" },
  },
  "time-log": {
    place: { x: 0, y: 40, w: 130, mx: 0, my: 14, mw: 78 },
    vars: { "--bd": "1.7s", "--bdl": "0.4s", "--by": "-9px", "--br": "-3deg", "--dox": "-160px", "--doy": "60px", "--or": "-12deg", "--mox": "-40px", "--moy": "80px", "--tilt": "-6deg" },
  },
  "service-areas": {
    place: { x: -8, y: 282, w: 112 },
    vars: { "--bd": "1.9s", "--bdl": "1.1s", "--by": "-7px", "--br": "3deg", "--dox": "-200px", "--doy": "160px", "--or": "-12deg", "--tilt": "5deg" },
    desktopOnly: true,
  },
  katiwala: {
    place: { x: 508, y: 286, w: 92 },
    vars: { "--bd": "1.6s", "--bdl": "0.2s", "--by": "-9px", "--br": "3deg", "--dox": "210px", "--doy": "160px", "--or": "12deg", "--tilt": "-5deg" },
    desktopOnly: true,
  },
  stockroom: {
    place: { x: 452, y: 474, w: 122, mx: 276, my: 200, mw: 76 },
    vars: { "--bd": "1.75s", "--bdl": "0.9s", "--by": "-7px", "--br": "-3deg", "--dox": "140px", "--doy": "220px", "--or": "12deg", "--mox": "50px", "--moy": "130px", "--tilt": "4deg" },
  },
  "agent-island": {
    place: { x: 478, y: 56, w: 110, mx: 286, my: 22, mw: 66 },
    vars: { "--bd": "1.8s", "--bdl": "1.4s", "--by": "-8px", "--br": "-4deg", "--dox": "170px", "--doy": "70px", "--or": "12deg", "--mox": "40px", "--moy": "80px", "--tilt": "6deg" },
  },
};

/** The hero stage: yolk blob, portrait arch and one mascot per world. Its grid switches with the
 *  viewport at 767 px (spec clarification 2), so it has its own container, not `.stage-c`. */
export function HeroStage() {
  return (
    <div className="hero-stage-c">
      <div className="hero-stage" data-scene="hero" data-tier="hero" style={cssVars({ "--dw": 620, "--dh": 620, "--mdw": 358, "--mdh": 300 })}>
        <Layer depth="bg">
          <svg className="hero-blob pos" style={place({ x: 40, y: 46, w: 540, mx: 44, my: 18, mw: 270 })} viewBox="0 0 540 520">
            <path
              fill="#FFC72C"
              d="M282 18C380 14 470 70 506 160C540 246 528 344 470 418C410 494 300 520 206 500C110 480 36 414 16 318C-4 222 34 120 112 64C162 30 222 20 282 18Z"
            />
            <circle cx="60" cy="40" r="12" fill="#FF9EC4" />
            <path className="g-d" d="M486 34l22 34h-44z" fill="#4F86F7" />
            <path d="M500 480q12-14 24 0t24 0" fill="none" stroke="#20B2A0" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </Layer>
        <Layer depth="mid" decorative={false}>
          <div className="pos p-scroll" style={place({ x: 160, y: 126, w: 300, mx: 96, my: 52, mw: 166 })}>
            <div className="p-pop">
              <div className="portrait">
                <Image
                  src={site.portrait.src}
                  alt={site.portrait.alt}
                  width={site.portrait.width}
                  height={site.portrait.height}
                  sizes="(min-width: 768px) 300px, 47vw"
                  fetchPriority="high"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </Layer>
        <Layer depth="fg">
          {fullProjects.map((project, index) => {
            const cast = CAST[project.slug];
            return (
              <div
                key={project.slug}
                className={cast.desktopOnly ? "m pos g-d" : "m pos"}
                style={place(cast.place, { ...cast.vars, "--mi": index })}
              >
                <div className="m-pop">
                  <div className="bob loop">
                    <Mascot slug={project.slug} />
                  </div>
                </div>
              </div>
            );
          })}
        </Layer>
      </div>
    </div>
  );
}

/** The hero "cast" (spec §7). Nothing waits for JavaScript: the entrance is CSS, the H1 and the portrait
 *  enter with transform only, and there is no preload class. */
export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-h">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <HeroHeading />
          <p className="lede">{site.lede}</p>
          <div className="cta-row">
            <a className="btn btn-primary" href="#work">
              {site.labels.work}
              <Icon name="arrow-up-right" />
            </a>
            <a className="btn btn-secondary" href={site.resume} download>
              {site.labels.resume}
              <Icon name="download" />
            </a>
          </div>
        </div>
        <HeroStage />
      </div>
      <HillEdge fill="var(--color-tint-pos)" variant={0} />
    </section>
  );
}
```

- [ ] **Step 5: Hero styles**

Replace `src/components/hero.css` with:

```css
/* The hero (spec §7): copy left, the "cast" right. Fills the first viewport under the 64 px nav. */
.hero { position: relative; overflow: clip; overflow-clip-margin: 1px; min-height: calc(100dvh - 64px); display: flex; flex-direction: column; padding-bottom: 72px; }
.hero-grid { flex: 1; display: grid; grid-template-columns: 54fr 46fr; align-items: center; gap: 24px; padding: 32px 0 48px; }

.hero h1 { display: grid; gap: 18px; }
.h1-name { display: block; font: 600 20px/1.3 var(--font-body); letter-spacing: 0; color: var(--color-muted); }
.h1-slogan { display: block; font: 800 clamp(44px, 5vw, 68px)/1.04 var(--font-display); letter-spacing: -0.025em; }
.h1-slogan .line { display: block; }
.hl { position: relative; display: inline-block; z-index: 0; }
.mark {
  position: absolute; left: -6px; right: -6px; bottom: 0.06em; height: 0.42em; z-index: -1;
  background: var(--color-yolk); border-radius: var(--radius-sm); transform: rotate(-1.5deg) scaleX(1); transform-origin: 0 50%;
}
.lede { margin-top: 24px; font-size: 20px; line-height: 1.5; max-width: 34ch; color: var(--color-muted); }
.cta-row { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 14px; }

/* The stage: its own size container (cqw needs one), grid switched by the viewport, not @container stage. */
.hero-stage-c { container: hero / inline-size; }
.hero-stage { position: relative; width: 100%; aspect-ratio: var(--dw) / var(--dh); --u: calc(100cqw / var(--dw)); }
.hero-blob { transform-origin: 50% 50%; }
.portrait {
  aspect-ratio: 300 / 360; overflow: clip; background: #26252B;
  border: 6px solid var(--color-paper); border-radius: 999px 999px var(--radius-lg) var(--radius-lg);
}
.portrait img { display: block; width: 100%; height: 100%; object-fit: cover; }
/* scale(1) keeps the function list equal to the pop keyframe's, so it interpolates per function. */
.m-pop { transform: scale(1) rotate(var(--tilt, 0deg)); }

@media (max-width: 767px) {
  .hero-grid { grid-template-columns: 1fr; padding: 24px 0 40px; gap: 28px; }
  .hero h1 { gap: 12px; }
  .h1-name { font-size: 16px; }
  .h1-slogan { font-size: min(40px, 9.5vw); }
  .lede { margin-top: 16px; font-size: 17px; }
  .cta-row { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 12px; }
  .cta-row .btn { width: 100%; }
  .hero-stage { aspect-ratio: var(--mdw) / var(--mdh); --u: calc(100cqw / var(--mdw)); }
  .hero-stage .pos {
    left: calc(var(--mx, var(--x)) * var(--u));
    top: calc(var(--my, var(--y)) * var(--u));
    width: calc(var(--mw, var(--w)) * var(--u));
  }
  .hero-stage .g-d { display: none; }
}

@keyframes hero-rise { from { transform: translateY(24px); } }
@keyframes hero-in { from { transform: translateY(24px); opacity: 0; } }
@keyframes hero-pop { from { transform: scale(0.7); } }
@keyframes hero-blob-in { from { transform: scale(0.6); opacity: 0; } }
@keyframes hero-mark { from { transform: rotate(-1.5deg) scaleX(0); } }
@keyframes hero-m-pop { from { transform: scale(0) rotate(calc(var(--tilt, 0deg) * -5)); } }

@media (prefers-reduced-motion: no-preference) {
  /* Entrance (spec §7): CSS with `both` fill, no JavaScript. The H1 and the portrait move with transform
     only, so they count for LCP at first paint. Timings follow the slice's GSAP timeline. */
  .hero .hero-blob { animation: hero-blob-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0s both; }
  .hero .h1-name { animation: hero-rise 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) 0.1s both; }
  .hero .h1-slogan { animation: hero-rise 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) 0.18s both; }
  .hero .lede { animation: hero-in 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) 0.26s both; }
  .hero .cta-row { animation: hero-in 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) 0.34s both; }
  .hero .p-pop { animation: hero-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both; }
  .hero .m-pop { animation: hero-m-pop 0.55s cubic-bezier(0.34, 1.8, 0.64, 1) calc(0.45s + var(--mi, 0) * 0.08s) both; }
  .hero .mark { animation: hero-mark 0.5s cubic-bezier(0.45, 0, 0.55, 1) 0.75s both; }

  /* Idle bobs start after the last pop has landed (1.4 s), each at its own offset: an animation that
     starts while its element is invisible would run on the main thread for good. */
  .hero .bob.loop { animation: bob calc(var(--bd, 1.7s) * 4) linear calc(1.5s + var(--bdl, 0s)) infinite; }

  /* Scroll-out on a named view timeline (compositor). No fallback where unsupported (spec §11 step 6). */
  @supports (animation-timeline: view()) {
    .hero { view-timeline: --hero block; }
    .hero .m { --ox: var(--dox, 0px); --oy: var(--doy, 120px); animation: hero-m-out linear both; animation-timeline: --hero; animation-range: exit 0% exit 100%; }
    .hero .p-scroll { animation: hero-p-out linear both; animation-timeline: --hero; animation-range: exit 0% exit 100%; }
    .hero .hero-copy { animation: hero-copy-out linear both; animation-timeline: --hero; animation-range: exit 0% exit 100%; }
    .hero .hero-stage > .layer-bg { animation: hero-bg-out linear both; animation-timeline: --hero; animation-range: exit 0% exit 100%; }
    @media (max-width: 767px) {
      .hero .m { --ox: var(--mox, 0px); --oy: var(--moy, 100px); }
    }
  }
}
@keyframes hero-m-out { to { transform: translate(var(--ox, 0px), var(--oy, 120px)) rotate(var(--or, 0deg)); } }
@keyframes hero-p-out { to { transform: translateY(120px) scale(0.92); } }
@keyframes hero-copy-out { to { transform: translateY(-110px); opacity: 0.1; } }
@keyframes hero-bg-out { to { transform: translateY(140px); } }
```

- [ ] **Step 6: Put the hero on the page and in the lab**

Replace `src/app/page.tsx` with:

```tsx
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import { Work } from "@/components/Work";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";
import MotionRuntime from "@/motion/MotionRuntime";

// Shell sections until Phase 4 replaces them.
const shellSections = [sections.moreWork, sections.capabilities, sections.experience, sections.about, sections.contact];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Work />
        {shellSections.map((s) => (
          <section key={s.id} id={s.id} className="section" aria-labelledby={`${s.id}-h`}>
            <div className="wrap">
              <h2 id={`${s.id}-h`} className="section-h">
                {s.heading}
              </h2>
            </div>
          </section>
        ))}
      </main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
```

Replace `src/app/dev/scenes/[id]/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HeroStage } from "@/components/Hero";
import { Sprite } from "@/components/Sprite";
import { compactProjects, fullProjects } from "@/content/projects";
import MotionRuntime from "@/motion/MotionRuntime";
import { compactScenes, fullScenes } from "@/scenes";
import { cssVars } from "@/scenes/grid";

// Fully static (spec §14): without SCENE_LAB=1 there are no params, so every path 404s and no function is made.
export const dynamicParams = false;
export const metadata: Metadata = { robots: { index: false, follow: false } };

const WIDTHS = [820, 600, 358];

function labIds(): string[] {
  return ["hero", ...[...fullProjects, ...compactProjects].map((p) => p.slug)];
}

export function generateStaticParams() {
  return process.env.SCENE_LAB === "1" ? labIds().map((id) => ({ id })) : [];
}

export default async function SceneLab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const full = fullProjects.find((p) => p.slug === id);
  const compact = compactProjects.find((p) => p.slug === id);
  if (id !== "hero" && !full && !compact) notFound();
  const render = () => {
    if (id === "hero") return <HeroStage />;
    if (full) {
      const Scene = fullScenes[full.slug];
      return <Scene project={full} />;
    }
    const Scene = compactScenes[compact!.slug];
    return <Scene project={compact!} />;
  };
  return (
    <main className="lab" style={id === "hero" ? undefined : cssVars({ "--tint": `var(--color-tint-${id})` })}>
      <Sprite />
      {WIDTHS.map((w) => (
        <div key={w} className="lab-frame" style={{ width: w }}>
          {render()}
        </div>
      ))}
      <MotionRuntime />
    </main>
  );
}
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (hero.test.tsx 9, engine.test.ts 12, page.test.tsx still one h1).

- [ ] **Step 8: Check the bobs composite**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/anim_raw.py hero
```

Expected: no line for `bob` (or any `hero-*` animation) shows `compositeFailed=`, and the last line reads `all animations composited` for the hero. Keep the server running for Step 10.

- [ ] **Step 9: Only if Step 8 shows `bob` with `compositeFailed`: start the bobs with `.ready`**

Skip this step when Step 8 is clean. Otherwise:

Add to `describe("startMotion", ...)` in `tests/engine.test.ts`:

```ts
  it("marks the hero ready after its entrance, and clears it on stop", () => {
    const [hero] = mountStages("hero");
    const { stop } = start({}, {}); // the fake setTimeout runs at once
    expect(hero.classList.contains("ready")).toBe(true);
    stop();
    expect(hero.classList.contains("ready")).toBe(false);
  });
```

In `src/motion/engine.ts`, add right before `if (pointer) teardown.push(startPointer(...));`:

```ts
  // Hero bobs start once the CSS entrance has finished (spec §7 fallback, loops only).
  const hero = stages.find((stage) => stage.dataset.scene === "hero");
  if (hero) {
    const readyTimer = win.setTimeout(() => hero.classList.add("ready"), 1500);
    teardown.push(() => win.clearTimeout(readyTimer));
  }
```

In `src/components/hero.css`, replace the line

```css
  .hero .bob.loop { animation: bob calc(var(--bd, 1.7s) * 4) linear calc(1.5s + var(--bdl, 0s)) infinite; }
```

with

```css
  .hero-stage.ready .bob.loop { animation: bob calc(var(--bd, 1.7s) * 4) linear var(--bdl, 0s) infinite; }
```

Run `npx vitest run tests/engine.test.ts`, rebuild, restart the server (`serve.py stop`, `npm run build`, `serve.py start`) and run Step 8 again: the `bob` lines must now be clean. Note the result in the PR.

- [ ] **Step 10: Find the LCP element at desktop and mobile**

```bash
npx -y lighthouse@13 http://127.0.0.1:3000/ --preset=desktop --only-categories=performance --output=json --output-path=tools/perf/out/lh-desktop.json --chrome-flags="--headless=new"
node tools/perf/lh-summary.mjs tools/perf/out/lh-desktop.json
npx -y lighthouse@13 http://127.0.0.1:3000/ --only-categories=performance --output=json --output-path=tools/perf/out/lh-mobile.json --chrome-flags="--headless=new"
node tools/perf/lh-summary.mjs tools/perf/out/lh-mobile.json
```

Read the `LCP element:` line of each (the SEO and accessibility lines read FAIL here because only the performance category ran; ignore them in this step). Mobile LCP must be under 2500 ms.

If the desktop LCP element is the portrait `<img>`, switch it to `preload` (the docs' case for an LCP hero image; `preload` must not be combined with `loading` or `fetchPriority`). In `src/components/Hero.tsx` replace the `<Image ... />` inside `.portrait` with:

```tsx
                <Image
                  src={site.portrait.src}
                  alt={site.portrait.alt}
                  width={site.portrait.width}
                  height={site.portrait.height}
                  sizes="(min-width: 768px) 300px, 47vw"
                  preload
                />
```

and in `tests/hero.test.tsx` change the line `expect(img?.getAttribute("loading")).toBe("eager");` to `expect(img?.getAttribute("loading")).not.toBe("lazy");`. Then rebuild, restart the server, run both Lighthouse commands again and keep whichever version gives the lower LCP on both runs (revert to the `fetchPriority="high"` + `loading="eager"` version if `preload` is not better). Paste both summaries and the decision into the PR.

If the LCP element is the slogan (`span.h1-slogan`) or another text node, keep the code as it is.

- [ ] **Step 11: Look at the hero at 1:1**

```bash
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.2 1440 900 --wait 2600
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.2 390 844 --wait 2600
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.2 390 844 --wait 800 --rm
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.2 390 844 --wait 800 --nojs
py -3.11 -I tools/perf/serve.py stop
```

Expected: all `PASS`. Compare `s-1440-00.png` with the slice's `C:\Users\OASIS\scratch-portfolio\slice\shots\final\s-1440-00.png` and `s-390-00.png` with `...\s-390-00.png`: same composition (blob, arch portrait, six mascots at 1440, four at 390), the CTAs above the fold, the green hill at the bottom. The `-rm` and `-nojs` first screenshots show the same finished frame (no hidden mascots, no missing slogan). In Chrome at 1440 open the page, move the pointer: the layers drift a few pixels; scroll down: the mascots fly out and the copy rises and fades.

- [ ] **Step 12: Commit and open the PR**

```bash
git add src/components/Hero.tsx src/components/hero.css src/app/page.tsx src/motion/engine.ts "src/app/dev/scenes/[id]/page.tsx" tests/hero.test.tsx tests/engine.test.ts
git commit -m "Add the hero cast with a CSS entrance, scroll-out and a viewport-driven grid"
git push -u origin rd/3.2-hero
gh pr create --base redesign --title "3.2 Hero cast" --body "Task 3.2. Hero copy + stage (blob, portrait arch, six mascots incl. the Agent Island bot), CSS entrance (H1 and portrait transform only, no preload class), bobs after the entrance, named view-timeline scroll-out, viewport-driven hero grid in the engine, hero in the scene lab. anim_raw and Lighthouse LCP results below."
```

Paste the Step 8 and Step 10 outputs into the PR. Review and merge per the protocol.

### Task 3.3: The Pig Feeds POS scene

**Files:**
- Create: `src/scenes/pos/Scene.tsx`, `src/scenes/pos/scene.css`, `src/content/scene-text.ts`
- Modify: `src/scenes/index.ts` (`pos: PosScene`), `src/app/globals.css` (one import), `tests/content-rules.test.ts` (scan scene text)
- Test: `tests/pos-scene.test.tsx`

**Interfaces:**
- Consumes: `Stage`, `Layer`, `place`, `cssVars` (Task 1.4); `FullProject` with `shot` (Task 1.2); the POS images in `public/work/pos/` (Task 1.2); sprite symbol `s-cloud` (Task 1.3); stage CSS and `device.css` (Task 1.4).
- Produces: `PosScene({ project }: { project: FullProject })`, a stage `[data-scene="pos"]` (grid 820 × 620, mobile 358 × 340) whose parts the choreography (Task 3.4) addresses: `[data-part="laptop"]`, `[data-part="pig"]` (with `data-interactive`), `[data-part="pig-inner"]`, `[data-part="pig-head"]`, `[data-part="sack"]`, `.pig-leg.leg-a` ×2, `.pig-leg.leg-b` ×2, `.pig-ear` ×2, `.pig-eye` ×2, `[data-part="burst"]` ×3. The CSS loops read `--fall`, `--drift`, `--cx`, `--cu`, `--cd` (px, set on the root by the choreography) and run only under `.live`.

Changes from the slice, all for the spec: the pig's legs and shadow become HTML-level elements (spec §11 Rule 3 bans per-frame tweens of SVG internals, and the walk-in swings the legs); the mobile grid follows the stage (`@container stage (width < 760px)` instead of `@media (max-width: 767px)`); both screenshots are rendered and swapped by the container query (clarification 5); pellets rest in a static pour when there is no `.live` (the no-JS and reduced-motion end frame); pellets are round on both grids (`aspect-ratio: 1`); the sack's "50 KG" grows from 12 to 13 design px and the sack and jar texts are hidden on the mobile grid, where they would render under 12 px.

- [ ] **Step 1: Write the failing POS scene test**

Create `tests/pos-scene.test.tsx`:

```tsx
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { fullScenes } from "@/scenes";
import { PosScene } from "@/scenes/pos/Scene";

const project = fullProjects.find((p) => p.slug === "pos")!;
const doc = new JSDOM(`<body>${renderToStaticMarkup(<PosScene project={project} />)}</body>`).window.document;
const stage = doc.querySelector<HTMLElement>('[data-scene="pos"]') as HTMLElement;

describe("POS scene", () => {
  it("is the registered POS scene", () => {
    expect(fullScenes.pos).toBe(PosScene);
  });

  it("shows the counter on the desktop grid and the rail on the mobile grid, both with the real alt text", () => {
    const counter = stage.querySelector('img[src="/work/pos/counter.webp"]');
    const rail = stage.querySelector('img[src="/work/pos/rail.webp"]');
    expect(counter?.classList.contains("shot-d")).toBe(true);
    expect(rail?.classList.contains("shot-m")).toBe(true);
    expect(counter?.getAttribute("alt")).toBe(project.shot?.alt);
    expect(rail?.getAttribute("alt")).toBe(project.shot?.alt);
  });

  it("keeps the saved-sale strips decorative", () => {
    const saved = stage.querySelector(".screen-saved") as HTMLElement;
    expect(saved.getAttribute("aria-hidden")).toBe("true");
    expect([...saved.querySelectorAll("img")].map((i) => i.getAttribute("alt"))).toEqual(["", ""]);
  });

  it("lets the pig react to the pointer from a hidden, non-inert layer", () => {
    const pig = stage.querySelector('[data-part="pig"]') as HTMLElement;
    expect(pig.hasAttribute("data-interactive")).toBe(true);
    const layer = pig.closest(".layer") as HTMLElement;
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    expect(layer.hasAttribute("inert")).toBe(false);
  });

  it("names every part the choreography needs", () => {
    for (const part of ["laptop", "pig", "pig-inner", "pig-head", "sack"]) expect(stage.querySelectorAll(`[data-part="${part}"]`), part).toHaveLength(1);
    expect(stage.querySelectorAll('[data-part="burst"]')).toHaveLength(3);
    expect(stage.querySelectorAll(".pig-leg.leg-a")).toHaveLength(2);
    expect(stage.querySelectorAll(".pig-leg.leg-b")).toHaveLength(2);
    expect(stage.querySelectorAll(".pig-ear")).toHaveLength(2);
    expect(stage.querySelectorAll(".pig-eye")).toHaveLength(2);
  });

  it("keeps the legs out of the SVG, so the walk-in never tweens SVG internals", () => {
    for (const leg of stage.querySelectorAll(".pig-leg")) expect(leg.closest("svg")).toBeNull();
  });

  it("marks every looping element with .loop", () => {
    const loops = [".pellet", ".coin:not(.coin-burst)", ".coin:not(.coin-burst) .coin-y", ".jar", ".sack", ".pig-tail", ".pig-head", ".pig-jaw", ".screen-saved", ".cloud"];
    for (const selector of loops) {
      const found = [...stage.querySelectorAll(selector)];
      expect(found.length, selector).toBeGreaterThan(0);
      for (const el of found) expect(el.classList.contains("loop"), selector).toBe(true);
    }
  });

  it("hides the sack and jar lettering on the mobile grid", () => {
    for (const text of stage.querySelectorAll("text")) expect(text.classList.contains("g-d")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/pos-scene.test.tsx`
Expected: FAIL, `Failed to resolve import "@/scenes/pos/Scene"`.

- [ ] **Step 3: The scene markup**

Scenes are aria-hidden illustrations, but their words are still copy (spec §5: components hold no copy), so they live in one content file that the copy-rule test scans. Create `src/content/scene-text.ts` (Task 3.5 adds `timeLog`; Phases 5 to 7 add their keys to the same object):

```ts
/** Mock UI text drawn inside scenes. Scenes are aria-hidden illustrations, but their words still follow
 *  the copy rules, so they live here and tests/content-rules.test.ts scans them. */
export const sceneText = {
  pos: { peso: "₱", sackLabel: "FEEDS", sackWeight: "50 KG" },
};
```

In `tests/content-rules.test.ts`, add `import * as sceneTextModule from "@/content/scene-text";` to the imports and `sceneText: sceneTextModule,` to `contentModules`.

Create `src/scenes/pos/Scene.tsx` (art from `slice/index.html` lines 119-205):

```tsx
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
```

- [ ] **Step 4: The scene styles**

Create `src/scenes/pos/scene.css` (objects from `slice/styles.css` lines 121-152, motion from lines 229-290):

```css
/* Pig Feeds POS world (ported from the approved slice). The server markup is the finished frame: loops
   run only under .live, several cycles per iteration (each iteration boundary wakes the main thread). */
[data-scene="pos"] { background: var(--color-sky-pos); }
[data-scene="pos"] .hill { position: absolute; left: 0; width: 100%; }
[data-scene="pos"] .hill-far { top: calc(410 * var(--u)); height: calc(300 * var(--u)); }
[data-scene="pos"] .hill-near { top: calc(482 * var(--u)); height: calc(240 * var(--u)); }

/* Screens: the counter on the desktop grid, the order rail on the mobile grid (clarification 5). */
[data-scene="pos"] .shot-d { display: block; }
[data-scene="pos"] .shot-m { display: none; }
[data-scene="pos"] .screen-saved {
  position: absolute; top: calc(10 * var(--u)); bottom: calc(10 * var(--u)); right: calc(10 * var(--u));
  width: calc((100% - 20 * var(--u)) * 0.3298); opacity: 0;
}
[data-scene="pos"] .screen-saved img { width: 100%; height: 100%; object-fit: cover; border-radius: 0 calc(18 * var(--u)) calc(18 * var(--u)) 0; }

/* Coins, jar, sack, pellets */
[data-scene="pos"] .coin { opacity: 0; }
[data-scene="pos"] .coin-y {
  width: 100%; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center;
  background: var(--color-yolk); box-shadow: inset 0 0 0 calc(3 * var(--u)) var(--color-yolk-shade);
}
[data-scene="pos"] .coin-y span { font: 800 calc(17 * var(--u))/1 var(--font-display); color: var(--color-ink); }
[data-scene="pos"] .jar { transform-origin: 50% 100%; }
[data-scene="pos"] .sack { transform: rotate(96deg); transform-origin: 50% 50%; }
/* Without .live (no JavaScript, reduced motion, or before the entrance) the pellets rest as a still pour. */
[data-scene="pos"] .pellet {
  display: block; aspect-ratio: 1; border-radius: 50%; background: #8C5A2B;
  transform: translate(calc(var(--dr) * 18 * var(--u)), calc(var(--i) * 10 * var(--u)));
}

/* The pig: tail, body, head and jaw are separate HTML-level layers; legs and shadow are HTML too. */
[data-scene="pos"] .pig-inner { position: relative; }
[data-scene="pos"] .pig-shadow { position: absolute; left: 24%; top: 91.818%; width: 72%; height: 7.273%; border-radius: 50%; background: rgb(31 27 36 / 0.12); }
[data-scene="pos"] .pig-leg {
  position: absolute; left: var(--l); top: var(--t); width: 6.667%; height: var(--h);
  border-radius: 999px; background: #E7739F; transform-origin: 50% 0%;
}
[data-scene="pos"] .pig-body { position: relative; display: block; width: 100%; height: auto; }
[data-scene="pos"] .pig-tail { position: absolute; left: 88.667%; top: 31.818%; width: 11.333%; height: auto; transform-origin: 29.4% 85%; }
[data-scene="pos"] .pig-head { position: absolute; left: 0; top: 4.545%; width: 50%; transform-origin: 86.67% 68%; }
[data-scene="pos"] .pig-head > svg:not(.pig-jaw) { display: block; width: 100%; height: auto; }
[data-scene="pos"] .pig-jaw { position: absolute; left: 25.333%; top: 82.667%; width: 29.333%; height: auto; transform-origin: 50% 33.3%; }
[data-scene="pos"] .pig-eye, [data-scene="pos"] .pig-ear { transform-box: fill-box; transform-origin: 50% 50%; }
[data-scene="pos"] .pig-ear { transform-origin: 50% 100%; }

/* The mobile grid (stage narrower than 760 px). */
@container stage (width < 760px) {
  [data-scene="pos"] .hill-far { top: calc(214 * var(--u)); height: calc(170 * var(--u)); }
  [data-scene="pos"] .hill-near { top: calc(250 * var(--u)); height: calc(130 * var(--u)); }
  [data-scene="pos"] .shot-d { display: none; }
  [data-scene="pos"] .shot-m { display: block; }
  [data-scene="pos"] .screen-saved { left: calc(10 * var(--u)); width: auto; }
  [data-scene="pos"] .screen-saved img { border-radius: calc(18 * var(--u)); }
}

@media (prefers-reduced-motion: no-preference) {
  /* Six falls per 3 s iteration. --fall and --drift are pixels set by the choreography. */
  [data-scene="pos"].live .pellet { animation: pos-pellet 3s linear infinite; animation-delay: calc(var(--i) * -0.0833s); }
  [data-scene="pos"].live .screen-saved { animation: pos-saved 6s ease-in-out infinite; }
  [data-scene="pos"].live .pig-tail { animation: pos-wag 4s linear infinite; }
  [data-scene="pos"].live .pig-head { animation: pos-eat 6.5s infinite; }
  [data-scene="pos"].live .pig-jaw { animation: pos-chew 6.5s ease-in-out infinite; }
  [data-scene="pos"].live .sack { animation: pos-wobble 5.6s linear infinite; }
  /* One 6 s story: four coins leave the laptop for the jar, then the screen shows the saved sale. */
  [data-scene="pos"].live .coin:not(.coin-burst) { animation: pos-coin-x 6s linear infinite; animation-delay: calc(var(--i) * 0.15s); }
  [data-scene="pos"].live .coin:not(.coin-burst) .coin-y { animation: pos-coin-y 6s infinite; animation-delay: calc(var(--i) * 0.15s); }
  [data-scene="pos"].live .jar { animation: pos-jar 6s infinite; }
}

@keyframes pos-pellet {
  0.00% { transform: translate(0, 0); animation-timing-function: cubic-bezier(.55, .085, .68, .53); }
  16.67% { transform: translate(calc(var(--dr) * var(--drift, 20px) + 4px), var(--fall, 44px)); }
  16.68% { transform: translate(0, 0); animation-timing-function: cubic-bezier(.55, .085, .68, .53); }
  33.33% { transform: translate(calc(var(--dr) * var(--drift, 20px) + 4px), var(--fall, 44px)); }
  33.34% { transform: translate(0, 0); animation-timing-function: cubic-bezier(.55, .085, .68, .53); }
  50.00% { transform: translate(calc(var(--dr) * var(--drift, 20px) + 4px), var(--fall, 44px)); }
  50.01% { transform: translate(0, 0); animation-timing-function: cubic-bezier(.55, .085, .68, .53); }
  66.67% { transform: translate(calc(var(--dr) * var(--drift, 20px) + 4px), var(--fall, 44px)); }
  66.68% { transform: translate(0, 0); animation-timing-function: cubic-bezier(.55, .085, .68, .53); }
  83.33% { transform: translate(calc(var(--dr) * var(--drift, 20px) + 4px), var(--fall, 44px)); }
  83.34% { transform: translate(0, 0); animation-timing-function: cubic-bezier(.55, .085, .68, .53); }
  100.00% { transform: translate(calc(var(--dr) * var(--drift, 20px) + 4px), var(--fall, 44px)); }
}
@keyframes pos-saved { 0%, 22% { opacity: 0; } 26%, 70% { opacity: 1; } 75%, 100% { opacity: 0; } }
@keyframes pos-wag {
  0.00% { transform: rotate(-22deg); animation-timing-function: ease-in-out; }
  12.50% { transform: rotate(22deg); animation-timing-function: ease-in-out; }
  25.00% { transform: rotate(-22deg); animation-timing-function: ease-in-out; }
  37.50% { transform: rotate(22deg); animation-timing-function: ease-in-out; }
  50.00% { transform: rotate(-22deg); animation-timing-function: ease-in-out; }
  62.50% { transform: rotate(22deg); animation-timing-function: ease-in-out; }
  75.00% { transform: rotate(-22deg); animation-timing-function: ease-in-out; }
  87.50% { transform: rotate(22deg); animation-timing-function: ease-in-out; }
  100% { transform: rotate(-22deg); }
}
@keyframes pos-eat {
  0% { transform: rotate(0deg); animation-timing-function: cubic-bezier(.45, 0, .55, 1); }
  6.15% { transform: rotate(-14deg); }
  66% { transform: rotate(-14deg); animation-timing-function: cubic-bezier(.34, 1.56, .64, 1); }
  73% { transform: rotate(0deg); }
  100% { transform: rotate(0deg); }
}
@keyframes pos-chew {
  0%, 6.15% { transform: rotate(0deg); }
  9.23% { transform: rotate(9deg); }
  12.30% { transform: rotate(0deg); }
  15.38% { transform: rotate(9deg); }
  18.46% { transform: rotate(0deg); }
  21.53% { transform: rotate(9deg); }
  24.61% { transform: rotate(0deg); }
  27.69% { transform: rotate(9deg); }
  30.77% { transform: rotate(0deg); }
  33.84% { transform: rotate(9deg); }
  36.92% { transform: rotate(0deg); }
  40.00% { transform: rotate(9deg); }
  43.07% { transform: rotate(0deg); }
  46.15% { transform: rotate(9deg); }
  49.23% { transform: rotate(0deg); }
  52.30% { transform: rotate(9deg); }
  55.38% { transform: rotate(0deg); }
  58.46% { transform: rotate(9deg); }
  61.54% { transform: rotate(0deg); }
  64.61% { transform: rotate(9deg); }
  67%, 100% { transform: rotate(0deg); }
}
@keyframes pos-wobble {
  0.00% { transform: rotate(95deg); animation-timing-function: ease-in-out; }
  25.00% { transform: rotate(97deg); animation-timing-function: ease-in-out; }
  50.00% { transform: rotate(95deg); animation-timing-function: ease-in-out; }
  75.00% { transform: rotate(97deg); animation-timing-function: ease-in-out; }
  100% { transform: rotate(95deg); }
}
@keyframes pos-coin-x {
  0% { transform: translateX(0); opacity: 1; }
  11.67% { transform: translateX(var(--cx)); opacity: 1; }
  12%, 100% { transform: translateX(var(--cx)); opacity: 0; }
}
@keyframes pos-coin-y {
  0% { transform: translateY(0) scale(.4); animation-timing-function: cubic-bezier(.25, .46, .45, .94); }
  2.5% { transform: translateY(calc(var(--cu) * -0.62)) scale(1); animation-timing-function: cubic-bezier(.25, .46, .45, .94); }
  5.83% { transform: translateY(calc(var(--cu) * -1)) scale(1); animation-timing-function: cubic-bezier(.55, .085, .68, .53); }
  11.67%, 100% { transform: translateY(var(--cd)) scale(1); }
}
@keyframes pos-jar {
  0%, 11.4% { transform: rotate(0deg); }
  13% { transform: rotate(4deg); }
  15% { transform: rotate(-3deg); }
  17% { transform: rotate(4deg); }
  19% { transform: rotate(-3deg); }
  21% { transform: rotate(2deg); }
  23%, 100% { transform: rotate(0deg); }
}
```

In `src/app/globals.css`, add after the `basic/scene.css` import:

```css
@import "../scenes/pos/scene.css" layer(scenes);
```

In `src/scenes/index.ts`, add `import { PosScene } from "./pos/Scene";` and change the `pos` entry of `fullScenes` to:

```ts
  pos: PosScene,
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass, including pos-scene.test.tsx (8), the POS rows of scenes.test.tsx (DOM well under 300) and the POS rows of choreo-contract.test.tsx (the basic choreography still drives it until Task 3.4; it finds no `[data-part="mascot"]` and simply adds `.live`).

- [ ] **Step 6: Look at the scene in the lab at 1:1**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
```

Open `http://127.0.0.1:3000/dev/scenes/pos` in Chrome at 1440 wide. The 820 frame (desktop grid) matches the slice's POS stage (`C:\Users\OASIS\scratch-portfolio\slice\shots\final\s-1440-01.png`): laptop with the counter screenshot, sack on its side pouring pellets into the trough, pig at the trough, jar of coins, two clouds, the far and near hills. The 600 and 358 frames show the mobile grid with the order-rail screenshot and no sack or jar lettering. With the basic choreography, loops start on view: pellets fall, the tail wags, the head dips to eat, coins hop to the jar and the rail flips to "Cash sale saved". Then `py -3.11 -I tools/perf/serve.py stop`.

- [ ] **Step 7: Commit and open the PR**

```bash
git add src/scenes/pos/Scene.tsx src/scenes/pos/scene.css src/scenes/index.ts src/app/globals.css tests/pos-scene.test.tsx
git commit -m "Port the Pig Feeds POS scene to the stage system"
git push -u origin rd/3.3-pos-scene
gh pr create --base redesign --title "3.3 Pig Feeds POS scene" --body "Task 3.3. Slice POS art on the stage grid (820x620 / 358x340), both screenshots swapped by the container query, HTML-level legs and shadow, CSS loops under .live, still pour without .live, 50 KG at 13 design px, sack and jar lettering hidden on the mobile grid. Lab screenshots attached."
```

Review and merge per the protocol.

### Task 3.4: The POS choreography

**Files:**
- Create: `src/scenes/pos/choreo.ts`
- Modify: `src/motion/registry.ts` (the `pos` loader)
- Test: `tests/pos-choreo.test.tsx`

**Interfaces:**
- Consumes: the choreography contract and `Choreo` (Task 1.5); the POS parts (Task 3.3); `finishAllTweens`, `setWidth` (Task 1.5 helpers).
- Produces: `src/scenes/pos/choreo.ts` default export `Choreo`, handle name `"choreo:pos"`. On `enter()` it sets `--fall`, `--drift`, `--cx`, `--cu`, `--cd` (px) on the root; `cleanup()` removes them.

- [ ] **Step 1: Write the failing test**

Create `tests/pos-choreo.test.tsx`:

```tsx
// @vitest-environment jsdom
import { gsap } from "gsap";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { registry } from "@/motion/registry";
import type { SceneEnv } from "@/motion/types";
import choreo from "@/scenes/pos/choreo";
import { PosScene } from "@/scenes/pos/Scene";
import { finishAllTweens, setWidth } from "./helpers";

const project = fullProjects.find((p) => p.slug === "pos")!;
const markup = renderToStaticMarkup(<PosScene project={project} />);

function mount(width = 820) {
  document.body.innerHTML = markup;
  const root = document.querySelector<HTMLElement>('[data-scene="pos"]') as HTMLElement;
  setWidth(root, width);
  return root;
}
const env = (skipEntrance: boolean, mobile = false): SceneEnv => ({ gsap, mobile, pointer: false, skipEntrance });

describe("POS choreography", () => {
  beforeEach(() => {
    gsap.globalTimeline.clear();
  });

  it("is the registered POS choreography", async () => {
    expect((await registry.pos()).default).toBe(choreo);
  });

  it("sets the loop distances in pixels on enter and removes them on cleanup", () => {
    const root = mount(820);
    const handle = choreo(root, env(true));
    expect(root.style.getPropertyValue("--fall")).toBe("");
    handle.enter();
    expect(root.style.getPropertyValue("--fall")).toBe("84px");
    expect(root.style.getPropertyValue("--cx")).toBe("196px");
    handle.cleanup();
    expect(root.style.getPropertyValue("--fall")).toBe("");
  });

  it("scales the distances to the mobile grid", () => {
    const root = mount(716); // two mobile design px per px
    const handle = choreo(root, env(true, true));
    handle.enter();
    expect(root.style.getPropertyValue("--fall")).toBe("52px");
    handle.cleanup();
  });

  it("starts the pig off-stage and the sack hidden when it has an entrance to play", () => {
    const root = mount(820);
    const handle = choreo(root, env(false));
    const pig = root.querySelector<HTMLElement>('[data-part="pig"]') as HTMLElement;
    const sack = root.querySelector<HTMLElement>('[data-part="sack"]') as HTMLElement;
    expect(pig.style.transform).toContain("-640px");
    expect(sack.style.visibility).toBe("hidden");
    handle.enter();
    finishAllTweens(gsap);
    expect(root.classList.contains("live")).toBe(true);
    expect(sack.style.visibility).not.toBe("hidden");
    handle.cleanup();
  });

  it("hops only once the scene is live", () => {
    const root = mount(820);
    const handle = choreo(root, env(false));
    const pig = root.querySelector<HTMLElement>('[data-part="pig"]') as HTMLElement;
    const inner = root.querySelector<HTMLElement>('[data-part="pig-inner"]') as HTMLElement;
    pig.dispatchEvent(new Event("pointerenter"));
    expect(gsap.getTweensOf(inner)).toHaveLength(0);
    handle.enter();
    finishAllTweens(gsap);
    pig.dispatchEvent(new Event("pointerenter"));
    expect(gsap.getTweensOf(inner).length).toBeGreaterThan(0);
    handle.cleanup();
    expect(gsap.getTweensOf(inner)).toHaveLength(0);
    expect(inner.style.transform).toBe("");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/pos-choreo.test.tsx`
Expected: FAIL, `Failed to resolve import "@/scenes/pos/choreo"`.

- [ ] **Step 3: The choreography**

Create `src/scenes/pos/choreo.ts` (ported from `slice/scenes.js` lines 129-212):

```ts
import type { Choreo } from "@/motion/types";

// Distances in design px for each grid (from the slice). The CSS loops read the first five as pixels.
const DESKTOP = { fall: 84, drift: 22, cx: 196, cu: 86, cd: 80, walk: -640, drop: -360 };
const MOBILE = { fall: 26, drift: 12, cx: 142, cu: 40, cd: 62, walk: -320, drop: -200 };
const LOOP_VARS = ["fall", "drift", "cx", "cu", "cd"] as const;

/** Pig Feeds POS: the laptop rises, the pig walks in, the sack drops and starts pouring; then .live
 *  starts the CSS loops. Hover or tap the pig and it hops while three coins pop out. */
const choreo: Choreo = (root, { gsap, mobile, skipEntrance }) => {
  const one = (selector: string) => root.querySelector<HTMLElement>(selector);
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  const D = mobile ? MOBILE : DESKTOP;
  const u = root.getBoundingClientRect().width / (mobile ? 358 : 820);

  const laptop = one('[data-part="laptop"]');
  const pig = one('[data-part="pig"]');
  const inner = one('[data-part="pig-inner"]');
  const head = one('[data-part="pig-head"]');
  const sack = one('[data-part="sack"]');
  const legsA = all(".pig-leg.leg-a");
  const legsB = all(".pig-leg.leg-b");
  const ears = all(".pig-ear");
  const eyes = all(".pig-eye");
  const burst = all('[data-part="burst"]');
  const targets = [laptop, pig, inner, sack, ...legsA, ...legsB, ...burst].filter((el): el is HTMLElement => el !== null);

  let ready = false;
  let hopping = false;
  let entrance: { kill(): unknown } | undefined;
  const owned: Array<{ kill(): unknown }> = [];
  let flourishes: Animation[] = [];

  if (!skipEntrance) {
    if (laptop) gsap.set(laptop, { y: 40 * u });
    if (pig) gsap.set(pig, { x: D.walk * u });
    if (sack) gsap.set(sack, { y: D.drop * u, rotation: 40, autoAlpha: 0 });
    if (legsA.length) gsap.set(legsA, { rotation: -14 });
    if (legsB.length) gsap.set(legsB, { rotation: 14 });
  }

  const goLive = () => {
    root.classList.add("live");
    ready = true;
  };

  // Each eat cycle, once the head is back up, the ears flick and the eyes blink twice. Short WAAPI
  // flourishes, skipped off-screen and where Element.animate is missing.
  const lookAtYou = () => {
    if (root.classList.contains("paused")) return;
    flourishes = flourishes.filter((a) => a.playState !== "finished");
    ears.forEach((ear, k) => {
      if (typeof ear.animate !== "function") return;
      flourishes.push(
        ear.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(0deg)" }], {
          duration: 260,
          delay: 4850 + k * 60,
          easing: "ease-in-out",
        }),
      );
    });
    for (const eye of eyes) {
      if (typeof eye.animate !== "function") continue;
      flourishes.push(
        eye.animate(
          [{ transform: "scaleY(1)" }, { transform: "scaleY(.1)" }, { transform: "scaleY(1)" }, { transform: "scaleY(.1)" }, { transform: "scaleY(1)" }],
          { duration: 300, delay: 5150, easing: "ease-in-out" },
        ),
      );
    }
  };

  const hop = () => {
    if (hopping || !ready || !inner) return;
    hopping = true;
    owned.push(
      gsap
        .timeline({ onComplete: () => { hopping = false; } })
        .to(inner, { y: -24 * u, duration: 0.18, ease: "power2.out" })
        .to(inner, { y: 0, duration: 0.4, ease: "bounce.out" }),
    );
    burst.forEach((coin, i) => {
      owned.push(
        gsap.fromTo(
          coin,
          { x: 0, y: 0, scale: 0.5, autoAlpha: 1 },
          {
            keyframes: [
              { x: (i - 1) * 46 * u, y: -86 * u, scale: 1, duration: 0.35, ease: "power2.out" },
              { y: -40 * u, autoAlpha: 0, duration: 0.35, ease: "power2.in" },
            ],
          },
        ),
      );
    });
  };

  head?.addEventListener("animationstart", lookAtYou);
  head?.addEventListener("animationiteration", lookAtYou);
  pig?.addEventListener("pointerenter", hop);
  pig?.addEventListener("pointerdown", hop);

  return {
    name: "choreo:pos",
    enter() {
      for (const key of LOOP_VARS) root.style.setProperty(`--${key}`, `${D[key] * u}px`);
      if (skipEntrance) {
        goLive();
        return;
      }
      const legs = [...legsA, ...legsB];
      const tl = gsap.timeline();
      if (laptop) tl.to(laptop, { y: 0, duration: 0.6, ease: "power3.out" }, 0);
      if (pig) tl.to(pig, { x: 0, duration: 0.9, ease: "power2.out" }, 0.3);
      if (legsA.length) tl.to(legsA, { rotation: 14, duration: 0.18, yoyo: true, repeat: 4, ease: "sine.inOut" }, 0.3);
      if (legsB.length) tl.to(legsB, { rotation: -14, duration: 0.18, yoyo: true, repeat: 4, ease: "sine.inOut" }, 0.3);
      if (legs.length) tl.to(legs, { rotation: 0, duration: 0.15 }, 1.2);
      if (sack) {
        tl.to(sack, { autoAlpha: 1, duration: 0.1 }, 0.35)
          .to(sack, { y: 0, duration: 0.7, ease: "bounce.out" }, 0.35)
          .to(sack, { rotation: 96, duration: 0.7, ease: "power2.out" }, 0.35);
      }
      tl.add(() => {
        // Hand the sack back to CSS (its resting rotate(96deg) and the wobble loop).
        if (sack) gsap.set(sack, { clearProps: "transform" });
        goLive();
      }, 1.1);
      entrance = tl;
    },
    cleanup() {
      entrance?.kill();
      for (const animation of owned.splice(0)) animation.kill();
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "transform,opacity,visibility" });
      for (const animation of flourishes) animation.cancel();
      flourishes = [];
      head?.removeEventListener("animationstart", lookAtYou);
      head?.removeEventListener("animationiteration", lookAtYou);
      pig?.removeEventListener("pointerenter", hop);
      pig?.removeEventListener("pointerdown", hop);
      for (const key of LOOP_VARS) root.style.removeProperty(`--${key}`);
      root.classList.remove("live");
      ready = false;
      hopping = false;
    },
  };
};

export default choreo;
```

In `src/motion/registry.ts`, change the `pos` entry to:

```ts
  pos: () => import("@/scenes/pos/choreo"),
```

- [ ] **Step 4: Run the tests, including the contract**

Run: `npx vitest run tests/pos-choreo.test.tsx tests/choreo-contract.test.tsx`
Expected: `5 passed` and `36 passed` (the contract's six POS checks now run the real choreography on both grids). Then `npx vitest run && npx tsc --noEmit && npm run lint`: all pass.

- [ ] **Step 5: Check the chunk size and watch it in the lab**

```bash
SCENE_LAB=1 npm run build
node tools/perf/chunks.mjs
py -3.11 -I tools/perf/serve.py start
```

Expected: `ok   choreo:pos <n> KB gz` with n ≤ 8.0, no `WARN` line, then `PASS`. Then measure the one SVG-internal flourish (clarification 17) with the lab still built: `py -3.11 -I tools/perf/serve.py start`, `py -3.11 -I tools/perf/who.py pos 4`. Expected: the JS function list shows the `lookAtYou` work (WAAPI starts) at no more than 2 ms per 6.5 s cycle and no recurring `Layerize` above 2 ms. If it costs more, delete `lookAtYou`, its two `animationstart`/`animationiteration` listeners and the WAAPI cleanup from `choreo.ts` (the loops do not depend on it), re-run the tests, and say so in the PR. In Chrome open `http://127.0.0.1:3000/dev/scenes/pos`: the laptop rises, the pig walks in with its legs swinging, the sack drops and settles on its side, then the loops start. Hover the pig: it hops and three coins pop. Scroll the 820 frame out of view and back: no snap back to the start. Resize the window from 1440 to 700 wide: the 820 frame switches to the mobile grid and keeps its finished frame. Then `py -3.11 -I tools/perf/serve.py stop`.

- [ ] **Step 6: Commit and open the PR**

```bash
git add src/scenes/pos/choreo.ts src/motion/registry.ts tests/pos-choreo.test.tsx
git commit -m "Port the POS choreography to the prepare/enter contract"
git push -u origin rd/3.4-pos-choreo
gh pr create --base redesign --title "3.4 POS choreography" --body "Task 3.4. choreo:pos: start state only when not skipping, entrance then .live, loop distances set in px on enter and removed on cleanup, hop after live, ear/eye flourishes guarded and cancelled, cleanup clears transform/opacity/visibility only. Contract test 36/36. chunks.mjs output below."
```

Paste the `chunks.mjs` output into the PR. Review and merge per the protocol.

### Task 3.5: The AGG Doors time-log scene

**Files:**
- Create: `src/scenes/time-log/Scene.tsx`, `src/scenes/time-log/scene.css`
- Modify: `src/scenes/index.ts` (`"time-log": TimeLogScene`), `src/app/globals.css` (one import), `src/content/scene-text.ts` (`timeLog`)
- Test: `tests/time-log-scene.test.tsx`

**Interfaces:**
- Consumes: `Stage`, `Layer`, `place` (Task 1.4); `FullProject` with `illustrationLabel` and `caption` (Task 1.2); sprite symbols `s-cloud`, `i-check` (Task 1.3).
- Produces: `TimeLogScene({ project }: { project: FullProject })`, a stage `[data-scene="time-log"]` (grid 820 × 620, mobile 358 × 432, `role="img"` named by the illustration label) whose parts the choreography (Task 3.6) addresses: `[data-part="win"]`, `[data-part="win-copy"]`, `[data-part="backed"]`, `[data-part="badge"]`, `[data-part="hour"]`, `[data-part="minute"]`, `.bubble[data-cell][data-time]` (cells `arr`, `start`, `lunch`, `back`, `out`; `arr` is desktop-only), `.ok` inside each, `[data-slot="<cell>"]` holding `.v` and `.flash`, `.total`, `.typing` (desktop-only), `.burst i` ×6, and the fg layer's `.mouse` (where chips are appended).

Changes from the slice: the sheet is `div`/`span` only (spec §8 bans `table`/`th` in scenes; a CSS grid per row replaces the table, 9 columns on the desktop grid and 6 on the mobile grid); the mobile grid follows the stage; the chip font on the mobile grid grows from 11.5 to 12 design px; the typing dots pack four bounces per iteration.

- [ ] **Step 1: Write the failing test**

Create `tests/time-log-scene.test.tsx`:

```tsx
import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { fullScenes } from "@/scenes";
import { TimeLogScene } from "@/scenes/time-log/Scene";

const project = fullProjects.find((p) => p.slug === "time-log")!;
const doc = new JSDOM(`<body>${renderToStaticMarkup(<TimeLogScene project={project} />)}</body>`).window.document;
const stage = doc.querySelector<HTMLElement>('[data-scene="time-log"]') as HTMLElement;

describe("time-log scene", () => {
  it("is the registered time-log scene, named by its illustration label", () => {
    expect(fullScenes["time-log"]).toBe(TimeLogScene);
    expect(stage.getAttribute("role")).toBe("img");
    expect(stage.getAttribute("aria-label")).toBe(project.illustrationLabel);
  });

  it("builds the sheet from rows of nine cells, three of them desktop-only", () => {
    const rows = [...stage.querySelectorAll(".sh-row")];
    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.children, row.textContent ?? "").toHaveLength(9);
      expect([...row.children].filter((c) => c.classList.contains("g-d"))).toHaveLength(3);
    }
  });

  it("pairs every chat bubble with its cell, and hides the arrival pair together on the mobile grid", () => {
    const bubbles = [...stage.querySelectorAll<HTMLElement>(".bubble[data-cell]")];
    expect(bubbles.map((b) => b.dataset.cell)).toEqual(["arr", "start", "lunch", "back", "out"]);
    for (const bubble of bubbles) {
      const cell = stage.querySelector(`[data-slot="${bubble.dataset.cell}"]`);
      expect(cell?.querySelector(".v")?.textContent, bubble.dataset.cell).toBeTruthy();
      expect(cell?.querySelector(".flash")).not.toBeNull();
      expect(cell?.classList.contains("g-d")).toBe(bubble.classList.contains("g-d"));
      expect(bubble.querySelector(".ok use")?.getAttribute("href")).toBe("#i-check");
    }
  });

  it("renders the finished week: Friday's total reads 6:54", () => {
    expect(stage.querySelector(".total")?.textContent).toBe("6:54");
  });

  it("names every part the choreography needs", () => {
    for (const part of ["win", "win-copy", "backed", "badge", "hour", "minute"]) expect(stage.querySelectorAll(`[data-part="${part}"]`), part).toHaveLength(1);
    expect(stage.querySelectorAll(".burst i")).toHaveLength(6);
    expect(stage.querySelector(".typing")?.classList.contains("g-d")).toBe(true);
    expect(stage.querySelector(".layer-fg .mouse")).not.toBeNull();
  });

  it("marks the time-based loops with .loop", () => {
    expect(stage.querySelector(".hand-s")?.classList.contains("loop")).toBe(true);
    for (const dot of stage.querySelectorAll(".typing .dots i")) expect(dot.classList.contains("loop")).toBe(true);
    for (const cloud of stage.querySelectorAll(".cloud")) expect(cloud.classList.contains("loop")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/time-log-scene.test.tsx`
Expected: FAIL, `Failed to resolve import "@/scenes/time-log/Scene"`.

- [ ] **Step 3: The scene markup**

Add the time-log words to `src/content/scene-text.ts`. The anonymised "A. Santos" week is not a real sheet. The result:

```ts
type TimeLogBubble = { cell: "arr" | "start" | "lunch" | "back" | "out"; time: string; text: string; desktopOnly?: boolean };

const timeLogBubbles: TimeLogBubble[] = [
  { cell: "arr", time: "7:21", text: "Arrived 7:21", desktopOnly: true },
  { cell: "start", time: "7:23", text: "Login 7:23" },
  { cell: "lunch", time: "12:04", text: "Lunch out 12:04" },
  { cell: "back", time: "12:47", text: "Back 12:47" },
  { cell: "out", time: "15:00", text: "Out 3:00" },
];

/** Mock UI text drawn inside scenes. Scenes are aria-hidden illustrations, but their words still follow
 *  the copy rules, so they live here and tests/content-rules.test.ts scans them. */
export const sceneText = {
  pos: { peso: "₱", sackLabel: "FEEDS", sackWeight: "50 KG" },
  timeLog: {
    backed: "Backed up",
    title: "Timesheet: A. Santos",
    head: ["Day", "Arrival", "Start", "Break", "In", "Lunch", "In", "Finish", "Total"],
    week: [
      ["Mon", "6:55", "6:58", "9:30", "9:45", "12:00", "12:41", "3:00", "7:21"],
      ["Tue", "7:02", "7:04", "9:41", "9:55", "12:10", "12:52", "3:04", "7:18"],
      ["Wed", "6:57", "7:00", "", "", "11:58", "12:40", "3:00", "7:18"],
      ["Thu", "7:05", "7:06", "9:35", "9:50", "12:05", "12:48", "3:02", "7:13"],
    ],
    friday: { day: "Fri", arr: "7:21", start: "7:23", lunch: "12:04", back: "12:47", out: "3:00", total: "6:54" },
    tabs: ["Week 40", "Week 41"],
    readBack: "Read-back OK",
    avatar: "A",
    bubbles: timeLogBubbles,
  },
};
```

Create `src/scenes/time-log/Scene.tsx` (art from `slice/index.html` lines 238-286):

```tsx
import { sceneText } from "@/content/scene-text";
import type { FullProject } from "@/content/types";
import { type Grid, place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID: Grid = { dw: 820, dh: 620, mdw: 358, mdh: 432 };

// Columns 1, 3 and 4 (Arrival, Break, In) show on the desktop grid only.
const DESKTOP_ONLY = new Set([1, 3, 4]);
const T = sceneText.timeLog;
const HEAD = T.head;
const WEEK = T.week;
const BUBBLES = T.bubbles;
const FRI = T.friday;

const cellClass = (column: number) => [DESKTOP_ONLY.has(column) ? "g-d" : "", column === 8 ? "t" : ""].filter(Boolean).join(" ") || undefined;

function Check() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true">
      <use href="#i-check" />
    </svg>
  );
}

function Slot({ slot, value, desktopOnly }: { slot: string; value: string; desktopOnly?: boolean }) {
  return (
    <span className={desktopOnly ? "g-d" : undefined} data-slot={slot}>
      <span className="v">{value}</span>
      <i className="flash" />
    </span>
  );
}

export function TimeLogScene({ project }: { project: FullProject }) {
  return (
    <Stage slug="time-log" tier="full" grid={GRID} label={project.illustrationLabel}>
      <Layer depth="bg">
        <div className="clock pos" style={place({ x: -64, y: -104, w: 520, mx: 190, my: -30, mw: 190 })}>
          <svg viewBox="0 0 520 520">
            <circle cx="260" cy="268" r="252" fill="#84B4F7" />
            <circle cx="260" cy="260" r="252" fill="#9CC5FF" />
            <g stroke="#1F1B24" strokeLinecap="round">
              <path d="M260 34V66M486 260H454M260 486V454M34 260H66" strokeWidth="12" />
              <path d="M373 64L361 85M456 147L435 159M456 373L435 361M373 456L361 435M147 456L159 435M64 373L85 361M64 147L85 159M147 64L159 85" strokeWidth="7" />
            </g>
          </svg>
        </div>
        <i className="hand hand-h pos" data-part="hour" style={place({ x: 187, y: 26, w: 18, mx: 280.5, my: 18, mw: 9 })} />
        <i className="hand hand-m pos" data-part="minute" style={place({ x: 190, y: 6, w: 12, mx: 282, my: -4, mw: 6 })} />
        <i className="hand hand-s pos loop" style={place({ x: 193, y: -9, w: 6, mx: 283.5, my: -12, mw: 3 })} />
        <i className="hand-cap pos" style={place({ x: 180, y: 140, w: 32, mx: 277, my: 57, mw: 16 })} />
        <svg className="cloud pos loop g-d" style={place({ x: 676, y: 30, w: 120 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="pos g-d" style={place({ x: 560, y: 110, w: 18 })} viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="9" fill="#FF9EC4" />
        </svg>
        <svg className="pos" style={place({ x: 330, y: 572, w: 32, mx: 176, my: 150, mw: 18 })} viewBox="0 0 36 30">
          <path d="M18 0L36 30H0Z" fill="#FFC72C" />
        </svg>
      </Layer>

      <Layer depth="mid">
        <div className="win-wrap pos" style={place({ x: 236, y: 196, w: 566, mx: 12, my: 196, mw: 334 })}>
          <div className="win-copy" data-part="win-copy">
            <span className="pill backed" data-part="backed">
              {T.backed}
            </span>
          </div>
          <div className="win" data-part="win">
            <div className="win-bar">
              <i />
              <i />
              <i />
              <span>{T.title}</span>
            </div>
            <div className="sheet">
              <div className="sh-row sh-head">
                {HEAD.map((label, column) => (
                  <span key={column} className={cellClass(column)}>
                    {label}
                  </span>
                ))}
              </div>
              {WEEK.map((row) => (
                <div key={row[0]} className="sh-row">
                  {row.map((value, column) => (
                    <span key={column} className={cellClass(column)}>
                      {value}
                    </span>
                  ))}
                </div>
              ))}
              <div className="sh-row live">
                <span>{FRI.day}</span>
                <Slot slot="arr" value={FRI.arr} desktopOnly />
                <Slot slot="start" value={FRI.start} />
                <span className="g-d" />
                <span className="g-d" />
                <Slot slot="lunch" value={FRI.lunch} />
                <Slot slot="back" value={FRI.back} />
                <Slot slot="out" value={FRI.out} />
                <span className="t">
                  <span className="total">{FRI.total}</span>
                </span>
              </div>
            </div>
            <div className="win-tabs">
              <span>{T.tabs[0]}</span>
              <span className="on">{T.tabs[1]}</span>
            </div>
          </div>
          <div className="badge" data-part="badge">
            <Check />
            {T.readBack}
            <span className="burst">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      </Layer>

      <Layer depth="fg">
        <div className="bubbles pos" style={place({ x: 22, y: 236, w: 200, mx: 10, my: 18, mw: 160 })}>
          {BUBBLES.map((b) => (
            <div key={b.cell} className={b.desktopOnly ? "bubble g-d" : "bubble"} data-cell={b.cell} data-time={b.time}>
              <b>{T.avatar}</b>
              {b.text}
              <i className="ok">
                <Check />
              </i>
            </div>
          ))}
          <div className="bubble typing g-d">
            <b>{T.avatar}</b>
            <span className="dots">
              <i className="loop" />
              <i className="loop" />
              <i className="loop" />
            </span>
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

- [ ] **Step 4: The scene styles**

Create `src/scenes/time-log/scene.css` (objects from `slice/styles.css` lines 154-202, motion from 292-298, mobile values from 374-396):

```css
/* AGG Doors time-log world (ported from the approved slice). The sheet is div/span only. Every font size
   is at least 13 design px on the desktop grid and 12 on the mobile grid. */
[data-scene="time-log"] { background: var(--color-sky-time-log); }

/* Clock */
[data-scene="time-log"] .hand { display: block; border-radius: 999px; background: var(--color-ink); transform-origin: 50% 100%; }
[data-scene="time-log"] .hand-h { height: calc(130 * var(--u)); transform: rotate(90deg); }
[data-scene="time-log"] .hand-m { height: calc(150 * var(--u)); transform: rotate(0deg); }
[data-scene="time-log"] .hand-s { height: calc(165 * var(--u)); background: var(--color-coral); transform: rotate(200deg); }
[data-scene="time-log"] .hand-cap {
  display: block; aspect-ratio: 1; border-radius: 50%; background: var(--color-ink);
  box-shadow: inset 0 0 0 calc(10 * var(--u)) var(--color-ink), inset 0 0 0 calc(16 * var(--u)) var(--color-coral);
}

/* The timesheet window */
[data-scene="time-log"] .win-copy {
  position: absolute; inset: 0; background: var(--color-paper); border: 2px solid var(--color-ink);
  border-radius: calc(30 * var(--u)); transform: translate(calc(24 * var(--u)), calc(-24 * var(--u)));
}
[data-scene="time-log"] .pill {
  position: absolute; display: inline-flex; align-items: center; height: calc(30 * var(--u)); padding: 0 calc(14 * var(--u));
  border-radius: 999px; background: var(--color-ink); color: var(--color-paper); font: 700 calc(13 * var(--u))/1 var(--font-display); white-space: nowrap;
}
[data-scene="time-log"] .backed { right: calc(18 * var(--u)); top: calc(-15 * var(--u)); }
[data-scene="time-log"] .win { position: relative; background: var(--color-ink); border-radius: calc(30 * var(--u)); padding: 0 calc(10 * var(--u)) calc(10 * var(--u)); }
[data-scene="time-log"] .win-bar { height: calc(42 * var(--u)); display: flex; align-items: center; gap: calc(7 * var(--u)); padding-left: calc(10 * var(--u)); }
[data-scene="time-log"] .win-bar i { width: calc(11 * var(--u)); aspect-ratio: 1; border-radius: 50%; background: var(--color-paper); }
[data-scene="time-log"] .win-bar span { margin-left: calc(14 * var(--u)); color: var(--color-paper); font: 600 calc(13 * var(--u))/1 var(--font-body); }
[data-scene="time-log"] .sheet {
  overflow: clip; background: var(--color-white); border-radius: calc(20 * var(--u)) calc(20 * var(--u)) 0 0;
  font: 500 calc(14 * var(--u))/1 var(--font-body); font-variant-numeric: tabular-nums;
}
[data-scene="time-log"] .sh-row { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); }
[data-scene="time-log"] .sh-row > span {
  position: relative; display: flex; align-items: center; height: calc(36 * var(--u));
  padding-left: calc(10 * var(--u)); border-bottom: 1px solid var(--color-sheet-line); white-space: nowrap;
}
[data-scene="time-log"] .sh-row > span:first-child { padding-left: calc(14 * var(--u)); }
[data-scene="time-log"] .sh-head > span { font-weight: 700; font-size: calc(13 * var(--u)); color: var(--color-muted); background: #F4F7FB; }
[data-scene="time-log"] .sh-row .t { font-weight: 700; }
[data-scene="time-log"] .sh-row.live > span { background: #EEF5FF; }
[data-scene="time-log"] .flash { position: absolute; inset: 2px; z-index: 0; border-radius: calc(6 * var(--u)); background: var(--color-clock); opacity: 0; pointer-events: none; }
[data-scene="time-log"] .v, [data-scene="time-log"] .total { position: relative; z-index: 1; }
[data-scene="time-log"] .win-tabs { display: flex; gap: calc(4 * var(--u)); padding: calc(6 * var(--u)) calc(10 * var(--u)); background: var(--color-sheets-green); border-radius: 0 0 calc(20 * var(--u)) calc(20 * var(--u)); }
[data-scene="time-log"] .win-tabs span { color: #fff; font: 600 calc(13 * var(--u))/1 var(--font-body); padding: calc(7 * var(--u)) calc(12 * var(--u)); border-radius: 999px; }
[data-scene="time-log"] .win-tabs .on { background: #0E5C35; }
[data-scene="time-log"] .badge {
  position: absolute; right: calc(-6 * var(--u)); bottom: calc(-22 * var(--u)); display: inline-flex; align-items: center; gap: calc(8 * var(--u));
  height: calc(44 * var(--u)); padding: 0 calc(18 * var(--u)); border-radius: 999px; white-space: nowrap;
  background: var(--color-sheets-green); color: #fff; font: 700 calc(15 * var(--u))/1 var(--font-display);
  box-shadow: 0 calc(4 * var(--u)) 0 #0B4A2A, 0 0 0 3px var(--color-sky-time-log);
}
[data-scene="time-log"] .badge svg { width: calc(16 * var(--u)); height: calc(16 * var(--u)); fill: currentColor; }
[data-scene="time-log"] .burst { position: absolute; left: 50%; top: 50%; width: 0; height: 0; }
[data-scene="time-log"] .burst i {
  position: absolute; left: calc(-5 * var(--u)); top: calc(-5 * var(--u)); width: calc(10 * var(--u)); aspect-ratio: 1;
  border-radius: 50%; background: var(--color-yolk); opacity: 0;
}
[data-scene="time-log"] .burst i:nth-child(2n) { background: var(--color-coral); }
[data-scene="time-log"] .burst i:nth-child(3n) { background: var(--color-avatar); }

/* Chat bubbles and the chips the choreography flies into the sheet */
[data-scene="time-log"] .bubbles { display: grid; gap: calc(12 * var(--u)); }
[data-scene="time-log"] .bubble {
  position: relative; display: flex; align-items: center; gap: calc(10 * var(--u)); width: max-content; max-width: 100%;
  height: calc(46 * var(--u)); padding: 0 calc(16 * var(--u)) 0 calc(8 * var(--u)); transform-origin: 0% 100%;
  background: var(--color-white); border-radius: calc(16 * var(--u)) calc(16 * var(--u)) calc(16 * var(--u)) calc(4 * var(--u));
  box-shadow: 0 calc(4 * var(--u)) 0 #B6CFF0; font: 600 calc(15 * var(--u))/1 var(--font-body); white-space: nowrap;
}
[data-scene="time-log"] .bubble b {
  flex: none; display: grid; place-items: center; width: calc(30 * var(--u)); aspect-ratio: 1; border-radius: 50%;
  background: var(--color-avatar); color: #fff; font: 700 calc(14 * var(--u))/1 var(--font-display);
}
[data-scene="time-log"] .ok {
  position: absolute; right: calc(-8 * var(--u)); top: calc(-8 * var(--u)); display: grid; place-items: center;
  width: calc(22 * var(--u)); aspect-ratio: 1; border-radius: 50%; background: var(--color-sheets-green); color: #fff;
}
[data-scene="time-log"] .ok svg { width: 60%; height: 60%; fill: currentColor; }
[data-scene="time-log"] .dots { display: flex; gap: calc(5 * var(--u)); padding: 0 calc(4 * var(--u)); }
[data-scene="time-log"] .dots i { width: calc(8 * var(--u)); aspect-ratio: 1; border-radius: 50%; background: var(--color-muted); }
[data-scene="time-log"] .chip {
  position: absolute; left: 0; top: 0; z-index: 2; display: inline-flex; align-items: center; height: calc(30 * var(--u));
  padding: 0 calc(11 * var(--u)); border-radius: 999px; background: var(--color-avatar); color: #fff;
  font: 700 calc(14 * var(--u))/1 var(--font-display); font-variant-numeric: tabular-nums; white-space: nowrap; will-change: transform;
}

/* The mobile grid (stage narrower than 760 px): six sheet columns and smaller (but >= 12 design px) type. */
@container stage (width < 760px) {
  [data-scene="time-log"] .hand-h { height: calc(47 * var(--u)); }
  [data-scene="time-log"] .hand-m { height: calc(69 * var(--u)); }
  [data-scene="time-log"] .hand-s { height: calc(77 * var(--u)); }
  [data-scene="time-log"] .hand-cap { box-shadow: inset 0 0 0 calc(5 * var(--u)) var(--color-ink), inset 0 0 0 calc(9 * var(--u)) var(--color-coral); }
  [data-scene="time-log"] .sh-row { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  [data-scene="time-log"] .sheet { font-size: calc(12.5 * var(--u)); border-radius: calc(12 * var(--u)) calc(12 * var(--u)) 0 0; }
  [data-scene="time-log"] .sh-head > span { font-size: calc(12 * var(--u)); }
  [data-scene="time-log"] .sh-row > span { height: calc(25 * var(--u)); padding-left: calc(6 * var(--u)); }
  [data-scene="time-log"] .sh-row > span:first-child { padding-left: calc(9 * var(--u)); }
  [data-scene="time-log"] .win { border-radius: calc(18 * var(--u)); padding: 0 calc(6 * var(--u)) calc(6 * var(--u)); }
  [data-scene="time-log"] .win-copy { border-radius: calc(18 * var(--u)); transform: translate(calc(12 * var(--u)), calc(-14 * var(--u))); }
  [data-scene="time-log"] .win-bar { height: calc(26 * var(--u)); gap: calc(4 * var(--u)); padding-left: calc(6 * var(--u)); }
  [data-scene="time-log"] .win-bar i { width: calc(7 * var(--u)); }
  [data-scene="time-log"] .win-bar span { font-size: calc(12 * var(--u)); margin-left: calc(6 * var(--u)); }
  [data-scene="time-log"] .win-tabs { border-radius: 0 0 calc(12 * var(--u)) calc(12 * var(--u)); padding: calc(4 * var(--u)) calc(6 * var(--u)); }
  [data-scene="time-log"] .win-tabs span { font-size: calc(12 * var(--u)); padding: calc(5 * var(--u)) calc(8 * var(--u)); }
  [data-scene="time-log"] .pill { height: calc(22 * var(--u)); font-size: calc(12 * var(--u)); padding: 0 calc(9 * var(--u)); }
  [data-scene="time-log"] .backed { top: calc(-11 * var(--u)); right: calc(10 * var(--u)); }
  [data-scene="time-log"] .badge {
    height: calc(32 * var(--u)); font-size: calc(12.5 * var(--u)); padding: 0 calc(12 * var(--u));
    right: calc(-4 * var(--u)); bottom: calc(-14 * var(--u)); gap: calc(5 * var(--u));
  }
  [data-scene="time-log"] .badge svg { width: calc(12 * var(--u)); height: calc(12 * var(--u)); }
  [data-scene="time-log"] .bubbles { gap: calc(8 * var(--u)); }
  [data-scene="time-log"] .bubble {
    height: calc(32 * var(--u)); font-size: calc(13 * var(--u)); gap: calc(6 * var(--u)); padding: 0 calc(10 * var(--u)) 0 calc(5 * var(--u));
    border-radius: calc(12 * var(--u)) calc(12 * var(--u)) calc(12 * var(--u)) calc(3 * var(--u));
  }
  [data-scene="time-log"] .bubble b { width: calc(22 * var(--u)); font-size: calc(12 * var(--u)); }
  [data-scene="time-log"] .ok { width: calc(16 * var(--u)); right: calc(-5 * var(--u)); top: calc(-5 * var(--u)); }
  [data-scene="time-log"] .chip { height: calc(22 * var(--u)); font-size: calc(12 * var(--u)); padding: 0 calc(8 * var(--u)); }
}

@media (prefers-reduced-motion: no-preference) {
  [data-scene="time-log"].live .hand-s { animation: tl-tick 60s steps(60) infinite; }
  /* Four bounces per iteration; .on is added when the typing bubble has been revealed. */
  [data-scene="time-log"] .typing.on .dots i { animation: tl-dot 4.8s ease-in-out infinite; }
  [data-scene="time-log"] .typing.on .dots i:nth-child(2) { animation-delay: 0.15s; }
  [data-scene="time-log"] .typing.on .dots i:nth-child(3) { animation-delay: 0.3s; }
}
@keyframes tl-tick { from { transform: rotate(200deg); } to { transform: rotate(560deg); } }
@keyframes tl-dot {
  0%, 12.5%, 25%, 37.5%, 50%, 62.5%, 75%, 87.5%, 100% { transform: translateY(0); }
  6.25%, 31.25%, 56.25%, 81.25% { transform: translateY(calc(-4 * var(--u))); }
}
```

In `src/app/globals.css`, add after the `pos/scene.css` import:

```css
@import "../scenes/time-log/scene.css" layer(scenes);
```

In `src/scenes/index.ts`, add `import { TimeLogScene } from "./time-log/Scene";` and change the `"time-log"` entry of `fullScenes` to:

```ts
  "time-log": TimeLogScene,
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (time-log-scene.test.tsx 6; the time-log rows of scenes.test.tsx, including no `table`/`th` and DOM under 300; the contract rows still on the basic choreography).

- [ ] **Step 6: Look at the scene in the lab at 1:1**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/shoot.py tools/perf/out/3.5 1440 900 --wait 3000
py -3.11 -I tools/perf/serve.py stop
```

Before stopping the server, open `http://127.0.0.1:3000/dev/scenes/time-log` in Chrome: the 820 frame matches the slice's time-log stage (`slice\shots\final\s-1440-03.png`): big clock top-left, the timesheet window with "Backed up" and "Read-back OK", five bubbles on the left, the typing bubble. The 600 and 358 frames show six sheet columns and four bubbles, and no text looks smaller than the bubble avatars' "A". (`shoot.py` checks the home page, not the lab; it must still print `PASS`.)

- [ ] **Step 7: Commit and open the PR**

```bash
git add src/scenes/time-log/Scene.tsx src/scenes/time-log/scene.css src/scenes/index.ts src/app/globals.css tests/time-log-scene.test.tsx
git commit -m "Port the time-log scene with a div-only timesheet"
git push -u origin rd/3.5-time-log-scene
gh pr create --base redesign --title "3.5 AGG Doors time-log scene" --body "Task 3.5. Slice time-log art on the stage grid (820x620 / 358x432), sheet rebuilt as div/span grid rows (no table/th), container-query mobile grid, chip 12 design px on mobile, typing dots packed 4 per iteration. Lab screenshots attached."
```

Review and merge per the protocol.

### Task 3.6: The time-log choreography

**Files:**
- Create: `src/scenes/time-log/choreo.ts`
- Modify: `src/motion/registry.ts` (the `"time-log"` loader)
- Test: `tests/time-log-choreo.test.tsx`

**Interfaces:**
- Consumes: the choreography contract (Task 1.5); the time-log parts (Task 3.5); `finishAllTweens`, `setWidth`.
- Produces: `src/scenes/time-log/choreo.ts` default export `Choreo`, handle name `"choreo:time-log"`. It appends `span.chip` elements to the fg layer's `.mouse` during the entrance and removes any left in `cleanup()`; it writes `.total`'s text during the entrance and restores the server text in `cleanup()`.

- [ ] **Step 1: Write the failing test**

Create `tests/time-log-choreo.test.tsx`:

```tsx
// @vitest-environment jsdom
import { gsap } from "gsap";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { fullProjects } from "@/content/projects";
import { registry } from "@/motion/registry";
import type { SceneEnv } from "@/motion/types";
import choreo from "@/scenes/time-log/choreo";
import { TimeLogScene } from "@/scenes/time-log/Scene";
import { finishAllTweens, setWidth } from "./helpers";

const project = fullProjects.find((p) => p.slug === "time-log")!;
const markup = renderToStaticMarkup(<TimeLogScene project={project} />);

function mount(width = 820) {
  document.body.innerHTML = markup;
  const root = document.querySelector<HTMLElement>('[data-scene="time-log"]') as HTMLElement;
  setWidth(root, width);
  return root;
}
const env = (skipEntrance: boolean, mobile = false): SceneEnv => ({ gsap, mobile, pointer: false, skipEntrance });
const entranceTimeline = () => gsap.globalTimeline.getChildren(false, false, true)[0];

describe("time-log choreography", () => {
  beforeEach(() => {
    gsap.globalTimeline.clear();
  });

  it("is the registered time-log choreography", async () => {
    expect((await registry["time-log"]()).default).toBe(choreo);
  });

  it("counts the total up from 0:00 and restores the server text on cleanup", () => {
    const root = mount();
    const total = root.querySelector(".total") as HTMLElement;
    const handle = choreo(root, env(false));
    expect(total.textContent).toBe("0:00");
    handle.enter();
    finishAllTweens(gsap);
    expect(total.textContent).toBe("6:54");
    expect(root.classList.contains("live")).toBe(true);
    expect(root.querySelector(".typing")?.classList.contains("on")).toBe(true);
    handle.cleanup();
    expect(total.textContent).toBe("6:54");
    expect(root.querySelector(".typing")?.classList.contains("on")).toBe(false);
  });

  it("leaves the total alone when skipping the entrance", () => {
    const root = mount();
    const handle = choreo(root, env(true));
    expect(root.querySelector(".total")?.textContent).toBe("6:54");
    handle.enter();
    expect(root.classList.contains("live")).toBe(true);
    handle.cleanup();
  });

  it("flies a chip into the sheet per bubble and removes any left over on cleanup", () => {
    const root = mount();
    const handle = choreo(root, env(false));
    handle.enter();
    entranceTimeline().time(1.7); // past the first bubble's flight start (1.6 s)
    expect(root.querySelectorAll(".layer-fg .mouse > .chip")).toHaveLength(1);
    handle.cleanup();
    expect(root.querySelectorAll(".chip")).toHaveLength(0);
  });

  it("flies only the bubbles shown on the mobile grid", () => {
    const root = mount(358);
    const handle = choreo(root, env(false, true));
    handle.enter();
    entranceTimeline().time(1.6 + 3 * 0.55 + 0.05); // all four mobile flights have started
    expect(root.querySelectorAll(".chip")).toHaveLength(4);
    handle.cleanup();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/time-log-choreo.test.tsx`
Expected: FAIL, `Failed to resolve import "@/scenes/time-log/choreo"`.

- [ ] **Step 3: The choreography**

Create `src/scenes/time-log/choreo.ts` (ported from `slice/scenes.js` lines 214-311):

```ts
import type { Choreo } from "@/motion/types";

/** AGG Doors time-log: the window rises, the chat bubbles pop in, each posted time flies into its cell
 *  as a chip while the clock sweeps to it, then the total counts up, "Read-back OK" pops and the typing
 *  bubble appears. .live is added at the end. */
const choreo: Choreo = (root, { gsap, mobile, skipEntrance }) => {
  const one = (selector: string) => root.querySelector<HTMLElement>(selector);
  const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
  const els = (...items: Array<HTMLElement | null | undefined>) => items.filter((el): el is HTMLElement => Boolean(el));
  const u = root.getBoundingClientRect().width / (mobile ? 358 : 820);

  const win = one('[data-part="win"]');
  const copy = one('[data-part="win-copy"]');
  const backed = one('[data-part="backed"]');
  const badge = one('[data-part="badge"]');
  const hourHand = one('[data-part="hour"]');
  const minuteHand = one('[data-part="minute"]');
  const total = one(".total");
  const dots = all(".burst i");
  const layer = one(".layer-fg .mouse");
  // Desktop-only parts (.g-d) are not shown on the mobile grid, so they take no part there.
  const shown = (el: HTMLElement) => !(mobile && el.classList.contains("g-d"));
  const bubbles = all(".bubble[data-cell]").filter(shown);
  const oks = bubbles.map((b) => b.querySelector<HTMLElement>(".ok"));
  const cells = bubbles.map((b) => one(`[data-slot="${b.dataset.cell}"]`));
  const values = cells.map((c) => c?.querySelector<HTMLElement>(".v") ?? null);
  const flashes = cells.map((c) => c?.querySelector<HTMLElement>(".flash") ?? null);
  const typingEl = one(".typing");
  const typing = typingEl && shown(typingEl) ? typingEl : null;
  const copyEnd = mobile ? { x: 12, y: -14 } : { x: 24, y: -24 };
  const serverTotal = total?.textContent ?? "";
  const targets = els(win, copy, backed, badge, hourHand, minuteHand, typing, ...dots, ...bubbles, ...oks, ...values, ...flashes);
  const owned: Array<{ kill(): unknown }> = [];
  let minuteAngle = 0;

  if (!skipEntrance) {
    gsap.set(els(win), { y: 30 * u });
    gsap.set(els(copy), { x: 0, y: 0 });
    gsap.set(els(backed, badge), { scale: 0, autoAlpha: 0 });
    gsap.set(bubbles, { scale: 0.4, autoAlpha: 0 });
    gsap.set(els(...oks), { scale: 0, autoAlpha: 0 });
    gsap.set(els(typing), { autoAlpha: 0 });
    gsap.set(els(...values), { autoAlpha: 0 });
    gsap.set(els(hourHand), { rotation: 7 * 60 * 0.5 }); // 7:00
    gsap.set(els(minuteHand), { rotation: 0 });
    if (total) total.textContent = "0:00";
  }

  const finish = () => {
    typing?.classList.add("on");
    root.classList.add("live");
  };

  // Minutes since midnight drive both hands; the minute hand always moves forward the short way.
  const sweepTo = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const t = h * 60 + m;
    minuteAngle += ((((t % 60) * 6 - (minuteAngle % 360)) % 360) + 360) % 360;
    if (minuteHand) owned.push(gsap.to(minuteHand, { rotation: minuteAngle, duration: 0.55, ease: "power2.inOut" }));
    if (hourHand) owned.push(gsap.to(hourHand, { rotation: t * 0.5, duration: 0.55, ease: "power2.inOut" }));
  };

  const land = (i: number, time: string, last: boolean) => {
    const value = values[i];
    const flash = flashes[i];
    if (value) owned.push(gsap.to(value, { autoAlpha: 1, duration: 0.25 }));
    if (flash) owned.push(gsap.fromTo(flash, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: 0.5, ease: "power1.out" }));
    sweepTo(time);
    if (!last) return;
    const counter = { minutes: 0 };
    owned.push(
      gsap.to(counter, {
        minutes: 414,
        duration: 0.6,
        delay: 0.3,
        ease: "power1.out",
        onUpdate: () => {
          const m = Math.round(counter.minutes);
          if (total) total.textContent = `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
        },
      }),
    );
    if (badge) owned.push(gsap.to(badge, { scale: 1, autoAlpha: 1, duration: 0.5, delay: 0.95, ease: "back.out(2.2)" }));
    dots.forEach((dot, k) => {
      const angle = (k / dots.length) * Math.PI * 2 - Math.PI / 2;
      owned.push(
        gsap.fromTo(
          dot,
          { x: 0, y: 0, autoAlpha: 1, scale: 1 },
          { x: Math.cos(angle) * 54 * u, y: Math.sin(angle) * 40 * u, autoAlpha: 0, scale: 0.4, duration: 0.6, delay: 1.0, ease: "power2.out" },
        ),
      );
    });
    if (typing) owned.push(gsap.to(typing, { autoAlpha: 1, duration: 0.3, delay: 1.5 }));
    owned.push(gsap.delayedCall(1.85, finish));
  };

  // One-shot flight: a chip with the posted time arcs from the bubble into its cell. Layout is read once
  // per flight (not per frame); the chip removes itself when it lands.
  const fly = (bubble: HTMLElement, i: number) => {
    const cell = cells[i];
    const value = values[i];
    if (!layer || !cell || !value) return;
    const box = layer.getBoundingClientRect();
    const from = bubble.getBoundingClientRect();
    const to = cell.getBoundingClientRect();
    const chip = root.ownerDocument.createElement("span");
    chip.className = "chip";
    chip.textContent = value.textContent;
    layer.appendChild(chip);
    const ox = from.left + from.width * 0.66;
    const oy = from.top + from.height / 2;
    gsap.set(chip, { left: ox - box.left - chip.offsetWidth / 2, top: oy - box.top - chip.offsetHeight / 2 });
    const dx = to.left + to.width / 2 - ox;
    const dy = to.top + to.height / 2 - oy;
    const ok = oks[i];
    if (ok) owned.push(gsap.to(ok, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(2.5)" }));
    owned.push(
      gsap
        .timeline({ onComplete: () => chip.remove() })
        .fromTo(chip, { scale: 0.5, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.16, ease: "back.out(2)" }, 0)
        .to(chip, { x: dx, duration: 0.7, ease: "power1.inOut" }, 0)
        .to(chip, { y: Math.min(0, dy) - 56 * u, duration: 0.32, ease: "power2.out" }, 0)
        .to(chip, { y: dy, duration: 0.38, ease: "power2.in" }, 0.32)
        .to(chip, { scale: 0.7, autoAlpha: 0, duration: 0.12 }, 0.62)
        .add(() => land(i, bubble.dataset.time ?? "15:00", i === bubbles.length - 1), 0.64),
    );
  };

  return {
    name: "choreo:time-log",
    enter() {
      if (skipEntrance) {
        finish();
        return;
      }
      const tl = gsap.timeline();
      if (win) tl.to(win, { y: 0, duration: 0.6, ease: "power3.out" }, 0);
      if (bubbles.length) tl.to(bubbles, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.12 }, 0.3);
      if (copy) tl.to(copy, { x: copyEnd.x * u, y: copyEnd.y * u, duration: 0.4, ease: "power2.out" }, 1.0);
      if (backed) tl.to(backed, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(2)" }, 1.2);
      bubbles.forEach((bubble, i) => tl.add(() => fly(bubble, i), 1.6 + i * 0.55));
      owned.push(tl);
    },
    cleanup() {
      for (const animation of owned.splice(0)) animation.kill();
      for (const chip of root.querySelectorAll(".chip")) chip.remove();
      gsap.killTweensOf(targets);
      gsap.set(targets, { clearProps: "transform,opacity,visibility" });
      if (total) total.textContent = serverTotal;
      typing?.classList.remove("on");
      root.classList.remove("live");
      minuteAngle = 0;
    },
  };
};

export default choreo;
```

In `src/motion/registry.ts`, change the `"time-log"` entry to:

```ts
  "time-log": () => import("@/scenes/time-log/choreo"),
```

- [ ] **Step 4: Run the tests, including the contract**

Run: `npx vitest run tests/time-log-choreo.test.tsx tests/choreo-contract.test.tsx`
Expected: `5 passed` and `36 passed`. Then `npx vitest run && npx tsc --noEmit && npm run lint`: all pass.

- [ ] **Step 5: Check the chunk size and watch it in the lab**

```bash
SCENE_LAB=1 npm run build
node tools/perf/chunks.mjs
py -3.11 -I tools/perf/serve.py start
```

Expected: `ok   choreo:pos`, `ok   choreo:time-log` and `ok   choreo:basic`, each ≤ 8.0 KB gz, then `PASS`. In Chrome open `http://127.0.0.1:3000/dev/scenes/time-log`: the window rises, bubbles pop in, five chips (four in the mobile frames) arc into Friday's cells while the hands sweep to each time, the total counts to 6:54, "Read-back OK" pops with its burst, the typing dots start. Scroll away mid-flight and back: no stray chips. Then `py -3.11 -I tools/perf/serve.py stop`.

- [ ] **Step 6: Commit and open the PR**

```bash
git add src/scenes/time-log/choreo.ts src/motion/registry.ts tests/time-log-choreo.test.tsx
git commit -m "Port the time-log choreography to the prepare/enter contract"
git push -u origin rd/3.6-time-log-choreo
gh pr create --base redesign --title "3.6 Time-log choreography" --body "Task 3.6. choreo:time-log: bubbles, chip flights into the div sheet, clock sweeps, total count-up, badge + burst, typing .on, .live at the end; chips and the total text restored on cleanup; mobile grid flies only its four bubbles. Contract test 36/36. chunks.mjs output below."
```

Paste the `chunks.mjs` output into the PR. Review and merge per the protocol.

### Task 3.7: Phase 3 verification

**Files:**
- Modify: only what the gate's MUST-FIX items require (each fix is a commit on this branch with its own test where testable).

**Interfaces:**
- Consumes: everything from Phases 0 to 3.
- Produces: a phase PR with the gate results; Wrenz's sign-off on the `redesign` preview.

- [ ] **Step 1: Build and start**

```bash
git checkout -b rd/3.7-phase3-gate
npm run build
node tools/perf/chunks.mjs
py -3.11 -I tools/perf/serve.py start
```

Expected: `chunks.mjs` prints `ok` lines for `choreo:pos`, `choreo:time-log` and `choreo:basic`, each ≤ 8.0 KB gz, and `PASS`.

- [ ] **Step 2: Frames on real Chrome**

```bash
py -3.11 -I tools/perf/perf.py 1440 900 1 --check
py -3.11 -I tools/perf/perf.py 1440 900 4 --check
py -3.11 -I tools/perf/perf.py 390 844 1 --mobile --check
py -3.11 -I tools/perf/perf.py 390 844 4 --mobile --check
```

Expected: each ends with `PASS` and lists `park-pos` and `park-time-log` among its phases (plus parks for the four basic worlds). If one fails, find the cause before changing anything: `py -3.11 -I tools/perf/who.py pos 4` (or `time-log`) shows what wakes the main thread while parked, `py -3.11 -I tools/perf/smooth.py 4` shows presented versus dropped frames during the scroll. Fix, rebuild, restart the server (`serve.py stop` then `start`), re-run all four.

- [ ] **Step 3: Compositing**

Run: `py -3.11 -I tools/perf/anim_raw.py`
Expected: `all animations composited`. Any `compositeFailed` line is fixed (the usual causes are in the slice README: an animation that started while invisible, `overflow: hidden`, an SVG-internal change) or explained in the PR.

- [ ] **Step 4: Budgets**

Run: `py -3.11 -I tools/perf/budget.py`
Expected: `PASS` (JS ≤ 150 KB gz at 390×844 including GSAP and the POS choreography, HTML ≤ 80 KB gz, DOM ≤ 2,500, the `pos` and `time-log` stages ≤ 300).

- [ ] **Step 5: Lighthouse mobile**

```bash
npx -y lighthouse@13 http://127.0.0.1:3000/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=tools/perf/out/lh.json --chrome-flags="--headless=new"
node tools/perf/lh-summary.mjs tools/perf/out/lh.json
```

Expected: every line `ok` (LCP < 2500 ms, CLS < 0.1, TBT < 200 ms, SEO 100, accessibility ≥ 95).

- [ ] **Step 6: Accessibility**

Run: `py -3.11 -I tools/perf/a11y.py`
Expected: `PASS`. Then by hand in Chrome at 1440 and at 390 (device mode): Tab from the top: the skip link appears first and jumps to the main content; the wordmark, nav links (menu at 390), "Email me", "See the work", "Download résumé", then each world's links in order, all with a visible focus ring; nothing inside a scene takes focus; Escape closes the menu.

- [ ] **Step 7: Screenshots at 1:1, reduced motion and no JavaScript**

```bash
py -3.11 -I tools/perf/shoot.py tools/perf/out/p3 1440 900
py -3.11 -I tools/perf/shoot.py tools/perf/out/p3 1024 768
py -3.11 -I tools/perf/shoot.py tools/perf/out/p3 820 1180
py -3.11 -I tools/perf/shoot.py tools/perf/out/p3 390 844
py -3.11 -I tools/perf/shoot.py tools/perf/out/p3 390 844 --rm
py -3.11 -I tools/perf/shoot.py tools/perf/out/p3 1440 900 --nojs
py -3.11 -I tools/perf/serve.py stop
```

Expected: every run prints `PASS` (no text under 12 px anywhere, scene text included; no horizontal overflow; no console errors). Open every screenshot at 1:1. Check: the hero composition and the POS and time-log stages match the slice (`C:\Users\OASIS\scratch-portfolio\slice\shots\final\`); the `-rm` and `-nojs` sets show every word, link, image and the finished frame of both scenes (pellets resting in a still pour, the week filled, total 6:54); at 1024 the split worlds use their mobile grids beside the copy; at 820 the stages sit above the copy.

- [ ] **Step 8: Fable design critique**

Dispatch the "Fable critique brief" from the Conventions (Agent tool, `model: "fable"`) with:
- screenshots: `tools/perf/out/p3/s-1440-*.png`, `s-1024-*.png`, `s-820-*.png`, `s-390-*.png`, and the slice references `C:\Users\OASIS\scratch-portfolio\slice\shots\final\s-1440-00.png` to `s-1440-05.png` and `s-390-00.png` to `s-390-07.png`;
- phase under review: "Phase 3: the hero cast, the six world bands (copy, ticks, varied blocks, tags, links, hill edges, split and full-bleed layouts) and the first two finished scenes, Pig Feeds POS and AGG Doors time-log, ported from the approved slice. Check parity with the slice references and flag anything the port lost. Worlds 3 to 6 still show interim basic scenes; judge only their band and copy layout."

Write the reply to `tools/perf/out/p3/fable.md` and paste it into the PR.

- [ ] **Step 9: Fix every MUST-FIX item**

For each MUST-FIX item: change the code (with a test where the item is testable), commit with a message naming the item, then re-run the gate steps it touches (always Steps 2, 4 and 7). List the NICE-TO-HAVE items in the PR for Wrenz to pick; do not do them unasked.

- [ ] **Step 10: Open the phase PR and ask for sign-off**

```bash
git push -u origin rd/3.7-phase3-gate
gh pr create --base redesign --title "3.7 Phase 3 verification gate" --body-file tools/perf/out/p3/pr.md
```

`tools/perf/out/p3/pr.md` holds: the `chunks.mjs`, four `perf.py --check`, `anim_raw.py`, `budget.py`, `lh-summary.mjs`, `a11y.py` and six `shoot.py` summaries; the keyboard pass notes; the Fable critique with each MUST-FIX marked fixed (commit hash) and the NICE-TO-HAVE list; and the `redesign` Vercel preview URL (from `gh pr checks` on this PR once it is merged, or the latest `redesign` deployment). Review and merge per the protocol, then ask Wrenz to sign off Phase 3 on the `redesign` preview. Phase 4 starts after his sign-off.

---

# Phase 4: Capabilities, Experience, About, Contact and More work

Goal: every remaining section of spec §9 and §10 is built, the page reaches its final composition, and the first complete page passes the full verification gate. After this phase the `redesign` preview is a complete, reviewable page: two designed worlds (POS, time-log), four worlds and five vignettes still on their basic scenes.

Read spec §9 and §10, and the Cross-phase contracts in this plan, before starting. Phase 3 has provided `Hero` (`src/components/Hero.tsx`) and `Work` (`src/components/Work.tsx`); check them first:

```bash
grep -n "export function Hero" src/components/Hero.tsx && grep -n "export function Work" src/components/Work.tsx
```

Expected: one line from each file. If either is missing, Phase 3 is not finished: stop.

### Task 4.1: Capabilities and Experience

**Files:**
- Create: `src/components/Capabilities.tsx`, `src/components/Experience.tsx`
- Modify: `src/components/sections.css` (append), `src/app/page.tsx`, `tests/helpers.ts` (append)
- Test: `tests/sections.test.tsx`

**Interfaces:**
- Consumes: `sections`, `site` (Task 1.1); `capabilities`, `stack`, `experience`, `pageCopy()` (Task 1.2); `<Icon>` and the sprite icons `i-stack`, `i-flow-arrow`, `i-browser`, `i-sparkle` (Task 1.3); `buildJsonLd`, `jsonLdHtml` (Task 2.3); `Hero`, `Work` (Phase 3).
- Produces:
  - `<Capabilities />`: `section#capabilities.section.capabilities` labelled by `#capabilities-h`; `.cap` list items (icon, `h3.cap-name`, `p.cap-line`); `.stack-group`s with `h3.stack-name` and `ul.pills`.
  - `<Experience />`: `section#experience.section.experience` labelled by `#experience-h`; `.timeline` with a decorative `span.timeline-line` and `ol.tl-list > li.tl-item` (`.tl-period`, `h3.tl-role`, `.tl-org`, `.tl-detail`, `.tl-body`).
  - Test helpers in `tests/helpers.ts`: `renderDoc(element: ReactElement): Document` and `strayText(doc: Document): string[]` (visible text nodes that are not part of any string in `src/content/`; decorative `aria-hidden` subtrees, scripts and punctuation-only nodes are skipped). Tasks 4.2 and 4.3 use both.

- [ ] **Step 1: Add the shared markup helpers**

Append to `tests/helpers.ts` (and add the four imports at the top of the file, next to the existing `gsap` type import):

```ts
import { JSDOM } from "jsdom";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { pageCopy } from "@/content/page-copy";
import { site } from "@/content/site";
```

```ts
/** Render a server component into a standalone document for markup tests. */
export function renderDoc(element: ReactElement): Document {
  return new JSDOM(`<body>${renderToStaticMarkup(element)}</body>`).window.document;
}

const KNOWN_COPY = [...pageCopy(), ...Object.values(site.labels), ...site.socials.map((s) => s.label)];

/** Visible text that does not come from src/content: components hold no copy (spec §5).
 *  Decorative subtrees (aria-hidden), scripts, styles and punctuation-only text are skipped. */
export function strayText(doc: Document): string[] {
  const stray: string[] = [];
  const walker = doc.createTreeWalker(doc.body, 4); // NodeFilter.SHOW_TEXT
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? "";
    if (!/[A-Za-z0-9]/.test(text)) continue;
    if (node.parentElement?.closest('[aria-hidden="true"], script, style')) continue;
    if (!KNOWN_COPY.some((copy) => copy.includes(text))) stray.push(text);
  }
  return stray;
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/sections.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { Capabilities } from "@/components/Capabilities";
import { Experience } from "@/components/Experience";
import { capabilities, stack } from "@/content/capabilities";
import { experience } from "@/content/experience";
import { sections } from "@/content/sections";
import { renderDoc, strayText } from "./helpers";

function labelledSection(doc: Document, id: string, heading: string) {
  const section = doc.getElementById(id);
  expect(section?.tagName).toBe("SECTION");
  expect(section?.getAttribute("aria-labelledby")).toBe(`${id}-h`);
  const h2 = doc.getElementById(`${id}-h`);
  expect(h2?.tagName).toBe("H2");
  expect(h2?.textContent).toBe(heading);
}

describe("Capabilities", () => {
  const doc = renderDoc(<Capabilities />);

  it("is the capabilities section, labelled by its h2", () => {
    labelledSection(doc, "capabilities", sections.capabilities.heading);
  });

  it("lists the four capabilities in order, each with its Phosphor icon", () => {
    const items = [...doc.querySelectorAll(".cap")];
    expect(items.map((li) => li.querySelector("h3")?.textContent)).toEqual(capabilities.map((c) => c.name));
    expect(items.map((li) => li.querySelector(".cap-line")?.textContent)).toEqual(capabilities.map((c) => c.line));
    items.forEach((li, i) => expect(li.querySelector("use")?.getAttribute("href")).toBe(`#i-${capabilities[i].icon}`));
  });

  it("groups the stack into pills, with no 01 to 04 numbering", () => {
    const groups = [...doc.querySelectorAll(".stack-group")];
    expect(groups.map((g) => g.querySelector("h3")?.textContent)).toEqual(stack.map((g) => g.name));
    groups.forEach((g, i) => expect([...g.querySelectorAll(".pills li")].map((li) => li.textContent)).toEqual(stack[i].items));
    expect(doc.body.textContent).not.toMatch(/\b0[1-4]\b/);
  });

  it("holds no copy of its own", () => {
    expect(strayText(doc)).toEqual([]);
  });
});

describe("Experience", () => {
  const doc = renderDoc(<Experience />);

  it("is the experience section, labelled by its h2", () => {
    labelledSection(doc, "experience", sections.experience.heading);
  });

  it("shows each role in order with its period, employer, detail and body", () => {
    const items = [...doc.querySelectorAll(".tl-item")];
    expect(items).toHaveLength(experience.length);
    items.forEach((li, i) => {
      expect(li.querySelector(".tl-period")?.textContent).toBe(experience[i].period);
      expect(li.querySelector("h3")?.textContent).toBe(experience[i].role);
      expect(li.querySelector(".tl-org")?.textContent).toBe(experience[i].org);
      expect(li.querySelector(".tl-detail")?.textContent).toBe(experience[i].detail);
      expect(li.querySelector(".tl-body")?.textContent).toBe(experience[i].body);
    });
  });

  it("names Managed Virtual Services and has no freelance rows", () => {
    expect(doc.body.textContent).toContain("Managed Virtual Services");
    expect(doc.body.textContent).not.toMatch(/Freelance|Self-employed/);
  });

  it("draws the line as a decorative element", () => {
    expect(doc.querySelector(".timeline-line")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("holds no copy of its own", () => {
    expect(strayText(doc)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run tests/sections.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/Capabilities"`.

- [ ] **Step 4: The two components**

Create `src/components/Capabilities.tsx`:

```tsx
import { capabilities, stack } from "@/content/capabilities";
import { sections } from "@/content/sections";
import { Icon } from "./Icon";

/** Plain paper, no scene: a breather between the worlds and the timeline (spec §10). */
export function Capabilities() {
  const { id, heading } = sections.capabilities;
  return (
    <section id={id} className="section capabilities" aria-labelledby={`${id}-h`}>
      <div className="wrap caps-grid">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
        <ul className="caps-list">
          {capabilities.map((c) => (
            <li key={c.name} className="cap">
              <span className="cap-icon">
                <Icon name={c.icon} />
              </span>
              <div>
                <h3 className="cap-name">{c.name}</h3>
                <p className="cap-line">{c.line}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="stack">
          {stack.map((group) => (
            <div key={group.name} className="stack-group">
              <h3 className="stack-name">{group.name}</h3>
              <ul className="pills">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Create `src/components/Experience.tsx`:

```tsx
import { experience } from "@/content/experience";
import { sections } from "@/content/sections";

/** Vertical timeline. The line draws as the section scrolls (CSS scroll-driven scaleY, transform only). */
export function Experience() {
  const { id, heading } = sections.experience;
  return (
    <section id={id} className="section experience" aria-labelledby={`${id}-h`}>
      <div className="wrap">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
        <div className="timeline">
          <span className="timeline-line" aria-hidden="true" />
          <ol className="tl-list">
            {experience.map((entry) => (
              <li key={`${entry.org}-${entry.role}`} className="tl-item">
                <p className="tl-period">{entry.period}</p>
                <h3 className="tl-role">{entry.role}</h3>
                <p className="tl-org">{entry.org}</p>
                <p className="tl-detail">{entry.detail}</p>
                <p className="tl-body">{entry.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Their styles**

Append to `src/components/sections.css`:

```css
/* Capabilities: a stacked list beside pill groups, on plain paper (spec §10). */
.caps-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 48px 72px; align-items: start; }
.caps-grid > .section-h { grid-column: 1 / -1; }
.caps-list { display: grid; gap: 28px; }
.cap { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 18px; align-items: start; }
.cap-icon {
  width: 52px; height: 52px; border-radius: 999px; display: grid; place-items: center;
  background: var(--color-yolk); box-shadow: 0 4px 0 var(--color-yolk-shade);
}
.cap-icon .icon { width: 26px; height: 26px; }
.cap-name { font: 800 24px/1.15 var(--font-display); }
.cap-line { margin-top: 6px; font-size: 17px; line-height: 1.5; color: var(--color-muted); max-width: 52ch; }
.stack { display: grid; gap: 26px; }
.stack-name { font: 800 18px/1.2 var(--font-display); }
.pills { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px; }
.pills li { padding: 7px 14px; border-radius: 999px; background: #F1E6D3; font: 600 15px/1.2 var(--font-body); }

/* Experience: a vertical timeline whose line draws with the scroll. */
.timeline { position: relative; margin-top: 56px; padding-left: 56px; max-width: 760px; }
.timeline-line {
  position: absolute; left: 13px; top: 10px; bottom: 10px; width: 4px; border-radius: 2px;
  background: var(--color-ink); transform-origin: 50% 0;
}
.tl-list { display: grid; gap: 48px; }
.tl-item { position: relative; }
.tl-item::before {
  content: ""; position: absolute; left: -56px; top: 2px; width: 30px; height: 30px; border-radius: 999px;
  background: var(--color-yolk); box-shadow: 0 4px 0 var(--color-yolk-shade), 0 0 0 5px var(--color-paper);
}
.tl-period { font: 700 15px/1.3 var(--font-body); color: var(--color-muted); }
.tl-role { margin-top: 6px; font: 800 28px/1.15 var(--font-display); }
.tl-org { margin-top: 6px; font-weight: 700; }
.tl-detail { font-size: 16px; color: var(--color-muted); }
.tl-body { margin-top: 12px; }

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .timeline-line { animation: line-draw linear both; animation-timeline: view(); animation-range: entry 10% cover 55%; }
  }
}
@keyframes line-draw { from { transform: scaleY(0); } to { transform: scaleY(1); } }

@media (max-width: 1023px) {
  .caps-grid { grid-template-columns: 1fr; gap: 36px; }
}
@media (max-width: 767px) {
  .timeline { padding-left: 44px; }
  .timeline-line { left: 10px; }
  .tl-item::before { left: -44px; width: 24px; height: 24px; }
  .tl-role { font-size: 23px; }
  .cap-name { font-size: 21px; }
}
```

- [ ] **Step 6: Put them on the page**

Replace `src/app/page.tsx` with:

```tsx
import { Capabilities } from "@/components/Capabilities";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import { Work } from "@/components/Work";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";
import MotionRuntime from "@/motion/MotionRuntime";

/** A section Phase 4 has not built yet: its anchor and heading only (removed in Task 4.3). */
function ShellSection({ id, heading }: { id: string; heading: string }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-h`}>
      <div className="wrap">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Work />
        <ShellSection id={sections.moreWork.id} heading={sections.moreWork.heading} />
        <Capabilities />
        <Experience />
        <ShellSection id={sections.about.id} heading={sections.about.heading} />
        <ShellSection id={sections.contact.id} heading={sections.contact.heading} />
      </main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (sections 9 new; `page.test.tsx` still passes).

- [ ] **Step 8: Look at both sections at 1:1**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/shoot.py tools/perf/out/4.1 1440 900 --wait 700
py -3.11 -I tools/perf/shoot.py tools/perf/out/4.1 390 844 --wait 700
py -3.11 -I tools/perf/serve.py stop
```

Expected: both print `PASS`. In the screenshots that show Capabilities: four rows with yolk icon discs (no numbers), pill groups on the right at 1440 and below the list at 390. In the Experience screenshots: the yolk dots sit centred on the ink line, "Managed Virtual Services" under the first role, no freelance rows. In Chrome at 1440, scroll slowly through Experience: the line grows downward with the scroll; with DevTools "Emulate prefers-reduced-motion: reduce" it is drawn in full from the start.

- [ ] **Step 9: Commit and open the PR**

```bash
git add src/components/Capabilities.tsx src/components/Experience.tsx src/components/sections.css src/app/page.tsx tests/helpers.ts tests/sections.test.tsx
git commit -m "Add the Capabilities list and the Experience timeline"
git push -u origin rd/4.1-capabilities-experience
gh pr create --base redesign --title "4.1 Capabilities and Experience" --body "Task 4.1. Capabilities as a stacked list + stack pill groups (no 01-04), Experience as a vertical timeline (Managed Virtual Services, client AGG Doors) with a scroll-drawn line. Markup tests incl. a no-stray-copy check. Screenshots at 1440 and 390 attached."
```

Review and merge per the protocol.

### Task 4.2: About and Contact

**Files:**
- Create: `src/components/About.tsx`, `src/components/Contact.tsx`
- Modify: `src/components/sections.css` (append), `src/app/page.tsx`, `tests/sections.test.tsx` (append)

**Interfaces:**
- Consumes: `sections`, `site`, `recognition` (Task 1.1); `fullProjects` (Task 1.2); `<ExtLink>`, `<Icon>` (Task 1.3); `<Mascot>`, `cssVars` (Task 1.4); the `bob` keyframes from `src/components/stage.css` (Task 1.4); `renderDoc`, `strayText` (Task 4.1).
- Produces:
  - `<About />`: `section#about` labelled by `#about-h`; `.about-copy` (h2, the two paragraphs, `.about-links` with GitHub and LinkedIn); `ul.stickers > li.sticker.sticker-<recognition id>` (`.sticker-title`, `.sticker-detail`, the subject as a second `.sticker-detail`). No portrait.
  - `<Contact />`: `section#contact.contact` (yolk band) labelled by `#contact-h`; the mascot strip `div.contact-cast[data-scene="contact"][data-tier="strip"][aria-hidden="true"]` with one `.peek > .bob.loop > svg[data-mascot]` per full world in page order; `.contact-inner` with h2, `.contact-line`, the "Email me" button and `p.contact-email`.
  - The About-to-Contact transition is a **straight top edge** (spec §10 is silent; a hill edge would fight the peeking mascots). The band starts 72 px below About and the mascots rise about 60% of their height above its edge.

- [ ] **Step 1: Write the failing tests**

In `tests/sections.test.tsx`, add these imports at the top:

```tsx
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { fullProjects } from "@/content/projects";
import { recognition } from "@/content/recognition";
import { site } from "@/content/site";
```

and append:

```tsx
describe("About", () => {
  const doc = renderDoc(<About />);

  it("is the about section, labelled by its h2", () => {
    labelledSection(doc, "about", sections.about.heading);
  });

  it("tells the story in the two paragraphs", () => {
    expect([...doc.querySelectorAll(".about-copy p")].map((p) => p.textContent)).toEqual([...sections.about.paragraphs]);
  });

  it("links GitHub and LinkedIn in new tabs with noopener", () => {
    const links = [...doc.querySelectorAll(".about-links a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(site.socials.map((s) => s.href));
    for (const a of links) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener");
    }
  });

  it("shows the four honours as stickers, worded by recognition.ts", () => {
    const stickers = [...doc.querySelectorAll(".sticker")];
    expect(stickers.map((s) => s.querySelector(".sticker-title")?.textContent)).toEqual(recognition.map((r) => r.title));
    expect(stickers[1].textContent).toContain("IRCITE 2026");
    expect(stickers[1].textContent).toContain("LiPAD");
  });

  it("does not repeat the portrait", () => {
    expect(doc.querySelector("img")).toBeNull();
  });

  it("holds no copy of its own", () => {
    expect(strayText(doc)).toEqual([]);
  });
});

describe("Contact", () => {
  const doc = renderDoc(<Contact />);

  it("is the contact band, labelled by its h2", () => {
    labelledSection(doc, "contact", sections.contact.heading);
    expect(doc.querySelector(".contact-line")?.textContent).toBe(sections.contact.line);
  });

  it("offers the one contact label, and the address as plain selectable text", () => {
    const links = [...doc.querySelectorAll("a")];
    expect(links.map((a) => a.textContent)).toEqual(["Email me"]);
    expect(links[0].getAttribute("href")).toBe(`mailto:${site.email}`);
    const address = doc.querySelector(".contact-email");
    expect(address?.textContent).toBe(site.email);
    expect(address?.closest("a")).toBeNull();
  });

  it("lets the six world mascots peek over the band from a decorative strip the engine can pause", () => {
    const strip = doc.querySelector('[data-scene="contact"]') as HTMLElement;
    expect(strip.dataset.tier).toBe("strip");
    expect(strip.getAttribute("aria-hidden")).toBe("true");
    expect([...strip.querySelectorAll("svg[data-mascot]")].map((s) => s.getAttribute("data-mascot"))).toEqual(fullProjects.map((p) => p.slug));
    expect([...strip.querySelectorAll(".bob")].every((b) => b.classList.contains("loop"))).toBe(true);
    expect(strip.querySelectorAll("a, button")).toHaveLength(0);
  });

  it("holds no copy of its own", () => {
    expect(strayText(doc)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run tests/sections.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/About"`.

- [ ] **Step 3: The two components**

Create `src/components/About.tsx`:

```tsx
import { recognition } from "@/content/recognition";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { ExtLink } from "./ExtLink";
import { Icon } from "./Icon";

/** Text column beside a sheet of four flat stickers rendered from recognition.ts (spec §10). */
export function About() {
  const { id, heading, paragraphs } = sections.about;
  return (
    <section id={id} className="section about" aria-labelledby={`${id}-h`}>
      <div className="wrap about-grid">
        <div className="about-copy">
          <h2 id={`${id}-h`} className="section-h">
            {heading}
          </h2>
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
          <div className="about-links">
            {site.socials.map((s) => (
              <ExtLink key={s.href} href={s.href} className="text-link">
                {s.label}
                <Icon name="arrow-up-right" />
              </ExtLink>
            ))}
          </div>
        </div>
        <ul className="stickers">
          {recognition.map((r) => (
            <li key={r.id} className={`sticker sticker-${r.id}`}>
              <span className="sticker-title">{r.title}</span>
              <span className="sticker-detail">{r.detail}</span>
              {r.subject ? <span className="sticker-detail">{r.subject}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

Create `src/components/Contact.tsx`:

```tsx
import { fullProjects } from "@/content/projects";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { cssVars } from "@/scenes/grid";
import { Mascot } from "./Mascot";

// Bob timing per mascot, in page order, so the six never move in step (the hero's values).
const BOBS = [
  { bd: "1.5s", bdl: "-0.7s", by: "-10px", br: "4deg" },
  { bd: "1.7s", bdl: "-0.4s", by: "-9px", br: "-3deg" },
  { bd: "1.9s", bdl: "-1.1s", by: "-7px", br: "3deg" },
  { bd: "1.6s", bdl: "-0.2s", by: "-9px", br: "3deg" },
  { bd: "1.75s", bdl: "-0.9s", by: "-7px", br: "-3deg" },
  { bd: "1.8s", bdl: "-1.4s", by: "-8px", br: "-4deg" },
];

/** The closing yolk band. The six world mascots peek over its straight top edge; the strip carries
 *  data-scene so the motion engine pauses its CSS bobs off-screen (spec clarification 9). */
export function Contact() {
  const { id, heading, line } = sections.contact;
  return (
    <section id={id} className="contact" aria-labelledby={`${id}-h`}>
      <div className="contact-cast" data-scene="contact" data-tier="strip" aria-hidden="true">
        {fullProjects.map((p, i) => (
          <div
            key={p.slug}
            className="peek"
            style={cssVars({ "--bd": BOBS[i].bd, "--bdl": BOBS[i].bdl, "--by": BOBS[i].by, "--br": BOBS[i].br })}
          >
            <div className="bob loop">
              <Mascot slug={p.slug} />
            </div>
          </div>
        ))}
      </div>
      <div className="wrap contact-inner">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
        <p className="contact-line">{line}</p>
        <a className="btn btn-primary" href={`mailto:${site.email}`}>
          {site.labels.email}
        </a>
        <p className="contact-email">{site.email}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Their styles**

Append to `src/components/sections.css`:

```css
/* About: a text column beside a sheet of four flat stickers (spec §10). */
.about-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 56px 72px; align-items: center; }
.about-copy p { margin-top: 20px; }
.about-copy .section-h + p { margin-top: 28px; }
.about-links { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 4px 28px; }
.stickers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.sticker {
  display: grid; gap: 4px; align-content: start; padding: 22px 20px; border-radius: var(--radius-md);
  background: var(--s-fill); box-shadow: 0 6px 0 var(--s-shade); transform: rotate(var(--s-tilt));
}
.sticker-cum-laude { --s-fill: var(--color-yolk); --s-shade: var(--color-yolk-shade); --s-tilt: -3deg; }
.sticker-ircite-2026 { --s-fill: #FF9EC4; --s-shade: #E7739F; --s-tilt: 2deg; }
.sticker-jpcs-2025 { --s-fill: var(--color-grass); --s-shade: #5FB84A; --s-tilt: 2.5deg; }
.sticker-azure-fundamentals { --s-fill: var(--color-clock); --s-shade: #6FA3EE; --s-tilt: -2deg; }
.sticker-title { font: 800 21px/1.15 var(--font-display); }
.sticker-detail { font: 600 15px/1.35 var(--font-body); }

/* Contact: a centred yolk band with a straight top edge; the world mascots peek over it. */
.contact { position: relative; margin-top: 72px; padding: 128px 0 96px; background: var(--color-yolk); }
.contact-cast {
  position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: flex-end; justify-content: center;
  gap: clamp(12px, 3vw, 40px); transform: translateY(-62%); pointer-events: none;
}
.peek { width: clamp(56px, 7vw, 96px); }
.contact-inner { display: grid; justify-items: center; gap: 22px; text-align: center; }
.contact .section-h { max-width: 22ch; }
.contact-line { font-size: 19px; max-width: 52ch; }
.contact-email { font: 700 18px/1.4 var(--font-body); user-select: all; }

/* The strip's bobs run from the start (no choreography, so no .live); the engine pauses them off-screen. */
@media (prefers-reduced-motion: no-preference) {
  [data-scene="contact"] .bob.loop { animation: bob calc(var(--bd, 1.7s) * 4) linear var(--bdl, 0s) infinite; }
}

@media (max-width: 1023px) {
  .about-grid { grid-template-columns: 1fr; }
  .stickers { max-width: 560px; }
}
@media (max-width: 767px) {
  .stickers { gap: 16px; }
  .sticker { padding: 18px 16px; }
  .sticker-title { font-size: 18px; }
  .contact { padding: 96px 0 72px; }
  .contact-line { font-size: 17px; }
  .peek:nth-child(n + 5) { display: none; }
}
```

- [ ] **Step 5: Put them on the page**

Replace `src/app/page.tsx` with:

```tsx
import { About } from "@/components/About";
import { Capabilities } from "@/components/Capabilities";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import { Work } from "@/components/Work";
import { sections } from "@/content/sections";
import { site } from "@/content/site";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";
import MotionRuntime from "@/motion/MotionRuntime";

/** A section Phase 4 has not built yet: its anchor and heading only (removed in Task 4.3). */
function ShellSection({ id, heading }: { id: string; heading: string }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-h`}>
      <div className="wrap">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Work />
        <ShellSection id={sections.moreWork.id} heading={sections.moreWork.heading} />
        <Capabilities />
        <Experience />
        <About />
        <Contact />
      </main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (sections 19).

- [ ] **Step 7: Look at both sections at 1:1, and check the strip pauses**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/shoot.py tools/perf/out/4.2 1440 900 --wait 700
py -3.11 -I tools/perf/shoot.py tools/perf/out/4.2 390 844 --wait 700
py -3.11 -I tools/perf/serve.py stop
```

Expected: both `PASS`. In the screenshots: About's stickers sit tilted in a 2×2 sheet with their darker shade under each, no portrait; the six mascots (four at 390) rise above the yolk band's straight edge without covering About's last line or links; "Email me" and the address are centred. In Chrome at 1440 (served again with `serve.py start`), DevTools Elements: the strip `[data-scene="contact"]` has `class="contact-cast paused"` while the band is off-screen and loses `paused` when it scrolls in. Stop the server afterwards.

- [ ] **Step 8: Commit and open the PR**

```bash
git add src/components/About.tsx src/components/Contact.tsx src/components/sections.css src/app/page.tsx tests/sections.test.tsx
git commit -m "Add About with the honours sticker sheet and the Contact band"
git push -u origin rd/4.2-about-contact
gh pr create --base redesign --title "4.2 About and Contact" --body "Task 4.2. About: two paragraphs, GitHub/LinkedIn, four flat stickers from recognition.ts, no portrait. Contact: yolk band with a straight top edge, the six world mascots peeking over it (data-scene=contact strip, paused off-screen), Email me + selectable address. Screenshots attached."
```

Review and merge per the protocol.

### Task 4.3: More work (the bento) and the final page

**Files:**
- Create: `src/components/MoreWork.tsx`, `src/components/Vignette.tsx`, `src/components/vignettes.css`
- Modify: `src/app/globals.css` (one import), `src/app/page.tsx` (final), `tests/sections.test.tsx` (append), `tests/page.test.tsx` (two tests)

**Interfaces:**
- Consumes: `compactProjects` (Task 1.2); `award()`, `site`, `sections` (Task 1.1); `Rich` (Task 0.1); `compactScenes`, `cssVars` (Task 1.4); `<ExtLink>`, `<Icon>` (Task 1.3); the `bob` and `drift` keyframes (Task 1.4); `renderDoc`, `strayText` (Task 4.1).
- Produces:
  - `<MoreWork />`: `section#more-work` labelled by `#more-work-h`, holding `div.bento` with the five vignettes in page order.
  - `<Vignette project={CompactProject} />`: `article.vignette.cell-<cell>` labelled by `#<slug>-h`, `--tint` = `--color-tint-<slug>`; the scene from `compactScenes`; `.v-copy` with `h3`, `p.v-summary`, `ul.v-tags`, `p.v-award` (LiPAD), `.v-links` (main link = the first link, plus `Source` when present, or the private label). Links are laid out inside `Vignette` rather than through Phase 3's `ProjectLinks`, because a vignette shows at most the main link and Source, and LiPAD shows its award badge instead.
  - **Vignette scene rule for Phase 7:** the narrowest vignette stage is a "third" cell at a 1024 px viewport: (944 - 5 × 24) / 6 × 2 + 24 - 2 × 20 padding = 258 px. With design width 400, scene text must be at least ⌈12 × 400 / 258⌉ = **19 design px**. A scene with another design width uses ⌈12 × dw / 258⌉.
  - Vignette loops (`[data-tier="compact"] .bob.loop`, `.cloud.loop`) run from the start without `.live` (spec §9: vignettes have no choreography and are never hidden); the engine pauses them off-screen.

- [ ] **Step 1: Write the failing tests**

In `tests/sections.test.tsx`, add these imports at the top:

```tsx
import { MoreWork } from "@/components/MoreWork";
import { compactProjects } from "@/content/projects";
```

(merge `compactProjects` into the existing `@/content/projects` import line), and append:

```tsx
describe("More work", () => {
  const doc = renderDoc(<MoreWork />);
  const cells = [...doc.querySelectorAll("article.vignette")];
  const cell = (slug: string) => doc.querySelector(`article[aria-labelledby="${slug}-h"]`) as HTMLElement;

  it("is the more-work section, labelled by its h2", () => {
    labelledSection(doc, "more-work", sections.moreWork.heading);
  });

  it("fills the bento with the five vignettes in order, each in its cell", () => {
    expect(cells.map((c) => c.querySelector("h3")?.textContent)).toEqual(compactProjects.map((p) => p.name));
    expect(cells.map((c) => [...c.classList].find((k) => k.startsWith("cell-")))).toEqual(compactProjects.map((p) => `cell-${p.cell}`));
  });

  it("puts each project's own scene in its cell", () => {
    cells.forEach((c, i) => expect(c.querySelector(`[data-scene="${compactProjects[i].slug}"]`)).not.toBeNull());
  });

  it("shows the main link and Source, and never makes a whole card a link", () => {
    expect([...cell("keyclick").querySelectorAll("a")].map((a) => a.textContent)).toEqual(["Download for Windows", "Source"]);
    expect([...cell("med42").querySelectorAll("a")].map((a) => a.textContent)).toEqual(["Live app", "Source"]);
    expect(doc.querySelector("a article, a .vignette, a .stage")).toBeNull();
    for (const a of doc.querySelectorAll("a")) expect(a.getAttribute("rel")).toBe("noopener");
  });

  it("gives LiPAD its award badge instead of links", () => {
    expect(cell("lipad").querySelectorAll("a")).toHaveLength(0);
    expect(cell("lipad").querySelector(".v-award")?.textContent).toBe("Best Thesis Paper and Presenter, IRCITE 2026");
  });

  it("keeps every vignette to four tags", () => {
    for (const c of cells) expect(c.querySelectorAll(".v-tags li").length).toBeLessThanOrEqual(4);
  });

  it("holds no copy of its own", () => {
    expect(strayText(doc)).toEqual([]);
  });
});
```

In `tests/page.test.tsx`, add `import { strayText } from "./helpers";` at the top and these tests inside `describe("home page markup", ...)`:

```tsx
  it("shows six worlds and five vignettes", () => {
    expect(doc.querySelectorAll('[data-tier="full"]')).toHaveLength(6);
    expect(doc.querySelectorAll('[data-tier="compact"]')).toHaveLength(5);
  });

  it("holds no visible copy outside src/content", () => {
    expect(strayText(doc)).toEqual([]);
  });
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run tests/sections.test.tsx tests/page.test.tsx`
Expected: FAIL, `Failed to resolve import "@/components/MoreWork"`.

- [ ] **Step 3: The components**

Create `src/components/Vignette.tsx`:

```tsx
import { award } from "@/content/recognition";
import { site } from "@/content/site";
import type { CompactProject } from "@/content/types";
import { Rich } from "@/lib/rich";
import { compactScenes } from "@/scenes";
import { cssVars } from "@/scenes/grid";
import { ExtLink } from "./ExtLink";
import { Icon } from "./Icon";

/** One bento cell (spec §9): its own tint, a small scene with its mascot, the name, a one-sentence
 *  summary, up to four tags, the main link and Source. LiPAD shows its award instead of links.
 *  No whole-card click area. */
export function Vignette({ project }: { project: CompactProject }) {
  const Scene = compactScenes[project.slug];
  const [main] = project.links;
  const source = project.links.find((link) => link.kind === "source" && link !== main);
  const honour = project.awardId ? award(project.awardId) : undefined;
  const privateLabel =
    project.status === "private-client" ? site.labels.privateClient : project.status === "private-product" ? site.labels.privateProduct : undefined;

  return (
    <article
      className={`vignette cell-${project.cell}`}
      aria-labelledby={`${project.slug}-h`}
      style={cssVars({ "--tint": `var(--color-tint-${project.slug})` })}
    >
      <Scene project={project} />
      <div className="v-copy">
        <h3 id={`${project.slug}-h`}>{project.name}</h3>
        <p className="v-summary">
          <Rich text={project.summary} />
        </p>
        <ul className="v-tags" aria-label={site.labels.builtWith}>
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        {honour ? (
          <p className="v-award">
            <Icon name="sparkle" />
            {honour.title}, {honour.detail}
          </p>
        ) : null}
        {main || privateLabel ? (
          <div className="v-links">
            {main ? (
              <ExtLink href={main.href} className="text-link">
                {main.label}
                <Icon name={main.kind === "download" ? "download" : "arrow-up-right"} />
              </ExtLink>
            ) : null}
            {source ? (
              <ExtLink href={source.href} className="text-link">
                {source.label}
                <Icon name="arrow-up-right" />
              </ExtLink>
            ) : null}
            {privateLabel ? <span className="v-note">{privateLabel}</span> : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
```

Create `src/components/MoreWork.tsx`:

```tsx
import { compactProjects } from "@/content/projects";
import { sections } from "@/content/sections";
import { Vignette } from "./Vignette";

/** The five compact projects in a 5-cell bento (spec §9). */
export function MoreWork() {
  const { id, heading } = sections.moreWork;
  return (
    <section id={id} className="section more-work" aria-labelledby={`${id}-h`}>
      <div className="wrap">
        <h2 id={`${id}-h`} className="section-h">
          {heading}
        </h2>
        <div className="bento">
          {compactProjects.map((project) => (
            <Vignette key={project.slug} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Their styles**

Create `src/components/vignettes.css`:

```css
/* More work: the 5-cell bento (spec §9). Desktop 6 columns: wide = 4, narrow = 2, thirds = 2 each. */
.bento { margin-top: 48px; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 24px; align-items: stretch; }
.cell-wide { grid-column: span 4; }
.cell-narrow, .cell-third { grid-column: span 2; }
.vignette {
  display: flex; flex-direction: column; padding: 20px; border-radius: var(--radius-lg);
  background: var(--tint); overflow: clip; /* never hidden */
}
.v-copy { display: flex; flex-direction: column; gap: 12px; flex: 1; padding: 20px 6px 4px; }
.v-copy h3 { font: 800 26px/1.1 var(--font-display); }
.v-summary { font-size: 16px; line-height: 1.5; color: var(--color-muted); }
.v-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.v-tags li { padding: 5px 11px; border-radius: 999px; background: var(--color-white); font: 600 13px/1.2 var(--font-body); }
.v-award {
  display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; padding: 8px 14px; border-radius: 999px;
  background: var(--color-yolk); box-shadow: 0 3px 0 var(--color-yolk-shade); font: 700 14px/1.25 var(--font-display);
}
.v-award .icon { width: 16px; height: 16px; }
.v-links { margin-top: auto; display: flex; flex-wrap: wrap; align-items: center; gap: 0 22px; }
.v-note { font-size: 14px; color: var(--color-muted); }

@media (prefers-reduced-motion: no-preference) {
  /* Vignette loops run from the start (no choreography, never hidden); the engine pauses them off-screen. */
  [data-tier="compact"] .bob.loop { animation: bob calc(var(--bd, 1.7s) * 4) linear var(--bdl, 0s) infinite; }
  [data-tier="compact"] .cloud.loop { animation: drift 9s ease-in-out infinite alternate; }
  /* Hover or keyboard focus plays one extra beat. It carries no information. */
  .vignette:hover [data-part="mascot"],
  .vignette:focus-within [data-part="mascot"] { animation: v-beat .6s cubic-bezier(.34, 1.56, .64, 1); }
  /* Entrance on scroll, transform only. Without scroll timelines the cells simply sit in place. */
  @supports (animation-timeline: view()) {
    .vignette { animation: v-rise linear both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
  }
}
@keyframes v-beat { 0%, 100% { transform: none; } 40% { transform: translateY(-12%) rotate(-6deg); } }
@keyframes v-rise { from { transform: translateY(56px); } to { transform: none; } }

/* Tablet: two columns, Everyday Rockstar spans both. */
@media (max-width: 1023px) {
  .bento { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cell-wide { grid-column: 1 / -1; }
  .cell-narrow, .cell-third { grid-column: auto; }
}
/* Mobile: one column. */
@media (max-width: 767px) {
  .bento { grid-template-columns: 1fr; gap: 20px; }
  .vignette { padding: 16px; }
  .v-copy h3 { font-size: 24px; }
}
```

In `src/app/globals.css`, add after the `sections.css` import line:

```css
@import "../components/vignettes.css" layer(components);
```

- [ ] **Step 5: The final page composition**

Replace `src/app/page.tsx` with (the Cross-phase contracts composition):

```tsx
import { About } from "@/components/About";
import { Capabilities } from "@/components/Capabilities";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { MoreWork } from "@/components/MoreWork";
import { Nav } from "@/components/Nav";
import { Sprite } from "@/components/Sprite";
import { Work } from "@/components/Work";
import { site } from "@/content/site";
import { buildJsonLd, jsonLdHtml } from "@/lib/jsonld";
import MotionRuntime from "@/motion/MotionRuntime";

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(buildJsonLd()) }} />
      <Sprite />
      <a className="skip" href="#main">
        {site.labels.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Work />
        <MoreWork />
        <Capabilities />
        <Experience />
        <About />
        <Contact />
      </main>
      <Footer />
      <MotionRuntime />
    </>
  );
}
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (sections 26, page 9). If `holds no visible copy outside src/content` fails, the message lists the stray text: either it is missing from `pageCopy()` (add it there) or the component invented it (move it into `src/content/`, a label into `site.labels`, and render it from there); never widen the test.

- [ ] **Step 7: Look at the bento at every layout**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
for size in "1440 900" "1024 768" "820 1180" "390 844"; do py -3.11 -I tools/perf/shoot.py tools/perf/out/4.3 $size --wait 700; done
py -3.11 -I tools/perf/serve.py stop
```

Expected: all four `PASS` (no text under 12 px, scenes included; no horizontal overflow). In the More work screenshots: at 1440 and 1024, Everyday Rockstar spans four columns beside LiPAD, then three equal cells; at 820, Everyday Rockstar spans both columns over a 2×2; at 390, one column. Each cell sits on its own tint, links line up at the bottom of each row, LiPAD shows the yolk award badge and no links, no card is wholly clickable. Hover a vignette in Chrome at 1440: its mascot does one hop.

- [ ] **Step 8: Commit and open the PR**

```bash
git add src/components/MoreWork.tsx src/components/Vignette.tsx src/components/vignettes.css src/app/globals.css src/app/page.tsx tests/sections.test.tsx tests/page.test.tsx
git commit -m "Add the More work bento and compose the final page"
git push -u origin rd/4.3-more-work
gh pr create --base redesign --title "4.3 More work bento and the final page" --body "Task 4.3. The 5-cell bento (wide 4 + narrow 2, three thirds; 2 columns on tablet, 1 on mobile), vignettes with tint, scene, summary, tags, main link + Source, LiPAD award badge, scroll-driven entrance and a hover beat. page.tsx reaches its final composition. Vignette scenes need >= 19 design px text (narrowest stage 258 px). Screenshots at 4 sizes attached."
```

Review and merge per the protocol.

### Task 4.4: Phase 4 verification gate (the first complete page)

The page is now complete: hero, two designed worlds, four worlds and five vignettes on basic scenes, and every section. This task runs the whole Verification gate from this plan's front matter against the production build, fixes every failure and every Fable MUST-FIX on this branch, records the results, and asks Wrenz to sign off.

**Files:**
- Create: `docs/verification/phase-4.md`
- Modify: whatever the MUST-FIX items and failed checks require (each fix is its own commit on this branch)

**Interfaces:**
- Consumes: every tool in `tools/perf/` (Task 0.3); the Fable critique brief (front matter).
- Produces: `docs/verification/phase-4.md` (the gate's results), a merged PR with Wrenz's written sign-off. Phase 5 starts only after that sign-off.

- [ ] **Step 1: Branch, build and serve**

```bash
git fetch origin && git checkout redesign && git pull --ff-only && git checkout -b rd/4.4-phase4-gate
npm run build && node tools/perf/chunks.mjs
py -3.11 -I tools/perf/serve.py start
mkdir -p tools/perf/out/4.4
```

Expected: `chunks.mjs` prints `ok` for `choreo:pos`, `choreo:time-log` and `choreo:basic`, then `PASS`.

- [ ] **Step 2: Frames (gate item 2)**

```bash
py -3.11 -I tools/perf/perf.py 1440 900 1 --check
py -3.11 -I tools/perf/perf.py 1440 900 4 --check
py -3.11 -I tools/perf/perf.py 390 844 1 --mobile --check
py -3.11 -I tools/perf/perf.py 390 844 4 --mobile --check
```

Expected: each ends with `PASS`, and lists `hero-idle`, `scroll-down`, `park-pos`, `park-time-log`, `park-service-areas`, `park-katiwala`, `park-stockroom`, `park-agent-island`, `scroll-up`. On `FAIL`, find the cause before changing anything: `py -3.11 -I tools/perf/who.py <slug> 4` (what wakes the main thread while parked) and `py -3.11 -I tools/perf/smooth.py 4` (dropped frames during the scroll). Fix, rebuild, re-run all four.

- [ ] **Step 3: Compositing (gate item 3)**

```bash
py -3.11 -I tools/perf/anim_raw.py
```

Expected: `all animations composited`. Any listed animation name is either fixed (usually an animation that started while invisible, or a non-transform property) or explained in the report with its `compositeFailed` value.

- [ ] **Step 4: Budgets (gate item 4)**

```bash
py -3.11 -I tools/perf/budget.py
```

Expected: `PASS`: JS ≤ 150 KB gz, HTML ≤ 80 KB gz, DOM ≤ 2,500 with every `full` stage ≤ 300 and every `compact` stage ≤ 120. Copy the `js_kb`, `html_kb` and `dom.total` values into the report.

- [ ] **Step 5: Lighthouse mobile (gate item 5)**

```bash
npx -y lighthouse@13 http://127.0.0.1:3000/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=tools/perf/out/lh.json --chrome-flags="--headless=new"
node tools/perf/lh-summary.mjs tools/perf/out/lh.json
```

Expected: `ok` on LCP < 2500 ms, CLS < 0.1, TBT < 200 ms, SEO = 100, Accessibility ≥ 95; the LCP element is printed. If LCP fails and the element is the portrait, apply spec §7: switch the hero portrait from `fetchPriority="high"` + `loading="eager"` to `preload` (never both), rebuild and measure again.

- [ ] **Step 6: Accessibility scan (gate item 6, automated part)**

```bash
py -3.11 -I tools/perf/a11y.py
```

Expected: `PASS` (no serious or critical axe violations at 1440, 390, or 390 with reduced motion).

- [ ] **Step 7: Keyboard-only pass (gate item 6)**

In Chrome at 1440×900 on `http://127.0.0.1:3000/`, mouse untouched, Tab from the address bar and check each line:
1. The first Tab shows "Skip to content" top-left; Enter moves focus to `main`, and the next Tab lands on the hero's "See the work".
2. Without skipping: wordmark, Work, Experience, About, Email me, in that order.
3. Every focus ring is visible (3 px blue `#1F5EFF`, 3 px offset) on paper, every tint and the yolk band.
4. Every world link, every vignette link, About's GitHub and LinkedIn, the Contact "Email me" and the footer links are reachable in reading order.
5. Focus never lands inside a scene (scenes hold no focusable elements).
6. "See the work" (Enter) scrolls to Work with the heading below the sticky bar.

Then at 390×844 (DevTools device mode): Tab to the menu button, Enter opens the menu, Tab moves through Work, Experience, About, Escape closes it and focus returns to the button; open it again, Enter on "About" closes it and lands on About below the bar. Record each line as pass or fail in the report.

- [ ] **Step 8: Reduced motion and JavaScript disabled (gate item 6)**

```bash
py -3.11 -I tools/perf/shoot.py tools/perf/out/4.4 1440 900 --rm --wait 600
py -3.11 -I tools/perf/shoot.py tools/perf/out/4.4 390 844 --rm --wait 600
py -3.11 -I tools/perf/shoot.py tools/perf/out/4.4 1440 900 --nojs --wait 600
py -3.11 -I tools/perf/shoot.py tools/perf/out/4.4 390 844 --nojs --wait 600
```

Expected: all four `PASS`. In the `-rm` and `-nojs` screenshots check: the hero copy and portrait sit in their final place (no half-played entrance); every world shows its finished frame as the server renders it (POS: the pig at the trough with the feed sack tipped over it; time-log: the Friday row filled and the "Read-back OK" badge shown); the Experience line is drawn in full; the vignettes sit in place; every image has loaded; the Contact mascots are visible. In `-nojs` also check every link is present. Then in Chrome with JavaScript disabled (DevTools, Settings, Debugger, Disable JavaScript) at 390 px: the menu button still opens and closes the menu (the Popover API needs no script); after tapping a link the menu may stay open, which is the accepted no-JS behaviour.

- [ ] **Step 9: Screenshots at 1:1 (gate item 7)**

```bash
for size in "1440 900" "1024 768" "820 1180" "390 844"; do py -3.11 -I tools/perf/shoot.py tools/perf/out/4.4 $size --wait 2600; done
```

Expected: four `PASS`. Open every PNG at 1:1 and check: hill edges meet without gaps between hero, Work and each world, and the last world's edge meets paper; no overlap between copy and stage in any world (the bleed worlds' copy panel sits on the calm left region from 1024); the scene text is crisp and readable; the bento rows line up; the Contact mascots do not cover About's text or links; the footer sits flush after the yolk band. List anything wrong as a fix before Step 10.

- [ ] **Step 10: Fable 5.1 design critique (gate item 8)**

Dispatch a subagent with the Agent tool, `model: "fable"`, using the front matter's Fable critique brief with these values:
- Screenshots: every `tools/perf/out/4.4/s-1440-*.png`, `s-1024-*.png`, `s-820-*.png` and `s-390-*.png` (give the absolute paths under `C:\Users\OASIS\Downloads\wrenz-portfolio\tools\perf\out\4.4\`).
- Phase under review: "Phase 4: the first complete page. New in this phase: Capabilities (list + pill groups), Experience (vertical timeline), About (text + four honour stickers), Contact (yolk band with peeking mascots), More work (5-cell bento of vignettes, basic vignette scenes for now). The hero, POS and time-log worlds are from Phase 3; four worlds and all five vignettes are still interim basic scenes, so judge their layout and copy, not their art."

Save its answer as `tools/perf/out/4.4/fable.md`.

- [ ] **Step 11: Fix every MUST-FIX item**

For each MUST-FIX item: make the change, run `npx vitest run && npx tsc --noEmit && npm run lint`, commit it on this branch with a message naming the item (for example `Raise the vignette tag size so it reads at 390`), rebuild and re-run the gate steps the change can affect (always Steps 4 and 9; Step 2 if motion or layers changed; Step 5 if the hero or images changed). Then send the new screenshots of the changed areas back to the same Fable subagent (SendMessage) and ask whether each MUST-FIX is resolved. Repeat until Fable reports no MUST-FIX. NICE-TO-HAVE items are not done here; they go in the report for Wrenz to pick.

- [ ] **Step 12: Write the report**

Create `docs/verification/phase-4.md` with these sections, filled from the runs above (final values after the fixes):

```markdown
# Phase 4 verification (first complete page)

Build: <git rev-parse --short HEAD> on rd/4.4-phase4-gate, measured <date> on Wrenz's laptop (real Chrome).

## Frames (perf.py --check)
| Run | Result | Worst phase (fps / late frames per 300) |
|---|---|---|
| 1440x900 1x | | |
| 1440x900 4x | | |
| 390x844 1x mobile | | |
| 390x844 4x mobile | | |

## Compositing (anim_raw.py)

## Budgets (budget.py)
JS: KB gz. HTML: KB gz. DOM total: . Largest full stage: . Largest compact stage: .

## Lighthouse mobile (lh-summary.mjs)
LCP / CLS / TBT / SEO / Accessibility / LCP element:

## Accessibility
axe (a11y.py): . Keyboard pass: (each checklist line, pass or fail). Reduced motion: . JavaScript disabled: .

## Screenshots (shoot.py, 1:1)
Sizes checked: 1440x900, 1024x768, 820x1180, 390x844. Findings fixed:

## Fable critique
MUST-FIX (all fixed, with the commit for each):
NICE-TO-HAVE (for Wrenz to pick):
```

- [ ] **Step 13: Commit, open the PR and stop the server**

```bash
py -3.11 -I tools/perf/serve.py stop
git add docs/verification/phase-4.md
git commit -m "Record the Phase 4 verification gate"
git push -u origin rd/4.4-phase4-gate
gh pr create --base redesign --title "4.4 Phase 4 verification gate" --body-file docs/verification/phase-4.md
gh pr checks --watch
```

Expected: CI `verify` passes.

- [ ] **Step 14: Ask Wrenz to sign off on the preview**

Find the PR's Vercel preview URL:

```bash
gh pr view --comments | grep -o 'https://[a-z0-9-]*\.vercel\.app' | sort -u
```

Send Wrenz the preview URL and the PR link, with the report's headline numbers and the NICE-TO-HAVE list, and ask him to look at it on his laptop (1440) and his phone. Merge only after his explicit sign-off in writing (on the PR or in chat), with `gh pr merge <N> --merge --delete-branch`. Any change he asks for is made on this branch first, with Steps 4, 9 and (if motion changed) 2 re-run. Phase 5 starts after the merge.

---

# Phase 5: AGG Doors service areas and Katiwala

Goal: two new worlds replace their basic scenes: the full-bleed **service areas** world (a real Service Area page behind a garage door that rolls up, suburb pins popping across a simplified Melbourne map) and the split **Katiwala** world (real app screens in a phone, tools bouncing in, verification steps landing). Each is drafted from this plan, critiqued by Fable 5.1 in the scene lab and on the page, and fixed before the phase gate.

Read spec §4 (illustration rules), §8 (anatomy, scenes table, breakpoints), §11 (choreography contract) and §16 (asset safety), plus the "Cross-phase contracts" in this plan, before starting.

### Scene protocol (applies to every scene task in Phases 5, 6 and 7)

- **Structure.** `Stage` + `Layer` + `place()` from `src/scenes/` (Task 1.4). Decorative layers keep the default `aria-hidden` + `inert`; the layer holding the real screenshot passes `decorative={false}`. Scene text lives in `src/content/scene-text.ts` (below), never in the component.
- **Display and the grid switch.** `.g-d` / `.g-m` hide objects per grid from the components layer, and the scenes layer wins over it. So **never set `display` on an element that carries `.g-d` or `.g-m`**: put the class on the `.pos` wrapper and style an inner element.
- **Motion.** Loops are CSS, transform and opacity only, with unitless or percentage keyframe values (`scale`, `rotate`, `translate` in %), several cycles per iteration, on elements with the `loop` class. World loops run under `.live`; vignette loops run from the start. GSAP only in `choreo.ts`, and only one-shot entrances.
- **Choreography.** Follows the Task 1.5 contract: start state only when `!skipEntrance`; `enter()` plays, then adds `.live`; `cleanup()` kills its timeline and tweens, runs `gsap.set(targets, { clearProps: "transform,opacity,visibility" })` (never `"all"`, which would wipe the inline placement variables), removes anything it appended and removes `.live`. Transform origins live in CSS, not in GSAP calls, so cleanup has nothing else to restore. `Element.animate` does not exist in jsdom: guard any WAAPI use with `typeof el.animate === "function"` and cancel what it returns in `cleanup()`.
- **Mascot hook.** Every world scene marks its mascot wrapper `data-part="mascot"`, so the basic choreography still works between a scene task and its choreography task.
- **Checks that already exist and must pass:** `tests/scenes.test.tsx` (no forbidden elements, DOM budget, aria-hidden/inert, the visual's name, sprite symbols, the 760 px literal, no `overflow: hidden`), `tests/choreo-contract.test.tsx` (both grids), `tests/content-integrity.test.ts` (shot files exist, one of shot or illustration label), `tests/contrast.test.ts` (the final tint), `tests/css-imports.test.ts`.

### Shared scene text

Task 3.3 creates `src/content/scene-text.ts` (keys `pos` and, from Task 3.5, `timeLog`) and adds it to the copy-rule scan in `tests/content-rules.test.ts`. Each task below adds its own key to the existing `sceneText` object and leaves the other keys alone. The keys Phases 5 to 7 add, once all are done:

```ts
/** Mock UI text drawn inside scenes. Scenes are aria-hidden illustrations, but their words still follow
 *  the copy rules, so they live here and tests/content-rules.test.ts scans them. */
export const sceneText = {
  // pos, timeLog: Task 3.3 and Task 3.5
  serviceAreas: { suburbs: ["Box Hill", "Eltham", "Hallam", "Moorabbin"] },
  katiwala: { steps: ["ID scanned", "Face captured", "Waiting for review"] },
  stockroom: { request: "GET /api/products", response: "200 OK" },
  agentIsland: {
    agents: ["Claude Code", "Codex", "Hermes"],
    note: "prompt.json",
    question: "Do you want to proceed?",
    choices: ["Allow once", "Don't ask again", "Deny"],
    handoff: "Continue in Terminal",
  },
  keyclick: { keys: ["Ctrl", "S"] },
  pesowise: { coin: "₱" },
};
```


### Task 5.1: AGG Doors service areas: the screenshot and the scene

**Files:**
- Modify: `.gitignore`
- Create: `tools/scenes/shot.py`, `tools/scenes/find_service_area.py`, `tools/scenes/README.md`
- Create (assets): `public/work/service-areas/page.webp`, `public/work/service-areas/map.svg`
- Modify: `src/content/projects.ts` (service areas: `shot` replaces `illustrationLabel`)
- Create or modify: `src/content/scene-text.ts` (`serviceAreas`), `tests/content-rules.test.ts` (scan it)
- Create: `src/scenes/service-areas/Scene.tsx`, `src/scenes/service-areas/scene.css`
- Modify: `src/scenes/index.ts`, `src/app/globals.css`

**Interfaces:**
- Consumes: `Stage`, `Layer`, `place` (Task 1.4); `DeviceFrame`, `Mascot` (Task 1.4); `FullProject` (Task 1.1); the bleed layout from Task 3.1 (full-width stage, copy panel over desktop x < 560 from 1024 px); device frame geometry from `device.css` (screen padding 10u, title bar 30u with a -4u top margin, so the image starts 36u below the screen's top edge).
- Produces: `ServiceAreasScene` registered as `fullScenes["service-areas"]`; parts `data-part="shot" | "door" | "pin" | "tag" | "mascot"` for Task 5.2; `tools/scenes/shot.py URL OUT.png [--size WxH] [--dpr N] [--wait-for CSS] [--hide CSS] [--wait MS]` (read-only real-Chrome capture, reused in Tasks 6.1 and 7.2).

- [ ] **Step 1: Ignore capture output and add the capture tool**

Append to `.gitignore`:

```gitignore
tools/scenes/out/
```

Create `tools/scenes/shot.py`:

```python
"""Read-only screenshot of one URL in real Chrome, for scene assets. It never clicks or types.
usage: py -3.11 -I tools/scenes/shot.py URL OUT.png [--size 1440x900] [--dpr 1] [--wait-for CSS]
       [--hide CSS] [--wait MS]
--hide hides matching elements (cookie or chat widgets) with CSS before the shot."""
import asyncio
import pathlib
import sys

from playwright.async_api import async_playwright

URL, OUT = sys.argv[1], sys.argv[2]


def opt(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


W, H = (int(v) for v in opt("--size", "1440x900").split("x"))
DPR = float(opt("--dpr", "1"))
WAIT_FOR = opt("--wait-for", "")
HIDE = opt("--hide", "")
WAIT = int(opt("--wait", "1500"))


async def main():
    async with async_playwright() as p:
        # Headed: some sites refuse headless browsers.
        b = await p.chromium.launch(channel="chrome", headless=False)
        ctx = await b.new_context(viewport={"width": W, "height": H}, device_scale_factor=DPR, locale="en-AU")
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle", timeout=60000)
        if WAIT_FOR:
            await pg.wait_for_selector(WAIT_FOR, timeout=30000)
        if HIDE:
            await pg.add_style_tag(content=f"{HIDE} {{ display: none !important; }}")
        await pg.wait_for_timeout(WAIT)
        pathlib.Path(OUT).parent.mkdir(parents=True, exist_ok=True)
        await pg.screenshot(path=OUT)
        print(f"saved {OUT} ({W}x{H} @{DPR}) from {pg.url}")
        await b.close()


asyncio.run(main())
```

Create `tools/scenes/find_service_area.py`:

```python
"""List the public Service Area page URLs linked from the AGG Doors index (read-only).
usage: py -3.11 -I tools/scenes/find_service_area.py"""
import asyncio
import re

from playwright.async_api import async_playwright

INDEX = "https://www.aggdoors.com.au/service-areas/"
SUBURB = re.compile(r"^https://www\.aggdoors\.com\.au/service-areas/[a-z0-9-]+/?$")


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=False)
        pg = await b.new_page()
        await pg.goto(INDEX, wait_until="networkidle", timeout=60000)
        hrefs = await pg.eval_on_selector_all("a[href]", "els => els.map(a => a.href)")
        suburbs = sorted({h for h in hrefs if SUBURB.match(h) and h.rstrip("/") != INDEX.rstrip("/")})
        if not suburbs:
            regions = sorted({h for h in hrefs if "/service-region/" in h})
            print("no suburb links on the index; region pages:", *regions, sep="\n  ")
            for region in regions[:2]:
                await pg.goto(region, wait_until="networkidle", timeout=60000)
                hrefs = await pg.eval_on_selector_all("a[href]", "els => els.map(a => a.href)")
                suburbs += sorted({h for h in hrefs if SUBURB.match(h)})
        print(f"{len(suburbs)} suburb pages:", *suburbs, sep="\n  ")
        await b.close()


asyncio.run(main())
```

Create `tools/scenes/README.md`:

```markdown
# Scene asset tools

Captures for the project worlds (spec §16). Read-only: no tool here clicks, types or signs up.
Output goes to `tools/scenes/out/` (git-ignored); converted WebPs are committed under `public/work/<slug>/`.

| Tool | Use |
|---|---|
| `shot.py URL OUT.png [--size WxH] [--dpr N] [--wait-for CSS] [--hide CSS]` | one screenshot in real Chrome |
| `find_service_area.py` | list public AGG Service Area page URLs |
| `bg.py start NAME CWD CMD... / wait URL [SECONDS] [TEXT] / stop NAME` | run a local app for a capture; stops only the PID it started (Task 5.3) |
| `render_plate.py` | render the invented LiPAD plate SVG to PNG (Task 7.1) |

PNG to WebP: `ffmpeg -y -i IN.png -c:v libwebp -quality 80 OUT.webp`, then `ffprobe -v error -show_entries stream=width,height -of csv=p=0 OUT.webp` for the size that goes into `projects.ts`.
```

- [ ] **Step 2: Point the project at the screenshot it is about to get**

In `src/content/projects.ts`, in the `service-areas` entry, replace these two lines:

```ts
    // Phase 5 (Task 5.1) replaces this with the captured Service Area page screenshot.
    illustrationLabel: "Illustration of the AGG Doors service areas project: a smiling garage door among Melbourne suburb pins.",
```

with:

```ts
    shot: {
      src: "/work/service-areas/page.webp",
      alt: "A live AGG Doors Service Area page for Moorabbin on aggdoors.com.au, opening with the suburb banner and the call and quote buttons.",
      width: 1440,
      height: 900,
      frame: "browser",
    },
```

Run: `npx vitest run tests/content-integrity.test.ts`
Expected: FAIL in "points every screenshot at a real file", naming `/work/service-areas/page.webp`.

- [ ] **Step 3: Find the page and capture it**

```bash
ffmpeg -hide_banner -encoders | grep -i webp
py -3.11 -I tools/scenes/find_service_area.py
```

Expected: `libwebp` is listed, and the finder prints the suburb pages. Use the Moorabbin page if it is listed (it is the template every suburb page was built from); otherwise use the first URL and change "Moorabbin" in the Step 2 alt text to that suburb. Then, with the URL it printed:

```bash
py -3.11 -I tools/scenes/shot.py https://www.aggdoors.com.au/service-areas/moorabbin/ tools/scenes/out/service-areas.png --size 1440x900 --wait 2500
mkdir -p public/work/service-areas
ffmpeg -y -i tools/scenes/out/service-areas.png -c:v libwebp -quality 80 public/work/service-areas/page.webp
ffprobe -v error -show_entries stream=width,height -of csv=p=0 public/work/service-areas/page.webp
```

Expected: `1440,900`. Open `tools/scenes/out/service-areas.png` at 1:1. If a cookie or chat widget covers the banner, find its selector in Chrome DevTools and re-run `shot.py` with `--hide "<selector>"`. Read the alt text from Step 2 against the image: every thing it names (the suburb banner, the call and quote buttons) must be visible; reword the alt to what is actually on screen if not. Nothing on this public page is private, so no redaction is needed.

Run: `npx vitest run tests/content-integrity.test.ts`
Expected: PASS.

- [ ] **Step 4: The scene text**

Create or extend `src/content/scene-text.ts` (see "Shared scene text" above) with:

```ts
  serviceAreas: { suburbs: ["Box Hill", "Eltham", "Hallam", "Moorabbin"] },
```

(These four are real AGG Service Area pages, named in the service areas automation records.) If the file is new, add it to `contentModules` in `tests/content-rules.test.ts` as described above.

- [ ] **Step 5: The static map backdrop**

Create `public/work/service-areas/map.svg` (a backdrop that never animates is a plain file loaded as an image, spec §4):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <rect width="1280" height="720" fill="#FFF1EB"/>
  <ellipse cx="980" cy="110" rx="120" ry="58" fill="#D6EFC8"/>
  <ellipse cx="1180" cy="430" rx="90" ry="66" fill="#D6EFC8"/>
  <ellipse cx="300" cy="140" rx="140" ry="68" fill="#D6EFC8"/>
  <path transform="translate(0 10)" fill="#86B6EE" d="M520 470C600 440 700 450 760 500C820 550 820 640 780 720H330C300 650 320 560 380 510C420 478 470 480 520 470Z"/>
  <path fill="#A9CDF7" d="M520 470C600 440 700 450 760 500C820 550 820 640 780 720H330C300 650 320 560 380 510C420 478 470 480 520 470Z"/>
  <path d="M560 470C640 420 720 380 820 330C920 280 1040 240 1280 200" fill="none" stroke="#A9CDF7" stroke-width="14" stroke-linecap="round"/>
  <g fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round">
    <path d="M560 460C700 430 900 400 1280 380"/>
    <path d="M560 460C720 500 880 560 1100 720"/>
    <path d="M560 460C620 340 690 200 760 0"/>
    <path d="M560 460C500 330 420 180 360 0"/>
    <path d="M560 460C420 420 220 390 0 380"/>
  </g>
</svg>
```

- [ ] **Step 6: The scene component**

Create `src/scenes/service-areas/Scene.tsx`:

```tsx
import Image from "next/image";
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import { sceneText } from "@/content/scene-text";
import type { FullProject } from "@/content/types";
import { cssVars, place, type Place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 1280, dh: 720, mdw: 358, mdh: 420 };

// Desktop pins stay at x >= 600: the copy panel covers x < 560 from 1024 px (bleed contract).
// Pins without mobile values are desktop-only.
const PINS: (Place & { i: number })[] = [
  { x: 604, y: 60, w: 40, mx: 24, my: 64, mw: 22, i: 0 },
  { x: 680, y: 120, w: 40, mx: 86, my: 30, mw: 22, i: 1 },
  { x: 770, y: 70, w: 40, mx: 150, my: 88, mw: 22, i: 2 },
  { x: 868, y: 128, w: 40, mx: 214, my: 36, mw: 22, i: 3 },
  { x: 962, y: 54, w: 40, mx: 276, my: 92, mw: 22, i: 4 },
  { x: 1060, y: 110, w: 40, mx: 322, my: 40, mw: 22, i: 5 },
  { x: 1160, y: 60, w: 40, i: 6 },
  { x: 606, y: 250, w: 40, i: 7 },
  { x: 630, y: 420, w: 40, i: 8 },
  { x: 760, y: 610, w: 40, i: 9 },
  { x: 1000, y: 640, w: 40, i: 10 },
  { x: 1230, y: 300, w: 40, i: 11 },
];

// One suburb name beside four of the pins (desktop only; 22 design px, above the 21 px bleed minimum).
const TAGS: Place[] = [
  { x: 726, y: 128, w: 120 },
  { x: 914, y: 136, w: 120 },
  { x: 1106, y: 118, w: 120 },
  { x: 806, y: 618, w: 140 },
];

function Pin() {
  return (
    <svg viewBox="0 0 40 56">
      <path transform="translate(0 4)" fill="#D9472B" d="M20 2C10 2 2 10 2 20C2 33 20 50 20 50C20 50 38 33 38 20C38 10 30 2 20 2Z" />
      <path fill="#FF6A4D" d="M20 2C10 2 2 10 2 20C2 33 20 50 20 50C20 50 38 33 38 20C38 10 30 2 20 2Z" />
      <circle cx="20" cy="20" r="7" fill="#FFF8EE" />
    </svg>
  );
}

export function ServiceAreasScene({ project }: { project: FullProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="full" grid={GRID} label={shot ? undefined : project.illustrationLabel}>
      <Layer depth="bg">
        <div className="pos" style={place({ x: 0, y: 0, w: 1280, mx: -560, my: -30, mw: 1000 })}>
          <Image src="/work/service-areas/map.svg" alt="" width={1280} height={720} unoptimized loading="lazy" />
        </div>
        <svg className="pos cloud loop g-d" style={place({ x: 1040, y: 18, w: 140 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>

      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" data-part="shot" style={place({ x: 700, y: 196, w: 520, mx: 29, my: 168, mw: 300 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 520px, 84vw">
              <span className="door-clip" aria-hidden="true">
                <span className="door" data-part="door">
                  <svg viewBox="0 0 520 320" preserveAspectRatio="none">
                    <rect width="520" height="320" fill="#FF6A4D" />
                    <path d="M0 48H520V56H0ZM0 112H520V120H0ZM0 176H520V184H0ZM0 240H520V248H0Z" fill="#D9472B" />
                    <rect x="230" y="286" width="60" height="14" rx="7" fill="#D9472B" />
                  </svg>
                </span>
              </span>
              <span className="door-housing" aria-hidden="true" />
            </DeviceFrame>
          </div>
        </Layer>
      ) : null}

      <Layer depth="fg">
        {PINS.map(({ i, ...p }) => (
          <span key={i} className={p.mx === undefined ? "pos g-d" : "pos"} data-part="pin" style={place(p, { "--i": i })}>
            <span className="pin-bob loop">
              <Pin />
            </span>
          </span>
        ))}
        {TAGS.map((p, i) => (
          <span key={sceneText.serviceAreas.suburbs[i]} className="pos g-d" data-part="tag" style={place(p)}>
            <span className="tag">{sceneText.serviceAreas.suburbs[i]}</span>
          </span>
        ))}
        <div className="pos" data-part="mascot" style={place({ x: 1120, y: 560, w: 130, mx: 286, my: 342, mw: 60 })}>
          <div className="bob loop" style={cssVars({ "--bd": "1.8s" })}>
            <Mascot slug="service-areas" />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/service-areas/scene.css`:

```css
/* AGG Doors service areas (bleed world). Desktop grid 1280 x 720, mobile 358 x 420.
   Desktop x < 560 stays calm: the copy panel sits there from 1024 px. */
.stage[data-scene="service-areas"] { background: #FFF1EB; }
[data-scene="service-areas"] .pos > img { display: block; width: 100%; height: auto; }

[data-scene="service-areas"] [data-part="pin"] { transform-origin: 50% 100%; }
[data-scene="service-areas"] .pin-bob { display: block; }
[data-scene="service-areas"] .pin-bob > svg { display: block; width: 100%; height: auto; }

[data-scene="service-areas"] [data-part="tag"] { width: max-content; transform-origin: 0 50%; }
[data-scene="service-areas"] .tag {
  display: inline-flex; align-items: center; padding: calc(9 * var(--u)) calc(16 * var(--u));
  border-radius: 999px; background: var(--color-white); color: var(--color-ink);
  font: 700 calc(22 * var(--u))/1 var(--font-display); white-space: nowrap;
  box-shadow: 0 calc(4 * var(--u)) 0 #F2C9BF;
}

/* The garage door covers the screenshot only (the image starts 36u below the screen's top edge).
   Server end state: rolled up and out of sight, so the page shows with no JavaScript. */
[data-scene="service-areas"] .door-clip {
  position: absolute; inset: calc(36 * var(--u)) calc(10 * var(--u)) calc(10 * var(--u));
  border-radius: calc(18 * var(--u)); overflow: clip;
}
[data-scene="service-areas"] .door { position: absolute; inset: 0; display: block; transform: translateY(-101%); }
[data-scene="service-areas"] .door svg { display: block; width: 100%; height: 100%; }
[data-scene="service-areas"] .door-housing {
  position: absolute; left: calc(6 * var(--u)); right: calc(6 * var(--u)); top: calc(28 * var(--u));
  height: calc(14 * var(--u)); border-radius: calc(7 * var(--u)); background: #D9472B;
}

@media (prefers-reduced-motion: no-preference) {
  /* Two bobs per 5 s iteration; negative delays spread the pins. */
  [data-scene="service-areas"].live .pin-bob.loop {
    animation: sa-pin 5s ease-in-out infinite;
    animation-delay: calc(var(--i) * -0.42s);
  }
}
@keyframes sa-pin {
  0%, 50%, 100% { transform: translateY(0); }
  25%, 75% { transform: translateY(-14%); }
}
```

- [ ] **Step 7: Register the scene and its stylesheet**

In `src/scenes/index.ts`, add `import { ServiceAreasScene } from "./service-areas/Scene";` and change the entry to `"service-areas": ServiceAreasScene,`.

In `src/app/globals.css`, add after the last full-world scene import (or after the basic scene import if there is none yet):

```css
@import "../scenes/service-areas/scene.css" layer(scenes);
```

- [ ] **Step 8: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass. The service areas scene passes `tests/scenes.test.tsx` (about 120 elements, under 300) and `tests/choreo-contract.test.tsx` with the basic choreography, which drives its `data-part="mascot"` until Task 5.2.

- [ ] **Step 9: Look at it in the scene lab and on the page**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
PERF_URL=http://127.0.0.1:3000/dev/scenes/service-areas py -3.11 -I tools/perf/shoot.py tools/perf/out/5.1/lab 1440 900 --wait 3000
py -3.11 -I tools/perf/shoot.py tools/perf/out/5.1/page 1440 900 --wait 1500
py -3.11 -I tools/perf/shoot.py tools/perf/out/5.1/page 390 844 --wait 1500
py -3.11 -I tools/perf/serve.py stop
```

Expected: the lab shows the stage at 820 (desktop grid: pins, four suburb tags, the page in its browser frame with the door housing on top) and at 600 and 358 (mobile grid: six pins, no tags). No `shoot.py` report lists text under 12 px. On the 1440 page shot the copy panel covers only the map's calm left part.

- [ ] **Step 10: Fable art direction**

Dispatch with the Agent tool, `model: "fable"`:

```
You are the art director for Wrenz Laylo's portfolio redesign. Read the spec
(docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md, §4 and §8) and the approved slice at
C:\Users\OASIS\scratch-portfolio\slice\ (index.html and styles.css; its POS and time-log worlds are the
quality bar). Use the design-taste-frontend and ui-ux-pro-max skills as lenses. Review the AGG Doors service
areas world (full-bleed; copy panel over the left part from 1024 px) at 1:1 in these screenshots:
tools/perf/out/5.1/lab/*.png (the scene alone at 820, 600 and 358 px) and tools/perf/out/5.1/page/*.png
(the page at 1440 and 390). Return: (1) MUST-FIX and NICE-TO-HAVE lists, each item naming the screenshot,
the element, the problem and the exact fix (hex values, design px on the named grid); (2) the final
--color-tint-service-areas as one hex in the coral family at lightness 88 to 91 that shares no hue family
with its neighbours (the time-log world is blue, Katiwala is teal) and keeps #1F1B24 and #5B5566 text at
4.5:1 or more. Sticker-flat rules: two tones per object (a fill and a shade about 20% darker underneath),
no outlines, gradients or filters, ink only for faces and small details, scene text at least 21 design px
on the desktop grid. No WebGL, no scroll hijacking.
```

- [ ] **Step 11: Apply every MUST-FIX and the final tint**

Make each MUST-FIX change in `Scene.tsx`, `scene.css` or `map.svg` exactly as specified, and set `--color-tint-service-areas` in `src/app/globals.css` to Fable's value. Then:

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (the contrast test re-checks the new tint).

Re-run Step 9 and look at the new screenshots at 1:1. List the NICE-TO-HAVE items in the PR description for Wrenz.

- [ ] **Step 12: Commit and open the PR**

```bash
git add .gitignore tools/scenes public/work/service-areas src/content src/scenes src/app/globals.css tests/content-rules.test.ts
git commit -m "Add the service areas world: live page screenshot, Melbourne map, pins and garage door"
git push -u origin rd/5.1-service-areas-scene
gh pr create --base redesign --title "5.1 Service areas: screenshot and scene" --body "Task 5.1. Read-only capture of a public AGG Service Area page, the static map backdrop, the bleed scene (pins, suburb tags, door, mascot), the final tint and Fable's MUST-FIX items. Lab and page screenshots attached; NICE-TO-HAVE list below."
```

Attach the Step 9 screenshots (lab 820/600/358 and page 1440/390) to the PR. Review and merge per the protocol.

### Task 5.2: The service areas choreography

**Files:**
- Create: `src/scenes/service-areas/choreo.ts`
- Modify: `src/motion/registry.ts`

**Interfaces:**
- Consumes: `Choreo`, `Gsap` (Task 1.5); parts `shot`, `door`, `pin`, `tag`, `mascot` (Task 5.1).
- Produces: `choreo:service-areas`. Entrance (about 1.6 s): the page frame rises, the pins pop in random order, the door rolls up to reveal the page, the suburb tags pop, the mascot hops in; then `.live` starts the pin bobs, the mascot bob and the cloud drift.

- [ ] **Step 1: Point the registry at the new choreography**

In `src/motion/registry.ts`, change the entry to:

```ts
  "service-areas": () => import("@/scenes/service-areas/choreo"),
```

Run: `npx vitest run tests/choreo-contract.test.tsx`
Expected: FAIL for `service-areas`, `Failed to resolve import "@/scenes/service-areas/choreo"`.

- [ ] **Step 2: Write the choreography**

Create `src/scenes/service-areas/choreo.ts`:

```ts
import type { Choreo, Gsap } from "@/motion/types";

type Vars = Parameters<Gsap["set"]>[1];

/** Service areas: pins pop across the map, the garage door rolls up to reveal the real page. */
const choreo: Choreo = (root, { gsap, skipEntrance }) => {
  const all = (name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`));
  const shot = all("shot");
  const door = all("door");
  const pins = all("pin");
  const tags = all("tag");
  const mascot = all("mascot");
  const targets = [...shot, ...door, ...pins, ...tags, ...mascot];
  const set = (els: HTMLElement[], vars: Vars) => {
    if (els.length) gsap.set(els, vars);
  };

  if (!skipEntrance) {
    set(shot, { yPercent: 10 });
    set(door, { y: 0, yPercent: 0 }); // the CSS end state is rolled up; inline values cover the page again
    set(pins, { scale: 0 });
    set(tags, { scale: 0.6, autoAlpha: 0 });
    set(mascot, { yPercent: 60, scale: 0.7 });
  }

  let timeline: ReturnType<Gsap["timeline"]> | undefined;

  return {
    name: "choreo:service-areas",
    enter() {
      if (skipEntrance) {
        root.classList.add("live");
        return;
      }
      const tl = gsap.timeline({ onComplete: () => root.classList.add("live") });
      if (shot.length) tl.to(shot, { yPercent: 0, duration: 0.6, ease: "power3.out" }, 0);
      if (pins.length) tl.to(pins, { scale: 1, duration: 0.45, ease: "back.out(2.4)", stagger: { each: 0.06, from: "random" } }, 0.2);
      if (door.length) tl.to(door, { yPercent: -101, duration: 1.1, ease: "power2.inOut" }, 0.45);
      if (tags.length) tl.to(tags, { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(2)", stagger: 0.1 }, 0.95);
      if (mascot.length) tl.to(mascot, { yPercent: 0, scale: 1, duration: 0.55, ease: "back.out(1.8)" }, 1.05);
      timeline = tl;
    },
    cleanup() {
      timeline?.kill();
      gsap.killTweensOf(targets);
      set(targets, { clearProps: "transform,opacity,visibility" });
      root.classList.remove("live");
    },
  };
};

export default choreo;
```

- [ ] **Step 3: Run the tests and the chunk check**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build && node tools/perf/chunks.mjs`
Expected: all tests pass (the contract test now runs `choreo:service-areas` on both grids); `chunks.mjs` prints `ok   choreo:service-areas` under 8 KB and `PASS`.

- [ ] **Step 4: Watch it in real Chrome**

```bash
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/who.py service-areas 1
py -3.11 -I tools/perf/anim_raw.py service-areas
py -3.11 -I tools/perf/serve.py stop
```

Before stopping the server, open `http://127.0.0.1:3000/#work` in Chrome at 1440×900 and scroll to the service areas world: the pins pop, the door rolls up and the page shows, then the pins bob gently. Scroll away and back: no replay, no jump. Expected tool output: `who.py` shows no recurring JS function calls while parked (only the compositor), and `anim_raw.py` lists no `compositeFailed` for `sa-pin`, `bob` or `drift`.

- [ ] **Step 5: Commit and open the PR**

```bash
git add src/scenes/service-areas/choreo.ts src/motion/registry.ts
git commit -m "Add the service areas entrance: pins pop and the garage door rolls up"
git push -u origin rd/5.2-service-areas-choreo
gh pr create --base redesign --title "5.2 Service areas choreography" --body "Task 5.2. Prepare/enter contract, percentage-based offsets (no layout reads), cleanup restores the server end state. chunks.mjs, who.py and anim_raw.py output below."
```

Review and merge per the protocol.

### Task 5.3: Katiwala: the app screens and the scene

The screens come from the Katiwala app itself, signed in with its test accounts, through the screenshot tool the Katiwala repo already has (`apps/mobile/scripts/ui-capture/`, Expo web build plus the local API). Test data only. The Katiwala rules apply on Wrenz's PC: heavy steps (the web build and the screenshot browser) run only when he says go, and no secret is printed or committed.

**Files:**
- Create: `tools/scenes/bg.py`
- Create (asset): `public/work/katiwala/book.webp`
- Modify: `src/content/projects.ts` (Katiwala: `shot` replaces `illustrationLabel`), `src/content/scene-text.ts` (`katiwala`)
- Create: `src/scenes/katiwala/Scene.tsx`, `src/scenes/katiwala/scene.css`
- Modify: `src/scenes/index.ts`, `src/app/globals.css`

**Interfaces:**
- Consumes: as Task 5.1; the Katiwala capture tool (`node scripts/ui-capture/capture.mjs <label> [route ...]`, output `apps/mobile/.captures/<label>/<route>-<scheme>-<width>.png` at device scale 2).
- Produces: `KatiwalaScene` as `fullScenes.katiwala`; parts `data-part="phone" | "tool" | "chip" | "tick" | "mascot"` for Task 5.4; `tools/scenes/bg.py` (`start NAME CWD CMD...`, `wait URL [SECONDS] [TEXT]`, `stop NAME`), reused in Task 6.1.

- [ ] **Step 1: The background-process helper**

Create `tools/scenes/bg.py`:

```python
"""Run a local app for a scene capture, recording its PID, and stop only that PID's process tree.
usage: py -3.11 -I tools/scenes/bg.py start NAME CWD COMMAND [ARGS...]
       py -3.11 -I tools/scenes/bg.py wait URL [SECONDS] [TEXT]
       py -3.11 -I tools/scenes/bg.py stop NAME
Never stops anything by name. Logs go to tools/scenes/out/NAME.log."""
import pathlib
import subprocess
import sys
import time
import urllib.request

OUT = pathlib.Path(__file__).resolve().parent / "out"
OUT.mkdir(exist_ok=True)


def start(name, cwd, cmd):
    pidfile = OUT / f"{name}.pid"
    if pidfile.exists():
        sys.exit(f"{name} already running (pid {pidfile.read_text().strip()}): run `bg.py stop {name}` first")
    log = open(OUT / f"{name}.log", "w")
    proc = subprocess.Popen(subprocess.list2cmdline(cmd), cwd=cwd, shell=True, stdout=log, stderr=subprocess.STDOUT,
                            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
    pidfile.write_text(str(proc.pid))
    print(f"started {name} (pid {proc.pid}), log: {OUT / (name + '.log')}")


def wait(url, seconds=120, text=""):
    deadline = time.time() + float(seconds)
    while time.time() < deadline:
        try:
            body = urllib.request.urlopen(url, timeout=3).read().decode("utf-8", "replace")
            if text in body:
                print(f"ready: {url}")
                return
        except Exception:
            pass
        time.sleep(1)
    sys.exit(f"not ready after {seconds} s: {url}")


def stop(name):
    pidfile = OUT / f"{name}.pid"
    if not pidfile.exists():
        print(f"{name}: no pid file, nothing to stop")
        return
    pid = pidfile.read_text().strip()
    subprocess.run(["taskkill", "/PID", pid, "/T", "/F"], check=False)
    pidfile.unlink()
    print(f"stopped {name} (pid {pid})")


if __name__ == "__main__":
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "start":
        start(args[0], args[1], args[2:])
    elif cmd == "wait":
        wait(*args)
    elif cmd == "stop":
        stop(args[0])
    else:
        sys.exit(__doc__)
```

- [ ] **Step 2: Point the project at its screenshot**

In `src/content/projects.ts`, in the `katiwala` entry, replace:

```ts
    // Phase 5 (Task 5.3) replaces this with real app screens.
    illustrationLabel: "Illustration of Katiwala: a smiling phone surrounded by home-service tools.",
```

with:

```ts
    shot: {
      src: "/work/katiwala/book.webp",
      alt: "The Katiwala customer app on a phone, showing the Book a service screen with home services to choose from.",
      width: 780,
      height: 1688,
      frame: "phone",
    },
```

Run: `npx vitest run tests/content-integrity.test.ts`
Expected: FAIL, naming `/work/katiwala/book.webp`.

- [ ] **Step 3: Ask before the heavy step**

Ask Wrenz: "OK to run the Katiwala local API, its Expo web build and the screenshot browser on your PC now, to capture the Book a service screen for the portfolio? It uses the test accounts only." Wait for his yes.

- [ ] **Step 4: Capture the screens**

Read `C:\Users\OASIS\Documents\Katiwala\katiwala\apps\mobile\scripts\ui-capture\README.md`. Its step 1 lists the API's environment variables and step 3 the two test logins. Export those variables in this Git Bash shell, using the values in that README. Never paste the values into a portfolio file, a commit or a PR: the portfolio repo is public. The API listens on port 3000, so stop the portfolio server first.

```bash
py -3.11 -I tools/perf/serve.py stop
KT=/c/Users/OASIS/Documents/Katiwala/katiwala
py -3.11 -I tools/scenes/bg.py start katiwala-api $KT/packages/api npx tsx src/index.ts
KATIWALA_SKIP_NATIVE_CHECK=1 py -3.11 -I tools/scenes/bg.py start katiwala-web $KT/apps/mobile npx expo start --web --port 8082
py -3.11 -I tools/scenes/bg.py wait http://localhost:3000/health 120
py -3.11 -I tools/scenes/bg.py wait http://localhost:8082/ 300
(cd $KT/apps/mobile && node scripts/ui-capture/capture.mjs portfolio c-book c-home)
py -3.11 -I tools/scenes/bg.py stop katiwala-web
py -3.11 -I tools/scenes/bg.py stop katiwala-api
```

If `/health` is not the API's health path, use `http://localhost:3000/` with the text the API returns there (check `tools/scenes/out/katiwala-api.log` for the listening line). Expected: `apps/mobile/.captures/portfolio/c-book-light-390.png` and `c-home-light-390.png` exist; both `stop` lines print `stopped`.

- [ ] **Step 5: Pick, check and convert the screen**

Open both light 390 PNGs at 1:1. Use `c-book-light-390.png`; if it shows a map placeholder or an error, use `c-home-light-390.png` and change the Step 2 alt text to describe the Home screen. Check that nothing personal shows (test account only) and that every thing the alt text names is visible.

```bash
mkdir -p public/work/katiwala
ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$KT/apps/mobile/.captures/portfolio/c-book-light-390.png"
ffmpeg -y -i "$KT/apps/mobile/.captures/portfolio/c-book-light-390.png" -vf "crop=780:1688:0:0" -c:v libwebp -quality 82 public/work/katiwala/book.webp
ffprobe -v error -show_entries stream=width,height -of csv=p=0 public/work/katiwala/book.webp
```

Expected: the source is `780,1688` or taller (a full-page capture); the WebP is `780,1688`, the first screen. If the source is shorter than 1688, drop the `-vf crop=...` option and put its real height in `projects.ts`.

Run: `npx vitest run tests/content-integrity.test.ts`
Expected: PASS.

- [ ] **Step 6: The scene text**

Add to `src/content/scene-text.ts` (create it as described in "Shared scene text" if it does not exist):

```ts
  katiwala: { steps: ["ID scanned", "Face captured", "Waiting for review"] },
```

- [ ] **Step 7: The scene component**

Create `src/scenes/katiwala/Scene.tsx`:

```tsx
import type { ReactElement } from "react";
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import { sceneText } from "@/content/scene-text";
import type { FullProject } from "@/content/types";
import { place, type Place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 820, dh: 620, mdw: 358, mdh: 380 };

const METAL = "#C3CAD6";
const METAL_SHADE = "#9AA3B5";

function Wrench() {
  const d = "M84 8C70 8 60 20 62 34L14 82C8 88 8 98 14 104C20 110 30 110 36 104L84 56C98 58 110 48 110 34L96 46L84 42L80 30L92 16C90 10 88 8 84 8Z";
  return (
    <svg viewBox="0 0 124 124">
      <path transform="translate(4 5)" d={d} fill={METAL_SHADE} />
      <path d={d} fill={METAL} />
      <circle cx="25" cy="93" r="5" fill={METAL_SHADE} />
    </svg>
  );
}

function Brush() {
  return (
    <svg viewBox="-10 -10 140 140">
      <g transform="rotate(35 60 60)">
        <rect x="56" y="10" width="18" height="58" rx="9" fill="#B97A38" />
        <rect x="52" y="6" width="18" height="58" rx="9" fill="#E3A85E" />
        <rect x="50" y="62" width="26" height="16" rx="4" fill={METAL_SHADE} />
        <rect x="47" y="60" width="26" height="16" rx="4" fill={METAL} />
        <path d="M49 76H77V100C77 108 71 114 63 114C55 114 49 108 49 100Z" fill="#E06A1F" />
        <path d="M46 74H74V98C74 106 68 112 60 112C52 112 46 106 46 98Z" fill="#FF8A3D" />
      </g>
    </svg>
  );
}

function Plug() {
  return (
    <svg viewBox="0 0 120 120">
      <path d="M60 86C60 104 40 112 22 106" fill="none" stroke="#3A6AD4" strokeWidth="8" strokeLinecap="round" />
      <rect x="44" y="18" width="8" height="26" rx="4" fill={METAL_SHADE} />
      <rect x="68" y="18" width="8" height="26" rx="4" fill={METAL_SHADE} />
      <rect x="34" y="42" width="56" height="48" rx="14" fill="#3A6AD4" />
      <rect x="30" y="38" width="56" height="48" rx="14" fill="#4F86F7" />
    </svg>
  );
}

const TOOLS: { place: Place; art: () => ReactElement }[] = [
  { place: { x: 130, y: 110, w: 120, mx: 14, my: 52, mw: 70 }, art: Wrench },
  { place: { x: 580, y: 70, w: 110, mx: 266, my: 28, mw: 66 }, art: Brush },
  { place: { x: 150, y: 380, w: 120, mx: 22, my: 190, mw: 70 }, art: Plug },
];

const CHIPS: Place[] = [
  { x: 560, y: 300, w: 200, mx: 12, my: 270, mw: 150 },
  { x: 560, y: 362, w: 200, mx: 184, my: 270, mw: 150 },
  { x: 560, y: 424, w: 220, mx: 90, my: 318, mw: 170 },
];

export function KatiwalaScene({ project }: { project: FullProject }) {
  const { shot } = project;
  const steps = sceneText.katiwala.steps;
  return (
    <Stage slug={project.slug} tier="full" grid={GRID} label={shot ? undefined : project.illustrationLabel}>
      <Layer depth="bg">
        <svg className="pos" style={place({ x: 150, y: 40, w: 520, mx: 40, my: 20, mw: 280 })} viewBox="0 0 520 528">
          <circle cx="266" cy="270" r="250" fill="#B2E6DD" />
          <circle cx="260" cy="260" r="250" fill="#D7F3EE" />
        </svg>
        <svg className="pos cloud loop" style={place({ x: 40, y: 40, w: 130, mx: 8, my: 14, mw: 64 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="pos cloud loop g-d" style={place({ x: 650, y: 26, w: 110 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>

      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" data-part="phone" style={place({ x: 300, y: 34, w: 240, mx: 119, my: 16, mw: 120 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 240px, 34vw" />
          </div>
        </Layer>
      ) : null}

      <Layer depth="fg">
        {TOOLS.map(({ place: p, art: Art }, i) => (
          <span key={i} className="pos" data-part="tool" style={place(p, { "--i": i })}>
            <span className="tool-float loop">
              <Art />
            </span>
          </span>
        ))}
        {CHIPS.map((p, i) => (
          <span key={steps[i]} className="pos" data-part="chip" style={place(p)}>
            <span className="chip">
              <span className={i < 2 ? "chip-mark done" : "chip-mark wait"} data-part="tick">
                {i < 2 ? (
                  <svg viewBox="0 0 256 256">
                    <use href="#i-check" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 6V12L16 14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              {steps[i]}
            </span>
          </span>
        ))}
        <div className="pos g-d" data-part="mascot" style={place({ x: 660, y: 486, w: 96 })}>
          <div className="bob loop">
            <Mascot slug="katiwala" />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/katiwala/scene.css`:

```css
/* Katiwala (split world). Desktop grid 820 x 620, mobile 358 x 380. */
.stage[data-scene="katiwala"] { background: #EAF8F5; --fs: 15; }
@container stage (width < 760px) {
  .stage[data-scene="katiwala"] { --fs: 13; }
}

[data-scene="katiwala"] .tool-float { display: block; }
[data-scene="katiwala"] .tool-float > svg { display: block; width: 100%; height: auto; }

[data-scene="katiwala"] [data-part="chip"] { width: max-content; }
[data-scene="katiwala"] .chip {
  display: inline-flex; align-items: center; gap: calc(8 * var(--u));
  padding: calc(7 * var(--u)) calc(14 * var(--u)) calc(7 * var(--u)) calc(7 * var(--u));
  border-radius: 999px; background: var(--color-white); color: var(--color-ink);
  font: 700 calc(var(--fs) * var(--u))/1 var(--font-display); white-space: nowrap;
  box-shadow: 0 calc(4 * var(--u)) 0 #B2E6DD;
}
[data-scene="katiwala"] .chip-mark {
  display: grid; place-items: center; flex: none; width: calc(26 * var(--u)); aspect-ratio: 1; border-radius: 50%;
  transform-origin: 50% 50%;
}
[data-scene="katiwala"] .chip-mark svg { width: 62%; height: 62%; }
[data-scene="katiwala"] .chip-mark.done { background: var(--color-sheets-green); color: #FFFFFF; }
[data-scene="katiwala"] .chip-mark.wait { background: var(--color-yolk); color: var(--color-ink); }

@media (prefers-reduced-motion: no-preference) {
  /* Two float cycles per 6 s iteration. */
  [data-scene="katiwala"].live .tool-float.loop {
    animation: kt-float 6s ease-in-out infinite;
    animation-delay: calc(var(--i) * -1.1s);
  }
}
@keyframes kt-float {
  0%, 50%, 100% { transform: translateY(0) rotate(-5deg); }
  25%, 75% { transform: translateY(-8%) rotate(5deg); }
}
```

- [ ] **Step 8: Register the scene and its stylesheet**

In `src/scenes/index.ts`, add `import { KatiwalaScene } from "./katiwala/Scene";` and change the entry to `katiwala: KatiwalaScene,`. In `src/app/globals.css`, add after the service areas scene import:

```css
@import "../scenes/katiwala/scene.css" layer(scenes);
```

- [ ] **Step 9: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (about 70 elements in the stage; the basic choreography drives the mascot until Task 5.4).

- [ ] **Step 10: Lab and page screenshots, then Fable art direction**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
PERF_URL=http://127.0.0.1:3000/dev/scenes/katiwala py -3.11 -I tools/perf/shoot.py tools/perf/out/5.3/lab 1440 900 --wait 3000
py -3.11 -I tools/perf/shoot.py tools/perf/out/5.3/page 1440 900 --wait 1500
py -3.11 -I tools/perf/shoot.py tools/perf/out/5.3/page 390 844 --wait 1500
py -3.11 -I tools/perf/serve.py stop
```

Dispatch the Step 10 brief from Task 5.1 to Fable (`model: "fable"`) with these substitutions: world = "the Katiwala world (split; the copy is on the left and the stage on the right)", screenshots = `tools/perf/out/5.3/lab/*.png` and `tools/perf/out/5.3/page/*.png`, token = `--color-tint-katiwala`, family = teal, neighbours = "the service areas world above is coral, Stockroom below is lilac", minimum scene text = 13 design px on the desktop grid and 12 on the mobile grid.

- [ ] **Step 11: Apply every MUST-FIX and the final tint**

Make each MUST-FIX change exactly as specified and set `--color-tint-katiwala` in `src/app/globals.css`. Run `npx vitest run && npx tsc --noEmit && npm run lint` (all pass), re-run Step 10's screenshots and look at them at 1:1. List the NICE-TO-HAVE items in the PR.

- [ ] **Step 12: Commit and open the PR**

```bash
git add tools/scenes/bg.py public/work/katiwala src/content src/scenes src/app/globals.css
git commit -m "Add the Katiwala world: real app screen in a phone, tools and verification steps"
git push -u origin rd/5.3-katiwala-scene
gh pr create --base redesign --title "5.3 Katiwala: app screen and scene" --body "Task 5.3. Book a service screen captured with the Katiwala ui-capture tool on test accounts (Wrenz said go), the split scene (wrench, brush, plug, ID / face / review steps, mascot), the final tint and Fable's MUST-FIX items. Screenshots attached; NICE-TO-HAVE list below."
```

Review and merge per the protocol.

### Task 5.4: The Katiwala choreography

**Files:**
- Create: `src/scenes/katiwala/choreo.ts`
- Modify: `src/motion/registry.ts`

**Interfaces:**
- Consumes: `Choreo`, `Gsap` (Task 1.5); parts `phone`, `tool`, `chip`, `tick`, `mascot` (Task 5.3).
- Produces: `choreo:katiwala`. Entrance (about 1.6 s): the phone rises, the three tools bounce in with a spring, the verification steps slide in one by one and their marks pop, the mascot hops in; then `.live` starts the tool float, the mascot bob and the cloud drift.

- [ ] **Step 1: Point the registry at the new choreography**

In `src/motion/registry.ts`, change the entry to:

```ts
  katiwala: () => import("@/scenes/katiwala/choreo"),
```

Run: `npx vitest run tests/choreo-contract.test.tsx`
Expected: FAIL for `katiwala`, `Failed to resolve import "@/scenes/katiwala/choreo"`.

- [ ] **Step 2: Write the choreography**

Create `src/scenes/katiwala/choreo.ts`:

```ts
import type { Choreo, Gsap } from "@/motion/types";

type Vars = Parameters<Gsap["set"]>[1];

/** Katiwala: the phone rises, tools bounce in around it, the verification steps land one by one. */
const choreo: Choreo = (root, { gsap, skipEntrance }) => {
  const all = (name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`));
  const phone = all("phone");
  const tools = all("tool");
  const chips = all("chip");
  const ticks = all("tick");
  const mascot = all("mascot");
  const targets = [...phone, ...tools, ...chips, ...ticks, ...mascot];
  const set = (els: HTMLElement[], vars: Vars) => {
    if (els.length) gsap.set(els, vars);
  };

  if (!skipEntrance) {
    set(phone, { yPercent: 8 });
    set(tools, { scale: 0, rotation: -40 });
    set(chips, { xPercent: -8, autoAlpha: 0 });
    set(ticks, { scale: 0 });
    set(mascot, { yPercent: 40, scale: 0.7 });
  }

  let timeline: ReturnType<Gsap["timeline"]> | undefined;

  return {
    name: "choreo:katiwala",
    enter() {
      if (skipEntrance) {
        root.classList.add("live");
        return;
      }
      const tl = gsap.timeline({ onComplete: () => root.classList.add("live") });
      if (phone.length) tl.to(phone, { yPercent: 0, duration: 0.6, ease: "power3.out" }, 0);
      if (tools.length) tl.to(tools, { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.55)", stagger: 0.12 }, 0.25);
      if (chips.length) tl.to(chips, { xPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out", stagger: 0.18 }, 0.7);
      if (ticks.length) tl.to(ticks, { scale: 1, duration: 0.35, ease: "back.out(3)", stagger: 0.18 }, 0.95);
      if (mascot.length) tl.to(mascot, { yPercent: 0, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, 1.05);
      timeline = tl;
    },
    cleanup() {
      timeline?.kill();
      gsap.killTweensOf(targets);
      set(targets, { clearProps: "transform,opacity,visibility" });
      root.classList.remove("live");
    },
  };
};

export default choreo;
```

- [ ] **Step 3: Run the tests and the chunk check**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build && node tools/perf/chunks.mjs`
Expected: all pass; `ok   choreo:katiwala` under 8 KB; `PASS`.

- [ ] **Step 4: Watch it in real Chrome**

```bash
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/who.py katiwala 1
py -3.11 -I tools/perf/anim_raw.py katiwala
py -3.11 -I tools/perf/serve.py stop
```

Before stopping the server, scroll to the Katiwala world in Chrome at 1440×900 and at 390×844 (device mode): the phone rises, the tools spring in, the steps land, then the tools float. Expected tool output: no recurring JS calls while parked; no `compositeFailed` for `kt-float`, `bob` or `drift`.

- [ ] **Step 5: Commit and open the PR**

```bash
git add src/scenes/katiwala/choreo.ts src/motion/registry.ts
git commit -m "Add the Katiwala entrance: tools bounce in and the verification steps land"
git push -u origin rd/5.4-katiwala-choreo
gh pr create --base redesign --title "5.4 Katiwala choreography" --body "Task 5.4. Prepare/enter contract, percentage offsets, cleanup restores the end state. chunks.mjs, who.py and anim_raw.py output below."
```

Review and merge per the protocol.

### Task 5.5: Phase 5 verification

**Files:**
- Modify: whatever the gate's MUST-FIX items touch (on this task's branch `rd/5.5-phase5-gate`)

**Interfaces:**
- Consumes: the whole page after Tasks 5.1 to 5.4.
- Produces: the gate results in the PR, Fable's phase critique, and Wrenz's sign-off.

- [ ] **Step 1: Unit checks and the production build**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build && node tools/perf/chunks.mjs`
Expected: all pass; `chunks.mjs` lists `basic` (if any world still uses it), `pos`, `time-log`, `service-areas` and `katiwala`, each under 8 KB, and `PASS`.

- [ ] **Step 2: Frames, compositing and budgets on this laptop**

```bash
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/perf.py 1440 900 1 --check
py -3.11 -I tools/perf/perf.py 1440 900 4 --check
py -3.11 -I tools/perf/perf.py 390 844 1 --mobile --check
py -3.11 -I tools/perf/perf.py 390 844 4 --mobile --check
py -3.11 -I tools/perf/anim_raw.py
py -3.11 -I tools/perf/budget.py
```

Expected: all four `perf.py` runs print `PASS` (they now park in `service-areas` and `katiwala` too); `anim_raw.py` prints `all animations composited` or only failures explained in the PR; `budget.py` prints `PASS`. A failing budget is fixed on this branch, or Wrenz accepts the miss in writing on the PR.

- [ ] **Step 3: Lighthouse, accessibility and screenshots**

```bash
npx -y lighthouse@13 http://127.0.0.1:3000/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=tools/perf/out/lh.json --chrome-flags="--headless=new"
node tools/perf/lh-summary.mjs tools/perf/out/lh.json
py -3.11 -I tools/perf/a11y.py
for size in "390 844" "820 1180" "1024 768" "1440 900"; do py -3.11 -I tools/perf/shoot.py tools/perf/out/5.5 $size; done
py -3.11 -I tools/perf/shoot.py tools/perf/out/5.5 390 844 --rm
py -3.11 -I tools/perf/shoot.py tools/perf/out/5.5 1440 900 --nojs
py -3.11 -I tools/perf/serve.py stop
```

Expected: `lh-summary.mjs` prints no `FAIL`; `a11y.py` prints `PASS`; every `shoot.py` run prints `PASS`. Then a keyboard-only pass in Chrome at 1440 and at 390 (skip link, nav, menu, every link in the two new worlds reachable, focus visible). Look at every `tools/perf/out/5.5/*.png` at 1:1, especially the bleed world at 820 and 1024 (copy panel versus stacked layout) and the reduced-motion and no-JavaScript shots (door rolled up, pins and tools in place, every word present).

- [ ] **Step 4: Fable phase critique**

Dispatch the "Fable critique brief" from this plan's front matter (`model: "fable"`) with: screenshots = `tools/perf/out/5.5/s-1440-*.png`, `s-390-*.png`, `s-820-*.png` and `s-1024-*.png`; phase = "Phase 5: the AGG Doors service areas world (full-bleed) and the Katiwala world (split) replaced their basic scenes."

- [ ] **Step 5: Fix every MUST-FIX and re-run the gate**

Fix each MUST-FIX item on this branch, then repeat Steps 1 to 3. All checks pass.

- [ ] **Step 6: Open the PR and ask for sign-off**

```bash
git add -A
git commit -m "Phase 5 gate fixes"
git push -u origin rd/5.5-phase5-gate
gh pr create --base redesign --title "5.5 Phase 5 verification" --body "Task 5.5. Gate results (perf 1x/4x at 1440 and 390, anim_raw, budget, Lighthouse, axe, keyboard, reduced motion, no JavaScript, screenshots at 4 sizes), Fable's critique with every MUST-FIX fixed, NICE-TO-HAVE list for Wrenz."
```

(If the gate needed no fixes, skip the commit and open the PR with an empty commit: `git commit --allow-empty -m "Phase 5 gate results"`.) Paste every tool output into the PR. Review and merge per the protocol, then ask Wrenz to check the two new worlds on the `redesign` Vercel preview and sign off Phase 5 before Phase 6 starts.

---

# Phase 6: Stockroom API and Agent Island

Goal: the last two basic world scenes are replaced: the split **Stockroom API** world (its real Swagger UI in a browser frame, boxes stacking onto shelves while a request returns "200 OK") and the full-bleed **Agent Island** world (a designed panel built from the README's states: three bots pass a JSON note into a Dynamic-Island pill, which expands to show the permission prompt). After this phase all six worlds are designed.

Follow the "Scene protocol" and "Shared scene text" sections at the top of Phase 5. Read spec §8 (scenes table: the Agent Island row) and §16 (asset safety: an agent never launches Agent Island, because it types into live terminals).

### Task 6.1: Stockroom API: the Swagger UI capture and the scene

The capture comes from Stockroom running on this laptop (Temurin 21, local PostgreSQL 16), started without the `demo` profile so no demo data is seeded. Nothing is deployed. The jar is started by `tools/scenes/bg.py`, which records the PID and stops only that process tree.

**Files:**
- Create (asset): `public/work/stockroom/swagger.webp`
- Modify: `src/content/projects.ts` (Stockroom: `shot` replaces `illustrationLabel`), `src/content/scene-text.ts` (`stockroom`)
- Create: `src/scenes/stockroom/Scene.tsx`, `src/scenes/stockroom/scene.css`
- Modify: `src/scenes/index.ts`, `src/app/globals.css`

**Interfaces:**
- Consumes: `tools/scenes/shot.py` (Task 5.1), `tools/scenes/bg.py` (Task 5.3); `Stage`, `Layer`, `place`, `DeviceFrame`, `Mascot` (Task 1.4).
- Produces: `StockroomScene` as `fullScenes.stockroom`; parts `data-part="shot" | "box" | "request" | "badge" | "mascot"` for Task 6.2.

- [ ] **Step 1: Point the project at its screenshot**

In `src/content/projects.ts`, in the `stockroom` entry, replace:

```ts
    // Phase 6 (Task 6.1) replaces this with the Swagger UI capture.
    illustrationLabel: "Illustration of Stockroom API: a smiling cardboard box on a stockroom shelf.",
```

with:

```ts
    shot: {
      src: "/work/stockroom/swagger.webp",
      alt: "Swagger UI for the Stockroom API, listing its authentication, product and order endpoints.",
      width: 1440,
      height: 900,
      frame: "browser",
    },
```

Run: `npx vitest run tests/content-integrity.test.ts`
Expected: FAIL, naming `/work/stockroom/swagger.webp`.

- [ ] **Step 2: Build and start Stockroom locally, capture Swagger UI, stop it**

```bash
SR=/c/Users/OASIS/Documents/GitHub/stockroom-api
. $SR/.superpowers/env.sh
(cd $SR && ./mvnw -q -DskipTests package)
JWT_SECRET=portfolio-capture-local-only-secret-0123456789 py -3.11 -I tools/scenes/bg.py start stockroom $SR "$JAVA_HOME/bin/java" -jar target/stockroom-api.jar
py -3.11 -I tools/scenes/bg.py wait http://localhost:8080/actuator/health 120 UP
py -3.11 -I tools/scenes/shot.py http://localhost:8080/swagger-ui/index.html tools/scenes/out/stockroom.png --size 1440x900 --wait-for ".opblock" --wait 1500
py -3.11 -I tools/scenes/bg.py stop stockroom
```

Expected: `ready: http://localhost:8080/actuator/health`, `saved tools/scenes/out/stockroom.png`, `stopped stockroom`. If the health check never turns `UP`, read `tools/scenes/out/stockroom.log`: a connection error means the PostgreSQL 16 Windows service is not running. Ask Wrenz to start it (Services, "postgresql-x64-16"); never start or stop services yourself. (The JWT secret above is a throwaway value for a local process; it is not a credential and nothing is deployed.)

- [ ] **Step 3: Check and convert the capture**

Open `tools/scenes/out/stockroom.png` at 1:1: the Swagger UI title and the endpoint groups are visible, and every thing the Step 1 alt text names is on screen (reword it if not).

```bash
mkdir -p public/work/stockroom
ffmpeg -y -i tools/scenes/out/stockroom.png -c:v libwebp -quality 80 public/work/stockroom/swagger.webp
ffprobe -v error -show_entries stream=width,height -of csv=p=0 public/work/stockroom/swagger.webp
```

Expected: `1440,900`. Run `npx vitest run tests/content-integrity.test.ts`: PASS.

- [ ] **Step 4: The scene text**

Add to `src/content/scene-text.ts` (create it as described in Phase 5 "Shared scene text" if it does not exist):

```ts
  stockroom: { request: "GET /api/products", response: "200 OK" },
```

(`GET /api/products` returns 200 for owners and staff, per the Stockroom README.)

- [ ] **Step 5: The scene component**

Create `src/scenes/stockroom/Scene.tsx`:

```tsx
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import { sceneText } from "@/content/scene-text";
import type { FullProject } from "@/content/types";
import { place, type Place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 820, dh: 620, mdw: 358, mdh: 420 };

function Box() {
  return (
    <svg viewBox="0 0 80 72">
      <rect x="4" y="10" width="74" height="60" rx="8" fill="#B97A38" />
      <rect x="2" y="6" width="74" height="60" rx="8" fill="#E3A85E" />
      <rect x="31" y="6" width="16" height="20" fill="#F6E2C2" />
      <rect x="12" y="40" width="30" height="14" rx="4" fill="#FFF8EE" />
    </svg>
  );
}

// Boxes sit on the planks (desktop tops at y 300 and 500, mobile at y 360); a box is 0.9 x its width tall.
// Order = drop order: lower shelf, upper shelf, then the one on top.
const BOXES: (Place & { top?: boolean })[] = [
  { x: 40, y: 426, w: 84 },
  { x: 128, y: 426, w: 84 },
  { x: 40, y: 226, w: 84, mx: 16, my: 301, mw: 66 },
  { x: 128, y: 226, w: 84, mx: 86, my: 301, mw: 66 },
  { x: 216, y: 226, w: 84, mx: 156, my: 301, mw: 66 },
  { x: 84, y: 152, w: 84, mx: 50, my: 243, mw: 66, top: true },
];

export function StockroomScene({ project }: { project: FullProject }) {
  const { shot } = project;
  const text = sceneText.stockroom;
  return (
    <Stage slug={project.slug} tier="full" grid={GRID} label={shot ? undefined : project.illustrationLabel}>
      <Layer depth="bg">
        <svg className="pos g-d" style={place({ x: 0, y: 0, w: 820 })} viewBox="0 0 820 620">
          <rect x="24" y="120" width="14" height="480" rx="7" fill="#C9BCEB" />
          <rect x="302" y="120" width="14" height="480" rx="7" fill="#C9BCEB" />
          <rect x="20" y="306" width="300" height="18" rx="9" fill="#A897D9" />
          <rect x="20" y="300" width="300" height="18" rx="9" fill="#C9BCEB" />
          <rect x="20" y="506" width="780" height="18" rx="9" fill="#A897D9" />
          <rect x="20" y="500" width="780" height="18" rx="9" fill="#C9BCEB" />
        </svg>
        <svg className="pos g-m" style={place({ x: 0, y: 0, w: 820, mx: 0, my: 0, mw: 358 })} viewBox="0 0 358 420">
          <rect x="10" y="366" width="338" height="14" rx="7" fill="#A897D9" />
          <rect x="10" y="360" width="338" height="14" rx="7" fill="#C9BCEB" />
        </svg>
      </Layer>

      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" data-part="shot" style={place({ x: 330, y: 50, w: 470, mx: 16, my: 16, mw: 326 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 470px, 90vw" />
          </div>
        </Layer>
      ) : null}

      <Layer depth="fg">
        {BOXES.map(({ top, ...p }, i) => (
          <span key={i} className={p.mx === undefined ? "pos g-d" : "pos"} data-part="box" style={place(p)}>
            {top ? (
              <span className="wiggle loop">
                <Box />
              </span>
            ) : (
              <Box />
            )}
          </span>
        ))}
        <div className="pos" data-part="mascot" style={place({ x: 216, y: 392, w: 120, mx: 236, my: 272, mw: 92 })}>
          <div className="bob loop">
            <Mascot slug="stockroom" />
          </div>
        </div>
        <span className="pos" data-part="request" style={place({ x: 336, y: 404, w: 220, mx: 16, my: 386, mw: 170 })}>
          <span className="req">{text.request}</span>
        </span>
        <span className="pos" data-part="badge" style={place({ x: 676, y: 344, w: 120, mx: 238, my: 222, mw: 96 })}>
          <span className="ok pulse loop">
            <svg viewBox="0 0 256 256">
              <use href="#i-check" />
            </svg>
            {text.response}
          </span>
        </span>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/stockroom/scene.css`:

```css
/* Stockroom API (split world). Desktop grid 820 x 620, mobile 358 x 420. */
.stage[data-scene="stockroom"] { background: #F5F1FF; --fs: 15; }
@container stage (width < 760px) {
  .stage[data-scene="stockroom"] { --fs: 12; }
}

[data-scene="stockroom"] [data-part="box"] { transform-origin: 50% 100%; }
[data-scene="stockroom"] .wiggle { display: block; transform-origin: 50% 100%; }
[data-scene="stockroom"] .wiggle > svg { display: block; width: 100%; height: auto; }

[data-scene="stockroom"] [data-part="request"],
[data-scene="stockroom"] [data-part="badge"] { width: max-content; }
[data-scene="stockroom"] .req {
  display: inline-flex; align-items: center; padding: calc(9 * var(--u)) calc(14 * var(--u));
  border-radius: calc(10 * var(--u)); background: var(--color-ink); color: var(--color-paper);
  font: 700 calc(var(--fs) * var(--u))/1 ui-monospace, "Cascadia Mono", Consolas, monospace; white-space: nowrap;
}
[data-scene="stockroom"] .ok {
  display: inline-flex; align-items: center; gap: calc(8 * var(--u)); padding: calc(10 * var(--u)) calc(18 * var(--u));
  border-radius: 999px; background: var(--color-sheets-green); color: #FFFFFF;
  font: 700 calc(var(--fs) * var(--u))/1 var(--font-display); white-space: nowrap;
  box-shadow: 0 calc(4 * var(--u)) 0 #0B4A2A;
}
[data-scene="stockroom"] .ok svg { width: calc(16 * var(--u)); height: calc(16 * var(--u)); }

@media (prefers-reduced-motion: no-preference) {
  /* Three pulses per 6 s; two wiggles per 5 s. */
  [data-scene="stockroom"].live .pulse.loop { animation: sr-pulse 6s ease-in-out infinite; }
  [data-scene="stockroom"].live .wiggle.loop { animation: sr-wiggle 5s ease-in-out infinite; }
}
@keyframes sr-pulse {
  0%, 33.33%, 66.67%, 100% { transform: scale(1); }
  8%, 41.33%, 74.67% { transform: scale(1.06); }
}
@keyframes sr-wiggle {
  0%, 50%, 100% { transform: rotate(0deg); }
  10%, 60% { transform: rotate(-3deg); }
  20%, 70% { transform: rotate(3deg); }
  30%, 80% { transform: rotate(0deg); }
}
```

- [ ] **Step 6: Register the scene and its stylesheet**

In `src/scenes/index.ts`, add `import { StockroomScene } from "./stockroom/Scene";` and change the entry to `stockroom: StockroomScene,`. In `src/app/globals.css`, add after the Katiwala scene import:

```css
@import "../scenes/stockroom/scene.css" layer(scenes);
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (about 75 elements; the basic choreography drives the mascot until Task 6.2).

- [ ] **Step 8: Lab and page screenshots, then Fable art direction**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
PERF_URL=http://127.0.0.1:3000/dev/scenes/stockroom py -3.11 -I tools/perf/shoot.py tools/perf/out/6.1/lab 1440 900 --wait 3000
py -3.11 -I tools/perf/shoot.py tools/perf/out/6.1/page 1440 900 --wait 1500
py -3.11 -I tools/perf/shoot.py tools/perf/out/6.1/page 390 844 --wait 1500
py -3.11 -I tools/perf/serve.py stop
```

Dispatch the Task 5.1 Step 10 brief to Fable (`model: "fable"`) with: world = "the Stockroom API world (split; the stage is on the left and the copy on the right)", screenshots = `tools/perf/out/6.1/lab/*.png` and `tools/perf/out/6.1/page/*.png`, token = `--color-tint-stockroom`, family = lilac, neighbours = "Katiwala above is teal, Agent Island below is rose", minimum scene text = 13 design px on the desktop grid and 12 on the mobile grid.

- [ ] **Step 9: Apply every MUST-FIX and the final tint**

Make each MUST-FIX change exactly as specified and set `--color-tint-stockroom` in `src/app/globals.css`. Run `npx vitest run && npx tsc --noEmit && npm run lint` (all pass), re-run Step 8's screenshots and look at them at 1:1. List the NICE-TO-HAVE items in the PR.

- [ ] **Step 10: Commit and open the PR**

```bash
git add public/work/stockroom src/content src/scenes src/app/globals.css
git commit -m "Add the Stockroom API world: local Swagger UI capture, shelves, boxes and a 200 OK"
git push -u origin rd/6.1-stockroom-scene
gh pr create --base redesign --title "6.1 Stockroom: Swagger UI and scene" --body "Task 6.1. Swagger UI captured from the jar running locally (no demo profile, PID stopped by bg.py, nothing deployed), the split scene (shelves, stacking boxes, request chip, 200 OK badge, box mascot), the final tint and Fable's MUST-FIX items. Screenshots attached; NICE-TO-HAVE list below."
```

Review and merge per the protocol.

### Task 6.2: The Stockroom choreography

**Files:**
- Create: `src/scenes/stockroom/choreo.ts`
- Modify: `src/motion/registry.ts`

**Interfaces:**
- Consumes: `Choreo`, `Gsap` (Task 1.5); parts `shot`, `box`, `request`, `badge`, `mascot` (Task 6.1).
- Produces: `choreo:stockroom`. Entrance (about 1.7 s): the Swagger frame rises, the boxes drop onto the shelves with a bounce (lower shelf first), the mascot box lands, the request chip slides in and the "200 OK" badge pops; then `.live` starts the badge pulse, the top box wiggle and the mascot bob.

- [ ] **Step 1: Point the registry at the new choreography**

In `src/motion/registry.ts`, change the entry to:

```ts
  stockroom: () => import("@/scenes/stockroom/choreo"),
```

Run: `npx vitest run tests/choreo-contract.test.tsx`
Expected: FAIL for `stockroom`, `Failed to resolve import "@/scenes/stockroom/choreo"`.

- [ ] **Step 2: Write the choreography**

Create `src/scenes/stockroom/choreo.ts`:

```ts
import type { Choreo, Gsap } from "@/motion/types";

type Vars = Parameters<Gsap["set"]>[1];

/** Stockroom: boxes stack onto the shelves while a request returns 200 OK. */
const choreo: Choreo = (root, { gsap, skipEntrance }) => {
  const all = (name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`));
  const shot = all("shot");
  const boxes = all("box");
  const mascot = all("mascot");
  const request = all("request");
  const badge = all("badge");
  const targets = [...shot, ...boxes, ...mascot, ...request, ...badge];
  const set = (els: HTMLElement[], vars: Vars) => {
    if (els.length) gsap.set(els, vars);
  };

  if (!skipEntrance) {
    set(shot, { yPercent: 8 });
    set([...boxes, ...mascot], { yPercent: -260, autoAlpha: 0 });
    set(request, { xPercent: -30, autoAlpha: 0 });
    set(badge, { scale: 0 });
  }

  let timeline: ReturnType<Gsap["timeline"]> | undefined;

  return {
    name: "choreo:stockroom",
    enter() {
      if (skipEntrance) {
        root.classList.add("live");
        return;
      }
      const tl = gsap.timeline({ onComplete: () => root.classList.add("live") });
      if (shot.length) tl.to(shot, { yPercent: 0, duration: 0.6, ease: "power3.out" }, 0);
      if (boxes.length) tl.to(boxes, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "bounce.out", stagger: 0.1 }, 0.2);
      if (mascot.length) tl.to(mascot, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: "bounce.out" }, 0.75);
      if (request.length) tl.to(request, { xPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0.95);
      if (badge.length) tl.to(badge, { scale: 1, duration: 0.45, ease: "back.out(2.5)" }, 1.3);
      timeline = tl;
    },
    cleanup() {
      timeline?.kill();
      gsap.killTweensOf(targets);
      set(targets, { clearProps: "transform,opacity,visibility" });
      root.classList.remove("live");
    },
  };
};

export default choreo;
```

- [ ] **Step 3: Run the tests and the chunk check**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build && node tools/perf/chunks.mjs`
Expected: all pass; `ok   choreo:stockroom` under 8 KB; `PASS`.

- [ ] **Step 4: Watch it in real Chrome**

```bash
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/who.py stockroom 1
py -3.11 -I tools/perf/anim_raw.py stockroom
py -3.11 -I tools/perf/serve.py stop
```

Before stopping the server, scroll to the Stockroom world at 1440×900 and 390×844: boxes drop and bounce onto the shelves, the chip slides in, the badge pops, then the badge pulses and the top box wiggles. Expected tool output: no recurring JS calls while parked; no `compositeFailed` for `sr-pulse`, `sr-wiggle` or `bob`.

- [ ] **Step 5: Commit and open the PR**

```bash
git add src/scenes/stockroom/choreo.ts src/motion/registry.ts
git commit -m "Add the Stockroom entrance: boxes stack and the request returns 200 OK"
git push -u origin rd/6.2-stockroom-choreo
gh pr create --base redesign --title "6.2 Stockroom choreography" --body "Task 6.2. Prepare/enter contract, percentage offsets, cleanup restores the end state. chunks.mjs, who.py and anim_raw.py output below."
```

Review and merge per the protocol.

### Task 6.3: Agent Island: the designed panel scene

There is no capture: the app types into live terminals, so an agent never launches it (spec §16). The scene is drawn from the README's described states: the idle black pill, the permission prompt with "Allow once / Don't ask again / Deny", and the "Continue in Terminal" hand-off. The project keeps its `illustrationLabel`, so the stage is `role="img"` with that label. If Wrenz later makes a real capture himself, it can replace the panel as a `shot`; that is his option, not a step of this plan.

**Files:**
- Create (asset): `public/work/agent-island/desktop.svg`
- Modify: `src/content/scene-text.ts` (`agentIsland`)
- Create: `src/scenes/agent-island/layout.ts`, `src/scenes/agent-island/Scene.tsx`, `src/scenes/agent-island/scene.css`
- Modify: `src/scenes/index.ts`, `src/app/globals.css`

**Interfaces:**
- Consumes: `Stage`, `Layer`, `place`, `cssVars`, `Mascot` (Task 1.4); the bleed contract (desktop x < 560 calm, 21 design px minimum text).
- Produces: `AgentIslandScene` as `fullScenes["agent-island"]`; `src/scenes/agent-island/layout.ts` exporting `GRID` and `NOTE_PATH: { desktop: Point[]; mobile: Point[] }` (shared with Task 6.4 so the choreography needs no layout reads); parts `data-part="mascot" | "bot" | "note" | "idle" | "panel" | "choice"`.

- [ ] **Step 1: The scene text**

Add to `src/content/scene-text.ts` (create it as described in Phase 5 "Shared scene text" if it does not exist):

```ts
  agentIsland: {
    agents: ["Claude Code", "Codex", "Hermes"],
    note: "prompt.json",
    question: "Do you want to proceed?",
    choices: ["Allow once", "Don't ask again", "Deny"],
    handoff: "Continue in Terminal",
  },
```

(Every string is from the Agent Island README: the three agents, the prompt files it reads, Claude's question, the three choices and the hand-off button.)

- [ ] **Step 2: The static desktop backdrop**

Create `public/work/agent-island/desktop.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <rect width="1280" height="720" fill="#FFF0F4"/>
  <circle cx="1120" cy="170" r="74" fill="#FFD9E4"/>
  <path transform="translate(0 10)" fill="#F7B8CB" d="M0 520C200 440 420 470 640 520C860 570 1060 540 1280 470V720H0Z"/>
  <path fill="#FFCADA" d="M0 520C200 440 420 470 640 520C860 570 1060 540 1280 470V720H0Z"/>
  <path fill="#FFE0E9" d="M0 610C260 570 520 600 760 640C980 676 1140 660 1280 630V720H0Z"/>
  <rect y="684" width="1280" height="36" fill="#1F1B24" fill-opacity="0.08"/>
</svg>
```

- [ ] **Step 3: The shared layout**

Create `src/scenes/agent-island/layout.ts`:

```ts
/** Shared by the Agent Island scene and its choreography, so the choreography needs no layout reads. */
export const GRID = { dw: 1280, dh: 720, mdw: 358, mdh: 440 };

export type Point = { x: number; y: number };

/** The JSON note's stops in design px: bot 1, bot 2, bot 3, then the island. The first stop is where
 *  the scene places the note. Desktop stops stay at x >= 560 (the copy panel covers the left part). */
export const NOTE_PATH: { desktop: Point[]; mobile: Point[] } = {
  desktop: [
    { x: 708, y: 528 },
    { x: 948, y: 560 },
    { x: 1176, y: 528 },
    { x: 900, y: 70 },
  ],
  mobile: [
    { x: 34, y: 300 },
    { x: 150, y: 306 },
    { x: 266, y: 300 },
    { x: 150, y: 40 },
  ],
};
```

- [ ] **Step 4: The scene component**

Create `src/scenes/agent-island/Scene.tsx`:

```tsx
import Image from "next/image";
import { Mascot } from "@/components/Mascot";
import { sceneText } from "@/content/scene-text";
import type { FullProject } from "@/content/types";
import { cssVars, place, type Place } from "../grid";
import { Layer, Stage } from "../Stage";
import { GRID, NOTE_PATH } from "./layout";

/** A bot in the mascot's face grammar, in another colour (Codex and Hermes; Claude Code is the mascot). */
function Bot({ fill, shade }: { fill: string; shade: string }) {
  return (
    <svg viewBox="0 0 120 112" aria-hidden="true" focusable="false">
      <path d="M60 24V10" stroke={shade} strokeWidth="6" strokeLinecap="round" />
      <circle cx="60" cy="9" r="7" fill="#FFC72C" />
      <rect x="2" y="52" width="12" height="28" rx="6" fill={shade} />
      <rect x="106" y="52" width="12" height="28" rx="6" fill={shade} />
      <rect x="10" y="30" width="100" height="78" rx="24" fill={shade} />
      <rect x="10" y="24" width="100" height="78" rx="24" fill={fill} />
      <rect x="24" y="40" width="72" height="46" rx="16" fill="#FFF8EE" />
      <use href="#s-eye" x="41" y="54" width="12" height="12" />
      <use href="#s-eye" x="67" y="54" width="12" height="12" />
      <path d="M52 72Q60 79 68 72" fill="none" stroke="#1F1B24" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

// Terminals without mobile values are desktop-only. Line widths are % of the terminal body.
const TERMINALS: { place: Place; lines: number[] }[] = [
  { place: { x: 620, y: 290, w: 300, mx: 20, my: 162, mw: 200 }, lines: [72, 48, 86, 40] },
  { place: { x: 960, y: 250, w: 290 }, lines: [64, 80, 36, 58] },
  { place: { x: 780, y: 452, w: 300 }, lines: [56, 90, 44, 70] },
];

const BOT_PLACES: Place[] = [
  { x: 650, y: 560, w: 100, mx: 20, my: 330, mw: 76 },
  { x: 900, y: 590, w: 100, mx: 140, my: 340, mw: 76 },
  { x: 1130, y: 560, w: 100, mx: 262, my: 330, mw: 76 },
];

export function AgentIslandScene({ project }: { project: FullProject }) {
  const text = sceneText.agentIsland;
  const start = { desktop: NOTE_PATH.desktop[0], mobile: NOTE_PATH.mobile[0] };
  return (
    <Stage slug={project.slug} tier="full" grid={GRID} label={project.shot ? undefined : project.illustrationLabel}>
      <Layer depth="bg">
        <div className="pos" style={place({ x: 0, y: 0, w: 1280, mx: -212, my: 0, mw: 782 })}>
          <Image src="/work/agent-island/desktop.svg" alt="" width={1280} height={720} unoptimized loading="lazy" />
        </div>
      </Layer>

      <Layer depth="mid">
        {TERMINALS.map((t, k) => (
          <span key={text.agents[k]} className={t.place.mx === undefined ? "pos g-d" : "pos"} style={place(t.place)}>
            <span className="term">
              <span className="term-bar">
                <i />
                <i />
                <i />
                <span className="term-title">{text.agents[k]}</span>
              </span>
              <span className="term-body">
                {t.lines.map((width, j) => (
                  <i key={j} className="term-line" style={cssVars({ "--l": `${width}%` })} />
                ))}
                <i className="term-cursor loop" />
              </span>
            </span>
          </span>
        ))}
        <span className="pos g-d" style={place({ x: 610, y: 210, w: 300 })}>
          <span className="handoff">
            <svg viewBox="0 0 256 256">
              <use href="#i-arrow-up-right" />
            </svg>
            {text.handoff}
          </span>
        </span>
      </Layer>

      <Layer depth="fg">
        {BOT_PLACES.map((p, k) => (
          <div key={k} className="pos" data-part={k === 0 ? "mascot" : "bot"} style={place(p, { "--bdl": `${-0.6 * k}s` })}>
            <div className="bob loop">
              {k === 0 ? <Mascot slug="agent-island" /> : k === 1 ? <Bot fill="#20B2A0" shade="#138F80" /> : <Bot fill="#FF8A3D" shade="#E06A1F" />}
            </div>
          </div>
        ))}
        <span
          className="pos"
          data-part="note"
          style={place({ x: start.desktop.x, y: start.desktop.y, w: 160, mx: start.mobile.x, my: start.mobile.y, mw: 96 })}
        >
          <span className="note">{text.note}</span>
        </span>
        <span className="pos" data-part="idle" style={place({ x: 900, y: 36, w: 120, mx: 139, my: 16, mw: 80 })}>
          <span className="pill-idle" />
        </span>
        <div className="pos" data-part="panel" style={place({ x: 690, y: 28, w: 540, mx: 10, my: 12, mw: 338 })}>
          <span className="panel">
            <span className="panel-who">
              <i className="panel-dot" />
              {text.agents[0]}
            </span>
            <span className="panel-q">{text.question}</span>
            <span className="panel-choices">
              {text.choices.map((choice, i) => (
                <span key={choice} className={i === 0 ? "choice yes" : "choice"} data-part="choice">
                  {choice}
                </span>
              ))}
            </span>
          </span>
        </div>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/agent-island/scene.css`:

```css
/* Agent Island (bleed world, a designed panel from the README states). Desktop grid 1280 x 720, mobile 358 x 440.
   --fs: body text, --fq: the question, --tb: terminal bar height, all in design px of the active grid. */
.stage[data-scene="agent-island"] { background: #FFF0F4; --fs: 21; --fq: 26; --tb: 40; }
@container stage (width < 760px) {
  .stage[data-scene="agent-island"] { --fs: 12; --fq: 14; --tb: 24; }
}
[data-scene="agent-island"] .pos > img { display: block; width: 100%; height: auto; }
[data-scene="agent-island"] .bob { display: block; }

[data-scene="agent-island"] .term {
  display: block; padding: 0 calc(14 * var(--u)) calc(16 * var(--u));
  border-radius: calc(18 * var(--u)); background: var(--color-ink);
}
[data-scene="agent-island"] .term-bar { display: flex; align-items: center; gap: calc(7 * var(--u)); height: calc(var(--tb) * var(--u)); }
[data-scene="agent-island"] .term-bar i { width: calc(10 * var(--u)); aspect-ratio: 1; border-radius: 50%; background: #8C8494; }
[data-scene="agent-island"] .term-title {
  margin-left: calc(8 * var(--u)); color: var(--color-paper);
  font: 600 calc(var(--fs) * var(--u))/1 var(--font-body); white-space: nowrap;
}
[data-scene="agent-island"] .term-body { display: block; }
[data-scene="agent-island"] .term-line {
  display: block; width: var(--l); height: calc(11 * var(--u)); margin-top: calc(12 * var(--u));
  border-radius: 999px; background: #5C5562;
}
[data-scene="agent-island"] .term-line:first-child { background: var(--color-yolk); }
[data-scene="agent-island"] .term-cursor {
  display: block; width: calc(12 * var(--u)); height: calc(16 * var(--u)); margin-top: calc(12 * var(--u));
  background: var(--color-yolk);
}

[data-scene="agent-island"] .handoff {
  display: inline-flex; align-items: center; gap: calc(8 * var(--u)); padding: calc(10 * var(--u)) calc(18 * var(--u));
  border-radius: 999px; background: var(--color-white); color: var(--color-ink);
  font: 700 calc(var(--fs) * var(--u))/1 var(--font-display); white-space: nowrap; box-shadow: 0 calc(4 * var(--u)) 0 #F7B8CB;
}
[data-scene="agent-island"] .handoff svg { width: calc(20 * var(--u)); height: calc(20 * var(--u)); }

/* End state: the note has been delivered (hidden) and the idle pill has expanded into the panel. */
[data-scene="agent-island"] [data-part="note"] { width: max-content; opacity: 0; }
[data-scene="agent-island"] .note {
  display: inline-flex; align-items: center; padding: calc(10 * var(--u)) calc(16 * var(--u));
  border-radius: calc(10 * var(--u)) calc(10 * var(--u)) calc(10 * var(--u)) calc(2 * var(--u));
  background: var(--color-white); color: var(--color-ink); white-space: nowrap; box-shadow: 0 calc(4 * var(--u)) 0 #F7B8CB;
  font: 700 calc(var(--fs) * var(--u))/1 ui-monospace, "Cascadia Mono", Consolas, monospace;
}
[data-scene="agent-island"] [data-part="idle"] { opacity: 0; }
[data-scene="agent-island"] .pill-idle { display: block; height: calc(36 * var(--u)); border-radius: 999px; background: var(--color-ink); }
[data-scene="agent-island"] [data-part="panel"] { transform-origin: 50% 0; }
[data-scene="agent-island"] .panel {
  display: grid; gap: calc(12 * var(--u)); padding: calc(22 * var(--u)) calc(26 * var(--u));
  border-radius: calc(36 * var(--u)); background: var(--color-ink); color: var(--color-paper);
}
[data-scene="agent-island"] .panel-who {
  display: flex; align-items: center; gap: calc(10 * var(--u)); color: #D8D1E0;
  font: 600 calc(var(--fs) * var(--u))/1 var(--font-body);
}
[data-scene="agent-island"] .panel-dot { width: calc(12 * var(--u)); aspect-ratio: 1; border-radius: 50%; background: #8B6CFF; }
[data-scene="agent-island"] .panel-q { font: 800 calc(var(--fq) * var(--u))/1.15 var(--font-display); }
[data-scene="agent-island"] .panel-choices { display: flex; flex-wrap: wrap; gap: calc(10 * var(--u)); }
[data-scene="agent-island"] .choice {
  display: inline-flex; align-items: center; padding: calc(10 * var(--u)) calc(18 * var(--u)); border-radius: 999px;
  background: #403A46; color: var(--color-paper); font: 700 calc(var(--fs) * var(--u))/1 var(--font-display); white-space: nowrap;
}
[data-scene="agent-island"] .choice.yes { background: var(--color-yolk); color: var(--color-ink); }

@media (prefers-reduced-motion: no-preference) {
  /* Six blinks per 6 s iteration. */
  [data-scene="agent-island"].live .term-cursor.loop { animation: ai-blink 6s steps(1, end) infinite; }
}
@keyframes ai-blink {
  0%, 16.66%, 33.33%, 50%, 66.66%, 83.33% { opacity: 1; }
  8.33%, 25%, 41.66%, 58.33%, 75%, 91.66% { opacity: 0; }
}
```

- [ ] **Step 5: Register the scene and its stylesheet**

In `src/scenes/index.ts`, add `import { AgentIslandScene } from "./agent-island/Scene";`, change the entry to `"agent-island": AgentIslandScene,`, and delete the line `import { BasicWorld } from "./basic/BasicWorld";` (no entry uses it any more, and `@typescript-eslint/no-unused-vars` is an error in this lint config). In `src/app/globals.css`, add after the Stockroom scene import:

```css
@import "../scenes/agent-island/scene.css" layer(scenes);
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass. `tests/scenes.test.tsx` finds no `button` (the choices are spans), about 110 elements, and the stage named by the illustration label. With the basic choreography the first bot (the mascot) pops in until Task 6.4.

- [ ] **Step 7: Lab and page screenshots, then Fable art direction**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
PERF_URL=http://127.0.0.1:3000/dev/scenes/agent-island py -3.11 -I tools/perf/shoot.py tools/perf/out/6.3/lab 1440 900 --wait 3000
py -3.11 -I tools/perf/shoot.py tools/perf/out/6.3/page 1440 900 --wait 1500
py -3.11 -I tools/perf/shoot.py tools/perf/out/6.3/page 390 844 --wait 1500
py -3.11 -I tools/perf/serve.py stop
```

Dispatch the Task 5.1 Step 10 brief to Fable (`model: "fable"`) with: world = "the Agent Island world (full-bleed; a designed panel, not a screenshot, built from the README's described states; the copy panel covers the left part from 1024 px)", screenshots = `tools/perf/out/6.3/lab/*.png` and `tools/perf/out/6.3/page/*.png`, token = `--color-tint-agent-island`, family = rose, neighbours = "Stockroom above is lilac; More work below is on paper", minimum scene text = 21 design px on the desktop grid and 12 on the mobile grid. Add to the brief: "Also judge whether the panel reads as Agent Island's real UI states (idle black pill, permission prompt, Continue in Terminal) without inventing features the README does not describe."

- [ ] **Step 8: Apply every MUST-FIX and the final tint**

Make each MUST-FIX change exactly as specified and set `--color-tint-agent-island` in `src/app/globals.css`. Run `npx vitest run && npx tsc --noEmit && npm run lint` (all pass), re-run Step 7's screenshots and look at them at 1:1. List the NICE-TO-HAVE items in the PR.

- [ ] **Step 9: Commit and open the PR**

```bash
git add public/work/agent-island src/content src/scenes src/app/globals.css
git commit -m "Add the Agent Island world: three bots, terminals and the island's permission prompt"
git push -u origin rd/6.3-agent-island-scene
gh pr create --base redesign --title "6.3 Agent Island: designed panel scene" --body "Task 6.3. No capture (the app is never launched by an agent). Bleed scene from the README states: terminals for Claude Code, Codex and Hermes, three bots, the prompt.json note, the island expanded to Allow once / Don't ask again / Deny, and Continue in Terminal. Final tint and Fable's MUST-FIX items; NICE-TO-HAVE list below. If Wrenz makes a real capture himself, it can replace the panel later."
```

Review and merge per the protocol.

### Task 6.4: The Agent Island choreography

**Files:**
- Create: `src/scenes/agent-island/choreo.ts`
- Modify: `src/motion/registry.ts`

**Interfaces:**
- Consumes: `Choreo`, `Gsap` (Task 1.5); `GRID`, `NOTE_PATH` (Task 6.3); parts `mascot`, `bot`, `note`, `idle`, `panel`, `choice`.
- Produces: `choreo:agent-island`. Entrance (about 3.7 s): the three bots hop up; the `prompt.json` note appears at bot 1 and hops to bot 2, bot 3, then arcs up into the idle pill; the pill pulses and expands into the prompt panel; the three choices pop. Then `.live` starts the cursor blinks and the bot bobs.

- [ ] **Step 1: Point the registry at the new choreography**

In `src/motion/registry.ts`, change the entry to:

```ts
  "agent-island": () => import("@/scenes/agent-island/choreo"),
```

Run: `npx vitest run tests/choreo-contract.test.tsx`
Expected: FAIL for `agent-island`, `Failed to resolve import "@/scenes/agent-island/choreo"`.

- [ ] **Step 2: Write the choreography**

Create `src/scenes/agent-island/choreo.ts`:

```ts
import type { Choreo, Gsap } from "@/motion/types";
import { GRID, NOTE_PATH } from "./layout";

type Vars = Parameters<Gsap["set"]>[1];

/** Agent Island: three bots pass a JSON note into the island, which expands to show the prompt. */
const choreo: Choreo = (root, { gsap, mobile, skipEntrance }) => {
  const all = (name: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`));
  const bots = [...all("mascot"), ...all("bot")];
  const note = all("note");
  const idle = all("idle");
  const panel = all("panel");
  const choices = all("choice");
  const targets = [...bots, ...note, ...idle, ...panel, ...choices];
  const set = (els: HTMLElement[], vars: Vars) => {
    if (els.length) gsap.set(els, vars);
  };

  // Design px to real px on the active grid, measured once here (prepare), never per frame.
  const route = mobile ? NOTE_PATH.mobile : NOTE_PATH.desktop;
  const unit = root.getBoundingClientRect().width / (mobile ? GRID.mdw : GRID.dw);
  const offset = (i: number) => ({ x: (route[i].x - route[0].x) * unit, y: (route[i].y - route[0].y) * unit });

  if (!skipEntrance) {
    set(bots, { yPercent: 120, autoAlpha: 0 });
    set(note, { x: 0, y: 0, scale: 0.6, autoAlpha: 0 });
    set(idle, { autoAlpha: 1 });
    set(panel, { scale: 0.25, autoAlpha: 0 });
    set(choices, { scale: 0.6, autoAlpha: 0 });
  }

  let timeline: ReturnType<Gsap["timeline"]> | undefined;

  return {
    name: "choreo:agent-island",
    enter() {
      if (skipEntrance) {
        root.classList.add("live");
        return;
      }
      const tl = gsap.timeline({ onComplete: () => root.classList.add("live") });
      if (bots.length) tl.to(bots, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(1.8)", stagger: 0.12 }, 0);
      if (note.length) {
        tl.to(note, { autoAlpha: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, 0.7);
        for (let i = 1; i < route.length; i++) {
          const from = offset(i - 1);
          const to = offset(i);
          const at = 1 + (i - 1) * 0.6;
          const peak = Math.min(from.y, to.y) - 50 * unit;
          tl.to(note, { x: to.x, duration: 0.5, ease: "power1.inOut" }, at)
            .to(note, { y: peak, duration: 0.24, ease: "power2.out" }, at)
            .to(note, { y: to.y, duration: 0.26, ease: "power2.in" }, at + 0.24);
        }
        tl.to(note, { autoAlpha: 0, scale: 0.4, duration: 0.2 }, 2.8);
      }
      if (idle.length) {
        tl.to(idle, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1 }, 2.8).to(idle, { autoAlpha: 0, duration: 0.15 }, 3.1);
      }
      if (panel.length) tl.to(panel, { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(1.4)" }, 3.1);
      if (choices.length) tl.to(choices, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(2.4)", stagger: 0.08 }, 3.4);
      timeline = tl;
    },
    cleanup() {
      timeline?.kill();
      gsap.killTweensOf(targets);
      set(targets, { clearProps: "transform,opacity,visibility" });
      root.classList.remove("live");
    },
  };
};

export default choreo;
```

- [ ] **Step 3: Run the tests and the chunk check**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build && node tools/perf/chunks.mjs`
Expected: all pass (the contract test runs it on both grids; after cleanup the note and the idle pill are back to their CSS end state, opacity 0); `ok   choreo:agent-island` under 8 KB; `PASS`.

- [ ] **Step 4: Watch it in real Chrome**

```bash
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/who.py agent-island 1
py -3.11 -I tools/perf/anim_raw.py agent-island
py -3.11 -I tools/perf/serve.py stop
```

Before stopping the server, scroll to the Agent Island world at 1440×900 and at 390×844 and watch the whole story: bots hop up, the note hops bot to bot and into the pill, the pill expands into the prompt, the choices pop, then cursors blink and bots bob. Resize the window across 760 px of stage width (drag the window from 1440 to 700 wide and back): the scene keeps its finished state on the new grid (the engine re-prepares it). Expected tool output: no recurring JS calls while parked; no `compositeFailed` for `ai-blink` or `bob`.

- [ ] **Step 5: Commit and open the PR**

```bash
git add src/scenes/agent-island/choreo.ts src/motion/registry.ts
git commit -m "Add the Agent Island entrance: the note travels into the island and the prompt opens"
git push -u origin rd/6.4-agent-island-choreo
gh pr create --base redesign --title "6.4 Agent Island choreography" --body "Task 6.4. Note route from layout.ts (design px times the unit measured once at prepare), pill expands to the prompt, cleanup restores the end state. chunks.mjs, who.py and anim_raw.py output below."
```

Review and merge per the protocol.

### Task 6.5: Phase 6 verification

**Files:**
- Modify: whatever the gate's MUST-FIX items touch (on branch `rd/6.5-phase6-gate`)

**Interfaces:**
- Consumes: the whole page after Tasks 6.1 to 6.4 (all six worlds designed).
- Produces: the gate results, Fable's phase critique, Wrenz's sign-off.

- [ ] **Step 1: Unit checks, build, chunk budget**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build && node tools/perf/chunks.mjs`
Expected: all pass; `chunks.mjs` lists `pos`, `time-log`, `service-areas`, `katiwala`, `stockroom` and `agent-island` (no `basic` any more), each under 8 KB, and `PASS`.

- [ ] **Step 2: Frames, compositing, budgets**

```bash
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/perf.py 1440 900 1 --check
py -3.11 -I tools/perf/perf.py 1440 900 4 --check
py -3.11 -I tools/perf/perf.py 390 844 1 --mobile --check
py -3.11 -I tools/perf/perf.py 390 844 4 --mobile --check
py -3.11 -I tools/perf/smooth.py 4
py -3.11 -I tools/perf/anim_raw.py
py -3.11 -I tools/perf/budget.py
```

Expected: four `PASS` lines from `perf.py` (parks in all six worlds); `smooth.py` dropped share in single digits; `anim_raw.py` shows no unexplained `compositeFailed`; `budget.py` `PASS`, with every world stage at or under 300 elements and the page at or under 2,500.

- [ ] **Step 3: Lighthouse, accessibility and screenshots**

```bash
npx -y lighthouse@13 http://127.0.0.1:3000/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=tools/perf/out/lh.json --chrome-flags="--headless=new"
node tools/perf/lh-summary.mjs tools/perf/out/lh.json
py -3.11 -I tools/perf/a11y.py
for size in "390 844" "820 1180" "1024 768" "1440 900"; do py -3.11 -I tools/perf/shoot.py tools/perf/out/6.5 $size; done
py -3.11 -I tools/perf/shoot.py tools/perf/out/6.5 390 844 --rm
py -3.11 -I tools/perf/shoot.py tools/perf/out/6.5 1440 900 --nojs
py -3.11 -I tools/perf/serve.py stop
```

Expected: `lh-summary.mjs` no `FAIL`; `a11y.py` `PASS`; every `shoot.py` `PASS`. Keyboard-only pass at 1440 and 390 (the Stockroom and Agent Island links reachable, focus visible). Look at every screenshot at 1:1, especially both bleed worlds at 1024 (copy panel over a calm area) and 820 (stacked), and the no-JavaScript shot (Agent Island shows the expanded prompt, Stockroom the boxes on their shelves).

- [ ] **Step 4: Fable phase critique**

Dispatch the "Fable critique brief" from the front matter (`model: "fable"`) with screenshots `tools/perf/out/6.5/s-1440-*.png`, `s-390-*.png`, `s-820-*.png`, `s-1024-*.png`; phase = "Phase 6: the Stockroom API world (split) and the Agent Island world (full-bleed, designed panel) replaced their basic scenes; all six worlds are now designed. Judge the six worlds as a sequence too: rhythm, hue families of neighbours, scene density."

- [ ] **Step 5: Fix every MUST-FIX and re-run the gate**

Fix each item on this branch and repeat Steps 1 to 3 until everything passes.

- [ ] **Step 6: Open the PR and ask for sign-off**

```bash
git add -A
git commit -m "Phase 6 gate fixes"
git push -u origin rd/6.5-phase6-gate
gh pr create --base redesign --title "6.5 Phase 6 verification" --body "Task 6.5. Gate results for all six designed worlds (perf 1x/4x at 1440 and 390, smooth, anim_raw, budget, Lighthouse, axe, keyboard, reduced motion, no JavaScript, 4 screenshot sizes), Fable's critique with every MUST-FIX fixed, NICE-TO-HAVE list for Wrenz."
```

(With no fixes needed, use `git commit --allow-empty -m "Phase 6 gate results"` instead.) Paste every output into the PR. Review and merge per the protocol, then ask Wrenz to review the six worlds on the `redesign` preview and sign off Phase 6 before Phase 7 starts.

---

# Phase 7: The five vignettes

Goal: the five basic vignette scenes are replaced by small designed scenes: an **Everyday Rockstar** star burst beside its live-site screenshot, a **LiPAD** invented licence plate crossfading from blurred to sharp, **KeyClick** keys pressing themselves and a cursor clicking beside the app window, a **Med42** heartbeat line and beating heart beside the live app, and **PesoWise** pesos dropping into a wallet beside the live app. Fable sets the final vignette tints.

Vignettes are CSS only (spec §9): no choreography and no GSAP. Their loops run from the start, because a vignette is never hidden, and the engine pauses them off-screen. The cell, the bento, the scroll-driven entrance and the hover or focus "beat" on `[data-part="mascot"]` belong to `<Vignette>` (Task 4.3); this phase builds only the scenes in `src/scenes/<slug>/` and registers them in `compactScenes`. LiPAD's award badge is real text in the cell (Task 4.3), never inside the aria-hidden scene.

Follow the "Scene protocol" and "Shared scene text" sections at the top of Phase 5, with these vignette rules from Task 4.3:
- **One grid.** A vignette stage passes the same values for both grids (`mdw = dw`, `mdh = dh`) and uses no `.g-d` / `.g-m`.
- **Scene text** is at least ⌈12 × dw / 258⌉ design px (the narrowest vignette stage is 258 px wide): **19** for a 400-wide grid, 30 for the 640-wide Everyday Rockstar grid (which has no text).
- **Loops run without `.live`**, scoped to the scene (`[data-scene="<slug>"] .x.loop`), inside `prefers-reduced-motion: no-preference`. The shared `[data-tier="compact"] .bob.loop` from Task 4.3 already bobs `.bob` wrappers.
- **First keyframe visible.** A loop must not begin at `opacity: 0` (Chrome would run it on the main thread for good); start each loop at a visible frame.
- **DOM:** at most 120 elements per vignette stage (tested).
- **The `[data-part="mascot"]` wrapper itself carries no animation;** loops go on a child, because `<Vignette>`'s hover and focus beat animates that wrapper.

### Task 7.1: Everyday Rockstar and LiPAD

**Files:**
- Create: `tools/scenes/lipad-plate.svg`, `tools/scenes/render_plate.py`
- Create (assets): `public/work/lipad/plate-sharp.webp`, `public/work/lipad/plate-blur.webp`
- Create: `src/scenes/everyday-rockstar/Scene.tsx`, `src/scenes/everyday-rockstar/scene.css`, `src/scenes/lipad/Scene.tsx`, `src/scenes/lipad/scene.css`
- Modify: `src/scenes/index.ts`, `src/app/globals.css`

**Interfaces:**
- Consumes: `Stage`, `Layer`, `place`, `cssVars`, `DeviceFrame`, `Mascot` (Task 1.4); `<Vignette>` and its `[data-part="mascot"]` beat (Task 4.3).
- Produces: `EverydayRockstarScene` and `LipadScene` in `compactScenes`; `tools/scenes/render_plate.py`.

- [ ] **Step 1: The invented plate**

The plate is invented for the scene, not taken from the LiPAD dataset, and its top band says so. Create `tools/scenes/lipad-plate.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 280" width="560" height="280">
  <rect x="8" y="16" width="544" height="256" rx="28" fill="#B6C6DC"/>
  <rect x="8" y="8" width="544" height="256" rx="28" fill="#FFFFFF"/>
  <path d="M36 8H524A28 28 0 0 1 552 36V60H8V36A28 28 0 0 1 36 8Z" fill="#4F86F7"/>
  <text x="280" y="44" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="26" letter-spacing="6" fill="#FFFFFF">SAMPLE PLATE</text>
  <text x="280" y="196" text-anchor="middle" font-family="Arial Black, Segoe UI Black, Arial, sans-serif" font-weight="900" font-size="118" letter-spacing="6" fill="#1F1B24">LPD 2026</text>
  <circle cx="44" cy="232" r="9" fill="#C3D2E6"/>
  <circle cx="516" cy="232" r="9" fill="#C3D2E6"/>
</svg>
```

Create `tools/scenes/render_plate.py`:

```python
"""Render tools/scenes/lipad-plate.svg to a transparent 1120x560 PNG (device scale 2) in real Chrome.
There is no PIL on this laptop; ffmpeg makes the WebPs (sharp, and blurred with gblur).
usage: py -3.11 -I tools/scenes/render_plate.py"""
import asyncio
import pathlib

from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent
SVG = (HERE / "lipad-plate.svg").read_text(encoding="utf-8")
OUT = HERE / "out" / "lipad-plate.png"


async def main():
    OUT.parent.mkdir(exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=True)
        pg = await b.new_page(viewport={"width": 560, "height": 280}, device_scale_factor=2)
        await pg.set_content(f"<html><body style='margin:0;background:transparent'>{SVG}</body></html>")
        await pg.screenshot(path=str(OUT), omit_background=True, clip={"x": 0, "y": 0, "width": 560, "height": 280})
        await b.close()
    print(f"saved {OUT}")


asyncio.run(main())
```

Render and convert:

```bash
py -3.11 -I tools/scenes/render_plate.py
mkdir -p public/work/lipad
ffmpeg -y -i tools/scenes/out/lipad-plate.png -c:v libwebp -quality 85 public/work/lipad/plate-sharp.webp
ffmpeg -y -i tools/scenes/out/lipad-plate.png -vf "gblur=sigma=14" -c:v libwebp -quality 85 public/work/lipad/plate-blur.webp
ffprobe -v error -show_entries stream=width,height -of csv=p=0 public/work/lipad/plate-sharp.webp
```

Expected: `1120,560`. Open both WebPs at 1:1: the sharp one reads "LPD 2026" with "SAMPLE PLATE" on the blue band; the blurred one is unreadable but clearly the same plate.

- [ ] **Step 2: The Everyday Rockstar scene**

Create `src/scenes/everyday-rockstar/Scene.tsx`:

```tsx
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import type { CompactProject } from "@/content/types";
import { place, type Place } from "../grid";
import { Layer, Stage } from "../Stage";

// The wide cell: one 640 x 320 grid at every width (no scene text, so no minimum-size limit applies).
const GRID = { dw: 640, dh: 320, mdw: 640, mdh: 320 };

const SPARK = "M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z";

// Sparks sit at their burst positions around the star; the loop only scales and turns them.
const SPARKS: (Place & { tone: "gold" | "coral" | "blue" })[] = [
  { x: 30, y: 70, w: 26, tone: "coral" },
  { x: 108, y: 38, w: 20, tone: "blue" },
  { x: 180, y: 84, w: 28, tone: "gold" },
  { x: 22, y: 196, w: 22, tone: "blue" },
  { x: 188, y: 206, w: 22, tone: "coral" },
  { x: 150, y: 268, w: 26, tone: "gold" },
  { x: 62, y: 270, w: 18, tone: "coral" },
  { x: 204, y: 148, w: 18, tone: "blue" },
];

export function EverydayRockstarScene({ project }: { project: CompactProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="compact" grid={GRID} label={shot ? undefined : project.illustrationLabel}>
      <Layer depth="bg">
        <svg className="pos" style={place({ x: 8, y: 40, w: 236 })} viewBox="0 0 236 236">
          <circle cx="122" cy="122" r="112" fill="#FFE08A" />
          <circle cx="118" cy="118" r="112" fill="#FFEDB3" />
        </svg>
      </Layer>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={place({ x: 232, y: 22, w: 388 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 470px, 60vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        {SPARKS.map(({ tone, ...p }, i) => (
          <span key={i} className="pos" style={place(p, { "--i": i })}>
            <span className={`spark ${tone} loop`}>
              <svg viewBox="0 0 24 24">
                <path d={SPARK} />
              </svg>
            </span>
          </span>
        ))}
        <div className="pos" data-part="mascot" style={place({ x: 56, y: 104, w: 132 })}>
          <div className="star-pop loop">
            <Mascot slug="everyday-rockstar" />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/everyday-rockstar/scene.css`:

```css
/* Everyday Rockstar vignette: a star burst beside the live site. One grid, 640 x 320. */
.stage[data-scene="everyday-rockstar"] { background: #FFF8E1; }
[data-scene="everyday-rockstar"] .spark { display: block; }
[data-scene="everyday-rockstar"] .spark > svg { display: block; width: 100%; height: auto; fill: currentColor; }
[data-scene="everyday-rockstar"] .spark.gold { color: #E29C0E; }
[data-scene="everyday-rockstar"] .spark.coral { color: #FF6A4D; }
[data-scene="everyday-rockstar"] .spark.blue { color: #1F5EFF; }
[data-scene="everyday-rockstar"] .star-pop { display: block; transform-origin: 50% 60%; }
[data-scene="everyday-rockstar"] .star-pop > svg { display: block; width: 100%; height: auto; }

@media (prefers-reduced-motion: no-preference) {
  /* Two bursts per 4 s iteration, staggered by --i; the star pulses with each burst. */
  [data-scene="everyday-rockstar"] .spark.loop { animation: er-spark 4s ease-out infinite; animation-delay: calc(var(--i) * -0.22s); }
  [data-scene="everyday-rockstar"] .star-pop.loop { animation: er-star 4s ease-in-out infinite; }
}
@keyframes er-spark {
  0%, 50%, 100% { transform: scale(0.3) rotate(0deg); opacity: 0.9; }
  15%, 65% { transform: scale(1.1) rotate(45deg); opacity: 1; }
  35%, 85% { transform: scale(0.6) rotate(90deg); opacity: 0; }
}
@keyframes er-star {
  0%, 24%, 50%, 74%, 100% { transform: scale(1) rotate(0deg); }
  12%, 62% { transform: scale(1.08) rotate(-4deg); }
}
```

- [ ] **Step 3: The LiPAD scene**

Create `src/scenes/lipad/Scene.tsx`:

```tsx
import Image from "next/image";
import { Mascot } from "@/components/Mascot";
import type { CompactProject } from "@/content/types";
import { place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 400, dh: 300, mdw: 400, mdh: 300 };

/** LiPAD: an invented plate (not a dataset image) crossfades from blurred to sharp while a scan line reads it.
 *  Two prepared images and an opacity loop; never an animated filter (spec §9). */
export function LipadScene({ project }: { project: CompactProject }) {
  return (
    <Stage slug={project.slug} tier="compact" grid={GRID} label={project.shot ? undefined : project.illustrationLabel}>
      <Layer depth="bg">
        <svg className="pos" style={place({ x: 20, y: 18, w: 96 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="pos" style={place({ x: 300, y: 30, w: 70 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
      </Layer>
      <Layer depth="mid">
        <div className="pos" style={place({ x: 50, y: 62, w: 300 })}>
          <span className="plate-clip">
            <Image className="plate-img" src="/work/lipad/plate-blur.webp" alt="" width={1120} height={560} loading="lazy" />
            <Image className="plate-img focus loop" src="/work/lipad/plate-sharp.webp" alt="" width={1120} height={560} loading="lazy" />
            <span className="scan loop" />
          </span>
        </div>
      </Layer>
      <Layer depth="fg">
        <div className="pos" data-part="mascot" style={place({ x: 286, y: 196, w: 96 })}>
          <div className="bob loop">
            <Mascot slug="lipad" />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/lipad/scene.css`:

```css
/* LiPAD vignette. One grid, 400 x 300. Server end state = the sharp plate. */
.stage[data-scene="lipad"] { background: #EEF5FC; }
[data-scene="lipad"] .plate-clip {
  position: relative; display: block; aspect-ratio: 2 / 1; overflow: clip; border-radius: calc(14 * var(--u));
}
[data-scene="lipad"] .plate-img { position: absolute; inset: 0; width: 100%; height: 100%; }
[data-scene="lipad"] .scan { position: absolute; inset: 0; transform: translateY(-12%); }
[data-scene="lipad"] .scan::before {
  content: ""; position: absolute; left: 4%; right: 4%; top: 0; height: calc(5 * var(--u));
  border-radius: 999px; background: var(--color-yolk);
}

@media (prefers-reduced-motion: no-preference) {
  /* One 8 s story: sharp, blur, the scan line reads it, sharp again. Both loops share the clock. */
  [data-scene="lipad"] .focus.loop { animation: lp-focus 8s ease-in-out infinite; }
  [data-scene="lipad"] .scan.loop { animation: lp-scan 8s linear infinite; }
}
@keyframes lp-focus {
  0%, 30% { opacity: 1; }
  40%, 80% { opacity: 0; }
  90%, 100% { opacity: 1; }
}
@keyframes lp-scan {
  0%, 42% { transform: translateY(-12%); }
  78% { transform: translateY(100%); }
  79%, 100% { transform: translateY(-12%); }
}
```

- [ ] **Step 4: Register both scenes and their stylesheets**

In `src/scenes/index.ts`, add:

```ts
import { EverydayRockstarScene } from "./everyday-rockstar/Scene";
import { LipadScene } from "./lipad/Scene";
```

and change the entries to `"everyday-rockstar": EverydayRockstarScene,` and `lipad: LipadScene,`. In `src/app/globals.css`, after the last full-world scene import (Agent Island), add:

```css
@import "../scenes/everyday-rockstar/scene.css" layer(scenes);
@import "../scenes/lipad/scene.css" layer(scenes);
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass. Both stages are well under 120 elements; LiPAD's stage is `role="img"` with its illustration label and its plate images sit in an aria-hidden layer with `alt=""`; Everyday Rockstar's screenshot keeps its alt text outside any aria-hidden layer.

- [ ] **Step 6: Lab and page screenshots, then Fable art direction**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
PERF_URL=http://127.0.0.1:3000/dev/scenes/everyday-rockstar py -3.11 -I tools/perf/shoot.py tools/perf/out/7.1/lab-er 1440 900 --wait 3000
PERF_URL=http://127.0.0.1:3000/dev/scenes/lipad py -3.11 -I tools/perf/shoot.py tools/perf/out/7.1/lab-lipad 1440 900 --wait 3000
py -3.11 -I tools/perf/shoot.py tools/perf/out/7.1/page 1440 900 --wait 1500
py -3.11 -I tools/perf/shoot.py tools/perf/out/7.1/page 820 1180 --wait 1500
py -3.11 -I tools/perf/shoot.py tools/perf/out/7.1/page 390 844 --wait 1500
py -3.11 -I tools/perf/serve.py stop
```

Dispatch with the Agent tool, `model: "fable"`:

```
You are the art director for Wrenz Laylo's portfolio redesign. Read the spec
(docs/superpowers/specs/2026-10-11-portfolio-redesign-design.md, §4 and §9) and look at the approved slice
(C:\Users\OASIS\scratch-portfolio\slice\) for the quality bar. Use the design-taste-frontend and ui-ux-pro-max
skills. Review two vignette scenes at 1:1: Everyday Rockstar (star burst beside its live-site screenshot;
tools/perf/out/7.1/lab-er/*.png) and LiPAD (an invented plate crossfading from blurred to sharp while a scan
line reads it; tools/perf/out/7.1/lab-lipad/*.png), plus the More work bento on the page at 1440, 820 and 390
(tools/perf/out/7.1/page/*.png). Return (1) MUST-FIX and NICE-TO-HAVE lists with exact fixes (hex, design px);
(2) final --color-tint-everyday-rockstar and --color-tint-lipad, lightness 88 to 91, keeping #1F1B24 and
#5B5566 text at 4.5:1 or more. Bento neighbours: Everyday Rockstar (wide, row 1) sits beside LiPAD and above
KeyClick and Med42; LiPAD sits above PesoWise. No two neighbouring cells may share a hue family; the later
cells will be KeyClick (orange), Med42 (red-pink), PesoWise (green), so choose these two accordingly.
Sticker-flat rules: two tones per object, no outlines, gradients or filters.
```

- [ ] **Step 7: Apply every MUST-FIX and the two tints**

Make each MUST-FIX change exactly as specified and set `--color-tint-everyday-rockstar` and `--color-tint-lipad` in `src/app/globals.css`. Run `npx vitest run && npx tsc --noEmit && npm run lint` (all pass), re-run Step 6's screenshots and look at them at 1:1. List the NICE-TO-HAVE items in the PR.

- [ ] **Step 8: Commit and open the PR**

```bash
git add tools/scenes/lipad-plate.svg tools/scenes/render_plate.py public/work/lipad src/scenes src/app/globals.css
git commit -m "Add the Everyday Rockstar star burst and the LiPAD plate vignettes"
git push -u origin rd/7.1-er-lipad
gh pr create --base redesign --title "7.1 Everyday Rockstar and LiPAD vignettes" --body "Task 7.1. CSS-only vignettes: star burst beside the live site; an invented SAMPLE PLATE crossfading from a prepared blurred WebP to a sharp one (opacity only, no animated filter) with a scan line. Final tints and Fable's MUST-FIX items; NICE-TO-HAVE list below."
```

Review and merge per the protocol.

### Task 7.2: KeyClick, Med42 and PesoWise captures

**Files:**
- Create (assets): `public/work/keyclick/main.webp`, `public/work/med42/home.webp`, `public/work/pesowise/home.webp`
- Modify: `src/content/projects.ts` (three `shot`s replace three `illustrationLabel`s)

**Interfaces:**
- Consumes: `tools/scenes/shot.py` (Task 5.1).
- Produces: the three shots; until Task 7.3 the basic vignette scene shows them in a frame.

- [ ] **Step 1: Point the projects at their screenshots**

In `src/content/projects.ts`, in the `keyclick` entry, replace:

```ts
    // Phase 7 (Task 7.2) replaces this with the app window image from the KeyClick repo.
    illustrationLabel: "Illustration of KeyClick Automator: a smiling orange keycap.",
```

with:

```ts
    shot: {
      src: "/work/keyclick/main.webp",
      alt: "The KeyClick Automator window: a saved sequence of keyboard and mouse actions, with timing and repeat controls.",
      width: 1360,
      height: 840,
      frame: "window",
    },
```

In the `med42` entry, replace:

```ts
    // Phase 7 (Task 7.2) replaces this with a capture of the live app.
    illustrationLabel: "Illustration of Med42 Clinical Suite: a smiling heart.",
```

with:

```ts
    shot: {
      src: "/work/med42/home.webp",
      alt: "The live Med42 Clinical Suite web app, showing its opening screen.",
      width: 1440,
      height: 900,
      frame: "browser",
    },
```

In the `pesowise` entry, replace:

```ts
    // Phase 7 (Task 7.2) replaces this with a capture of the live app.
    illustrationLabel: "Illustration of PesoWise: a smiling green wallet.",
```

with:

```ts
    shot: {
      src: "/work/pesowise/home.webp",
      alt: "The live PesoWise web app, showing its opening screen.",
      width: 1440,
      height: 900,
      frame: "browser",
    },
```

Run: `npx vitest run tests/content-integrity.test.ts`
Expected: FAIL, naming the three missing WebP files.

- [ ] **Step 2: KeyClick from its repo image (the app is never driven)**

```bash
mkdir -p public/work/keyclick
ffprobe -v error -show_entries stream=width,height -of csv=p=0 /c/Users/OASIS/Downloads/KeyClickAutomator/assets/screenshots/keyclick-main.png
ffmpeg -y -i /c/Users/OASIS/Downloads/KeyClickAutomator/assets/screenshots/keyclick-main.png -c:v libwebp -quality 82 public/work/keyclick/main.webp
```

Expected: `1360,840`. Open the PNG at 1:1 and make the alt text name only what is visible (reword if needed).

- [ ] **Step 3: Med42 and PesoWise, read-only**

Open each URL, do not sign up or type anything; the capture is whatever the public first screen is (a landing or sign-in page is fine).

```bash
py -3.11 -I tools/scenes/shot.py https://medical-diagnosis-app-two.vercel.app tools/scenes/out/med42.png --size 1440x900 --wait 2500
py -3.11 -I tools/scenes/shot.py https://pesowise-umber.vercel.app tools/scenes/out/pesowise.png --size 1440x900 --wait 2500
mkdir -p public/work/med42 public/work/pesowise
ffmpeg -y -i tools/scenes/out/med42.png -c:v libwebp -quality 80 public/work/med42/home.webp
ffmpeg -y -i tools/scenes/out/pesowise.png -c:v libwebp -quality 80 public/work/pesowise/home.webp
```

Open both PNGs at 1:1. If either shows a sign-in form, change its alt text to "The live <name> web app's sign-in screen." If either fails to load or shows an error page, stop and tell Wrenz (the vignette keeps its illustration label for that app until the app is up; restore its two `illustrationLabel` lines from Step 1 and drop that `shot`).

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (the basic vignettes now show the three screenshots).

- [ ] **Step 4: Commit and open the PR**

```bash
git add public/work/keyclick public/work/med42 public/work/pesowise src/content/projects.ts
git commit -m "Add the KeyClick, Med42 and PesoWise screenshots"
git push -u origin rd/7.2-vignette-captures
gh pr create --base redesign --title "7.2 KeyClick, Med42 and PesoWise captures" --body "Task 7.2. KeyClick from its repo image (the app is never driven); Med42 and PesoWise read-only first screens of the live apps, no sign-ups. Alt text checked against each image."
```

Review and merge per the protocol.

### Task 7.3: KeyClick, Med42 and PesoWise scenes

**Files:**
- Modify: `src/content/scene-text.ts` (`keyclick`, `pesowise`)
- Create: `src/scenes/keyclick/Scene.tsx`, `src/scenes/keyclick/scene.css`, `src/scenes/med42/Scene.tsx`, `src/scenes/med42/scene.css`, `src/scenes/pesowise/Scene.tsx`, `src/scenes/pesowise/scene.css`
- Modify: `src/scenes/index.ts`, `src/app/globals.css`

**Interfaces:**
- Consumes: the three shots (Task 7.2); `Stage`, `Layer`, `place`, `DeviceFrame`, `Mascot` (Task 1.4).
- Produces: `KeyclickScene`, `Med42Scene`, `PesowiseScene` in `compactScenes`.

- [ ] **Step 1: The scene text**

Add to `src/content/scene-text.ts`:

```ts
  keyclick: { keys: ["Ctrl", "S"] },
  pesowise: { coin: "₱" },
```

- [ ] **Step 2: The KeyClick scene**

Create `src/scenes/keyclick/Scene.tsx`:

```tsx
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import { sceneText } from "@/content/scene-text";
import type { CompactProject } from "@/content/types";
import { place, type Place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 400, dh: 260, mdw: 400, mdh: 260 };

const KEYS: Place[] = [
  { x: 14, y: 34, w: 100 },
  { x: 34, y: 132, w: 72 },
];

/** KeyClick: a shortcut presses itself and a cursor clicks, beside the app window (never the live app). */
export function KeyclickScene({ project }: { project: CompactProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="compact" grid={GRID} label={shot ? undefined : project.illustrationLabel}>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={place({ x: 130, y: 22, w: 254 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 300px, 70vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        {KEYS.map((p, i) => (
          <span key={sceneText.keyclick.keys[i]} className="pos" style={place(p, { "--i": i })}>
            <span className="key">
              <span className="key-top press loop">{sceneText.keyclick.keys[i]}</span>
            </span>
          </span>
        ))}
        <span className="pos" style={place({ x: 252, y: 90, w: 40 })}>
          <span className="ring loop" />
        </span>
        <span className="pos" style={place({ x: 264, y: 100, w: 30 })}>
          <span className="tap loop">
            <svg viewBox="0 0 30 40">
              <path transform="translate(2 3)" d="M2 2V32L10 24L16 37L22 34L16 22H27Z" fill="#1F1B24" fillOpacity="0.25" />
              <path d="M2 2V32L10 24L16 37L22 34L16 22H27Z" fill="#FFFFFF" stroke="#1F1B24" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
        <div className="pos" data-part="mascot" style={place({ x: 300, y: 162, w: 84 })}>
          <div className="bob loop">
            <Mascot slug="keyclick" />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

(The cursor is the one object with an ink line: a pointer is drawn that way everywhere, and ink is allowed for small details.)

Create `src/scenes/keyclick/scene.css`:

```css
/* KeyClick vignette. One grid, 400 x 260. Key labels 20 design px (minimum 19). */
.stage[data-scene="keyclick"] { background: #FFF4EA; }
[data-scene="keyclick"] .key {
  position: relative; display: block; padding-bottom: calc(8 * var(--u));
  border-radius: calc(14 * var(--u)); background: #E06A1F;
}
[data-scene="keyclick"] .key-top {
  display: flex; align-items: center; justify-content: center; height: calc(56 * var(--u));
  border-radius: calc(14 * var(--u)); background: #FF8A3D; color: var(--color-ink);
  font: 800 calc(20 * var(--u))/1 var(--font-display);
}
[data-scene="keyclick"] .tap { display: block; transform-origin: 10% 10%; }
[data-scene="keyclick"] .tap > svg { display: block; width: 100%; height: auto; }
[data-scene="keyclick"] .ring {
  display: block; aspect-ratio: 1; border-radius: 50%;
  box-shadow: inset 0 0 0 calc(4 * var(--u)) #FF8A3D; transform: scale(0.3);
}

@media (prefers-reduced-motion: no-preference) {
  /* Two presses and two clicks per 4 s iteration; S follows Ctrl by 0.16 s. */
  [data-scene="keyclick"] .press.loop { animation: kc-press 4s ease-in-out infinite; animation-delay: calc(var(--i) * 0.16s); }
  [data-scene="keyclick"] .tap.loop { animation: kc-tap 4s ease-in-out infinite; }
  [data-scene="keyclick"] .ring.loop { animation: kc-ring 4s ease-out infinite; }
}
@keyframes kc-press {
  0%, 8%, 18%, 58%, 68%, 100% { transform: translateY(0); }
  12%, 14%, 62%, 64% { transform: translateY(12%); }
}
@keyframes kc-tap {
  0%, 28%, 36%, 78%, 86%, 100% { transform: scale(1); }
  32%, 82% { transform: scale(0.82); }
}
@keyframes kc-ring {
  0%, 32% { transform: scale(0.3); opacity: 0.8; }
  48% { transform: scale(1.5); opacity: 0; }
  49%, 82% { transform: scale(0.3); opacity: 0.8; }
  98% { transform: scale(1.5); opacity: 0; }
  99%, 100% { transform: scale(0.3); opacity: 0.8; }
}
```

- [ ] **Step 3: The Med42 scene**

Create `src/scenes/med42/Scene.tsx`:

```tsx
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import type { CompactProject } from "@/content/types";
import { place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 400, dh: 260, mdw: 400, mdh: 260 };

/** Med42: a beating heart and a heartbeat line, beside the live app. The line is redrawn by a sliding
 *  block of background colour (transform only), never by animating the SVG stroke. */
export function Med42Scene({ project }: { project: CompactProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="compact" grid={GRID} label={shot ? undefined : project.illustrationLabel}>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={place({ x: 150, y: 20, w: 236 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 280px, 66vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        <div className="pos" data-part="mascot" style={place({ x: 22, y: 30, w: 104 })}>
          <div className="beat loop">
            <Mascot slug="med42" />
          </div>
        </div>
        <span className="pos" style={place({ x: 10, y: 210, w: 380 })}>
          <span className="ecg">
            <svg viewBox="0 0 380 44">
              <path
                d="M0 26H90L104 26L114 6L126 40L136 16L146 26H240L254 26L264 6L276 40L286 16L296 26H380"
                fill="none"
                stroke="#D94A60"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="wipe loop" />
          </span>
        </span>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/med42/scene.css`:

```css
/* Med42 vignette. One grid, 400 x 260. --sky is also the wipe colour, so the wipe is invisible on it. */
.stage[data-scene="med42"] { --sky: #FFF3F4; background: var(--sky); }
[data-scene="med42"] .beat { display: block; transform-origin: 50% 55%; }
[data-scene="med42"] .beat > svg { display: block; width: 100%; height: auto; }
[data-scene="med42"] .ecg { position: relative; display: block; aspect-ratio: 380 / 44; overflow: clip; }
[data-scene="med42"] .ecg > svg { display: block; width: 100%; height: 100%; }
[data-scene="med42"] .wipe { position: absolute; top: 0; bottom: 0; left: 0; width: 34%; background: var(--sky); transform: translateX(-100%); }

@media (prefers-reduced-motion: no-preference) {
  /* Three lub-dub beats per 3.6 s; two sweeps per 4.8 s. */
  [data-scene="med42"] .beat.loop { animation: md-beat 3.6s ease-in-out infinite; }
  [data-scene="med42"] .wipe.loop { animation: md-wipe 4.8s linear infinite; }
}
@keyframes md-beat {
  0%, 9%, 26%, 33.33%, 42.33%, 59.33%, 66.67%, 75.67%, 92.67%, 100% { transform: scale(1); }
  4%, 37.33%, 70.67% { transform: scale(1.12); }
  14%, 47.33%, 80.67% { transform: scale(1.06); }
}
@keyframes md-wipe {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(300%); }
  50.01% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
```

- [ ] **Step 4: The PesoWise scene**

Create `src/scenes/pesowise/Scene.tsx`:

```tsx
import { DeviceFrame } from "@/components/DeviceFrame";
import { Mascot } from "@/components/Mascot";
import { sceneText } from "@/content/scene-text";
import type { CompactProject } from "@/content/types";
import { place, type Place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID = { dw: 400, dh: 260, mdw: 400, mdh: 260 };

const COINS: Place[] = [
  { x: 40, y: 96, w: 30 },
  { x: 66, y: 90, w: 30 },
  { x: 92, y: 96, w: 30 },
];

/** PesoWise: pesos drop into the wallet beside the live app. Coin text 20 design px (minimum 19). */
export function PesowiseScene({ project }: { project: CompactProject }) {
  const { shot } = project;
  return (
    <Stage slug={project.slug} tier="compact" grid={GRID} label={shot ? undefined : project.illustrationLabel}>
      {shot ? (
        <Layer depth="mid" decorative={false}>
          <div className="pos" style={place({ x: 150, y: 20, w: 236 })}>
            <DeviceFrame shot={shot} sizes="(min-width: 1024px) 280px, 66vw" />
          </div>
        </Layer>
      ) : null}
      <Layer depth="fg">
        {COINS.map((p, i) => (
          <span key={i} className="pos" style={place(p, { "--i": i })}>
            <span className="coin-fall loop">
              <span className="coin">{sceneText.pesowise.coin}</span>
            </span>
          </span>
        ))}
        <div className="pos" data-part="mascot" style={place({ x: 18, y: 140, w: 116 })}>
          <div className="catch loop">
            <Mascot slug="pesowise" />
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
```

Create `src/scenes/pesowise/scene.css`:

```css
/* PesoWise vignette. One grid, 400 x 260. */
.stage[data-scene="pesowise"] { background: #EEF9F3; }
[data-scene="pesowise"] .coin-fall { display: block; }
[data-scene="pesowise"] .coin {
  display: grid; place-items: center; aspect-ratio: 1; border-radius: 50%;
  background: var(--color-yolk); box-shadow: inset 0 0 0 calc(3 * var(--u)) var(--color-yolk-shade);
  color: var(--color-ink); font: 800 calc(20 * var(--u))/1 var(--font-display);
}
[data-scene="pesowise"] .catch { display: block; transform-origin: 50% 100%; }
[data-scene="pesowise"] .catch > svg { display: block; width: 100%; height: auto; }

@media (prefers-reduced-motion: no-preference) {
  /* Two drops per 4.8 s per coin, staggered; the wallet squashes as each wave lands. */
  [data-scene="pesowise"] .coin-fall.loop { animation: pw-drop 4.8s ease-in infinite; animation-delay: calc(var(--i) * 0.4s); }
  [data-scene="pesowise"] .catch.loop { animation: pw-catch 4.8s ease-out infinite; animation-delay: 0.4s; }
}
@keyframes pw-drop {
  0% { transform: translateY(-160%); opacity: 1; }
  30% { transform: translateY(120%); opacity: 1; }
  40% { transform: translateY(140%); opacity: 0; }
  41% { transform: translateY(-160%); opacity: 0; }
  50% { transform: translateY(-160%); opacity: 1; }
  80% { transform: translateY(120%); opacity: 1; }
  90% { transform: translateY(140%); opacity: 0; }
  91% { transform: translateY(-160%); opacity: 0; }
  100% { transform: translateY(-160%); opacity: 1; }
}
@keyframes pw-catch {
  0%, 28%, 40%, 78%, 90%, 100% { transform: scale(1, 1); }
  33%, 83% { transform: scale(1.04, 0.94); }
}
```

- [ ] **Step 5: Register the scenes and their stylesheets**

In `src/scenes/index.ts`, add:

```ts
import { KeyclickScene } from "./keyclick/Scene";
import { Med42Scene } from "./med42/Scene";
import { PesowiseScene } from "./pesowise/Scene";
```

and change the entries to `keyclick: KeyclickScene,`, `med42: Med42Scene,` and `pesowise: PesowiseScene,`. Every entry in `compactScenes` is now a designed scene, so delete the line `import { BasicVignette } from "./basic/BasicVignette";` (an unused import fails lint); the file itself stays until Task 8.1 removes the basic scenes. In `src/app/globals.css`, after the LiPAD scene import, add:

```css
@import "../scenes/keyclick/scene.css" layer(scenes);
@import "../scenes/med42/scene.css" layer(scenes);
@import "../scenes/pesowise/scene.css" layer(scenes);
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass (each stage well under 120 elements; screenshots named by their alt text).

- [ ] **Step 7: Lab and page screenshots, then Fable art direction**

```bash
SCENE_LAB=1 npm run build
py -3.11 -I tools/perf/serve.py start
for s in keyclick med42 pesowise; do PERF_URL=http://127.0.0.1:3000/dev/scenes/$s py -3.11 -I tools/perf/shoot.py tools/perf/out/7.3/lab-$s 1440 900 --wait 3000; done
for size in "1440 900" "1024 768" "820 1180" "390 844"; do py -3.11 -I tools/perf/shoot.py tools/perf/out/7.3/page $size --wait 1500; done
py -3.11 -I tools/perf/serve.py stop
```

Expected: every `shoot.py` run prints `PASS` (the 1024 run checks the narrowest "third" cell: key labels and the peso stay at or above 12 px).

Dispatch the Task 7.1 Step 6 brief to Fable (`model: "fable"`) with these changes: the scenes under review are KeyClick (keys press themselves and a cursor clicks beside the app window; `tools/perf/out/7.3/lab-keyclick/*.png`), Med42 (a beating heart and a heartbeat line beside the live app; `lab-med42`) and PesoWise (pesos drop into a wallet beside the live app; `lab-pesowise`), plus the whole bento at four widths (`tools/perf/out/7.3/page/*.png`); the tokens to set are `--color-tint-keyclick`, `--color-tint-med42` and `--color-tint-pesowise`, chosen so that no two neighbouring cells (including Everyday Rockstar and LiPAD as already set) share a hue family.

- [ ] **Step 8: Apply every MUST-FIX and the three tints**

Make each MUST-FIX change exactly as specified and set the three tints in `src/app/globals.css`. Run `npx vitest run && npx tsc --noEmit && npm run lint` (all pass), re-run Step 7's screenshots and look at them at 1:1. List the NICE-TO-HAVE items in the PR.

- [ ] **Step 9: Commit and open the PR**

```bash
git add src/content/scene-text.ts src/scenes src/app/globals.css
git commit -m "Add the KeyClick, Med42 and PesoWise vignettes"
git push -u origin rd/7.3-keyclick-med42-pesowise
gh pr create --base redesign --title "7.3 KeyClick, Med42 and PesoWise vignettes" --body "Task 7.3. CSS-only vignettes: a shortcut pressing itself and a cursor click; a beating heart and a heartbeat line redrawn by a sliding block (transform only); pesos dropping into the wallet. Final tints and Fable's MUST-FIX items; NICE-TO-HAVE list below."
```

Review and merge per the protocol.

### Task 7.4: Phase 7 verification

**Files:**
- Modify: whatever the gate's MUST-FIX items touch (branch `rd/7.4-phase7-gate`)

**Interfaces:**
- Consumes: the whole page after Tasks 7.1 to 7.3 (every scene designed).
- Produces: the gate results, Fable's phase critique, Wrenz's sign-off.

- [ ] **Step 1: Unit checks, build, chunk budget**

Run: `npx vitest run && npx tsc --noEmit && npm run lint && npm run build && node tools/perf/chunks.mjs`
Expected: all pass; six world choreographies under 8 KB; `PASS`. (Vignettes add no JavaScript.)

- [ ] **Step 2: Frames, compositing, budgets**

```bash
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/perf.py 1440 900 1 --check
py -3.11 -I tools/perf/perf.py 1440 900 4 --check
py -3.11 -I tools/perf/perf.py 390 844 1 --mobile --check
py -3.11 -I tools/perf/perf.py 390 844 4 --mobile --check
py -3.11 -I tools/perf/anim_raw.py everyday-rockstar lipad keyclick med42 pesowise
py -3.11 -I tools/perf/budget.py
```

Expected: four `PASS` lines; `anim_raw.py` lists no `compositeFailed` for `er-spark`, `er-star`, `lp-focus`, `lp-scan`, `kc-press`, `kc-tap`, `kc-ring`, `md-beat`, `md-wipe`, `pw-drop` or `pw-catch` (a failure there usually means a loop starts at an invisible frame or animates a non-transform property: fix it, then re-run); `budget.py` `PASS` with every vignette stage at or under 120 elements.

- [ ] **Step 3: Lighthouse, accessibility, screenshots**

```bash
npx -y lighthouse@13 http://127.0.0.1:3000/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=tools/perf/out/lh.json --chrome-flags="--headless=new"
node tools/perf/lh-summary.mjs tools/perf/out/lh.json
py -3.11 -I tools/perf/a11y.py
for size in "390 844" "820 1180" "1024 768" "1440 900"; do py -3.11 -I tools/perf/shoot.py tools/perf/out/7.4 $size; done
py -3.11 -I tools/perf/shoot.py tools/perf/out/7.4 390 844 --rm
py -3.11 -I tools/perf/shoot.py tools/perf/out/7.4 1440 900 --nojs
py -3.11 -I tools/perf/serve.py stop
```

Expected: no `FAIL` anywhere. Keyboard-only pass through the bento at 1440 and 390 (each vignette's links reachable, focus visible, the hover or focus beat plays once and carries no information). Look at every screenshot at 1:1; in the reduced-motion and no-JavaScript shots each vignette shows its end frame (sharp plate, keys up, coins in place).

- [ ] **Step 4: Fable phase critique**

Dispatch the "Fable critique brief" (`model: "fable"`) with screenshots `tools/perf/out/7.4/s-1440-*.png`, `s-1024-*.png`, `s-820-*.png`, `s-390-*.png`; phase = "Phase 7: the five vignettes in the More work bento are designed; every scene on the page is now final."

- [ ] **Step 5: Fix every MUST-FIX and re-run the gate**

Fix each item on this branch and repeat Steps 1 to 3 until everything passes.

- [ ] **Step 6: Open the PR and ask for sign-off**

```bash
git add -A
git commit -m "Phase 7 gate fixes"
git push -u origin rd/7.4-phase7-gate
gh pr create --base redesign --title "7.4 Phase 7 verification" --body "Task 7.4. Gate results with all eleven scenes designed (perf, anim_raw, budget, Lighthouse, axe, keyboard, reduced motion, no JavaScript, 4 screenshot sizes), Fable's critique with every MUST-FIX fixed, NICE-TO-HAVE list for Wrenz."
```

(With no fixes needed, use `git commit --allow-empty -m "Phase 7 gate results"` instead.) Paste every output into the PR. Review and merge per the protocol, then ask Wrenz to review the bento on the `redesign` preview and sign off Phase 7 before Phase 8 starts.

---

# Phase 8: Final performance, SEO and accessibility pass

Goal: prove every success criterion in spec §1 on the finished page (§12 budgets, §13 SEO, §14 testing), remove the interim code, get a last whole-page critique from Fable 5.1, then open the one `redesign` to `master` PR. **Wrenz reviews the Vercel preview and merges that PR himself; it is never merged for him.** After his merge, production is checked and the results recorded.

### Task 8.1: Final performance pass and interim-code removal

**Files:**
- Delete: `src/scenes/basic/` (`BasicWorld.tsx`, `BasicVignette.tsx`, `choreo.ts`, `scene.css`)
- Modify: `src/app/globals.css` (drop the basic scene import), `src/scenes/index.ts` (drop the basic imports if any remain)
- Modify: whatever the measurements show needs fixing (branch `rd/8.1-final-perf`)

**Interfaces:**
- Consumes: the complete page (Phases 1 to 7).
- Produces: final performance numbers for the release PR; no interim scenes left.

- [ ] **Step 1: Remove the basic scenes**

```bash
grep -rn "basic" src --include=*.ts --include=*.tsx --include=*.css
```

Expected: only `src/scenes/basic/*` and the `@import "../scenes/basic/scene.css" layer(scenes);` line in `globals.css` (Tasks 6.3 and 7.3 already removed the `BasicWorld` / `BasicVignette` imports). No registry entry and no scene map entry may use them; if one does, its phase is unfinished: stop and report it.

```bash
git rm -r src/scenes/basic
```

Delete the basic `@import` line from `src/app/globals.css` and any `Basic*` import from `src/scenes/index.ts`.

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all pass. (`tests/css-imports.test.ts` no longer sees a `basic` folder; the contract test runs only the six real choreographies.)

- [ ] **Step 2: Confirm GSAP never loads up front**

```bash
grep -rn "from \"gsap\"" src
grep -rn "ScrollTrigger" src package.json
```

Expected: the first command lists only `import type` lines (such as the one in `src/motion/types.ts`); the second prints nothing. A value import of `gsap` anywhere in `src` would put it in the first-load bundle: replace it with the engine's `env.gsap`.

- [ ] **Step 3: Measure everything on this laptop**

```bash
npm run build && node tools/perf/chunks.mjs
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/perf.py 1440 900 1 --check
py -3.11 -I tools/perf/perf.py 1440 900 4 --check
py -3.11 -I tools/perf/perf.py 390 844 1 --mobile --check
py -3.11 -I tools/perf/perf.py 390 844 4 --mobile --check
py -3.11 -I tools/perf/smooth.py 1
py -3.11 -I tools/perf/smooth.py 4
py -3.11 -I tools/perf/smooth.py 4 390 844 --mobile
for s in hero pos time-log service-areas katiwala stockroom agent-island; do py -3.11 -I tools/perf/who.py $s 4; done
py -3.11 -I tools/perf/anim_raw.py
py -3.11 -I tools/perf/budget.py
for i in 1 2 3; do npx -y lighthouse@13 http://127.0.0.1:3000/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=tools/perf/out/lh-$i.json --chrome-flags="--headless=new"; node tools/perf/lh-summary.mjs tools/perf/out/lh-$i.json; done
py -3.11 -I tools/perf/serve.py stop
```

Expected: `chunks.mjs` `PASS` (six choreographies, each ≤ 8 KB gz); four `perf.py` `PASS`; `smooth.py` dropped share in single digits; `who.py` shows no recurring JS calls while parked in any stage (pointer frames excepted when the mouse moves); `anim_raw.py` `all animations composited` (or only failures explained in the PR); `budget.py` `PASS` (JS ≤ 150 KB, HTML ≤ 80 KB, DOM ≤ 2,500 and per-stage limits); at least two of the three Lighthouse runs print no `FAIL`, and the median LCP is under 2,500 ms.

- [ ] **Step 4: Fix what fails, with these levers in this order**

For each failing number, apply the matching lever on this branch, re-run that measurement, and record before and after in the PR:
- **JS over 150 KB:** read the `scripts` list in `tools/perf/out/budget.json`. A chunk containing GSAP that loads before any world is near means a static import slipped in (Step 2). A large unexpected chunk: find its importer with `next experimental-analyze --output` and move that import behind the runtime.
- **HTML over 80 KB or DOM over budget:** the largest stage in `budget.json` first; replace repeated drawings with `<use>` symbols from `<Sprite />` and drop desktop-only parts that cost the most.
- **LCP over 2,500 ms:** read the LCP element in `lh-summary.mjs` output. If it is the hero portrait at mobile, switch its `next/image` from `fetchPriority="high"` + `loading="eager"` to `preload` (spec §7) and re-measure; if it is text, try `experimental: { inlineCss: true }` in `next.config.ts` and keep it only if the median LCP improves.
- **Frames at 4x CPU over budget in one world:** `who.py <slug> 4` names the cost. Pointer parallax is the usual one: it switches itself off when frames run long; if it does not, lower that stage's `data-k` values. A failing loop: pack more cycles per iteration or move the moving part into its own element.
- **Dropped frames when a stage scrolls into view** (`smooth.py` scroll phase, DevTools Performance shows a long Layerize as a stage enters): the `.paused` rule in `stage.css` that drops `will-change` re-promotes layers on entry. Remove that one rule, re-run `smooth.py 1` and `smooth.py 4`, and keep whichever version drops fewer frames; record both in the PR. Also check in the DevTools Layers panel that `.layer-mid` (which never moves on its own) can lose `will-change` without new jank.
- A budget that cannot be met after these levers goes to Wrenz in writing on the PR (spec §12): the number, what was tried, and the trade-off; he decides.

- [ ] **Step 5: Commit and open the PR**

```bash
git add -A
git commit -m "Remove the interim basic scenes; final performance fixes"
git push -u origin rd/8.1-final-perf
gh pr create --base redesign --title "8.1 Final performance pass" --body "Task 8.1. Basic scenes removed. Full measurement set (chunks, perf 1x/4x at 1440 and 390, smooth, who per stage, anim_raw, budget, 3 Lighthouse runs) with before/after for every fix."
```

Paste every output into the PR. Review and merge per the protocol.

### Task 8.2: SEO and accessibility pass

**Files:**
- Create: `tools/perf/seo_check.py`, `tools/perf/nojs_text.py`
- Modify: `tools/perf/README.md` (two rows)
- Modify: whatever the checks show needs fixing (branch `rd/8.2-seo-a11y`)

**Interfaces:**
- Consumes: the built site on `127.0.0.1:3000` (or any URL via `PERF_URL`); Phase 2's metadata, robots, sitemap, OG image, icons and JSON-LD.
- Produces: `seo_check.py [--site ORIGIN]` and `nojs_text.py`, both printing `PASS` or `FAIL`; reused against production in Task 8.4.

- [ ] **Step 1: The SEO checker**

Create `tools/perf/seo_check.py`:

```python
"""Spec §13 checks against a running site: head tags, one H1, the JSON-LD graph, three font preloads,
alt on every image, rel=noopener on external links, robots.txt, sitemap.xml and the OG image.
usage: py -3.11 -I tools/perf/seo_check.py [--site https://wrenz-portfolio.vercel.app]
The page comes from PERF_URL (default http://127.0.0.1:3000/); --site is the canonical origin the tags
must use (SITE_URL at build time)."""
import json
import pathlib
import sys
import urllib.request
from html.parser import HTMLParser
from urllib.parse import urlsplit

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL  # noqa: E402

SITE = (sys.argv[sys.argv.index("--site") + 1] if "--site" in sys.argv else "https://wrenz-portfolio.vercel.app").rstrip("/")
ORIGIN = "{0.scheme}://{0.netloc}".format(urlsplit(BASE_URL))
fails = []


def check(ok, label):
    print(("ok   " if ok else "FAIL ") + label)
    if not ok:
        fails.append(label)


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "seo-check"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, r.headers.get("content-type", ""), r.read()


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta, self.links, self.imgs, self.anchors, self.ld = {}, [], [], [], []
        self.h1, self.title = 0, ""
        self._ld = self._title = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        key = a.get("property") or a.get("name")
        if tag == "meta" and key:
            self.meta.setdefault(key, a.get("content", ""))
        elif tag == "link":
            self.links.append(a)
        elif tag == "h1":
            self.h1 += 1
        elif tag == "img":
            self.imgs.append(a)
        elif tag == "a":
            self.anchors.append(a)
        elif tag == "script" and a.get("type") == "application/ld+json":
            self._ld = True
            self.ld.append("")
        elif tag == "title":
            self._title = True

    def handle_endtag(self, tag):
        if tag == "script":
            self._ld = False
        elif tag == "title":
            self._title = False

    def handle_data(self, data):
        if self._ld:
            self.ld[-1] += data
        if self._title:
            self.title += data


status, _, body = get(BASE_URL)
page = Page()
page.feed(body.decode("utf-8"))
m = page.meta
check(status == 200, f"home answers 200 ({status})")
check("Wrenz Laylo" in page.title, f"title {page.title!r}")
check(50 <= len(m.get("description", "")) <= 170, f"description length {len(m.get('description', ''))}")
canonical = next((link.get("href", "") for link in page.links if link.get("rel") == "canonical"), "")
check(canonical.rstrip("/") == SITE, f"canonical {canonical!r}")
for key in ["og:title", "og:description", "og:site_name", "og:image", "twitter:image"]:
    check(bool(m.get(key)), f"{key} present")
check(m.get("og:type") == "website", "og:type website")
check(m.get("og:locale") == "en_PH", "og:locale en_PH")
check(m.get("twitter:card") == "summary_large_image", "twitter:card summary_large_image")
check(m.get("og:image", "").startswith(SITE), "og:image is absolute on the site URL")
check(m.get("theme-color", "").upper() == "#FFF8EE", "theme-color #FFF8EE")
check("keywords" not in m, "no keywords meta")
check(page.h1 == 1, f"exactly one h1 ({page.h1})")
fonts = [link for link in page.links if link.get("rel") == "preload" and link.get("as") == "font"]
check(len(fonts) == 3, f"three font preloads ({len(fonts)})")
check(any("icon" in (link.get("rel") or "") and (link.get("href") or "").split("?")[0].endswith(".svg") for link in page.links), "SVG icon link")
check(any(link.get("rel") == "apple-touch-icon" for link in page.links), "apple-touch-icon link")
check(all("alt" in img for img in page.imgs), f"every img has an alt attribute ({len(page.imgs)} images)")
external = [a for a in page.anchors if (a.get("href") or "").startswith("http")]
check(all("noopener" in (a.get("rel") or "") for a in external), f"external links carry noopener ({len(external)})")
check(len(page.ld) == 1, f"one JSON-LD block ({len(page.ld)})")
if page.ld:
    raw = page.ld[0]
    check("<" not in raw, "JSON-LD contains no raw <")
    graph = json.loads(raw).get("@graph", [])
    types = {node.get("@type") for node in graph}
    for wanted in ["Person", "WebSite", "ProfilePage", "ItemList"]:
        check(wanted in types, f"JSON-LD has {wanted}")
    items = next((node for node in graph if node.get("@type") == "ItemList"), {}).get("itemListElement", [])
    check(len(items) == 11, f"ItemList holds 11 projects ({len(items)})")
_, _, robots = get(ORIGIN + "/robots.txt")
robots_txt = robots.decode()
check(f"Sitemap: {SITE}/sitemap.xml" in robots_txt, "robots.txt names the sitemap")
check("Allow: /" in robots_txt, "robots.txt allows everything")
_, _, sitemap = get(ORIGIN + "/sitemap.xml")
sitemap_xml = sitemap.decode()
check(f"<loc>{SITE}</loc>" in sitemap_xml or f"<loc>{SITE}/</loc>" in sitemap_xml, "sitemap lists the home page")
check("/dev/" not in sitemap_xml, "sitemap has no scene lab")
og_image = m.get("og:image", "")
if og_image:
    st, ctype, data = get(og_image.replace(SITE, ORIGIN, 1))
    check(st == 200 and ctype.startswith("image/png"), f"og:image serves a PNG ({st} {ctype}, {len(data)} bytes)")
print("PASS" if not fails else f"FAIL ({len(fails)})")
sys.exit(1 if fails else 0)
```

- [ ] **Step 2: The no-JavaScript parity checker**

Create `tools/perf/nojs_text.py`:

```python
"""Spec §1 criterion 3: with JavaScript off, and with reduced motion, the page carries every word, link and
image alt it carries with JavaScript and motion on (scrolled through, entrances finished).
usage: py -3.11 -I tools/perf/nojs_text.py"""
import asyncio
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL, wheel_to_bottom  # noqa: E402
from playwright.async_api import async_playwright  # noqa: E402

GRAB = r"""
() => ({
  text: document.body.innerText,
  links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
  alts: [...document.querySelectorAll('img')].map(i => i.getAttribute('alt') || ''),
})
"""


async def grab(b, js, rm, scroll):
    ctx = await b.new_context(viewport={"width": 1440, "height": 900}, java_script_enabled=js,
                              reduced_motion="reduce" if rm else "no-preference")
    pg = await ctx.new_page()
    await pg.goto(BASE_URL, wait_until="networkidle")
    if scroll:
        await wheel_to_bottom(pg)
        await pg.wait_for_timeout(6000)
    out = await pg.evaluate(GRAB)
    await ctx.close()
    return {"words": set(re.findall(r"[\w₱'’.,:&/-]+", out["text"])), "links": sorted(out["links"]), "alts": sorted(out["alts"])}


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=True)
        full = await grab(b, True, False, True)
        nojs = await grab(b, False, False, False)
        calm = await grab(b, True, True, True)
        await b.close()
    bad = False
    for name, other in [("no JavaScript", nojs), ("reduced motion", calm)]:
        missing = sorted(full["words"] - other["words"])
        print(f"{name}: {len(missing)} missing word(s) {missing[:20]}")
        print(f"{name}: links {'same' if other['links'] == full['links'] else 'DIFFER'}, image alts {'same' if other['alts'] == full['alts'] else 'DIFFER'}")
        bad = bad or bool(missing) or other["links"] != full["links"] or other["alts"] != full["alts"]
    print("PASS" if not bad else "FAIL")
    sys.exit(1 if bad else 0)


asyncio.run(main())
```

Add two rows to the table in `tools/perf/README.md`:

```markdown
| `seo_check.py [--site ORIGIN]` | spec §13 head tags, one H1, JSON-LD graph, font preloads, alt, noopener, robots, sitemap, OG image |
| `nojs_text.py` | every word, link and image alt present with JavaScript off and with reduced motion |
```

- [ ] **Step 3: Run the SEO and parity checks**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
py -3.11 -I tools/perf/seo_check.py
py -3.11 -I tools/perf/nojs_text.py
```

Expected: both print `PASS`. A `FAIL` names the tag or the missing words; fix the source (Phase 2's files for tags, the scene or component for words), rebuild and re-run.

- [ ] **Step 4: Accessibility: automated, keyboard, reduced motion**

```bash
py -3.11 -I tools/perf/a11y.py
py -3.11 -I tools/perf/shoot.py tools/perf/out/8.2 390 844 --rm
py -3.11 -I tools/perf/shoot.py tools/perf/out/8.2 1440 900 --rm
py -3.11 -I tools/perf/shoot.py tools/perf/out/8.2 1440 900 --nojs
py -3.11 -I tools/perf/serve.py stop
```

Expected: `a11y.py` `PASS`; each `shoot.py` `PASS`. Then, in real Chrome at 1440×900 and in device mode at 390×844, keyboard only:
1. `Tab` from the top: the skip link appears first and jumps to `#main`.
2. Nav links, "Email me", and at 390 the menu button: `Enter` opens the menu, `Escape` closes it, `Tab` reaches each link, `Enter` on "About" lands below the sticky bar and closes the menu.
3. Every project link in the six worlds and the five vignettes, the résumé link, GitHub, LinkedIn, the contact "Email me" and "Back to top" are reachable, each with the 3 px focus ring visible on every background (worlds, bento cells, the yolk band).
4. No focus lands inside any scene.
5. Windows "Show animations" off (Settings, Accessibility, Visual effects), reload: nothing moves, every scene shows its finished frame.

Record each item as passed in the PR.

- [ ] **Step 5: Commit and open the PR**

```bash
git add -A
git commit -m "Add the SEO and no-JavaScript parity checks; final SEO and accessibility fixes"
git push -u origin rd/8.2-seo-a11y
gh pr create --base redesign --title "8.2 SEO and accessibility pass" --body "Task 8.2. seo_check.py and nojs_text.py (PASS), axe PASS, keyboard checklist, reduced motion and no-JavaScript screenshots. Fixes listed below."
```

Paste every output into the PR. Review and merge per the protocol.

### Task 8.3: Final whole-page critique and the handoff

**Files:**
- Modify: whatever Fable's MUST-FIX items touch (branch `rd/8.3-final-critique`)
- Modify: `docs/HANDOFF.md`

**Interfaces:**
- Consumes: the page after Tasks 8.1 and 8.2.
- Produces: the final screenshots and critique for the release PR; an updated handoff that points at Spec 2.

- [ ] **Step 1: Final screenshots at every size**

```bash
npm run build
py -3.11 -I tools/perf/serve.py start
for size in "390 844" "820 1180" "1024 768" "1440 900"; do py -3.11 -I tools/perf/shoot.py tools/perf/out/8.3 $size; done
py -3.11 -I tools/perf/serve.py stop
```

Expected: four `PASS`.

- [ ] **Step 2: Fable whole-page critique**

Dispatch the "Fable critique brief" (`model: "fable"`) with every `tools/perf/out/8.3/*.png`; phase = "Phase 8, the release candidate: the whole page as recruiters and freelance clients will see it. Judge it against spec §1 (goal and success criteria) as a whole: first impression in the hero, the rhythm of the six worlds, the bento, the closing band, and consistency of type, colour and spacing across all sections."

- [ ] **Step 3: Fix every MUST-FIX**

Fix each item, then re-run `npx vitest run && npx tsc --noEmit && npm run lint`, Step 1's screenshots, `py -3.11 -I tools/perf/budget.py` and `py -3.11 -I tools/perf/perf.py 1440 900 4 --check` (with the server started) to confirm the fixes cost nothing. Collect the NICE-TO-HAVE items from every phase's PRs into one list for the release PR.

- [ ] **Step 4: Update the handoff**

In `docs/HANDOFF.md`, replace the `## RESUME HERE` block (down to the next `##` heading) with:

```markdown
## RESUME HERE

Spec 1 (design system, motion engine, home page, technical SEO) is complete on `redesign`: every task PR
merged, every phase gate passed and signed off. The release PR `redesign` -> `master` waits for Wrenz's
review and merge (he merges it himself). After it ships: Spec 2, the `/work/[slug]` case-study pages
(spec §17), built on these components: `routes.ts` gains the case-study paths, the JSON-LD ItemList points at
them, and each page gets its own OG image and CreativeWork JSON-LD.

Open NICE-TO-HAVE items from the Fable critiques are listed in the release PR. Measurement tools:
`tools/perf/README.md`; capture tools: `tools/scenes/README.md`.
```

- [ ] **Step 5: Commit and open the PR**

```bash
git add -A
git commit -m "Final critique fixes and handoff for Spec 2"
git push -u origin rd/8.3-final-critique
gh pr create --base redesign --title "8.3 Final critique and handoff" --body "Task 8.3. Fable's whole-page critique (MUST-FIX fixed, budgets re-checked), screenshots at 390/820/1024/1440, handoff pointing at Spec 2, and the collected NICE-TO-HAVE list."
```

Review and merge per the protocol.

### Task 8.4: Release: `redesign` to `master`

**Files:**
- None changed. The PR is `redesign` into `master`.

**Interfaces:**
- Consumes: `redesign` with every Phase 0 to 8 task merged and Phase 3 to 7 sign-offs from Wrenz.
- Produces: the release PR; after Wrenz's merge, the production check results.

- [ ] **Step 1: Confirm nothing is left open**

```bash
gh pr list --repo WrenzLaylo/wrenz-portfolio --base redesign --state open
git fetch origin && git log --oneline origin/master..origin/redesign | wc -l
```

Expected: no open task PRs into `redesign`; a positive count of commits ahead of `master`.

- [ ] **Step 2: Open the release PR**

Write the body to `tools/perf/out/release.md` with these sections, filled from the merged PRs (`gh pr list --base redesign --state merged --limit 100`):
1. **What changed:** one paragraph from spec §1, and the list of phases with their gate PR numbers.
2. **Success criteria (spec §1):** a table with each criterion, its measured result and the PR that shows it: frames at 1x and 4x (Task 8.1), LCP / CLS / TBT (Task 8.1), complete without JavaScript and with reduced motion (Task 8.2 `nojs_text.py`), SEO P0 and P1 (Task 8.2 `seo_check.py`), Wrenz's approval (this PR).
3. **Budgets (spec §12):** the final `budget.py` and `chunks.mjs` numbers.
4. **Accepted misses:** any budget Wrenz accepted in writing, with links; or "none".
5. **NICE-TO-HAVE backlog:** the collected list from Task 8.3.
6. **How to review:** the `redesign` Vercel preview URL (from `gh pr checks` or the Vercel comment), and the checks Wrenz may like to do himself: the page on his phone, the menu, one world's animation, the LinkedIn and GitHub links.

```bash
gh pr create --repo WrenzLaylo/wrenz-portfolio --base master --head redesign --title "Portfolio redesign (Spec 1)" --body-file tools/perf/out/release.md
```

- [ ] **Step 3: Hand it to Wrenz**

Tell Wrenz the PR number, the preview URL and the one-paragraph summary. **Do not merge it.** Wait for his merge; if he asks for changes, make them as task PRs into `redesign` (same protocol), and the release PR updates itself.

- [ ] **Step 4: After Wrenz merges: check production**

Wait until the production deployment serves the new page (the HTML contains `data-scene`):

```bash
until curl -s https://wrenz-portfolio.vercel.app/ | grep -q 'data-scene'; do sleep 20; done; echo deployed
PERF_URL=https://wrenz-portfolio.vercel.app/ py -3.11 -I tools/perf/seo_check.py --site https://wrenz-portfolio.vercel.app
PERF_URL=https://wrenz-portfolio.vercel.app/ py -3.11 -I tools/perf/budget.py
npx -y lighthouse@13 https://wrenz-portfolio.vercel.app/ --only-categories=performance,accessibility,seo,best-practices --output=json --output-path=tools/perf/out/lh-prod.json --chrome-flags="--headless=new"
node tools/perf/lh-summary.mjs tools/perf/out/lh-prod.json
curl -s -o /dev/null -w "og image %{http_code} %{content_type}\n" "$(curl -s https://wrenz-portfolio.vercel.app/ | grep -o '<meta property="og:image" content="[^"]*"' | sed 's/.*content="//;s/"$//')"
```

Expected: `seo_check.py` `PASS`, `budget.py` `PASS`, `lh-summary.mjs` no `FAIL`, and `og image 200 image/png`. Post all outputs as a comment on the merged release PR (`gh pr comment <N> --body-file ...`). If anything fails in production but passed locally, open a fix as a normal task PR (a branch from `master` now) and tell Wrenz.

Wrenz may also paste the production URL into Google's Rich Results Test and the Schema.org validator himself; that is his choice, not a step of this plan.

- [ ] **Step 5: Close out the handoff**

On a branch from `master`, set the first line of the `## RESUME HERE` block in `docs/HANDOFF.md` to "Spec 1 shipped to production on <date> (release PR #<N>). Next: Spec 2, the `/work/[slug]` case studies." Commit, open a PR into `master`, and let Wrenz merge it.

---

## Appendix: review log

**Fable 5.1, 2026-10-11. Verdict: approve with fixes** (2 MUST-FIX, 6 SHOULD-FIX, 8 NICE-TO-HAVE). Full review:
`C:\Users\OASIS\scratch-portfolio\plan-review\fable-plan-review.md`. Every item was checked against the plan and the
repo before acting on it.

| # | Finding | Disposition |
|---|---|---|
| M1 | The whole-page "no stray copy" test (Task 4.3) fails on the nav labels, which `pageCopy()` did not list | Fixed: `pageCopy()` starts with the nav labels (Task 1.2); the Task 4.3 guidance now says where missing copy goes |
| M2 | Unused `BasicWorld` / `BasicVignette` imports fail lint after Tasks 6.3 and 7.3 | Fixed: both tasks delete the import; Task 8.1's expectation updated |
| S1 | `scroll-behavior: smooth` turns the tools' `scrollTo` into smooth scrolls | Fixed further than asked: the rule is gone (the spec never asked for it; native scroll stays untouched) and the tools scroll with `behavior: 'instant'` |
| S2 | POS ear flick and blink are SVG-internal WAAPI tweens not listed as a deviation | Fixed: clarification 17 + a `who.py pos 4` check in Task 3.4 with a delete-it fallback |
| S3 | `will-change` pinned on every layer of every stage | Fixed: `.paused` stages drop `will-change` (Task 1.4), with a measured revert lever in Task 8.1. Note: the review's ~100 MB texture estimate is high (Chrome does not raster off-screen tiles); the layer-count cost per frame is the real reason |
| S4 | `git rm` aborts if `keyclick-automator-logo.png` is absent | Fixed with `--ignore-unmatch`. The file does exist on `master` since PR #1 merged; the reviewer's checkout predates it |
| S5 | `chunks.mjs` trusts that each choreography has its own chunk | Fixed: warns when choreographies share a chunk and fails when GSAP is bundled into one |
| S6 | Contact's straight edge, the stroke `icon.svg`, the OG circle and smooth scrolling were undeclared deviations | Fixed: clarifications 18-20 (smooth scrolling was removed instead) |
| N1 | Three wrong test counts | Fixed (content-integrity 12, world 18, page 9) |
| N2 | The hero's `overflow: clip` hides the hill edge's 1 px overlap | Fixed: `overflow-clip-margin: 1px` on `.hero` |
| N3 | `@types/jsdom@30` may not exist | Not changed: verified on npm, `@types/jsdom` is at 30.0.0 |
| N4 | The contract snapshot ignores text | Fixed: it compares leaf text too (only the time-log choreography writes text, and it restores it) |
| N5 | `perf.py`'s optional DPR argument | Not changed: documented in its usage line, unused by the gates |
| N6 | `shoot.py` reads computed, not rendered, size of SVG `<text>` | Not changed: the only SVG text (POS sack and jar) is sized for the rule and hidden on the mobile grid |
| N7 | Engine tests find observers by `rootMargin` | Not changed: exactly one observer has no margin; a test would fail loudly if that changed |
| N8 | The vignette mascot wrapper must not animate | Fixed: added to the Phase 7 rules |
