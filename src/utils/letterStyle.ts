export const LETTER_FONTS = [
  { name: 'Cedarville Cursive', family: "'Cedarville Cursive', cursive" },
  { name: 'Homemade Apple', family: "'Homemade Apple', cursive" },
  { name: 'Reenie Beanie', family: "'Reenie Beanie', cursive" },
  { name: 'Nothing You Could Do', family: "'Nothing You Could Do', cursive" },
];
const PREFIX = 'letterstyle:';
export interface LetterStyle { font: number; flowers: number; from: string }
export const getLetterStyle = (tags?: string[] | null): LetterStyle => {
  const raw = tags?.find(t => t.startsWith(PREFIX));
  try {
    const value = JSON.parse(decodeURIComponent(raw?.slice(PREFIX.length) || ''));
    return { font: Number.isInteger(value.font) && value.font >= 0 && value.font < 4 ? value.font : 0,
      flowers: Number.isInteger(value.flowers) && value.flowers >= -1 && value.flowers < 4 ? value.flowers : 0,
      from: typeof value.from === 'string' ? value.from.slice(0, 80) : '' };
  } catch { return { font: 0, flowers: 0, from: '' }; }
};
export const withLetterStyle = (tags: string[], style: LetterStyle): string[] =>
  [...tags.filter(t => !t.startsWith(PREFIX)), PREFIX + encodeURIComponent(JSON.stringify(style))];
