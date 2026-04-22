const BASE_CSS = `:root {
  --bg: #ffffff;
  --surface: #fafafa;
  --border: #e5e5e5;
  --border-strong: #d4d4d4;
  --text: #1a1a1a;
  --text-muted: #6b6b6b;
  --text-subtle: #9a9a9a;
  --accent: oklch(55% 0.13 250);
  --accent-soft: oklch(92% 0.03 250);
}
* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif;
  font-size: 15px; line-height: 1.55;
  color: var(--text); background: var(--bg);
  -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
}
.page { max-width: 860px; margin: 0 auto; padding: 72px 48px 48px; }
header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 28px; margin-bottom: 40px;
}
h1 {
  font-size: 28px; font-weight: 500;
  letter-spacing: -0.02em; margin: 0 0 6px;
}
.eyebrow {
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-subtle); margin-bottom: 14px;
}
.subtitle {
  font-size: 14px; color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
h2 {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text-subtle); margin: 36px 0 14px;
}
h3 {
  font-size: 17px; font-weight: 500;
  margin: 28px 0 8px; letter-spacing: -0.01em;
}
p { margin: 12px 0; color: var(--text); }
em { color: var(--text-muted); font-style: normal; display: block; margin-top: 2px; font-size: 13px; }
strong { font-weight: 600; color: var(--text); }
ul, ol { padding-left: 20px; margin: 8px 0; }
li { margin: 6px 0; }
code {
  font-family: 'SF Mono', ui-monospace, Menlo, monospace;
  font-size: 0.88em;
  background: var(--surface);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--border);
}
a { color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--accent-soft); }
a:hover { border-bottom-color: var(--accent); }
blockquote {
  margin: 16px 0;
  padding: 12px 16px;
  border-left: 2px solid var(--border-strong);
  color: var(--text-muted);
  background: var(--surface);
  font-size: 14px;
}
hr { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
table {
  width: 100%; border-collapse: collapse;
  margin: 16px 0;
  font-variant-numeric: tabular-nums;
}
table th, table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  text-align: left; vertical-align: top;
}
table th {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--text-subtle);
}
footer {
  margin-top: 72px; padding-top: 24px;
  border-top: 1px solid var(--border);
  font-size: 11px; letter-spacing: 0.04em;
  color: var(--text-subtle);
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
}
footer a { color: var(--text-subtle); border-bottom: none; }
footer a:hover { color: var(--text); }
@media print {
  html, body { background: #fff; color: #1a1a1a; font-size: 11pt;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { padding: 0; max-width: none; }
  section, h2, h3 { page-break-inside: avoid; }
  header { page-break-after: avoid; }
  h1 { font-size: 22pt; }
  @page {
    margin: 24mm 20mm;
    @bottom-center { content: "Powered by Vibra · getvibra.co"; font-size: 9pt; color: #9a9a9a; }
  }
}
@media (max-width: 720px) {
  .page { padding: 32px 20px; }
  h1 { font-size: 24px; }
}`;

export function renderRamsShell({ title, eyebrow, community, subtitle, bodyHtml, extraCss = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
<style>
${BASE_CSS}
${extraCss}
</style>
</head>
<body>
<div class="page">
<header>
  <div class="eyebrow">${escape(eyebrow)}</div>
  <h1>${escape(community)}</h1>
  <div class="subtitle">${escape(subtitle)}</div>
</header>

${bodyHtml}

<footer>
  <span>${escape(community)}</span>
  <span>Powered by <a href="https://getvibra.co">Vibra</a> · the new community manager hire for professional communities</span>
</footer>
</div>
</body>
</html>`;
}

export function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  let inList = null;
  let inBq = false;

  const closeList = () => { if (inList) { out.push(`</${inList}>`); inList = null; } };
  const closeBq = () => { if (inBq) { out.push('</blockquote>'); inBq = false; } };

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { closeList(); closeBq(); i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) { closeList(); closeBq(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue; }

    if (/^---+$/.test(line.trim())) { closeList(); closeBq(); out.push('<hr>'); i++; continue; }

    if (line.startsWith('> ')) {
      closeList();
      if (!inBq) { out.push('<blockquote>'); inBq = true; }
      out.push(inline(line.slice(2)));
      i++; continue;
    }
    closeBq();

    const b = line.match(/^[-*]\s+(.+)$/);
    if (b) {
      if (inList !== 'ul') { closeList(); out.push('<ul>'); inList = 'ul'; }
      out.push(`<li>${inline(b[1])}</li>`);
      i++; continue;
    }
    const n = line.match(/^\d+\.\s+(.+)$/);
    if (n) {
      if (inList !== 'ol') { closeList(); out.push('<ol>'); inList = 'ol'; }
      out.push(`<li>${inline(n[1])}</li>`);
      i++; continue;
    }
    closeList();

    if (line.startsWith('|') && lines[i + 1] && /^\|[-:|\s]+\|/.test(lines[i + 1])) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      out.push('<table><thead><tr>' + cells.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>');
      i += 2;
      while (i < lines.length && lines[i].startsWith('|')) {
        const row = lines[i].split('|').slice(1, -1).map(c => c.trim());
        out.push('<tr>' + row.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>');
        i++;
      }
      out.push('</tbody></table>');
      continue;
    }

    out.push(`<p>${inline(line)}</p>`);
    i++;
  }
  closeList(); closeBq();
  return out.join('\n');
}

function inline(s) {
  return escape(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function escape(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
