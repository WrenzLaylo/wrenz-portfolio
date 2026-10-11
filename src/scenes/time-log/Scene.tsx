import { sceneText } from "@/content/scene-text";
import type { FullProject } from "@/content/types";
import { type Grid, place } from "../grid";
import { Layer, Stage } from "../Stage";

const GRID: Grid = { dw: 820, dh: 620, mdw: 358, mdh: 432 };

// Columns 1, 3 and 4 (Arrival, Break, In) show on the desktop grid only.
const DESKTOP_ONLY = new Set([1, 3, 4]);
const T = sceneText.timeLog;
const HEAD = T.head;
const WEEK = T.week;
const BUBBLES = T.bubbles;
const FRI = T.friday;

const cellClass = (column: number) => [DESKTOP_ONLY.has(column) ? "g-d" : "", column === 8 ? "t" : ""].filter(Boolean).join(" ") || undefined;

function Check() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true">
      <use href="#i-check" />
    </svg>
  );
}

function Slot({ slot, value, desktopOnly }: { slot: string; value: string; desktopOnly?: boolean }) {
  return (
    <span className={desktopOnly ? "g-d" : undefined} data-slot={slot}>
      <span className="v">{value}</span>
      <i className="flash" />
    </span>
  );
}

export function TimeLogScene({ project }: { project: FullProject }) {
  return (
    <Stage slug="time-log" tier="full" grid={GRID} label={project.illustrationLabel}>
      <Layer depth="bg">
        <div className="clock pos" style={place({ x: -64, y: -104, w: 520, mx: 190, my: -30, mw: 190 })}>
          <svg viewBox="0 0 520 520">
            <circle cx="260" cy="268" r="252" fill="#84B4F7" />
            <circle cx="260" cy="260" r="252" fill="#9CC5FF" />
            <g stroke="#1F1B24" strokeLinecap="round">
              <path d="M260 34V66M486 260H454M260 486V454M34 260H66" strokeWidth="12" />
              <path d="M373 64L361 85M456 147L435 159M456 373L435 361M373 456L361 435M147 456L159 435M64 373L85 361M64 147L85 159M147 64L159 85" strokeWidth="7" />
            </g>
          </svg>
        </div>
        <i className="hand hand-h pos" data-part="hour" style={place({ x: 187, y: 26, w: 18, mx: 280.5, my: 18, mw: 9 })} />
        <i className="hand hand-m pos" data-part="minute" style={place({ x: 190, y: 6, w: 12, mx: 282, my: -4, mw: 6 })} />
        <i className="hand hand-s pos loop" style={place({ x: 193, y: -9, w: 6, mx: 283.5, my: -12, mw: 3 })} />
        <i className="hand-cap pos" style={place({ x: 180, y: 140, w: 32, mx: 277, my: 57, mw: 16 })} />
        <svg className="cloud pos loop g-d" style={place({ x: 676, y: 30, w: 120 })} viewBox="0 0 110 60">
          <use href="#s-cloud" />
        </svg>
        <svg className="pos g-d" style={place({ x: 560, y: 110, w: 18 })} viewBox="0 0 18 18">
          <circle cx="9" cy="9" r="9" fill="#FF9EC4" />
        </svg>
        <svg className="pos" style={place({ x: 330, y: 572, w: 32, mx: 176, my: 150, mw: 18 })} viewBox="0 0 36 30">
          <path d="M18 0L36 30H0Z" fill="#FFC72C" />
        </svg>
      </Layer>

      <Layer depth="mid">
        <div className="win-wrap pos" style={place({ x: 236, y: 196, w: 566, mx: 12, my: 196, mw: 334 })}>
          <div className="win-copy" data-part="win-copy">
            <span className="pill backed" data-part="backed">
              {T.backed}
            </span>
          </div>
          <div className="win" data-part="win">
            <div className="win-bar">
              <i />
              <i />
              <i />
              <span>{T.title}</span>
            </div>
            <div className="sheet">
              <div className="sh-row sh-head">
                {HEAD.map((label, column) => (
                  <span key={column} className={cellClass(column)}>
                    {label}
                  </span>
                ))}
              </div>
              {WEEK.map((row) => (
                <div key={row[0]} className="sh-row">
                  {row.map((value, column) => (
                    <span key={column} className={cellClass(column)}>
                      {value}
                    </span>
                  ))}
                </div>
              ))}
              <div className="sh-row live">
                <span>{FRI.day}</span>
                <Slot slot="arr" value={FRI.arr} desktopOnly />
                <Slot slot="start" value={FRI.start} />
                <span className="g-d" />
                <span className="g-d" />
                <Slot slot="lunch" value={FRI.lunch} />
                <Slot slot="back" value={FRI.back} />
                <Slot slot="out" value={FRI.out} />
                <span className="t">
                  <span className="total">{FRI.total}</span>
                </span>
              </div>
            </div>
            <div className="win-tabs">
              <span>{T.tabs[0]}</span>
              <span className="on">{T.tabs[1]}</span>
            </div>
          </div>
          <div className="badge" data-part="badge">
            <Check />
            {T.readBack}
            <span className="burst">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
      </Layer>

      <Layer depth="fg">
        <div className="bubbles pos" style={place({ x: 22, y: 236, w: 200, mx: 10, my: 18, mw: 160 })}>
          {BUBBLES.map((b) => (
            <div key={b.cell} className={b.desktopOnly ? "bubble g-d" : "bubble"} data-cell={b.cell} data-time={b.time}>
              <b>{T.avatar}</b>
              {b.text}
              <i className="ok">
                <Check />
              </i>
            </div>
          ))}
          <div className="bubble typing g-d">
            <b>{T.avatar}</b>
            <span className="dots">
              <i className="loop" />
              <i className="loop" />
              <i className="loop" />
            </span>
          </div>
        </div>
      </Layer>
    </Stage>
  );
}
