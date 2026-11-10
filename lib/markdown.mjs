/** The section of a Markdown text under `## <title>`, up to the next one. */
export function section(text, title) {
  const lines = text.split('\n');
  const start = lines.findIndex(line => line.startsWith('## ') && line.includes(title));
  if (start < 0) {
    return '';
  }
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines.slice(start, end < 0 ? undefined : end).join('\n').trim();
}
