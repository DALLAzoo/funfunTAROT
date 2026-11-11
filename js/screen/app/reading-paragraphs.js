// AD2 2026-11-11: group the existing tarot advice into readable paragraphs.
// Only whitespace between existing sentences changes; the advice itself remains unchanged.
// Each number marks the sentence after which a paragraph ends.
const PARAGRAPH_BREAKS = Object.freeze({
  'major-00': [2, 4],
  'major-01': [3, 5],
  'major-02': [2, 4],
  'major-03': [2, 4],
  'major-04': [2, 4],
  'major-05': [2, 5],
  'major-06': [3, 5],
  'major-07': [2, 4],
  'major-08': [2, 4],
  'major-09': [2, 4],
  'major-10': [3, 5],
  'major-11': [2, 4],
  'major-12': [2, 4],
  'major-13': [2, 4, 6],
  'major-14': [2, 4],
  'major-15': [3, 5],
  'major-16': [3, 4],
  'major-17': [3, 6],
  'major-18': [3, 5, 8],
  'major-19': [3, 6],
  'major-20': [2, 4, 7],
  'major-21': [4, 6],
  // The four Pages and four Knights were missing from the first pass.
  'cups-page': [2, 4],
  'wands-page': [2, 5],
  'swords-page': [2, 4],
  'pentacles-page': [2, 4],
  'cups-knight': [3, 6],
  'wands-knight': [3, 6],
  'swords-knight': [2, 5],
  'pentacles-knight': [2, 5],
});

// Source data mixes single-line advice with short editorial line breaks. Those
// line breaks are not paragraph boundaries: let the browser wrap by width.
function splitSentences(text) {
  const result = [];
  let start = 0;
  for (const match of text.matchAll(/[.!?]+(?=\s|$)/g)) {
    const end = match.index + match[0].length;
    const sentence = text.slice(start, end).trim();
    if (sentence) result.push(sentence);
    start = end;
  }
  const tail = text.slice(start).trim();
  if (tail) result.push(tail);
  return result;
}

export function renderReadingParagraphs(container, originalText, cardId) {
  const text = String(originalText || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    container.replaceChildren();
    return;
  }

  const breaks = PARAGRAPH_BREAKS[cardId];
  const sentences = breaks ? splitSentences(text) : [];
  const chunks = [];
  if (breaks && sentences.length > breaks[breaks.length - 1]) {
    let from = 0;
    for (const after of [...breaks, sentences.length]) {
      chunks.push(sentences.slice(from, after).join(' '));
      from = after;
    }
  } else {
    chunks.push(text);
  }

  // Keep #resultReading as the existing scroll container; only add visual
  // paragraph children. This preserves the scroll cue and all result layouts.
  const nodes = [];
  chunks.forEach((chunk, i) => {
    // Preserve a text separator for textContent, copying and screen readers.
    if (i) nodes.push(document.createTextNode(' '));
    const span = document.createElement('span');
    span.className = 'ad2-reading-paragraph';
    span.textContent = chunk;
    nodes.push(span);
  });
  container.replaceChildren(...nodes);
}
