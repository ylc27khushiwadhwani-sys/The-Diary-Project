import { describe, it, expect } from 'vitest';
import { getUnsealDate, isDateSealed, daysUntilUnseal, withUnsealTag, visibleTags } from './unseal';

describe('date seals', () => {
  it('reads and writes the unseal tag without touching other tags', () => {
    const tags = withUnsealTag(['grief', 'unseal:2020-01-01'], '2030-05-09');
    expect(tags).toEqual(['grief', 'unseal:2030-05-09']);
    expect(getUnsealDate(tags)).toBe('2030-05-09');
    expect(visibleTags(tags)).toEqual(['grief']);
    expect(withUnsealTag(tags, null)).toEqual(['grief']);
  });
  it('is sealed until local midnight of the unseal day', () => {
    const note = { tags: ['unseal:2030-05-09'] };
    expect(isDateSealed(note, new Date(2030, 4, 8, 23, 59))).toBe(true);
    expect(isDateSealed(note, new Date(2030, 4, 9, 0, 0))).toBe(false);
    expect(isDateSealed({ tags: [] })).toBe(false);
    expect(isDateSealed({ tags: ['unseal:nonsense'] })).toBe(false);
  });
  it('counts whole days remaining', () => {
    expect(daysUntilUnseal('2030-05-09', new Date(2030, 4, 6, 10, 0))).toBe(3);
    expect(daysUntilUnseal('2030-05-09', new Date(2031, 0, 1))).toBe(0);
  });
});
