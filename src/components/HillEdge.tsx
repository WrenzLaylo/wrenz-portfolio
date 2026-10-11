// The three hill edges from the slice. Each band ends in one, filled with the NEXT band's colour,
// so the next world appears to rise into this one (spec §8).
const EDGES = [
  "M0 72V44C220 6 470 -4 720 26C960 54 1200 66 1440 22V72Z",
  "M0 72V26C260 64 520 70 760 40C1000 10 1220 4 1440 34V72Z",
  "M0 72V40C240 8 500 4 740 30C980 56 1220 60 1440 20V72Z",
] as const;

export function HillEdge({ fill, variant = 0 }: { fill: string; variant?: 0 | 1 | 2 }) {
  return (
    <svg className="hill-edge" viewBox="0 0 1440 72" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={EDGES[variant]} style={{ fill }} />
    </svg>
  );
}
