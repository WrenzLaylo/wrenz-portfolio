"""Chrome's own frame presentation stats (PipelineReporter states) + main-thread breakdown
during a scripted wheel scroll and a parked POS scene.
usage: py -3.11 -I smooth.py THROTTLE [W H] [--mobile]"""
import sys, asyncio, json, collections, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import BASE_URL, park  # noqa: E402
from playwright.async_api import async_playwright

THR = float(sys.argv[1])
W = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 1440
H = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 900
MOBILE = "--mobile" in sys.argv
CATS = "benchmark,cc,devtools.timeline,disabled-by-default-devtools.timeline,toplevel,blink"

async def phase(cdp, run):
    events = []
    done = asyncio.get_event_loop().create_future()
    h1 = lambda e: events.extend(e["value"])
    h2 = lambda e: done.done() or done.set_result(True)
    cdp.on("Tracing.dataCollected", h1); cdp.on("Tracing.tracingComplete", h2)
    await cdp.send("Tracing.start", {"categories": CATS, "transferMode": "ReportEvents"})
    await run()
    await cdp.send("Tracing.end"); await done
    cdp.remove_listener("Tracing.dataCollected", h1); cdp.remove_listener("Tracing.tracingComplete", h2)
    return events

def analyze(events):
    states = collections.Counter(); smooth = collections.Counter()
    for e in events:
        if e.get("name") == "PipelineReporter" and e.get("ph") == "b":
            fr = (e.get("args") or {}).get("frame_reporter") or {}
            st = fr.get("state", "?")
            states[st] += 1
            if fr.get("affects_smoothness"):
                smooth[st] += 1
    names = {}
    for e in events:
        if e.get("ph") == "M" and e.get("name") == "thread_name":
            names[(e["pid"], e["tid"])] = e["args"]["name"]
    main = {k for k, v in names.items() if v == "CrRendererMain"}
    agg = collections.Counter()
    for e in events:
        if (e.get("pid"), e.get("tid")) in main and e.get("ph") == "X" and "dur" in e:
            agg[e["name"]] += e["dur"] / 1000
    keep = ["ProxyMain::BeginMainFrame", "FireAnimationFrame", "FunctionCall", "UpdateLayoutTree", "Layout", "PrePaint", "Paint", "Layerize", "HitTest", "EventDispatch", "TimerFire", "IntersectionObserverController::computeIntersections"]
    total = sum(smooth.values()) or 1
    dropped = smooth.get("STATE_DROPPED", 0)
    partial = smooth.get("STATE_PRESENTED_PARTIAL", 0)
    return {"frames": dict(states), "smooth_frames": dict(smooth), "dropped_pct": round(100 * dropped / total, 1), "partial_pct": round(100 * partial / total, 1),
            "main_ms": {k: round(agg[k], 1) for k in keep if agg.get(k)}}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=False, args=["--window-position=0,0"])
        ctx = await b.new_context(viewport={"width": W, "height": H}, is_mobile=MOBILE, has_touch=MOBILE, reduced_motion="reduce" if "--rm" in sys.argv else "no-preference")
        pg = await ctx.new_page()
        cdp = await ctx.new_cdp_session(pg)
        await pg.goto(BASE_URL, wait_until="networkidle")
        await pg.wait_for_timeout(2500)
        if THR > 1:
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": THR})
        await pg.mouse.move(W * 0.5, H * 0.5)

        async def scroll_down():
            total = await pg.evaluate("document.documentElement.scrollHeight - innerHeight")
            while await pg.evaluate("scrollY") < total - 5:
                await pg.mouse.wheel(0, 100); await pg.wait_for_timeout(40)
            await pg.wait_for_timeout(400)
        res_scroll = analyze(await phase(cdp, scroll_down))

        res_pos = None
        if await park(pg, "pos"):
            await pg.wait_for_timeout(2500)
            async def park_idle():
                for i in range(20):
                    await pg.mouse.move(W * (0.3 + 0.5 * ((i % 5) / 4)), H * (0.3 + 0.4 * ((i % 3) / 2)), steps=3)
                    await pg.wait_for_timeout(150)
            res_pos = analyze(await phase(cdp, park_idle))
        await b.close()
    print(json.dumps({"throttle": THR, "viewport": f"{W}x{H}", "scroll": res_scroll, "pos_idle": res_pos}, indent=1))

asyncio.run(main())
