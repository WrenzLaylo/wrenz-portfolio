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
