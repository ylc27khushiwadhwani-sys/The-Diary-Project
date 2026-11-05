import type { Note } from "../types/database";

const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export interface WritingThread {
  /** Distinct local days with at least one letter written. */
  daysWritten: number;
  /** Consecutive days ending today (or yesterday, if today is unwritten). */
  thread: number;
}

export const writingThread = (notes: Note[]): WritingThread => {
  const days = new Set<string>();
  notes.forEach((n) => {
    if (n.created_at) days.add(dayKey(n.created_at));
  });

  const hasDay = (offset: number): boolean => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return days.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  };

  let thread = 0;
  let offset = hasDay(0) ? 0 : 1; // a thread may rest today and still be alive
  while (hasDay(offset)) {
    thread++;
    offset++;
  }

  return { daysWritten: days.size, thread };
};
