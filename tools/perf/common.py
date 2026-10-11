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
