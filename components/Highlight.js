'use client';

// Renders `text` as plain text, except every case-insensitive occurrence of `query` is wrapped
// in a yellow <mark> - used to show a visitor exactly where their search term matched on the
// caterer profile page they clicked through to from search results.
export function Highlight({ text, query }) {
  const q = query?.trim();
  if (!q || !text) return text || null;

  const lower = String(text).toLowerCase();
  const qLower = q.toLowerCase();
  const parts = [];
  let last = 0;
  let idx = lower.indexOf(qLower);

  if (idx === -1) return text;

  while (idx !== -1) {
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push(
      <mark key={idx} className="bg-yellow-300 text-ink rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    last = idx + q.length;
    idx = lower.indexOf(qLower, last);
  }
  if (last < text.length) parts.push(text.slice(last));

  return parts;
}
