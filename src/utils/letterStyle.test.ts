import { describe, expect, it } from 'vitest';
import { getLetterStyle, withLetterStyle } from './letterStyle';
import { visibleTags, getUnsealDate } from './unseal';
describe('letter presentation metadata', () => {
  it('round-trips custom handwriting, flowers and an accented pen name', () => {
    const style = {font: 2, flowers: 3, from: 'Écho'};
    const tags = withLetterStyle(['hope', 'unseal:2028-04-23'], style);
    expect(getLetterStyle(tags)).toEqual(style);
    expect(visibleTags(tags)).toEqual(['hope']);
    expect(getUnsealDate(tags)).toBe('2028-04-23');
  });
  it('updates metadata without duplicates or changing other tags', () => {
    const tags = withLetterStyle(withLetterStyle(['hope'], {font: 0, flowers: 1, from: ''}), {font: 3, flowers: -1, from: 'Q'});
    expect(tags).toHaveLength(2);
    expect(getLetterStyle(tags)).toEqual({font: 3, flowers: -1, from: 'Q'});
  });
  it('falls back safely for old letters and malformed metadata', () => {
    expect(getLetterStyle(['hope'])).toEqual({font:0, flowers:0, from:''});
    expect(getLetterStyle(['letterstyle:invalid'])).toEqual({font:0, flowers:0, from:''});
  });
});
