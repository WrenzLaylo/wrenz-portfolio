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
