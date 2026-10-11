"""Who requests main-thread frames? Parks in a scene with NO input, traces, and lists
JS function calls (by name/url:line), rAF owners and style-recalc triggers.
usage: py -3.11 -I tools/perf/who.py SLUG THROTTLE [--scroll|--mouse] [--q=QUERY]"""
import sys, asyncio, json, collections, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL, park  # noqa: E402
from playwright.async_api import async_playwright

SLUG, THR = sys.argv[1], float(sys.argv[2])
SCROLL = "--scroll" in sys.argv
URL = BASE_URL + next((a.split("=",1)[1] for a in sys.argv if a.startswith("--q=")), "")
CATS = "devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack,blink,cc,benchmark"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=False, args=["--window-position=0,0"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        pg = await ctx.new_page()
        cdp = await ctx.new_cdp_session(pg)
        await pg.goto(URL, wait_until="networkidle")
        await pg.mouse.move(5, 5)
        if not await park(pg, SLUG):
            await b.close()
            sys.exit(f"no stage {SLUG} on the page")
        await pg.wait_for_timeout(8000)
        if THR > 1:
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": THR})
        ev = []; done = asyncio.get_event_loop().create_future()
        cdp.on("Tracing.dataCollected", lambda e: ev.extend(e["value"]))
        cdp.on("Tracing.tracingComplete", lambda e: done.set_result(1))
        await cdp.send("Tracing.start", {"categories": CATS, "transferMode": "ReportEvents"})
        if SCROLL:
            for _ in range(30):
                await pg.mouse.wheel(0, -60); await pg.wait_for_timeout(40)
        elif "--mouse" in sys.argv:
            for i in range(20):
                await pg.mouse.move(1440 * (0.3 + 0.5 * ((i % 5) / 4)), 900 * (0.3 + 0.4 * ((i % 3) / 2)), steps=3)
                await pg.wait_for_timeout(150)
        else:
            await pg.wait_for_timeout(3000)
        await cdp.send("Tracing.end"); await done
        await b.close()
    names = {(e["pid"], e["tid"]): e["args"]["name"] for e in ev if e.get("ph") == "M" and e.get("name") == "thread_name"}
    main = {k for k, v in names.items() if v == "CrRendererMain"}
    fn = collections.Counter(); fnms = collections.Counter(); kinds = collections.Counter(); kms = collections.Counter()
    recalc_reasons = collections.Counter()
    for e in ev:
        if (e.get("pid"), e.get("tid")) not in main:
            continue
        if e.get("ph") == "X":
            kinds[e["name"]] += 1; kms[e["name"]] += e.get("dur", 0) / 1000
        if e.get("name") == "FunctionCall":
            d = (e.get("args") or {}).get("data") or {}
            key = f"{d.get('functionName') or '(anon)'} {str(d.get('url',''))[-28:]}:{d.get('lineNumber')}"
            fn[key] += 1; fnms[key] += e.get("dur", 0) / 1000
        if e.get("name") in ("ScheduleStyleRecalculation", "StyleRecalcInvalidationTracking", "StyleInvalidatorInvalidationTracking"):
            d = (e.get("args") or {}).get("data") or {}
            recalc_reasons[(e["name"], str(d.get("reason") or d.get("frame") or "")[:40], str(d.get("nodeName") or "")[:40])] += 1
    pr = collections.Counter()
    for e in ev:
        if e.get("name") == "PipelineReporter" and e.get("ph") == "b":
            pr[((e.get("args") or {}).get("frame_reporter") or {}).get("state")] += 1
    print("frames:", dict(pr))
    print("top main-thread events:")
    for k, ms in kms.most_common(14):
        print(f"  {k:48s} {ms:8.1f} ms  x{kinds[k]}")
    print("JS function calls:")
    for k, n in fn.most_common(12):
        print(f"  {k:60s} x{n}  {fnms[k]:.1f} ms")
    print("style invalidations:", recalc_reasons.most_common(12))

asyncio.run(main())
