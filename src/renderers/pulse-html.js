const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function renderPulseHtml(p, { community }) {
  const { sinceIso, untilIso, totalMessages, distinctMembers, messagesByDay, messagesByHourOfWeek, contributors, gini, responseRate, threadStats, roster } = p;
  const date = iso => iso.slice(0, 10);
  const fmtPct = n => n == null ? '—' : `${Math.round(n * 100)}%`;
  const giniLabel = gini < 0.3 ? 'healthy distribution' : gini < 0.5 ? 'moderately concentrated' : gini < 0.7 ? 'highly concentrated' : 'very concentrated';

  const dayMax = Math.max(1, ...messagesByDay.map(d => d.count));
  const activitySvg = renderActivity(messagesByDay, dayMax);
  const heatmapSvg = renderHeatmap(messagesByHourOfWeek);
  const topRows = contributors.slice(0, 10)
    .map(c => `<tr><td>${escape(c.name)}</td><td class="r">${c.count}</td><td class="bar"><div style="width:${(c.count / contributors[0].count) * 100}%"></div></td></tr>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(community)} — pulse</title>
<style>
body{font:14px/1.5 system-ui,sans-serif;margin:0;background:#0f0f1a;color:#e8e8f0}
.wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
h1{margin:0 0 4px;font-size:22px}.muted{color:#888}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
.card{background:#1a1a2a;border:1px solid #2a2a3e;border-radius:8px;padding:18px}
.card h2{margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px}
.stat{font-size:28px;font-weight:600}
.sub{color:#888;font-size:12px;margin-top:4px}
.section{background:#1a1a2a;border:1px solid #2a2a3e;border-radius:8px;padding:20px;margin:16px 0}
.section h2{margin:0 0 14px;font-size:14px;color:#aaa;text-transform:uppercase;letter-spacing:.5px}
table{width:100%;border-collapse:collapse}
td{padding:6px 8px;border-bottom:1px solid #2a2a3e}
td.r{text-align:right;color:#aaa}
td.bar{width:40%}
td.bar>div{height:8px;background:linear-gradient(90deg,#5b8def,#9b6bff);border-radius:4px}
svg{display:block}
</style></head><body><div class="wrap">
<h1>${escape(community)} — pulse</h1>
<div class="muted">${date(sinceIso)} → ${date(untilIso)}</div>

<div class="grid">
<div class="card"><h2>Messages</h2><div class="stat">${totalMessages.toLocaleString()}</div></div>
<div class="card"><h2>Roster vs active</h2><div class="stat">${roster.activeInWindow} / ${roster.rosterSize}</div><div class="sub">${roster.silentInWindow} silent this window · ${roster.neverPosted} never posted${roster.rosterIsLowerBound ? ' · lower bound' : ''}</div></div>
<div class="card"><h2>Response rate</h2><div class="stat">${fmtPct(responseRate.rate)}</div><div class="sub">${responseRate.answered}/${responseRate.questions} questions answered &lt;30 min</div></div>
<div class="card"><h2>Concentration</h2><div class="stat">${gini.toFixed(2)}</div><div class="sub">Gini — ${giniLabel}</div></div>
</div>

<div class="section"><h2>Activity by day</h2>${activitySvg}</div>
<div class="section"><h2>Heatmap (day × hour)</h2>${heatmapSvg}</div>
<div class="section"><h2>Top contributors</h2><table><tbody>${topRows}</tbody></table></div>
<div class="section"><h2>Thread health</h2>
<div class="sub">${threadStats.count} threads, average ${threadStats.avgLength} messages and ${threadStats.avgParticipants} participants per thread</div>
</div>
</div></body></html>`;
}

function renderActivity(days, max) {
  const W = 1000, H = 120, PAD = 24;
  const bw = (W - PAD * 2) / Math.max(1, days.length);
  const bars = days.map((d, i) => {
    const h = (d.count / max) * (H - PAD * 2);
    const x = PAD + i * bw + 1;
    const y = H - PAD - h;
    return `<rect x="${x}" y="${y}" width="${bw - 2}" height="${h}" fill="#5b8def" rx="2"/>`;
  }).join('');
  const labels = days.filter((_, i) => i % Math.ceil(days.length / 7) === 0)
    .map(d => `<text x="${PAD + days.indexOf(d) * bw + bw / 2}" y="${H - 6}" fill="#888" font-size="10" text-anchor="middle">${d.date.slice(5)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${bars}${labels}</svg>`;
}

function renderHeatmap(grid) {
  const W = 1000, H = 220, PAD_L = 36, PAD_T = 20, PAD_B = 4;
  const cellW = (W - PAD_L - 4) / 24;
  const cellH = (H - PAD_T - PAD_B) / 7;
  const max = Math.max(1, ...grid.flat());
  let cells = '';
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = grid[d][h];
      const a = v === 0 ? 0.04 : 0.15 + (v / max) * 0.85;
      cells += `<rect x="${PAD_L + h * cellW}" y="${PAD_T + d * cellH}" width="${cellW - 1}" height="${cellH - 1}" fill="rgb(91,141,239)" opacity="${a.toFixed(2)}"><title>${DAYS[d]} ${h}:00 — ${v} msgs</title></rect>`;
    }
  }
  let labels = '';
  for (let d = 0; d < 7; d++) labels += `<text x="${PAD_L - 6}" y="${PAD_T + d * cellH + cellH / 2 + 4}" text-anchor="end" font-size="10" fill="#888">${DAYS[d]}</text>`;
  for (let h = 0; h < 24; h += 3) labels += `<text x="${PAD_L + h * cellW}" y="${PAD_T - 6}" font-size="10" fill="#888">${h}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${cells}${labels}</svg>`;
}

function escape(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
