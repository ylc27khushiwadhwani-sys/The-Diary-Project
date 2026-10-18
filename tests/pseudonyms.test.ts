import { describe, it, expect } from 'vitest';
import { generatePseudonym, getRandomAvatarColor } from '../src/utils/pseudonyms';

describe('Pseudonym & Anonymous Pen Name Generator', () => {
  it('generates a pseudonym in the format "Adjective Noun #123"', () => {
    const penName = generatePseudonym();
    expect(penName).toMatch(/^[A-Za-z]+ [A-Za-z]+ #\d{3}$/);
  });

  it('generates diverse pseudonyms across repeated invocations', () => {
    const names = new Set<string>();
    for (let i = 0; i < 25; i++) {
      names.add(generatePseudonym());
    }
    // High probability of variety
    expect(names.size).toBeGreaterThan(15);
  });

  it('returns valid hex color strings for avatars', () => {
    const color = getRandomAvatarColor();
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
