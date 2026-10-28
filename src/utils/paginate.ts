/**
 * Split a letter into book pages. Paragraphs stay together when they fit;
 * longer ones break at sentence boundaries, then word boundaries. Closing
 * quotes/brackets stay attached to the sentence they end, and no character of
 * the source is ever dropped (see paginate.test.ts).
 */
export const PAGE_TARGET = 620;

const SENTENCE = /[^.!?]+[.!?]*["'\u201d\u2019)\]]*(?:\s+|$)|[.!?]+["'\u201d\u2019)\]]*(?:\s+|$)/g;

const toSentences = (para: string): string[] => {
  const parts = para.match(SENTENCE) ?? [];
  // Safety net: if the regex ever skips text, fall back to the whole paragraph.
  return parts.join('') === para ? parts : [para];
};

export const paginate = (content: string, target = PAGE_TARGET): string[] => {
  const paras = content.split(/\r?\n\r?\n/).filter((p) => p.trim().length > 0);
  const pages: string[] = [];
  let current = '';
  for (const para of paras) {
    if (current && (current + '\n\n' + para).length > target) {
      pages.push(current.trim());
      current = '';
    } else if (current) {
      current += '\n\n';
    }
    for (const sentence of toSentences(para)) {
      if (current && (current + sentence).length > target) {
        pages.push(current.trim());
        current = '';
      }
      let rest = sentence;
      while ((current + rest).length > target) {
        let cut = rest.lastIndexOf(' ', target - current.length);
        if (cut < 80) cut = target - current.length;
        pages.push((current + rest.slice(0, cut)).trim());
        current = '';
        rest = rest.slice(cut);
      }
      current += rest;
    }
  }
  if (current.trim()) pages.push(current.trim());
  return pages.length > 0 ? pages : [''];
};
