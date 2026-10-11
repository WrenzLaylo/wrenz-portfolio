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
