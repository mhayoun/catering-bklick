'use client';

import { parseKeywords } from '../lib/search';

// Renders `text` as plain text, except every case-insensitive occurrence of any term in `query`
// (comma/space separated) is wrapped in a yellow <mark> - used to show a visitor exactly where
// their search terms matched on the caterer profile page they clicked through to from search results.
export function Highlight({ text, query }) {
  const terms = parseKeywords(query);
  if (terms.length === 0 || !text) return text || null;

  const str = String(text);
  const lower = str.toLowerCase();

  // Collect every match range (start index, end index) for every term, then merge overlapping
  // or adjacent ranges so a spot matched by two different terms isn't double-wrapped in nested marks.
  const ranges = [];
  for (const term of terms) {
    const t = term.toLowerCase();
    if (!t) continue;
    let idx = lower.indexOf(t);
    while (idx !== -1) {
      ranges.push([idx, idx + t.length]);
      idx = lower.indexOf(t, idx + t.length);
    }
  }
  if (ranges.length === 0) return text;

  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [ranges[0]];
  for (const [start, end] of ranges.slice(1)) {
    const last = merged[merged.length - 1];
    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const parts = [];
  let cursor = 0;
  merged.forEach(([start, end], i) => {
    if (start > cursor) parts.push(str.slice(cursor, start));
    parts.push(
      <mark key={i} className="bg-yellow-300 text-ink rounded-sm px-0.5">
        {str.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < str.length) parts.push(str.slice(cursor));

  return parts;
}
