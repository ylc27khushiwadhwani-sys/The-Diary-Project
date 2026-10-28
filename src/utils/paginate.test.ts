import { describe, expect, it } from 'vitest';
import { paginate } from './paginate';
import { INITIAL_PUBLIC_NOTES } from '../data/seedNotes';

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('paginate', () => {
  it('keeps the closing quote with its sentence', () => {
    const text = 'She said, "I will be there with you." Then she left the room.';
    const pages = paginate(text, 40);
    expect(pages.join(' ')).toContain('with you."');
    expect(squash(pages.join(' '))).toBe(squash(text));
  });

  it('never drops text from quoted, bracketed or unterminated sentences', () => {
    const text = 'He asked (quietly.) "Why?" \u201cBecause,\u201d she said. No ending here';
    for (const target of [20, 35, 620]) {
      expect(squash(paginate(text, target).join(' '))).toBe(squash(text));
    }
  });

  it('respects the page target for long paragraphs', () => {
    const text = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} goes here.`).join(' ');
    const pages = paginate(text, 200);
    expect(pages.length).toBeGreaterThan(3);
    expect(pages.every((p) => p.length <= 200)).toBe(true);
  });

  it('round-trips every seed letter without losing a character', () => {
    for (const n of INITIAL_PUBLIC_NOTES) {
      expect(squash(paginate(n.content).join(' '))).toBe(squash(n.content));
    }
  });
});
