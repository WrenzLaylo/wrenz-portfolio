# HANDOFF: portfolio redesign (written 2026-10-10)

Untracked file. Read it top to bottom before doing anything. Delete it, or move it into
`docs/`, once the work it describes is underway.

## RESUME HERE

Implementation is under way on the `redesign` branch, following
`docs/superpowers/plans/2026-10-11-portfolio-redesign-spec-1.md`. Progress = the task PRs merged into
`redesign` (`gh pr list --base redesign --state all`). Pick the first plan task without a merged PR.
Everything below this block is history from the design stage.

## Earlier state (2026-10-10 night)

**Read first:** this section, then `C:\Users\OASIS\scratch-portfolio\slice\README.md` (the approved
prototype: design system, performance architecture, gotchas, tools). Then the rest of this file.

### Where we are
- The visual direction is **APPROVED** by Wrenz via the slice prototype (hero "cast" + green POS world +
  blue time-log world). Serve it with
  `py -3.11 -I -m http.server 3110 --bind 127.0.0.1 --directory C:\Users\OASIS\scratch-portfolio\slice`.
- The POS screen now reacts (a 6 s CSS story: order, then 4 coins into the jar, then "Cash sale saved
  #4969" on the rail, then back), as he asked. Captured with zero DB writes (`slice/tools/pos_saved.py`).
- Portrait: **keep it as is** (dark studio backdrop, no cut-out).
- KeyClick WIP is **PR #1** (`feat/keyclick-project`, Vercel preview green), waiting for his merge. The old
  orphaned POS dev server is gone (the session restart ended it).
- **We are mid-brainstorming** (superpowers:brainstorming, ARCHITECTURAL path) for the full rebuild.
  Nothing of the rebuild exists in the repo yet: no branch, no spec, no plan.

### Decisions made in brainstorming so far
1. **Two specs** (option A). **Spec 1** = design system + motion engine + home page (all project worlds)
   + technical SEO. **Spec 2** = the `/work/[slug]` case-study pages (≥300 words each, per-route OG,
   CreativeWork JSON-LD), built on Spec 1's components. Write Spec 1 first.
2. **Home layout = 6 full worlds + 5 compact.** Full worlds: Pig Feeds POS, AGG time-log,
   AGG WordPress automation, Katiwala, Stockroom API, Agent Island. Compact (smaller animated
   vignettes in a grid): KeyClick Automator, Med42, Everyday Rockstar, LiPAD (with its IRCITE 2026
   award), PesoWise.
3. My understanding, which he did not correct: light theme only (Fable's call); carry the slice's
   performance architecture into React; keep the existing stack (Next 16.2.12, React 19.2.4,
   Tailwind 4, GSAP 3.15); a mascot for every project; success = 60 fps in real Chrome on his laptop
   at 1x, LCP < 2.5 s on 4G, INP < 200 ms, plus SEO P0/P1 below.

### Facts gathered for Spec 1
- `src/app/layout.tsx` uses IBM Plex via `next/font/google`. It is to be replaced by Gabarito + Albert
  Sans (self-hosted via `next/font`). `metadataBase` hardcodes `https://wrenz-portfolio.vercel.app`, so
  move it to ONE site-URL config value (no domain yet). It still has `keywords` (drop them: SEO P2).
- **Stockroom API** is real: `C:\Users\OASIS\Documents\GitHub\stockroom-api`, pushed to GitHub `main`
  (WrenzLaylo/stockroom-api), Spring Boot 4, 109 tests. The visual = a real Swagger UI (springdoc)
  screenshot and/or a designed code/diagram scene ("boxes stacking on shelves").
- **Agent Island** is real: `C:\Users\OASIS\Downloads\agent-island` (GitHub WrenzLaylo/Agent-Island). It
  is a Dynamic-Island-style Electron overlay that shows what Claude Code / Codex / Hermes are doing and
  answers their permission prompts. Scene idea: three bots passing a JSON note. Its README has no
  screenshot yet.
- AGG WordPress automation: 178 unique suburb Service Area pages via the WP REST API (see memory
  `aggd-service-areas-automation.md`). Real screenshots come from the public aggdoors.com.au pages.
- Katiwala: Expo/RN app; real screens from the app (see memory `katiwala-app.md`).

### NEXT (in this order, per the brainstorming skill)
1. Propose **2-3 implementation approaches** for Spec 1, with a recommendation. My lean: Server
   Components for content, one typed `content/projects.ts` driving the worlds + JSON-LD + sitemap,
   each scene a small client island, CSS-first motion, GSAP lazy-loaded per scene.
2. Present the **design in sections**, getting his OK after each: structure and content model;
   the world/scene system and performance budget; the compact vignettes; the other sections
   (capabilities, experience, about, contact); SEO; testing and delivery.
   **Delivery proposal:** an integration branch `redesign`, task PRs into it, Vercel previews on it,
   and one final `redesign` to `master` PR. Merging task PRs into `master` would put a half-built
   redesign live.
3. Write the spec to `docs/superpowers/specs/2026-10-xx-portfolio-redesign-design.md` on its own branch
   + PR, run the spec self-review, then **Fable 5.1 reviews it**, then Wrenz reviews it.
4. Only then: superpowers:writing-plans.

## Where things stood before the slice
- **Nothing is implemented in the repo.** No branch, no commits, no spec, no plan. We are still in
  brainstorming (superpowers:brainstorming, **architectural path**).
- The working tree still has Wrenz's **uncommitted KeyClick Automator changes**
  (`src/app/page.tsx`, `src/app/globals.css`, `public/keyclick-automator-logo.png`). They
  are not live. Ask him whether to land them as their own PR first. Don't discard them.
- `.superpowers/` (brainstorm companion files) is untracked. Add `.superpowers/` to
  `.gitignore` in the first PR.
- Live site: https://wrenz-portfolio.vercel.app (Next 16.2, React 19, Tailwind 4, GSAP 3.15,
  branch `master`). **Read `AGENTS.md`**: this Next.js differs from training data, so check
  `node_modules/next/dist/docs/` before using any API.

## What Wrenz wants (decisions made 2026-10-09/10)
- Ask: "very creative, wow factor, animations, parallax, fix SEO". **Fable 5.1 as advisor /
  planner** (dispatch `model: "fable"` subagents for planning, critique and big reviews).
- **Audience:** recruiters AND freelance clients, equally.
- **No domain yet:** build domain-agnostic, with the site URL in ONE config value.
- **Content:** keep all current projects and copy, and ADD:
  - per-project case-study pages at `/work/[slug]`
  - new projects: **Stockroom API**, **AGG WordPress automation**, **Agent Island** (NOT Flick-n-Fire)
  - the experience-wording fix
- **Experience:** "Developer, AI & Automation · **Managed Virtual Services**", with AGG Doors
  (Melbourne) as the client. Remove the "Freelance… / Self-employed" rows.
- **Identity:** FRESH start (retire navy + lime, IBM Plex, the dossier card). Keep the plain,
  concrete copy voice ("Messy operations in. Reliable systems out.", "Production work, not
  coursework dressed up.", Filipino specifics like benta/utang, Aling Rosa).
- **Visuals:** real screenshots wherever possible (live sites, the POS on TEST data,
  Katiwala screens, AGG public pages); designed diagrams/code visuals for Stockroom and Agent Island.

## What was tried and REJECTED (don't repeat it)
Prototypes are in `C:\Users\OASIS\scratch-portfolio\directions\` (README.md, a/b/c.html,
r2-a.html, r2-b.html). Reference only.
1. **Round 1** (A Sorting Line / B Exploded View / C Tindahan, Three.js, restrained):
   "boring and simple".
2. **Round 2** (Signal = 65k GPGPU particles + bloom; Pitong Libong Isla = night-sea world;
   Lenis smooth scroll): "**broken asf**". All four: **laggy/choppy, visual glitches, scroll
   felt wrong, ugly/confusing.**
   - Root cause on my side: I only checked them in headless SwiftShader screenshots, never
     in real Chrome on this laptop (i7-8550U, GeForce 940MX + UHD 620, 12 GB).
   - Also, I liked them more than he did. Don't trust your own taste call over his stated
     preference.

## The NEW direction (agreed 2026-10-10)
- **No Three.js / WebGL at all.** No Lenis or any smooth-scroll hijack: use native scroll.
- **Colourful, bright, playful but professional**, with parallax and lots of animation.
  Each project gets its own colour world.
- **Each project = the real screenshot in a device frame + an animated vector (SVG) scene
  around it.** His example: Pig Feeds POS shows the POS screenshot, and a pig eats feed
  pellets pouring from a feed sack (coins pop, etc.). Every part animates (GSAP), files stay
  tiny, and it's fast.
- Scene ideas (not yet approved):
  - Time-log: chat bubbles fly into a spreadsheet grid, clock hands.
  - KeyClick: keys pressing themselves, a cursor clicking.
  - Med42: a heartbeat line.
  - Katiwala: a phone with tools bouncing.
  - Stockroom: boxes stacking on shelves.
  - AGG WP: Melbourne suburb pins popping, a garage door rolling up.
  - Agent Island: three bots passing a JSON note.
  - PesoWise: pesos into a wallet.
  - LiPAD: a plate deblurring.
  - Everyday Rockstar: a star burst.
- Parallax: GSAP ScrollTrigger, **transform/opacity only**, layered depth (bg shapes /
  scene / foreground), mouse parallax on desktop only. Respect `prefers-reduced-motion`.

## NEXT STEP
Build **ONE slice prototype** (throwaway, in `C:\Users\OASIS\scratch-portfolio\`, not the
repo): the hero + the **POS pig scene** + the **time-log scene**, at 1440×900 and 390×844.
Before showing it to Wrenz, verify it in **real Chrome on this laptop**:
- Use Playwright `channel="chrome"`. Chrome is at
  `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`, and Edge also exists.
- Run a scripted mouse-wheel scroll, and measure rAF frame times, normally and with CDP
  `Emulation.setCPUThrottlingRate` 4×.
- Take screenshots at many scroll positions, and check for overlaps and unreadable text.
- Look at everything at 1:1.

Invoke `design-taste-frontend` + `ui-ux-pro-max` first. Then get his yes on the slice, and
only then:
1. written spec in `docs/superpowers/specs/2026-10-xx-portfolio-redesign-design.md`
2. writing-plans
3. execution via a branch + PR per task

The POS screenshot source is `C:\Users\OASIS\Documents\POS` (Next/Prisma). Read its AGENTS.md
first. Its `prisma/dev.db` on this laptop is TEST data.

## SEO / quality findings to carry into the spec (Fable audit, 2026-10-09)
**P0**
- `app/robots.ts` and `app/sitemap.ts` (both currently 404).
- `app/opengraph-image.tsx` via `ImageResponse` from `next/og`, plus `summary_large_image`.
- JSON-LD inline `<script type="application/ld+json">` (escape `<` as `\u003c`): Person
  (alternateName "Wrenz Ivan Laylo", alumniOf AUF, sameAs GitHub/LinkedIn, awards),
  WebSite, ProfilePage, and an ItemList of projects.

**P1**
- The H1 must contain his name + role.
- Mock-up UI: make it `aria-hidden`/`inert`, with no fake headings or buttons.
- `/work/[slug]` with `generateStaticParams` + `generateMetadata` (`params` is a Promise
  in v16), a per-route OG image and CreativeWork JSON-LD. Each page needs ≥300 words of
  real content.
- `openGraph.siteName`, `apple-icon`, and `themeColor` via `export const viewport`.

**P2**
- Drop `keywords`.
- Trim font preloads (currently 6).
- Shrink the Katiwala logo (594 KB source for a 58 px render).

**Current-site bugs**
- `.project-points li{display:flex}` splits `<em>` words into columns.
- No mobile nav.
- Mock-up text is 6–9 px.
- The POS mock-up is half-empty on mobile.
- Dead space under LiPAD/PesoWise.
- A hydration fade flash in the hero.
- `public/motion.js` is dead code.

**Budget**
- Currently ~243 KB gz JS. Keep LCP < 2.5 s on 4G, INP < 200 ms.

## Standing rules (from memory)
- Every task goes through its own branch + PR. I review it on GitHub. Phase PRs wait for his merge.
- **No Claude co-author trailer or footer** in commits or PRs.
- Never kill processes by name; only kill PIDs I started.
- Fable 5.1 critiques real 390/1440 screenshots after every visual phase (MUST-FIX vs NICE-TO-HAVE).
- Tooling: Playwright = `py -3.11 -I`. No PIL on either Python. ffmpeg is on PATH (winget).
