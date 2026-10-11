import type { Recognition, RecognitionId } from "./types";

/** The ONE source of award wording: About stickers, the LiPAD badge and JSON-LD `award` all read it. */
export const recognition: Recognition[] = [
  { id: "cum-laude", title: "Cum Laude", detail: "BS Computer Science, Data Science" },
  { id: "ircite-2026", title: "Best Thesis Paper and Presenter", detail: "IRCITE 2026", subject: "LiPAD" },
  { id: "jpcs-2025", title: "1st Place", detail: "JPCS Hackathon 2025" },
  { id: "azure-fundamentals", title: "Microsoft Certified", detail: "Azure Fundamentals" },
];

export function award(id: RecognitionId): Recognition {
  const found = recognition.find((r) => r.id === id);
  if (!found) throw new Error(`unknown recognition id: ${id}`);
  return found;
}
