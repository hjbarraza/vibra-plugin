const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function renderPulseHtml(p, { community }) {
  const { sinceIso, untilIso, totalMessages, distinctMembers, messagesByDay, messagesByHourOfWeek, contributors, gini, responseRate, threadStats, roster } = p;
  const date = iso => iso.slice(0, 10);
  const fmtPct = n => n == null ? '—' : `${Math.round(n * 100)}%`;
  const giniLabel = gini < 0.3 ? 'Healthy distribution' : gini < 0.5 ? 'Moderately concentrated' : gini < 0.7 ? 'Highly concentrated' : 'Very concentrated';

  const dayMax = Math.max(1, ...messagesByDay.map(d => d.count));
  const activitySvg = renderActivity(messagesByDay, dayMax);
  const heatmapSvg = renderHeatmap(messagesByHourOfWeek);
  const topRows = contributors.slice(0, 10).map((c, i) => {
    const pct = (c.count / contributors[0].count) * 100;
    return `<tr>
      <td class="rank">${i + 1}</td>
      <td class="name">${escape(c.name)}</td>
      <td class="count">${c.count}</td>
      <td class="bar-cell"><div class="bar" style="width:${pct}%"></div></td>
    </tr>`;
  }).join('');

  const rosterActivePct = roster.rosterSize > 0 ? Math.round((roster.activeInWindow / roster.rosterSize) * 100) : 0;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(community)} — Community Pulse</title>
<style>
:root {
  --bg: #ffffff;
  --surface: #fafafa;
  --border: #e5e5e5;
  --border-strong: #d4d4d4;
  --text: #1a1a1a;
  --text-muted: #6b6b6b;
  --text-subtle: #9a9a9a;
  --accent: oklch(55% 0.13 250);
  --accent-soft: oklch(92% 0.03 250);
  --warn: oklch(60% 0.15 35);
  --success: oklch(55% 0.14 145);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.55;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.page {
  max-width: 980px;
  margin: 0 auto;
  padding: 72px 48px 48px;
}

header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 28px;
  margin-bottom: 40px;
}

h1 {
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  color: var(--text);
}

.eyebrow {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-subtle);
  margin-bottom: 14px;
}

.period {
  font-size: 14px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

h2 {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-subtle);
  margin: 0 0 14px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 56px;
}

.metric {
  border-top: 1px solid var(--border-strong);
  padding-top: 18px;
}

.metric .value {
  font-size: 34px;
  font-weight: 400;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text);
  line-height: 1.1;
}

.metric .label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.metric .sub {
  font-size: 12px;
  color: var(--text-subtle);
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

section {
  margin-bottom: 48px;
  break-inside: avoid;
}

.chart {
  margin-top: 8px;
}

.chart svg {
  display: block;
  width: 100%;
  height: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

table td {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

table tr:last-child td { border-bottom: none; }

td.rank {
  width: 28px;
  color: var(--text-subtle);
  font-size: 12px;
}

td.name {
  font-weight: 400;
  color: var(--text);
}

td.count {
  text-align: right;
  width: 60px;
  color: var(--text-muted);
  font-size: 13px;
}

td.bar-cell {
  padding-left: 20px;
  width: 40%;
}

.bar {
  height: 4px;
  background: var(--accent);
  border-radius: 0;
}

.thread-note {
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

footer {
  margin-top: 72px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text-subtle);
  display: flex;
  justify-content: space-between;
}

footer a {
  color: var(--text-subtle);
  text-decoration: none;
}

footer a:hover { color: var(--text); }

@media print {
  html, body {
    background: #ffffff;
    color: #1a1a1a;
    font-size: 11pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { padding: 0; max-width: none; }
  section { page-break-inside: avoid; }
  header { page-break-after: avoid; }
  h1 { font-size: 22pt; }
  .metric .value { font-size: 22pt; }
  footer { position: running(footer); }
  @page {
    margin: 24mm 20mm;
    @bottom-center { content: "Powered by getvibra"; font-size: 9pt; color: #9a9a9a; }
  }
}

@media (max-width: 720px) {
  .page { padding: 32px 20px; }
  .metrics { grid-template-columns: repeat(2, 1fr); gap: 20px; }
  h1 { font-size: 24px; }
  .metric .value { font-size: 28px; }
  td.bar-cell { display: none; }
}
</style>
</head>
<body>
<div class="page">
<header>
  <div class="eyebrow">Community Pulse</div>
  <h1>${escape(community)}</h1>
  <div class="period">${date(sinceIso)} — ${date(untilIso)}</div>
</header>

<div class="metrics">
  <div class="metric">
    <div class="value">${totalMessages.toLocaleString()}</div>
    <div class="label">Messages</div>
    <div class="sub">${threadStats.count} threads</div>
  </div>
  <div class="metric">
    <div class="value">${roster.activeInWindow}<span style="color:var(--text-subtle);font-size:.6em;">/${roster.rosterSize}</span></div>
    <div class="label">Active of roster</div>
    <div class="sub">${rosterActivePct}% posted · ${roster.neverPosted} never posted</div>
  </div>
  <div class="metric">
    <div class="value">${fmtPct(responseRate.rate)}</div>
    <div class="label">Response rate</div>
    <div class="sub">${responseRate.answered} of ${responseRate.questions} &lt;30 min</div>
  </div>
  <div class="metric">
    <div class="value">${gini.toFixed(2)}</div>
    <div class="label">Concentration (Gini)</div>
    <div class="sub">${giniLabel}</div>
  </div>
</div>

<section>
  <h2>Activity by day</h2>
  <div class="chart">${activitySvg}</div>
</section>

<section>
  <h2>Activity heatmap · day × hour</h2>
  <div class="chart">${heatmapSvg}</div>
</section>

<section>
  <h2>Top contributors</h2>
  <table><tbody>${topRows}</tbody></table>
</section>

<section>
  <h2>Thread health</h2>
  <div class="thread-note">${threadStats.count} threads · average ${threadStats.avgLength} messages and ${threadStats.avgParticipants} participants per thread</div>
</section>

<footer>
  <span>${escape(community)} · ${date(sinceIso)} — ${date(untilIso)}</span>
  <span>Powered by <a href="https://github.com/hjbarraza/vibra-plugin">getvibra</a></span>
</footer>
</div>
</body>
</html>`;
}

function renderActivity(days, max) {
  const W = 1000, H = 180, PAD_L = 32, PAD_R = 8, PAD_T = 12, PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const bw = innerW / Math.max(1, days.length);

  const yTicks = 4;
  let gridLines = '';
  for (let i = 0; i <= yTicks; i++) {
    const y = PAD_T + (innerH * i) / yTicks;
    const v = Math.round((max * (yTicks - i)) / yTicks);
    gridLines += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e5e5e5" stroke-width="1"/>`;
    gridLines += `<text x="${PAD_L - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#9a9a9a">${v}</text>`;
  }

  const bars = days.map((d, i) => {
    const h = (d.count / max) * innerH;
    const x = PAD_L + i * bw + 1;
    const y = PAD_T + innerH - h;
    return `<rect x="${x}" y="${y}" width="${Math.max(1, bw - 2)}" height="${h}" fill="oklch(55% 0.13 250)"/>`;
  }).join('');

  const labelEvery = Math.max(1, Math.ceil(days.length / 7));
  const labels = days.map((d, i) => {
    if (i % labelEvery !== 0) return '';
    return `<text x="${PAD_L + i * bw + bw / 2}" y="${H - 8}" fill="#9a9a9a" font-size="10" text-anchor="middle">${d.date.slice(5)}</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${gridLines}${bars}${labels}</svg>`;
}

function renderHeatmap(grid) {
  const W = 1000, H = 220, PAD_L = 40, PAD_T = 24, PAD_R = 8, PAD_B = 6;
  const cellW = (W - PAD_L - PAD_R) / 24;
  const cellH = (H - PAD_T - PAD_B) / 7;
  const max = Math.max(1, ...grid.flat());
  let cells = '';
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = grid[d][h];
      const intensity = v === 0 ? 0 : 0.12 + (v / max) * 0.88;
      const fill = v === 0 ? '#f0f0f0' : `oklch(55% 0.13 250 / ${intensity})`;
      cells += `<rect x="${PAD_L + h * cellW + 1}" y="${PAD_T + d * cellH + 1}" width="${cellW - 2}" height="${cellH - 2}" fill="${fill}"><title>${DAYS[d]} ${h}:00 — ${v} messages</title></rect>`;
    }
  }
  let labels = '';
  for (let d = 0; d < 7; d++) labels += `<text x="${PAD_L - 8}" y="${PAD_T + d * cellH + cellH / 2 + 4}" text-anchor="end" font-size="11" fill="#6b6b6b">${DAYS[d]}</text>`;
  for (let h = 0; h < 24; h += 3) labels += `<text x="${PAD_L + h * cellW}" y="${PAD_T - 8}" font-size="10" fill="#9a9a9a">${h.toString().padStart(2, '0')}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${cells}${labels}</svg>`;
}

function escape(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
