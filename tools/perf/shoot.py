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
