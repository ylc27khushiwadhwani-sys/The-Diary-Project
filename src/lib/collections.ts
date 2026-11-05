import { Note } from "../types/database";

/**
 * The Librarian's collections: curated shelves gathered by theme.
 * Matching is client-side and keyword-based so it works over the public
 * feed the reader already has - no schema change, no migration. As real
 * letters arrive, the shelves fill themselves; a shelf that finds nothing
 * says so instead of pretending.
 */
export interface LibrarianCollection {
  id: string;
  title: string;
  line: string;
  keywords: string[];
}

export const LIBRARIAN_COLLECTIONS: LibrarianCollection[] = [
  {
    id: "first-love",
    title: "Letters about first love",
    line: "the ones who taught us the word before we knew what it cost",
    keywords: ["love", "laugh", "cassette", "mixtape", "off-key", "heart"],
  },
  {
    id: "unsaid-at-the-table",
    title: "Things never said across the table",
    line: "family, and everything dinner conversation stepped around",
    keywords: [
      "father",
      "mother",
      "dad",
      "mom",
      "dinner",
      "table",
      "upstairs",
      "basement",
      "phone call",
    ],
  },
  {
    id: "goodbyes",
    title: "Goodbyes that never happened",
    line: "departures nobody marked, endings nobody named",
    keywords: [
      "goodbye",
      "platform",
      "gate",
      "boarding",
      "walked out",
      "stopped trying",
      "ring out",
    ],
  },
  {
    id: "the-apology",
    title: "The apology still owed",
    line: "arguments won, people lost",
    keywords: ["sorry", "apolog", "argument", "no offense", "stubborn"],
  },
  {
    id: "carried-us",
    title: "The ones who carried us",
    line: "small kindnesses that held a whole person up",
    keywords: ["soup", "umbrella", "stranger", "armor", "ocean", "heavy"],
  },
];

export const noteMatchesCollection = (
  note: Note,
  collection: LibrarianCollection,
): boolean => {
  const haystack =
    `${note.title ?? ""} ${note.content ?? ""}`.toLowerCase();
  return collection.keywords.some((keyword) => haystack.includes(keyword));
};
