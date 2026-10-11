"""Start or stop `next start` on 127.0.0.1:3000 for the perf tools.
usage: py -3.11 -I tools/perf/serve.py start|stop
It only ever stops the PID it started (kept in .perf-server.pid). Never stop processes by name."""
import pathlib
import subprocess
import sys
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
PIDFILE = ROOT / ".perf-server.pid"
URL = "http://127.0.0.1:3000/"


def start():
    if PIDFILE.exists():
        sys.exit(f"{PIDFILE.name} exists (pid {PIDFILE.read_text().strip()}): run `serve.py stop` first")
    if not (ROOT / ".next" / "BUILD_ID").exists():
        sys.exit("no production build: run `npm run build` first")
    nxt = ROOT / "node_modules" / "next" / "dist" / "bin" / "next"
    proc = subprocess.Popen(
        ["node", str(nxt), "start", "-p", "3000", "-H", "127.0.0.1"],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
    )
    PIDFILE.write_text(str(proc.pid))
    for _ in range(60):
        try:
            urllib.request.urlopen(URL, timeout=2)
            print(f"up: {URL} (pid {proc.pid})")
            return
        except Exception:
            time.sleep(0.5)
    stop()
    sys.exit("server did not answer within 30 s")


def stop():
    if not PIDFILE.exists():
        print("no .perf-server.pid: nothing to stop")
        return
    pid = PIDFILE.read_text().strip()
    # /T ends the child tree of OUR pid only (node spawned by us).
    subprocess.run(["taskkill", "/PID", pid, "/T", "/F"], check=False)
    PIDFILE.unlink()
    print(f"stopped pid {pid}")


if __name__ == "__main__":
    {"start": start, "stop": stop}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: sys.exit(__doc__))()
