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
