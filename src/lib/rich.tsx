import type { ReactNode } from "react";

// The only inline convention in copy strings: *phrase* becomes <em>phrase</em>. Nothing else is parsed.
const EMPHASIS = /\*([^*]+)\*/g;

export function rich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(EMPHASIS)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    out.push(<em key={key++}>{match[1]}</em>);
    last = start + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Rich({ text }: { text: string }) {
  return <>{rich(text)}</>;
}

/** The same text without markers, for alt text, meta descriptions and JSON-LD. */
export function plain(text: string): string {
  return text.replace(EMPHASIS, "$1");
}
