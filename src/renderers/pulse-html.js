const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function renderPulseHtml(p, { community }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(community)} — Community Dashboard</title>
<style>${CSS}</style>
</head>
<body data-active-tab="cm">
<div class="page">
${renderHeader(p, community)}
${renderTabs()}
<main>
  <section class="tab" id="tab-cm">
    ${renderCmTab(p)}
  </section>
  <section class="tab" id="tab-business">
    ${renderBusinessTab(p)}
  </section>
</main>
${renderFooter(community, p)}
</div>
<script>${TAB_JS}</script>
</body>
</html>`;
}

function renderHeader(p, community) {
  const date = iso => iso.slice(0, 10);
  return `<header>
  <div class="eyebrow">Community Dashboard</div>
  <h1>${esc(community)}</h1>
  <div class="subtitle">${date(p.sinceIso)} — ${date(p.untilIso)} · ${p.windowDays} days</div>
</header>`;
}

function renderTabs() {
  return `<nav class="tabs">
  <button type="button" class="tab-btn active" data-tab="cm">For the Community Manager</button>
  <button type="button" class="tab-btn" data-tab="business">For the Business</button>
  <button type="button" class="print-btn" onclick="window.print()" title="Print the currently active tab to PDF">Print / PDF</button>
</nav>`;
}

function renderCmTab(p) {
  return `
<div class="cm-grid">
  ${renderActionQueue(p)}
  ${renderOpenQuestions(p)}
  ${renderTopThreads(p)}
  ${renderContentCards(p)}
  ${renderQuietAndNew(p)}
</div>
`;
}

function renderActionQueue(p) {
  const a = p.actions;
  const rows = [];
  for (const m of (a.frustrationCandidates ?? []).slice(0, 3)) {
    rows.push({ kind: '🚨 Frustration', who: m.sender, when: m.sentAt?.slice(0, 10) ?? '', detail: (m.text ?? '').slice(0, 140) });
  }
  for (const m of (a.longSilentMembers ?? []).slice(0, 5)) {
    rows.push({ kind: '👻 Long-silent', who: m.sender, when: `${m.silentDays}d silent`, detail: 'On roster, never posted' });
  }
  for (const m of (a.welcomeGaps ?? []).slice(0, 3)) {
    rows.push({ kind: '🎯 Welcome gap', who: m.sender, when: m.joinedAt?.slice(0, 10) ?? '', detail: (m.firstMessage ?? '').slice(0, 140) });
  }
  for (const m of (a.silentJoiners ?? []).slice(0, 3)) {
    rows.push({ kind: '👋 Silent joiner', who: m.sender, when: m.joinedAt?.slice(0, 10) ?? '', detail: 'Joined but never posted' });
  }
  for (const m of (a.shoutoutCandidates ?? []).slice(0, 3)) {
    rows.push({ kind: '🙌 Shoutout', who: m.sender, when: `${m.helpCount} replies`, detail: m.sample ? (m.sample.reply ?? '').slice(0, 140) : '' });
  }

  const body = rows.length
    ? `<table class="action-table"><tbody>${rows.map(r => `
      <tr>
        <td class="kind">${esc(r.kind)}</td>
        <td class="who"><strong>${esc(r.who)}</strong></td>
        <td class="when">${esc(r.when)}</td>
        <td class="detail">${esc(r.detail)}</td>
      </tr>`).join('')}</tbody></table>`
    : `<p class="muted">Nothing to chase this week. Community's in a healthy rhythm.</p>`;

  return `<div class="card wide">
  <h2>Action queue</h2>
  <p class="card-hint">What to do Monday — frustrations, ghosts, welcome gaps, silent joiners, shoutout candidates.</p>
  ${body}
</div>`;
}

function renderOpenQuestions(p) {
  const bundles = p.openQuestionBundles ?? [];
  const questions = bundles.flatMap(b => b.questions);
  if (questions.length === 0) {
    return `<div class="card"><h2>Open questions</h2><p class="muted">All questions addressed.</p></div>`;
  }
  const rows = questions.slice(0, 10).map(q => `
    <li>
      <strong>${esc(q.sender)}</strong>
      <span class="when">${esc((q.sentAt ?? '').slice(0, 10))}</span>
      <div class="q-text">${esc((q.text ?? '').slice(0, 240))}</div>
    </li>`).join('');
  return `<div class="card wide">
  <h2>Open questions</h2>
  <p class="card-hint">Candidate asks that may need your follow-up. Full LLM-judged answered-ness via <code>/vibra:unanswered</code>.</p>
  <ol class="open-q">${rows}</ol>
</div>`;
}

function renderTopThreads(p) {
  const threads = p.topThreads ?? [];
  if (threads.length === 0) return `<div class="card"><h2>Top threads</h2><p class="muted">No significant threads this window.</p></div>`;
  const rows = threads.slice(0, 5).map((t, i) => {
    const who = (t.participants ?? []).slice(0, 3).join(', ') + ((t.participants?.length ?? 0) > 3 ? ' et al.' : '');
    const snippet = t.messages?.[0]?.text?.slice(0, 140) ?? '';
    return `
    <li>
      <div class="thread-head"><span class="rank">${i + 1}</span><strong>${esc(who)}</strong> <span class="when">${t.messageCount} msgs · ${t.participants?.length ?? 0} participants</span></div>
      <div class="thread-snippet">${esc(snippet)}</div>
    </li>`;
  }).join('');
  return `<div class="card wide">
  <h2>Top threads</h2>
  <p class="card-hint">Highest-engagement threads this window. Full summaries via <code>/vibra:digest</code>.</p>
  <ol class="threads">${rows}</ol>
</div>`;
}

function renderContentCards(p) {
  const links = p.content?.links ?? [];
  const quotes = p.content?.quotableCandidates ?? [];
  const linkRows = links.slice(0, 5).map(l => {
    let host = l.url;
    try { host = new URL(l.url).hostname.replace(/^www\./, ''); } catch {}
    return `<li><a href="${esc(l.url)}">${esc(host)}</a> <span class="when">${l.engagement ?? 0} replies</span><div class="muted">shared by ${esc(l.sharedBy)}</div></li>`;
  }).join('');
  const quoteRows = quotes.slice(0, 3).map(q => `
    <li><strong>${esc(q.sender)}</strong>: <span class="quote">"${esc((q.text ?? '').slice(0, 220))}"</span></li>
  `).join('');
  return `<div class="card">
  <h2>Content to amplify</h2>
  <p class="card-hint">Fuel for the next newsletter or social post.</p>
  <h3>Best links</h3>
  ${linkRows ? `<ol class="links">${linkRows}</ol>` : '<p class="muted">No shared links this window.</p>'}
  <h3>Quotable moments</h3>
  ${quoteRows ? `<ul>${quoteRows}</ul>` : '<p class="muted">No standout quotes identified by the heuristic.</p>'}
</div>`;
}

function renderQuietAndNew(p) {
  const quiet = p.quietMembers ?? [];
  const newM = p.newMembers ?? [];
  return `<div class="card">
  <h2>Membership flow</h2>
  <div class="two-col">
    <div>
      <h3>New members</h3>
      ${newM.length ? `<ul>${newM.map(m => `<li>${esc(m.canonical_name)} <span class="when">${esc((m.first_seen_at ?? '').slice(0, 10))}</span></li>`).join('')}</ul>` : '<p class="muted">None joined this window.</p>'}
    </div>
    <div>
      <h3>Went quiet</h3>
      ${quiet.length ? `<ul>${quiet.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '<p class="muted">No members dropped off.</p>'}
    </div>
  </div>
</div>`;
}

function renderBusinessTab(p) {
  return `
<div class="business-grid">
  ${renderVitals(p)}
  ${renderGrowth(p)}
  ${renderActivityCharts(p)}
  ${renderPersonas(p)}
  ${renderTopics(p)}
  ${renderJtbd(p)}
  ${renderRecommendations(p)}
</div>
`;
}

function renderVitals(p) {
  const fmtPct = n => n == null ? '—' : `${Math.round(n * 100)}%`;
  const rosterPct = p.roster.rosterSize > 0 ? Math.round((p.roster.activeInWindow / p.roster.rosterSize) * 100) : 0;
  const giniLabel = p.gini < 0.3 ? 'Healthy distribution' : p.gini < 0.5 ? 'Moderately concentrated' : p.gini < 0.7 ? 'Highly concentrated' : 'Very concentrated';
  return `<div class="card wide">
  <h2>Community vitals</h2>
  <div class="metrics">
    <div class="metric"><div class="value">${p.totalMessages.toLocaleString()}</div><div class="label">Messages</div><div class="sub">${p.threadStats.count} threads</div></div>
    <div class="metric"><div class="value">${p.roster.activeInWindow}<span class="dim">/${p.roster.rosterSize}</span></div><div class="label">Active of roster</div><div class="sub">${rosterPct}% posted · ${p.roster.neverPosted} never posted${p.roster.rosterIsLowerBound ? ' (lower bound)' : ''}</div></div>
    <div class="metric"><div class="value">${fmtPct(p.responseRate.rate)}</div><div class="label">Response rate</div><div class="sub">${p.responseRate.answered}/${p.responseRate.questions} &lt;30 min</div></div>
    <div class="metric"><div class="value">${p.gini.toFixed(2)}</div><div class="label">Gini</div><div class="sub">${giniLabel}</div></div>
  </div>
</div>`;
}

function renderGrowth(p) {
  const prev = p.growth?.previousPeriod;
  if (!prev) return '';
  const delta = (cur, pre) => pre === 0 ? '—' : `${cur > pre ? '+' : ''}${(((cur - pre) / pre) * 100).toFixed(0)}%`;
  return `<div class="card wide">
  <h2>Growth vs prior ${p.windowDays} days</h2>
  <table class="kv">
    <tr><th>Metric</th><th>Prior period</th><th>This period</th><th>Δ</th></tr>
    <tr><td>Messages</td><td>${prev.totalMessages}</td><td>${p.totalMessages}</td><td>${delta(p.totalMessages, prev.totalMessages)}</td></tr>
    <tr><td>Active members</td><td>${prev.distinctMembers}</td><td>${p.distinctMembers}</td><td>${delta(p.distinctMembers, prev.distinctMembers)}</td></tr>
    <tr><td>Roster (visible)</td><td>${prev.rosterSize}</td><td>${p.roster.rosterSize}</td><td>${delta(p.roster.rosterSize, prev.rosterSize)}</td></tr>
  </table>
</div>`;
}

function renderActivityCharts(p) {
  const dayMax = Math.max(1, ...p.messagesByDay.map(d => d.count));
  return `<div class="card wide">
  <h2>Activity over time</h2>
  <div class="chart">${renderActivitySvg(p.messagesByDay, dayMax)}</div>
  <h3>Day × hour heatmap</h3>
  <div class="chart">${renderHeatmapSvg(p.messagesByHourOfWeek)}</div>
  <h3>Top contributors</h3>
  ${renderContributorsTable(p.contributors)}
</div>`;
}

function renderContributorsTable(contributors) {
  if (!contributors.length) return '<p class="muted">No contributors.</p>';
  const max = contributors[0].count;
  const rows = contributors.slice(0, 10).map((c, i) => {
    const pct = (c.count / max) * 100;
    return `<tr><td class="rank">${i + 1}</td><td>${esc(c.name)}</td><td class="count">${c.count}</td><td class="bar-cell"><div class="bar" style="width:${pct}%"></div></td></tr>`;
  }).join('');
  return `<table class="contributors"><tbody>${rows}</tbody></table>`;
}

function renderPersonas(p) {
  const c = p.personas?.clusters ?? {};
  const clusterOrder = ['helper', 'asker', 'connector', 'content-sharer', 'regular', 'newcomer', 'observer'];
  const rows = clusterOrder.map(key => {
    const members = c[key] ?? [];
    if (!members.length && key !== 'lurker_count') return '';
    return `<tr>
      <td class="persona-label">${esc(labelFor(key))}</td>
      <td class="persona-count">${members.length}</td>
      <td class="persona-top">${members.slice(0, 5).map(m => esc(m.name)).join(', ')}</td>
    </tr>`;
  }).filter(Boolean).join('');
  const lurkerRow = c.lurker_count > 0
    ? `<tr><td class="persona-label">Lurkers (no posts)</td><td class="persona-count">${c.lurker_count}</td><td class="persona-top muted">On roster, never contributed</td></tr>`
    : '';

  return `<div class="card wide">
  <h2>Member personas</h2>
  <p class="card-hint">Heuristic clustering by behavior. Quantitative — descriptive labels and narrative below are agent-synthesized.</p>
  <table class="personas"><thead><tr><th>Persona</th><th>Count</th><th>Top members</th></tr></thead><tbody>${rows}${lurkerRow}</tbody></table>
  <div class="agent-fill" data-fill="persona-narrative">
    <h3>Persona narrative</h3>
    <p class="muted">This section fills in when rendered via Claude Code — the agent reads the clustering above and writes a short narrative per cluster (who they are, what they need, how they engage). If this text is still here, run <code>/vibra:pulse &lt;path&gt;</code> inside Claude Code.</p>
  </div>
</div>`;
}

function renderTopics(p) {
  const tokens = p.topics?.topTokens ?? [];
  const body = tokens.length
    ? `<ul class="topic-list">${tokens.slice(0, 12).map(t => `<li><strong>${esc(t.token)}</strong> <span class="when">${t.count} messages · ${t.distinctMembers} members</span></li>`).join('')}</ul>`
    : '<p class="muted">Not enough signal to surface topics.</p>';
  return `<div class="card wide">
  <h2>Topic signal</h2>
  <p class="card-hint">Keyword-frequency tokens that appear across multiple members. Semantic clustering + labels come from the agent.</p>
  ${body}
  <div class="agent-fill" data-fill="topic-themes">
    <h3>Topic themes</h3>
    <p class="muted">Agent-synthesized theme labels and what they reveal about the community's focus. If this text is still here, run <code>/vibra:pulse &lt;path&gt;</code> inside Claude Code.</p>
  </div>
</div>`;
}

function renderJtbd(p) {
  return `<div class="card wide agent-fill" data-fill="jtbd">
  <h2>Jobs to be done</h2>
  <p class="card-hint">What members are actually trying to accomplish — functional, emotional, social. Derived from asks, frustrations, and topic signal.</p>
  <p class="muted">Agent-synthesized. Run <code>/vibra:pulse &lt;path&gt;</code> inside Claude Code to populate this section with JTBD analysis grounded in the data above.</p>
</div>`;
}

function renderRecommendations(p) {
  return `<div class="card wide agent-fill" data-fill="recommendations">
  <h2>Strategic observations</h2>
  <p class="card-hint">Concrete moves the business should consider, grounded in the data.</p>
  <p class="muted">Agent-synthesized. Run <code>/vibra:pulse &lt;path&gt;</code> inside Claude Code to populate this section with 3–5 strategic recommendations based on growth, vitals, personas, topics, and risk signals.</p>
</div>`;
}

function labelFor(key) {
  return {
    helper: 'Helpers',
    asker: 'Askers',
    connector: 'Connectors',
    'content-sharer': 'Content sharers',
    regular: 'Regulars',
    newcomer: 'Newcomers',
    observer: 'Observers',
  }[key] ?? key;
}

function renderActivitySvg(days, max) {
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
  const labelEvery = Math.max(1, Math.ceil(days.length / 10));
  const labels = days.map((d, i) => i % labelEvery !== 0 ? '' : `<text x="${PAD_L + i * bw + bw / 2}" y="${H - 8}" fill="#9a9a9a" font-size="10" text-anchor="middle">${d.date.slice(5)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${gridLines}${bars}${labels}</svg>`;
}

function renderHeatmapSvg(grid) {
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

function renderFooter(community, p) {
  const date = iso => iso.slice(0, 10);
  return `<footer>
  <span>${esc(community)} · ${date(p.sinceIso)} — ${date(p.untilIso)}</span>
  <span>Powered by <a href="https://getvibra.co">Vibra</a> · the new community manager hire for professional communities</span>
</footer>`;
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const TAB_JS = `
const buttons = document.querySelectorAll('.tab-btn');
const body = document.body;
buttons.forEach(btn => btn.addEventListener('click', () => {
  buttons.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  body.dataset.activeTab = btn.dataset.tab;
}));
`;

const CSS = `
:root {
  --bg: #ffffff; --surface: #fafafa; --surface-2: #f3f3f3;
  --border: #e5e5e5; --border-strong: #d4d4d4;
  --text: #1a1a1a; --text-muted: #6b6b6b; --text-subtle: #9a9a9a;
  --accent: oklch(55% 0.13 250); --accent-soft: oklch(92% 0.03 250);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif; font-size: 15px; line-height: 1.55; color: var(--text); background: var(--bg); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
.page { max-width: 1080px; margin: 0 auto; padding: 56px 40px 40px; }
header { border-bottom: 1px solid var(--border); padding-bottom: 24px; margin-bottom: 16px; }
h1 { font-size: 28px; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 6px; }
.eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 12px; }
.subtitle { font-size: 14px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
h2 { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-subtle); margin: 0 0 14px; }
h3 { font-size: 14px; font-weight: 500; margin: 20px 0 8px; letter-spacing: -0.01em; }
.muted { color: var(--text-subtle); font-size: 13px; }
.dim { color: var(--text-subtle); font-size: 0.6em; }

.tabs { display: flex; gap: 2px; margin: 20px 0 24px; border-bottom: 1px solid var(--border); align-items: center; }
.tab-btn { background: transparent; border: none; padding: 10px 16px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; font-family: inherit; letter-spacing: 0.01em; }
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--text); border-bottom-color: var(--accent); }
.print-btn { margin-left: auto; background: transparent; border: 1px solid var(--border); padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px; color: var(--text-muted); font-family: inherit; }
.print-btn:hover { color: var(--text); border-color: var(--border-strong); }

.tab { display: none; }
body[data-active-tab="cm"] #tab-cm,
body[data-active-tab="business"] #tab-business { display: block; }

.cm-grid, .business-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card { border: 1px solid var(--border); border-radius: 4px; padding: 20px 22px; background: var(--bg); }
.card.wide { grid-column: 1 / -1; }
.card-hint { color: var(--text-subtle); font-size: 12px; margin: -6px 0 14px; }
.card h3 { color: var(--text-muted); font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 20px; }

.action-table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.action-table td { padding: 8px 10px 8px 0; border-bottom: 1px solid var(--border); vertical-align: top; }
.action-table .kind { width: 140px; color: var(--text-muted); }
.action-table .who { width: 160px; }
.action-table .when { width: 100px; color: var(--text-subtle); font-size: 12px; }
.action-table .detail { color: var(--text-muted); }
.action-table tr:last-child td { border-bottom: none; }

.open-q { padding-left: 20px; margin: 0; }
.open-q li { margin: 10px 0; border-bottom: 1px solid var(--border); padding-bottom: 10px; list-style: decimal; }
.open-q li:last-child { border-bottom: none; }
.open-q strong { font-weight: 500; }
.open-q .when { color: var(--text-subtle); font-size: 12px; margin-left: 8px; }
.open-q .q-text { margin-top: 4px; color: var(--text-muted); font-size: 14px; }

.threads { padding-left: 0; margin: 0; list-style: none; }
.threads li { margin: 12px 0; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.threads li:last-child { border-bottom: none; }
.thread-head { display: flex; align-items: baseline; gap: 10px; }
.thread-head .rank { color: var(--text-subtle); font-size: 12px; font-variant-numeric: tabular-nums; width: 20px; }
.thread-head .when { color: var(--text-subtle); font-size: 12px; margin-left: auto; }
.thread-snippet { color: var(--text-muted); font-size: 13px; margin-top: 4px; padding-left: 30px; }

.links { padding-left: 20px; margin: 4px 0 12px; }
.links li { margin: 8px 0; font-size: 14px; }
.links a { color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--accent-soft); }
.links .when { color: var(--text-subtle); font-size: 12px; margin-left: 8px; }
.links .muted { margin-top: 2px; font-size: 12px; }
.quote { color: var(--text-muted); font-style: italic; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.two-col ul { padding-left: 20px; margin: 4px 0; }
.two-col li { font-size: 13px; margin: 4px 0; }
.two-col .when { color: var(--text-subtle); font-size: 11px; margin-left: 6px; }

.metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.metric .value { font-size: 30px; font-weight: 400; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; line-height: 1.1; }
.metric .label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.metric .sub { font-size: 12px; color: var(--text-subtle); margin-top: 2px; font-variant-numeric: tabular-nums; }

.kv { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: 13px; }
.kv th, .kv td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: left; }
.kv th { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-subtle); }
.kv tr:last-child td { border-bottom: none; }

.chart svg { display: block; width: 100%; height: auto; }

.contributors { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.contributors td { padding: 8px 10px; border-bottom: 1px solid var(--border); }
.contributors tr:last-child td { border-bottom: none; }
.contributors .rank { width: 24px; color: var(--text-subtle); font-size: 12px; }
.contributors .count { text-align: right; width: 50px; color: var(--text-muted); font-size: 13px; }
.contributors .bar-cell { width: 40%; padding-left: 20px; }
.bar { height: 4px; background: var(--accent); border-radius: 0; }

.personas { width: 100%; border-collapse: collapse; font-size: 13px; }
.personas th, .personas td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
.personas th { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-subtle); }
.personas .persona-label { width: 180px; }
.personas .persona-count { width: 60px; color: var(--text-muted); }
.personas .persona-top { color: var(--text-muted); }

.topic-list { columns: 2; column-gap: 32px; padding-left: 0; list-style: none; margin: 8px 0; }
.topic-list li { break-inside: avoid; padding: 4px 0; font-size: 14px; }
.topic-list .when { color: var(--text-subtle); font-size: 12px; margin-left: 6px; }

.agent-fill { border-left: 2px solid var(--accent-soft); padding-left: 14px; margin-top: 18px; }
.agent-fill.card { border-left-width: 2px; }

code { font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 0.88em; background: var(--surface); padding: 1px 5px; border-radius: 3px; border: 1px solid var(--border); }

footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 11px; letter-spacing: 0.04em; color: var(--text-subtle); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
footer a { color: var(--text-subtle); text-decoration: none; }
footer a:hover { color: var(--text); }

@media print {
  html, body { background: #fff; color: #1a1a1a; font-size: 10.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { padding: 0; max-width: none; }
  nav.tabs, .print-btn { display: none !important; }
  body[data-active-tab="cm"] #tab-business,
  body[data-active-tab="business"] #tab-cm { display: none !important; }
  .card { border: 1px solid #e5e5e5; page-break-inside: avoid; }
  h1 { font-size: 20pt; }
  .metric .value { font-size: 18pt; }
  .cm-grid, .business-grid { grid-template-columns: 1fr; }
  @page { margin: 18mm 16mm; @bottom-center { content: "Powered by Vibra · getvibra.co"; font-size: 9pt; color: #9a9a9a; } }
}

@media (max-width: 900px) {
  .cm-grid, .business-grid, .metrics, .two-col, .topic-list { grid-template-columns: 1fr !important; columns: 1 !important; }
  .page { padding: 32px 20px; }
  .metrics { gap: 16px; }
}
`;
