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
