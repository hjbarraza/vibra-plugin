const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIERS = ['Champion', 'Power', 'Regular', 'Occasional', 'One-time'];

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
    ${renderBusinessNav()}
    ${renderBusinessTab(p)}
  </section>
</main>
${renderFooter(community, p)}
</div>
${renderDrillDownModal()}
<script>${JS}</script>
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

function renderBusinessNav() {
  const items = [
    ['health', 'Health'],
    ['vitals', 'Vitals'],
    ['growth', 'Growth'],
    ['mix', 'Content mix'],
    ['activity', 'Activity'],
    ['members', 'Members'],
    ['network', 'Network'],
    ['stickiness', 'Stickiness'],
    ['gratitude', 'Gratitude'],
    ['buy', 'Revenue'],
    ['topics', 'Topics'],
    ['insights', 'Insights'],
  ];
  return `<nav class="subnav">${items.map(([id, label]) =>
    `<a href="#sec-${id}" class="subnav-link">${label}</a>`).join('')}</nav>`;
}

// ============================================================================
// CM TAB
// ============================================================================

function renderCmTab(p) {
  return `
<nav class="cm-subnav">
  <a href="#cm-today" class="subnav-link">Today</a>
  <a href="#cm-week" class="subnav-link">This week</a>
  <a href="#cm-month" class="subnav-link">This month</a>
  <a href="#cm-decisions" class="subnav-link">Decisions</a>
  <a href="#cm-data" class="subnav-link">Supporting data</a>
</nav>
<div class="cm-grid">
  ${renderTodayCard(p)}
  ${renderWeekCard(p)}
  ${renderMonthCard(p)}
  ${renderDecisionsCard(p)}
</div>
<details class="supporting" id="cm-data">
  <summary>Supporting data — at-risk, open questions, threads, content, membership</summary>
  <div class="cm-grid supporting-grid">
    ${renderActionQueue(p)}
    ${renderAtRisk(p)}
    ${renderAsksOffersIntros(p)}
    ${renderOpenQuestions(p)}
    ${renderTopThreads(p)}
    ${renderContentCards(p)}
    ${renderQuietAndNew(p)}
  </div>
</details>
`;
}

function renderTodayCard(p) {
  const cm = p.cmContext?.cmName;
  const cmLine = cm ? `Inferred CM: <strong>${esc(cm)}</strong> (highest-influence senior member). ` : '';
  return `<div class="card wide horizon-today" id="cm-today">
  <div class="horizon-header"><span class="horizon-pill pill-today">Today</span><h2>Your action brief</h2></div>
  <p class="card-hint">${cmLine}3-5 specific moves for the next few hours. Each has copy-paste text tone-matched to the CM's voice.</p>
  <div class="agent-fill" data-fill="today-actions">
    <div class="draft-placeholder">
      <p class="muted"><strong>Awaiting agent synthesis.</strong> Inside Claude Code, the agent reads the at-risk members, asks/offers, gratitude signals, recent activity, and the CM's voice samples, then drafts 3-5 specific actions for today: who to DM (with the text), intros to make (with the intro copy), public shoutouts (with the post), all timed and prioritized.</p>
    </div>
  </div>
</div>`;
}

function renderWeekCard(p) {
  const peaks = p.cmContext?.peakWindows ?? [];
  const peakLine = peaks.length ? `Peak posting windows detected: <strong>${peaks.map(pk => pk.label).join(' · ')}</strong>.` : '';
  const dormant = p.cmContext?.dormantTopics ?? [];
  const dormLine = dormant.length ? ` Dormant topics worth reviving: <strong>${dormant.slice(0, 3).map(d => esc(d.token)).join(', ')}</strong>.` : '';
  return `<div class="card wide horizon-week" id="cm-week">
  <div class="horizon-header"><span class="horizon-pill pill-week">This week</span><h2>7-day plan</h2></div>
  <p class="card-hint">Seed prompts with timing, thread follow-ups, newsletter picks. ${peakLine}${dormLine}</p>
  <div class="agent-fill" data-fill="week-plan">
    <div class="draft-placeholder">
      <p class="muted"><strong>Awaiting agent synthesis.</strong> The agent writes 5-7 specific seed prompts with suggested posting times anchored to the peak windows above, 2-3 thread follow-ups from last week, and newsletter feature nominations — each grounded in topic signal, engagement data, dormant topics worth reviving, and the community's dominant language.</p>
    </div>
  </div>
</div>`;
}

function renderMonthCard(p) {
  const buyCurious = p.personas?.buyCurious ?? [];
  const buyLine = buyCurious.length ? `Premium-tier interview queue: <strong>${buyCurious.slice(0, 3).map(m => esc(m.name)).join(', ')}</strong>.` : '';
  const funnel = p.stickiness?.funnel;
  const ghostLine = funnel && funnel.total > 0
    ? ` Stickiness funnel: ${funnel.ghost}/${funnel.total} newcomers ghosted — onboarding playbook needed.`
    : '';
  return `<div class="card wide horizon-month" id="cm-month">
  <div class="horizon-header"><span class="horizon-pill pill-month">This month</span><h2>Strategic moves</h2></div>
  <p class="card-hint">${buyLine}${ghostLine}</p>
  <div class="agent-fill" data-fill="month-plan">
    <div class="draft-placeholder">
      <p class="muted"><strong>Awaiting agent synthesis.</strong> The agent proposes 3-5 strategic moves grounded in the month's growth, retention, and buy-signal data: premium-tier interviews (with outreach drafts), an onboarding playbook if stickiness is weak, stakeholder-report talking points framed for the owner, and sub-community/product ideas grounded in topic themes.</p>
    </div>
  </div>
</div>`;
}

function renderDecisionsCard(p) {
  const mods = p.cmContext?.moderatorCandidates ?? [];
  const modLine = mods.length ? `Potential moderator promotions: <strong>${mods.map(m => esc(m.name)).join(', ')}</strong>.` : '';
  return `<div class="card wide horizon-decisions" id="cm-decisions">
  <div class="horizon-header"><span class="horizon-pill pill-decisions">Decisions</span><h2>Blocking questions</h2></div>
  <p class="card-hint">${modLine} Binary yes/no questions — each gets pro/con grounded in data so you can pick without re-analyzing.</p>
  <div class="agent-fill" data-fill="decisions">
    <div class="draft-placeholder">
      <p class="muted"><strong>Awaiting agent synthesis.</strong> The agent surfaces 3-5 decisions grounded in the data: promotions (like the moderator candidates above), thread moderation (lock, feature, redirect?), newsletter selections, pricing experiments. Each as a clear yes/no question with pro/con rooted in specific numbers and member names.</p>
    </div>
  </div>
</div>`;
}

function renderActionQueue(p) {
  const a = p.actions;
  const rows = [];
  for (const m of (a.frustrationCandidates ?? []).slice(0, 3)) rows.push({ kind: '🚨 Frustration', who: m.sender, when: m.sentAt?.slice(0, 10) ?? '', detail: (m.text ?? '').slice(0, 140) });
  for (const m of (a.longSilentMembers ?? []).slice(0, 5)) rows.push({ kind: '👻 Long-silent', who: m.sender, when: `${m.silentDays}d silent`, detail: 'On roster, never posted' });
  for (const m of (a.welcomeGaps ?? []).slice(0, 3)) rows.push({ kind: '🎯 Welcome gap', who: m.sender, when: m.joinedAt?.slice(0, 10) ?? '', detail: (m.firstMessage ?? '').slice(0, 140) });
  for (const m of (a.silentJoiners ?? []).slice(0, 3)) rows.push({ kind: '👋 Silent joiner', who: m.sender, when: m.joinedAt?.slice(0, 10) ?? '', detail: 'Joined but never posted' });
  for (const m of (a.shoutoutCandidates ?? []).slice(0, 3)) rows.push({ kind: '🙌 Shoutout', who: m.sender, when: `${m.helpCount} replies`, detail: m.sample ? (m.sample.reply ?? '').slice(0, 140) : '' });

  const body = rows.length
    ? `<table class="action-table"><tbody>${rows.map(r => `
      <tr>
        <td class="kind">${esc(r.kind)}</td>
        <td class="who"><strong class="member-link" data-member="${esc(r.who)}">${esc(r.who)}</strong></td>
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

function renderAtRisk(p) {
  const atRisk = p.personas?.atRisk ?? [];
  if (!atRisk.length) return `<div class="card"><h2>At-risk members</h2><p class="muted">No clear churn signals.</p></div>`;
  const rows = atRisk.slice(0, 8).map(m => `
    <tr>
      <td><strong class="member-link" data-member="${esc(m.name)}">${esc(m.name)}</strong> <span class="tier-pill tier-${tierClass(m.tier)}">${esc(m.tier)}</span></td>
      <td class="risk"><div class="risk-bar"><div class="risk-fill" style="width:${m.disengageRisk}%;background:${riskColor(m.disengageRisk)}"></div></div><span class="risk-num">${m.disengageRisk}</span></td>
      <td class="muted">${m.daysSinceActive}d quiet · ${m.messages} msgs</td>
    </tr>`).join('');
  return `<div class="card wide">
  <h2>At-risk members</h2>
  <p class="card-hint">Composite disengage-risk score — posting-trend decline + days-since-last-post. Consider a check-in DM.</p>
  <table class="risk-table"><tbody>${rows}</tbody></table>
</div>`;
}

function renderAsksOffersIntros(p) {
  const intros = p.asksOffers?.possibleIntros ?? [];
  const matches = p.asksOffers?.matches ?? [];
  if (!matches.length && !intros.length) {
    return `<div class="card"><h2>Asks & offers</h2><p class="muted">No ask/offer pairs detected.</p></div>`;
  }
  const introRows = intros.slice(0, 6).map(m => `
    <tr>
      <td><strong class="member-link" data-member="${esc(m.ask.sender)}">${esc(m.ask.sender)}</strong>
        <span class="muted"> asked</span>: <em>${esc(m.ask.text.slice(0, 120))}</em></td>
      <td><strong class="member-link" data-member="${esc(m.offer.sender)}">${esc(m.offer.sender)}</strong>
        <span class="muted"> offered</span>: <em>${esc(m.offer.text.slice(0, 120))}</em></td>
      <td><span class="confidence confidence-${m.confidence}">${m.confidence}</span></td>
    </tr>`).join('');
  const conf = matches.filter(m => m.inReplyWindow).length;
  return `<div class="card wide">
  <h2>Asks, offers, and possible intros</h2>
  <p class="card-hint">${p.asksOffers.asksCount} asks and ${p.asksOffers.offersCount} offers detected. ${conf} pairs already connected in-thread. Below: candidates the CM might still introduce.</p>
  ${introRows ? `<table class="intros"><thead><tr><th>Ask</th><th>Offer</th><th>Signal</th></tr></thead><tbody>${introRows}</tbody></table>` : '<p class="muted">No un-connected ask/offer pairs above low confidence this window.</p>'}
</div>`;
}

function renderOpenQuestions(p) {
  const bundles = p.openQuestionBundles ?? [];
  const questions = bundles.flatMap(b => b.questions);
  if (questions.length === 0) return `<div class="card"><h2>Open questions</h2><p class="muted">All questions addressed.</p></div>`;
  const rows = questions.slice(0, 10).map(q => `
    <li>
      <strong class="member-link" data-member="${esc(q.sender)}">${esc(q.sender)}</strong>
      <span class="when">${esc((q.sentAt ?? '').slice(0, 10))}</span>
      <div class="q-text">${esc((q.text ?? '').slice(0, 240))}</div>
    </li>`).join('');
  return `<div class="card wide">
  <h2>Open questions</h2>
  <p class="card-hint">Candidate asks that may need your follow-up. Full LLM-judged answered-ness via <code>/vibra-code-lite:unanswered</code>.</p>
  <ol class="open-q">${rows}</ol>
</div>`;
}

function renderTopThreads(p) {
  const threads = p.topThreads ?? [];
  if (threads.length === 0) return `<div class="card"><h2>Top threads</h2><p class="muted">No significant threads this window.</p></div>`;
  const rows = threads.slice(0, 5).map((t, i) => {
    const who = (t.participants ?? []).slice(0, 3).map(n => `<span class="member-link" data-member="${esc(n)}">${esc(n)}</span>`).join(', ') + ((t.participants?.length ?? 0) > 3 ? ' et al.' : '');
    const snippet = t.messages?.[0]?.text?.slice(0, 140) ?? '';
    return `
    <li>
      <div class="thread-head"><span class="rank">${i + 1}</span><span>${who}</span> <span class="when">${t.messageCount} msgs · ${t.participants?.length ?? 0} participants</span></div>
      <div class="thread-snippet">${esc(snippet)}</div>
    </li>`;
  }).join('');
  return `<div class="card wide">
  <h2>Top threads</h2>
  <p class="card-hint">Highest-engagement threads this window. Full summaries via <code>/vibra-code-lite:digest</code>.</p>
  <ol class="threads">${rows}</ol>
</div>`;
}

function renderContentCards(p) {
  const links = p.content?.links ?? [];
  const quotes = p.content?.quotableCandidates ?? [];
  const linkRows = links.slice(0, 5).map(l => {
    let host = l.url;
    try { host = new URL(l.url).hostname.replace(/^www\./, ''); } catch {}
    return `<li><a href="${esc(l.url)}">${esc(host)}</a> <span class="when">${l.engagement ?? 0} replies</span><div class="muted">shared by <span class="member-link" data-member="${esc(l.sharedBy)}">${esc(l.sharedBy)}</span></div></li>`;
  }).join('');
  const quoteRows = quotes.slice(0, 3).map(q => `
    <li><strong class="member-link" data-member="${esc(q.sender)}">${esc(q.sender)}</strong>: <span class="quote">"${esc((q.text ?? '').slice(0, 220))}"</span></li>
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
      ${newM.length ? `<ul>${newM.map(m => `<li><span class="member-link" data-member="${esc(m.canonical_name)}">${esc(m.canonical_name)}</span> <span class="when">${esc((m.first_seen_at ?? '').slice(0, 10))}</span></li>`).join('')}</ul>` : '<p class="muted">None joined this window.</p>'}
    </div>
    <div>
      <h3>Went quiet</h3>
      ${quiet.length ? `<ul>${quiet.map(n => `<li><span class="member-link" data-member="${esc(n)}">${esc(n)}</span></li>`).join('')}</ul>` : '<p class="muted">No members dropped off.</p>'}
    </div>
  </div>
</div>`;
}

// ============================================================================
// BUSINESS TAB
// ============================================================================

function renderBusinessTab(p) {
  return `
<div class="business-grid">
  ${renderHealthScore(p)}
  ${renderVitals(p)}
  ${renderGrowth(p)}
  ${renderContentMix(p)}
  ${renderActivityCharts(p)}
  ${renderMembers(p)}
  ${renderNetwork(p)}
  ${renderStickiness(p)}
  ${renderGratitude(p)}
  ${renderBuySignals(p)}
  ${renderTopics(p)}
  ${renderJtbd(p)}
  ${renderRecommendations(p)}
</div>
`;
}

function renderHealthScore(p) {
  const h = p.healthScore;
  if (!h) return '';
  const pct = h.score;
  const color = pct >= 75 ? 'oklch(55% 0.14 145)' : pct >= 60 ? 'oklch(60% 0.13 200)' : pct >= 45 ? 'oklch(65% 0.14 60)' : 'oklch(55% 0.16 30)';
  const circumference = 2 * Math.PI * 70;
  const offset = circumference * (1 - pct / 100);
  const rows = Object.entries(h.components).map(([key, val]) => `
    <tr><td>${componentLabel(key)}</td><td class="bar-cell"><div class="bar" style="width:${val}%;background:${color};opacity:0.6"></div></td><td class="num">${val}</td></tr>
  `).join('');
  return `<div class="card wide" id="sec-health">
  <h2>Community health score</h2>
  <p class="card-hint">Composite signal: response rate (35%) + roster activation (30%) + distribution (20%) + growth direction (15%).</p>
  <div class="health-wrap">
    <svg viewBox="0 0 180 180" class="health-gauge" width="180" height="180">
      <circle cx="90" cy="90" r="70" fill="none" stroke="#f0f0f0" stroke-width="14"/>
      <circle cx="90" cy="90" r="70" fill="none" stroke="${color}" stroke-width="14" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 90 90)"/>
      <text x="90" y="88" text-anchor="middle" font-size="34" font-weight="400" fill="#1a1a1a" font-variant-numeric="tabular-nums">${pct}</text>
      <text x="90" y="110" text-anchor="middle" font-size="11" fill="#6b6b6b" letter-spacing="0.12em">${h.label.toUpperCase()}</text>
    </svg>
    <div class="health-components">
      <table><tbody>${rows}</tbody></table>
    </div>
  </div>
</div>`;
}

function componentLabel(k) {
  return { responseRate: 'Response rate', activation: 'Roster activation', distribution: 'Distribution (low Gini)', growth: 'Growth direction' }[k] ?? k;
}

function renderVitals(p) {
  const fmtPct = n => n == null ? '—' : `${Math.round(n * 100)}%`;
  const rosterPct = p.roster.rosterSize > 0 ? Math.round((p.roster.activeInWindow / p.roster.rosterSize) * 100) : 0;
  const giniLabel = p.gini < 0.3 ? 'Healthy' : p.gini < 0.5 ? 'Moderate' : p.gini < 0.7 ? 'High' : 'Very high';
  const benchResponse = p.responseRate.rate != null && p.responseRate.rate > 0.7 ? 'strong' : p.responseRate.rate > 0.5 ? 'typical' : 'low';
  return `<div class="card wide" id="sec-vitals">
  <h2>Community vitals</h2>
  <div class="metrics">
    <div class="metric"><div class="value">${p.totalMessages.toLocaleString()}</div><div class="label">Messages</div><div class="sub">${p.threadStats.count} threads</div></div>
    <div class="metric"><div class="value">${p.roster.activeInWindow}<span class="dim">/${p.roster.rosterSize}</span></div><div class="label">Active of roster</div><div class="sub">${rosterPct}% posted · ${p.roster.neverPosted} never posted${p.roster.rosterIsLowerBound ? ' (lower bound)' : ''}</div></div>
    <div class="metric"><div class="value">${fmtPct(p.responseRate.rate)}</div><div class="label">Response rate</div><div class="sub bench">${benchResponse} · paid communities typical: 50-70%</div></div>
    <div class="metric"><div class="value">${p.gini.toFixed(2)}</div><div class="label">Concentration (Gini)</div><div class="sub">${giniLabel}</div></div>
  </div>
</div>`;
}

function renderGrowth(p) {
  const prev = p.growth?.previousPeriod;
  if (!prev) return '';
  const delta = (cur, pre) => pre === 0 ? '—' : `${cur > pre ? '+' : ''}${(((cur - pre) / pre) * 100).toFixed(0)}%`;
  return `<div class="card" id="sec-growth">
  <h2>Growth vs prior ${p.windowDays} days</h2>
  <table class="kv">
    <tr><th>Metric</th><th>Prior</th><th>Now</th><th>Δ</th></tr>
    <tr><td>Messages</td><td>${prev.totalMessages}</td><td>${p.totalMessages}</td><td>${delta(p.totalMessages, prev.totalMessages)}</td></tr>
    <tr><td>Active members</td><td>${prev.distinctMembers}</td><td>${p.distinctMembers}</td><td>${delta(p.distinctMembers, prev.distinctMembers)}</td></tr>
    <tr><td>Roster (visible)</td><td>${prev.rosterSize}</td><td>${p.roster.rosterSize}</td><td>${delta(p.roster.rosterSize, prev.rosterSize)}</td></tr>
  </table>
</div>`;
}

function renderContentMix(p) {
  const mix = p.contentMix;
  if (!mix || !mix.total) return '';
  const order = ['question', 'answer', 'share', 'social', 'announcement', 'meta', 'other'];
  const colors = { question: 'oklch(55% 0.13 250)', answer: 'oklch(55% 0.14 145)', share: 'oklch(65% 0.13 290)', social: 'oklch(70% 0.1 60)', announcement: 'oklch(60% 0.14 30)', meta: 'oklch(60% 0.05 250)', other: 'oklch(80% 0.02 250)' };
  let x = 0;
  const bar = order.map(k => {
    const pct = mix.percentages[k] ?? 0;
    if (pct === 0) return '';
    const seg = `<rect x="${x}%" y="0" width="${pct}%" height="100%" fill="${colors[k]}"><title>${k}: ${mix.categories[k]} msgs (${pct}%)</title></rect>`;
    x += pct;
    return seg;
  }).join('');
  const rows = order.map(k => `
    <tr>
      <td><span class="dot" style="background:${colors[k]}"></span>${labelFor(k)}</td>
      <td class="num">${mix.categories[k]}</td>
      <td class="num">${mix.percentages[k]}%</td>
    </tr>`).join('');
  return `<div class="card wide" id="sec-mix">
  <h2>Content mix</h2>
  <p class="card-hint">What members actually post. Balanced communities have &gt;30% answers, healthy 15-25% social, &lt;5% meta.</p>
  <svg viewBox="0 0 100 8" preserveAspectRatio="none" class="mix-bar">${bar}</svg>
  <table class="mini"><tbody>${rows}</tbody></table>
</div>`;
}

function labelFor(k) {
  return { question: 'Questions', answer: 'Answers', share: 'Shares / media', social: 'Social / chitchat', announcement: 'Announcements', meta: 'Meta', other: 'Other' }[k] ?? k;
}

function renderActivityCharts(p) {
  const dayMax = Math.max(1, ...p.messagesByDay.map(d => d.count));
  return `<div class="card wide" id="sec-activity">
  <h2>Activity over time</h2>
  <div class="chart">${renderActivitySvg(p.messagesByDay, dayMax)}</div>
  <h3>Stacked by tier</h3>
  <div class="chart">${renderStackedAreaSvg(p.activityByTier)}</div>
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
    return `<tr><td class="rank">${i + 1}</td><td><span class="member-link" data-member="${esc(c.name)}">${esc(c.name)}</span></td><td class="count">${c.count}</td><td class="bar-cell"><div class="bar" style="width:${pct}%"></div></td></tr>`;
  }).join('');
  return `<table class="contributors"><tbody>${rows}</tbody></table>`;
}

function renderMembers(p) {
  return `<div class="card wide" id="sec-members">
  <h2>Members</h2>
  <p class="card-hint">Engagement tiers + per-member intelligence. Sortable, filterable. Click any name for a mini-profile.</p>
  ${renderTierDistribution(p)}
  ${renderMemberIntel(p)}
</div>`;
}

function renderTierDistribution(p) {
  const tiers = p.personas?.tierCounts ?? {};
  const entries = [['Champion', tiers.Champion], ['Power', tiers.Power], ['Regular', tiers.Regular], ['Occasional', tiers.Occasional], ['One-time', tiers['One-time']], ['Lurker', tiers.Lurker]];
  const total = entries.reduce((s, [, n]) => s + (n || 0), 0);
  if (total === 0) return '';
  const rows = entries.map(([label, count]) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return `<tr>
      <td class="tier-label"><span class="tier-pill tier-${tierClass(label)}">${label}</span></td>
      <td class="count">${count}</td>
      <td class="bar-cell"><div class="bar" style="width:${pct}%;background:${tierColor(label)}"></div></td>
      <td class="pct">${pct.toFixed(0)}%</td>
    </tr>`;
  }).join('');
  return `<h3>Engagement tier distribution</h3>
  <table class="tier-dist"><tbody>${rows}</tbody></table>`;
}

function renderMemberIntel(p) {
  const members = [...(p.personas?.members ?? [])].sort((a, b) => b.messages - a.messages).slice(0, 25);
  if (!members.length) return '';
  const daily = p.memberDaily?.perMember ?? {};
  const filters = ['All', 'Champion', 'Power', 'Regular', 'at-risk', 'buy-curious'];
  const pills = filters.map((f, i) => `<button type="button" class="filter-pill${i === 0 ? ' active' : ''}" data-filter="${esc(f)}">${esc(f)}</button>`).join('');
  const rows = members.map((m, i) => {
    const sp = renderSparkline(daily[m.name] ?? []);
    const tierCls = tierClass(m.tier);
    const filterTags = [m.tier, ...(m.tags || [])].join(' ');
    return `<tr class="member-row" data-filter="${esc(filterTags)}" data-member="${esc(m.name)}"
        data-activity="${m.messages}" data-attention="${m.attention}" data-influence="${m.influence}"
        data-giver="${m.giverPct}" data-buy="${m.buySignals}" data-risk="${m.disengageRisk}" data-last="${m.daysSinceActive}">
      <td class="rank">${i + 1}</td>
      <td class="name"><strong class="member-link" data-member="${esc(m.name)}">${esc(m.name)}</strong></td>
      <td><span class="tier-pill tier-${tierCls}">${esc(m.tier)}</span></td>
      <td class="spark">${sp}</td>
      <td class="num">${m.messages}</td>
      <td class="num">${m.attention}</td>
      <td class="num">${m.influence}</td>
      <td class="num">${Math.round(m.giverPct * 100)}%</td>
      <td class="num">${m.buySignals > 0 ? m.buySignals : ''}</td>
      <td class="num risk-cell"><span style="color:${riskColor(m.disengageRisk)}">${m.disengageRisk}</span></td>
      <td class="muted">${m.daysSinceActive}d</td>
    </tr>`;
  }).join('');
  return `<h3>Member intelligence</h3>
  <p class="card-hint">Activity (msgs) · Sparkline (per-day) · Attention (replies received) · Influence (network reach) · Giver % · Buy cues · Risk (0–100) · Last active.</p>
  <div class="filter-bar">${pills}</div>
  <div class="table-scroll">
    <table class="member-intel" id="member-intel">
      <thead><tr>
        <th></th><th>Member</th><th>Tier</th><th>Trend</th>
        <th class="num sortable" data-sort="activity">Activity</th>
        <th class="num sortable" data-sort="attention">Attention</th>
        <th class="num sortable" data-sort="influence">Influence</th>
        <th class="num sortable" data-sort="giver">Giver</th>
        <th class="num sortable" data-sort="buy">Buy</th>
        <th class="num sortable" data-sort="risk">Risk</th>
        <th class="num sortable" data-sort="last">Last</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderNetwork(p) {
  const positions = p.network?.forcePositions ?? [];
  const nodes = p.network?.forceNodes ?? [];
  const edges = p.network?.forceEdges ?? [];
  if (!positions.length) return `<div class="card" id="sec-network"><h2>Network map</h2><p class="muted">Not enough cross-member interactions.</p></div>`;

  const posMap = new Map(positions.map(p => [p.id, p]));
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const maxInfluence = Math.max(1, ...nodes.map(n => n.influence));
  const maxWeight = Math.max(1, ...edges.map(e => e.weight));

  const edgeSvg = edges.map((e, i) => {
    const a = posMap.get(e.source); const b = posMap.get(e.target);
    if (!a || !b) return '';
    const w = 0.5 + (e.weight / maxWeight) * 2.8;
    const opacity = 0.15 + (e.weight / maxWeight) * 0.55;
    return `<line class="net-edge" data-a="${esc(e.source)}" data-b="${esc(e.target)}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#1a1a1a" stroke-width="${w.toFixed(2)}" stroke-opacity="${opacity.toFixed(2)}"/>`;
  }).join('');

  const nodeSvg = positions.map(pos => {
    const n = nodeMap.get(pos.id);
    if (!n) return '';
    const r = 4 + (n.influence / maxInfluence) * 18;
    const color = tierColor(n.tier);
    return `<g class="node" data-member="${esc(n.id)}">
      <circle cx="${pos.x.toFixed(1)}" cy="${pos.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" stroke="#fff" stroke-width="1.5"><title>${esc(n.id)} · ${n.tier} · ${n.messages} msgs · influence ${n.influence}</title></circle>
      <text x="${pos.x.toFixed(1)}" y="${(pos.y + r + 10).toFixed(1)}" text-anchor="middle" font-size="9" fill="#1a1a1a" pointer-events="none">${esc(shortName(n.id))}</text>
    </g>`;
  }).join('');

  const tierLegend = ['Champion', 'Power', 'Regular', 'Occasional', 'One-time']
    .map(t => `<span class="legend-chip"><span class="legend-dot" style="background:${tierColor(t)}"></span>${t}</span>`).join('');

  const pairs = p.network.topPairs.slice(0, 8).map(e => `<li><strong class="member-link" data-member="${esc(e.a)}">${esc(e.a)}</strong> ⟷ <strong class="member-link" data-member="${esc(e.b)}">${esc(e.b)}</strong> <span class="when">${e.count}x</span></li>`).join('');

  return `<div class="card wide" id="sec-network">
  <h2>Network map</h2>
  <p class="card-hint">Node size = influence. Color = tier. Edge thickness = interaction count. <strong>Click a node</strong> to highlight its neighborhood. <strong>Click empty space</strong> to clear.</p>
  <div class="legend">${tierLegend}</div>
  <div class="network-wrap">
    <svg viewBox="0 0 900 520" class="network-svg" id="network-svg">${edgeSvg}${nodeSvg}</svg>
  </div>
  <h3>Top interaction pairs</h3>
  <ul class="pair-list">${pairs}</ul>
</div>`;
}

function shortName(s) {
  const first = s.split(' ')[0];
  return first.length > 14 ? first.slice(0, 13) + '…' : first;
}

function renderStickiness(p) {
  const s = p.stickiness;
  if (!s || s.funnel.total === 0) return `<div class="card" id="sec-stickiness"><h2>New-member stickiness</h2><p class="muted">No newcomers this window.</p></div>`;
  const f = s.funnel;
  const stages = [
    ['Joined', f.total, 'oklch(55% 0.13 250)'],
    ['Tried (1-2 msgs)', f.tried, 'oklch(60% 0.13 250)'],
    ['Stuck (3-7 msgs)', f.stuck, 'oklch(55% 0.14 145)'],
    ['Ramped (8+ msgs)', f.ramped, 'oklch(50% 0.16 145)'],
  ];
  const rows = stages.map(([label, n, color]) => {
    const pct = f.total > 0 ? (n / f.total) * 100 : 0;
    return `<tr>
      <td class="stage-label">${label}</td>
      <td class="count">${n}</td>
      <td class="bar-cell"><div class="bar" style="width:${pct}%;background:${color}"></div></td>
      <td class="pct">${pct.toFixed(0)}%</td>
    </tr>`;
  }).join('');
  const ghostRows = s.ghosts.slice(0, 8).map(g => `<li><strong class="member-link" data-member="${esc(g.name)}">${esc(g.name)}</strong> <span class="when">joined ${g.joinedAt.slice(0, 10)}</span></li>`).join('');
  return `<div class="card wide" id="sec-stickiness">
  <h2>New-member stickiness</h2>
  <p class="card-hint">Newcomers' trajectory in their first 14 days. Key retention KPI — ghost rate above 40% is a welcome-flow problem.</p>
  <table class="tier-dist"><tbody>${rows}</tbody></table>
  ${ghostRows ? `<h3>Ghosts (joined, never posted)</h3><ul>${ghostRows}</ul>` : ''}
</div>`;
}

function renderGratitude(p) {
  const g = p.gratitude;
  if (!g || g.totalCount === 0) return `<div class="card" id="sec-gratitude"><h2>Gratitude & satisfaction</h2><p class="muted">No gratitude signals detected.</p></div>`;
  const receivers = g.topReceivers.slice(0, 6).map(r => `<li><strong class="member-link" data-member="${esc(r.name)}">${esc(r.name)}</strong> <span class="when">${r.count}x thanked</span></li>`).join('');
  const samples = g.samples.slice(0, 3).map(s => `<li><strong class="member-link" data-member="${esc(s.sender)}">${esc(s.sender)}</strong>: <em>${esc((s.text ?? '').slice(0, 180))}</em></li>`).join('');
  return `<div class="card" id="sec-gratitude">
  <h2>Gratitude & satisfaction</h2>
  <p class="card-hint">${g.totalCount} messages expressing thanks/appreciation. Signal of what the community values.</p>
  <h3>Most-thanked members</h3>
  <ul>${receivers}</ul>
  ${samples ? `<h3>Sample moments</h3><ul class="samples">${samples}</ul>` : ''}
</div>`;
}

function renderBuySignals(p) {
  const buyCurious = p.personas?.buyCurious ?? [];
  if (!buyCurious.length) return `<div class="card" id="sec-buy"><h2>Revenue / buy signals</h2><p class="muted">No purchase-intent cues this window.</p></div>`;
  const rows = buyCurious.slice(0, 8).map(m => `
    <tr>
      <td><strong class="member-link" data-member="${esc(m.name)}">${esc(m.name)}</strong></td>
      <td class="count">${m.buySignals} msg${m.buySignals === 1 ? '' : 's'}</td>
      <td class="muted">Mentions pricing, subscriptions, or purchase intent</td>
    </tr>`).join('');
  return `<div class="card wide" id="sec-buy">
  <h2>Revenue / buy signals</h2>
  <p class="card-hint">Members whose messages contained purchase-intent cues (pricing, "worth it", "I'd pay…"). Target for premium-tier research.</p>
  <table class="mini"><tbody>${rows}</tbody></table>
</div>`;
}

function renderTopics(p) {
  const tokens = p.topics?.topTokens ?? [];
  const body = tokens.length
    ? `<ul class="topic-list">${tokens.slice(0, 12).map(t => `<li><strong>${esc(t.token)}</strong> <span class="when">${t.count} messages · ${t.distinctMembers} members</span></li>`).join('')}</ul>`
    : '<p class="muted">Not enough signal to surface topics.</p>';
  return `<div class="card wide" id="sec-topics">
  <h2>Topic signal</h2>
  <p class="card-hint">Keyword-frequency tokens across multiple members. Semantic clustering + labels come from the agent.</p>
  ${body}
  <div class="agent-fill" data-fill="topic-themes">
    <h3>Topic themes</h3>
    <p class="muted">Agent-synthesized theme labels. Run <code>/vibra-code-lite:pulse &lt;path&gt;</code> inside Claude Code to populate.</p>
  </div>
</div>`;
}

function renderJtbd(p) {
  return `<div class="card wide agent-fill" data-fill="jtbd" id="sec-insights">
  <h2>Jobs to be done</h2>
  <p class="card-hint">What members are trying to accomplish. Synthesized by the agent from asks, frustrations, topic signal.</p>
  <p class="muted">Agent-synthesized. Run <code>/vibra-code-lite:pulse &lt;path&gt;</code> inside Claude Code to populate.</p>
</div>`;
}

function renderRecommendations(p) {
  return `<div class="card wide agent-fill" data-fill="recommendations">
  <h2>Strategic observations</h2>
  <p class="card-hint">Concrete moves grounded in the data.</p>
  <p class="muted">Agent-synthesized. Run <code>/vibra-code-lite:pulse &lt;path&gt;</code> inside Claude Code to populate.</p>
</div>`;
}

// ============================================================================
// PERSONAS LEGACY (kept accessible via agent-fill)
// ============================================================================

// Persona narrative lives inside the Members section per v0.3; the agent-fill
// placeholder is still rendered so the skill synthesis can land somewhere.
function renderPersonaNarrativePlaceholder() {
  return `<div class="agent-fill" data-fill="persona-narrative">
    <h3>Persona narrative</h3>
    <p class="muted">Agent-synthesized cluster narrative. Run <code>/vibra-code-lite:pulse &lt;path&gt;</code> inside Claude Code to populate.</p>
  </div>`;
}

// ============================================================================
// CHART HELPERS
// ============================================================================

function renderActivitySvg(days, max) {
  const W = 1000, H = 180, PAD_L = 32, PAD_R = 8, PAD_T = 12, PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const bw = innerW / Math.max(1, days.length);
  const yTicks = 4;
  let grid = '';
  for (let i = 0; i <= yTicks; i++) {
    const y = PAD_T + (innerH * i) / yTicks;
    const v = Math.round((max * (yTicks - i)) / yTicks);
    grid += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e5e5e5" stroke-width="1"/><text x="${PAD_L - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#9a9a9a">${v}</text>`;
  }
  const bars = days.map((d, i) => {
    const h = (d.count / max) * innerH;
    const x = PAD_L + i * bw + 1;
    const y = PAD_T + innerH - h;
    return `<rect x="${x}" y="${y}" width="${Math.max(1, bw - 2)}" height="${h}" fill="oklch(55% 0.13 250)"/>`;
  }).join('');
  const labelEvery = Math.max(1, Math.ceil(days.length / 10));
  const labels = days.map((d, i) => i % labelEvery !== 0 ? '' : `<text x="${PAD_L + i * bw + bw / 2}" y="${H - 8}" fill="#9a9a9a" font-size="10" text-anchor="middle">${d.date.slice(5)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${grid}${bars}${labels}</svg>`;
}

function renderStackedAreaSvg(activityByTier) {
  if (!activityByTier || !activityByTier.days.length) return '';
  const W = 1000, H = 180, PAD_L = 32, PAD_R = 120, PAD_T = 12, PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const days = activityByTier.days;
  const n = days.length;
  const stacked = days.map((_, i) => {
    let cum = 0;
    const col = {};
    for (const tier of TIERS) {
      const v = activityByTier.series[tier]?.[i] ?? 0;
      col[tier] = { start: cum, end: cum + v };
      cum += v;
    }
    col.total = cum;
    return col;
  });
  const max = Math.max(1, ...stacked.map(c => c.total));
  const xAt = i => PAD_L + (i / Math.max(1, n - 1)) * innerW;
  const yAt = v => PAD_T + innerH - (v / max) * innerH;
  const areas = TIERS.map(tier => {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(`${xAt(i).toFixed(1)},${yAt(stacked[i][tier].end).toFixed(1)}`);
    for (let i = n - 1; i >= 0; i--) pts.push(`${xAt(i).toFixed(1)},${yAt(stacked[i][tier].start).toFixed(1)}`);
    return `<polygon points="${pts.join(' ')}" fill="${tierColor(tier)}" opacity="0.85"><title>${tier}</title></polygon>`;
  }).join('');
  const legend = TIERS.map((t, i) => `<g transform="translate(${W - PAD_R + 16}, ${PAD_T + i * 18})"><rect width="10" height="10" fill="${tierColor(t)}"/><text x="14" y="9" font-size="10" fill="#6b6b6b">${t}</text></g>`).join('');
  const yTicks = 4;
  let grid = '';
  for (let i = 0; i <= yTicks; i++) {
    const y = PAD_T + (innerH * i) / yTicks;
    const v = Math.round((max * (yTicks - i)) / yTicks);
    grid += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e5e5e5" stroke-width="1"/><text x="${PAD_L - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="#9a9a9a">${v}</text>`;
  }
  const labelEvery = Math.max(1, Math.ceil(n / 10));
  const xlabels = days.map((d, i) => i % labelEvery !== 0 ? '' : `<text x="${xAt(i)}" y="${H - 8}" fill="#9a9a9a" font-size="10" text-anchor="middle">${d.slice(5)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${grid}${areas}${xlabels}${legend}</svg>`;
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

function renderSparkline(values) {
  if (!values || !values.length) return '';
  const W = 90, H = 24;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(H - (v / max) * (H - 2) - 1).toFixed(1)}`).join(' ');
  const bars = values.map((v, i) => {
    const h = (v / max) * (H - 2);
    const x = i * step;
    return `<rect x="${x.toFixed(1)}" y="${(H - h - 1).toFixed(1)}" width="${Math.max(0.8, step - 0.6).toFixed(1)}" height="${h.toFixed(1)}" fill="oklch(55% 0.13 250)" opacity="0.6"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="sparkline">${bars}<polyline points="${pts}" fill="none" stroke="oklch(40% 0.15 250)" stroke-width="1"/></svg>`;
}

// ============================================================================
// COMMON HELPERS
// ============================================================================

function renderFooter(community, p) {
  const date = iso => iso.slice(0, 10);
  return `<footer>
  <span>${esc(community)} · ${date(p.sinceIso)} — ${date(p.untilIso)}</span>
  <span>Powered by <a href="https://getvibra.co">Vibra</a> · the new community manager hire for professional communities</span>
</footer>`;
}

function renderDrillDownModal() {
  return `<div class="modal" id="member-modal" aria-hidden="true">
  <div class="modal-backdrop" data-close></div>
  <div class="modal-panel" role="dialog" aria-labelledby="modal-title">
    <button type="button" class="modal-close" data-close aria-label="Close">×</button>
    <h3 id="modal-title">Member</h3>
    <div id="modal-body"></div>
  </div>
</div>`;
}

function tierClass(tier) {
  return (tier || '').toLowerCase().replace(/[^a-z]/g, '');
}

function tierColor(tier) {
  return { Champion: 'oklch(55% 0.14 145)', Power: 'oklch(55% 0.13 250)', Regular: 'oklch(70% 0.08 250)', Occasional: 'oklch(80% 0.04 250)', 'One-time': 'oklch(85% 0.02 250)', Lurker: 'oklch(90% 0.01 250)' }[tier] ?? 'oklch(70% 0.04 250)';
}

function riskColor(score) {
  if (score >= 70) return 'oklch(55% 0.16 30)';
  if (score >= 40) return 'oklch(65% 0.14 60)';
  return 'oklch(70% 0.12 145)';
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================================
// JS (tabs, sub-nav, sort, filter, modal, collapse)
// ============================================================================

const JS = `
const body = document.body;
document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  body.dataset.activeTab = btn.dataset.tab;
}));

document.querySelectorAll('.filter-pill').forEach(p => p.addEventListener('click', () => {
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
  p.classList.add('active');
  const f = p.dataset.filter;
  document.querySelectorAll('.member-row').forEach(row => {
    if (f === 'All') row.style.display = '';
    else {
      const tags = (row.dataset.filter || '').split(' ');
      row.style.display = tags.includes(f) ? '' : 'none';
    }
  });
}));

document.querySelectorAll('.sortable').forEach(th => th.addEventListener('click', () => {
  const sort = th.dataset.sort;
  const tbody = th.closest('table').querySelector('tbody');
  const rows = [...tbody.querySelectorAll('tr')];
  const asc = th.dataset.dir === 'asc';
  rows.sort((a, b) => {
    const av = parseFloat(a.dataset[sort] || 0);
    const bv = parseFloat(b.dataset[sort] || 0);
    return asc ? av - bv : bv - av;
  });
  th.dataset.dir = asc ? 'desc' : 'asc';
  document.querySelectorAll('.sortable').forEach(t => { if (t !== th) t.dataset.dir = ''; });
  rows.forEach(r => tbody.appendChild(r));
}));

const modal = document.getElementById('member-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

function openMember(name) {
  modalTitle.textContent = name;
  const row = document.querySelector('.member-row[data-member="' + name.replace(/"/g, '\\\\"') + '"]');
  let html = '';
  if (row) {
    const d = row.dataset;
    html = '<dl class="kv-dl">' +
      '<dt>Tier</dt><dd>' + (row.querySelector('.tier-pill')?.textContent || '—') + '</dd>' +
      '<dt>Activity</dt><dd>' + (d.activity || 0) + ' messages</dd>' +
      '<dt>Attention</dt><dd>' + (d.attention || 0) + ' replies received</dd>' +
      '<dt>Influence</dt><dd>' + (d.influence || 0) + '</dd>' +
      '<dt>Giver %</dt><dd>' + Math.round((parseFloat(d.giver) || 0) * 100) + '%</dd>' +
      '<dt>Buy signals</dt><dd>' + (d.buy || 0) + '</dd>' +
      '<dt>Disengage risk</dt><dd>' + (d.risk || 0) + ' / 100</dd>' +
      '<dt>Last active</dt><dd>' + (d.last || 0) + ' days ago</dd>' +
    '</dl>' +
    '<p class="muted">For a full narrative dossier, run <code>/vibra-code-lite:profile &lt;path&gt; --member "' + name + '"</code>.</p>';
  } else {
    html = '<p class="muted">No row in the member intelligence table for this name. Try <code>/vibra-code-lite:members</code> for the full roster.</p>';
  }
  modalBody.innerHTML = html;
  modal.setAttribute('aria-hidden', 'false');
}

document.addEventListener('click', (ev) => {
  const link = ev.target.closest('.member-link');
  if (link) {
    ev.preventDefault();
    openMember(link.dataset.member || link.textContent);
    return;
  }
  if (ev.target.closest('[data-close]')) {
    modal.setAttribute('aria-hidden', 'true');
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') modal.setAttribute('aria-hidden', 'true');
});

document.querySelectorAll('.subnav-link').forEach(a => a.addEventListener('click', (ev) => {
  ev.preventDefault();
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if (el) {
    if (el.tagName === 'DETAILS') el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}));

// Network map: click node to highlight neighborhood
const netSvg = document.getElementById('network-svg');
if (netSvg) {
  let activeNode = null;
  netSvg.addEventListener('click', (ev) => {
    const node = ev.target.closest('.node');
    if (!node) {
      activeNode = null;
      netSvg.querySelectorAll('.node, .net-edge').forEach(el => {
        el.style.opacity = '';
      });
      return;
    }
    const name = node.dataset.member;
    if (activeNode === name) {
      activeNode = null;
      netSvg.querySelectorAll('.node, .net-edge').forEach(el => { el.style.opacity = ''; });
      return;
    }
    activeNode = name;
    const connected = new Set([name]);
    netSvg.querySelectorAll('.net-edge').forEach(e => {
      if (e.dataset.a === name || e.dataset.b === name) {
        connected.add(e.dataset.a);
        connected.add(e.dataset.b);
        e.style.opacity = '1';
      } else {
        e.style.opacity = '0.05';
      }
    });
    netSvg.querySelectorAll('.node').forEach(n => {
      n.style.opacity = connected.has(n.dataset.member) ? '1' : '0.2';
    });
  });
}

// Copy buttons: any button with data-copy copies the associated target's text
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-copy]');
  if (!btn) return;
  const targetId = btn.dataset.copy;
  const target = document.getElementById(targetId);
  if (!target) return;
  const text = target.innerText || target.textContent || '';
  navigator.clipboard?.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = original; }, 1200);
  });
});

// Dismiss buttons: hide the parent card-like block (session only)
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-dismiss]');
  if (!btn) return;
  const target = btn.closest('.draft-card, .decision-card, .action-card');
  if (target) target.style.display = 'none';
});
`;

// ============================================================================
// CSS
// ============================================================================

const CSS = `
:root {
  --bg: #ffffff; --surface: #fafafa; --surface-2: #f3f3f3;
  --border: #e5e5e5; --border-strong: #d4d4d4;
  --text: #1a1a1a; --text-muted: #6b6b6b; --text-subtle: #9a9a9a;
  --accent: oklch(55% 0.13 250); --accent-soft: oklch(92% 0.03 250);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif; font-size: 15px; line-height: 1.55; color: var(--text); background: var(--bg); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
.page { max-width: 1120px; margin: 0 auto; padding: 56px 40px 40px; }
header { border-bottom: 1px solid var(--border); padding-bottom: 24px; margin-bottom: 16px; }
h1 { font-size: 28px; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 6px; }
.eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 12px; }
.subtitle { font-size: 14px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
h2 { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-subtle); margin: 0 0 14px; }
h3 { font-size: 12px; font-weight: 600; margin: 20px 0 8px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-subtle); }
.muted { color: var(--text-subtle); font-size: 13px; }
.dim { color: var(--text-subtle); font-size: 0.6em; }

.tabs { display: flex; gap: 2px; margin: 20px 0 0; border-bottom: 1px solid var(--border); align-items: center; }
.tab-btn { background: transparent; border: none; padding: 10px 16px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; font-family: inherit; }
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--text); border-bottom-color: var(--accent); }
.print-btn { margin-left: auto; background: transparent; border: 1px solid var(--border); padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px; color: var(--text-muted); font-family: inherit; }
.print-btn:hover { color: var(--text); border-color: var(--border-strong); }

.subnav { display: flex; flex-wrap: wrap; gap: 2px; padding: 12px 0 8px; margin: 0 0 20px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); z-index: 10; }
.subnav-link { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); padding: 6px 10px; text-decoration: none; border-radius: 3px; }
.subnav-link:hover { background: var(--surface); color: var(--text); }

.tab { display: none; }
body[data-active-tab="cm"] #tab-cm, body[data-active-tab="business"] #tab-business { display: block; }

.cm-grid, .business-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card { border: 1px solid var(--border); border-radius: 4px; padding: 20px 22px; background: var(--bg); }
.card.wide { grid-column: 1 / -1; }
.card-hint { color: var(--text-subtle); font-size: 12px; margin: -6px 0 14px; }

.action-table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.action-table td { padding: 8px 10px 8px 0; border-bottom: 1px solid var(--border); vertical-align: top; }
.action-table .kind { width: 140px; color: var(--text-muted); }
.action-table .who { width: 180px; }
.action-table .when { width: 100px; color: var(--text-subtle); font-size: 12px; }
.action-table .detail { color: var(--text-muted); }
.action-table tr:last-child td { border-bottom: none; }

.open-q { padding-left: 20px; margin: 0; }
.open-q li { margin: 10px 0; border-bottom: 1px solid var(--border); padding-bottom: 10px; }
.open-q li:last-child { border-bottom: none; }
.open-q .when { color: var(--text-subtle); font-size: 12px; margin-left: 8px; }
.open-q .q-text { margin-top: 4px; color: var(--text-muted); font-size: 14px; }

.threads { padding-left: 0; margin: 0; list-style: none; }
.threads li { margin: 12px 0; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.threads li:last-child { border-bottom: none; }
.thread-head { display: flex; align-items: baseline; gap: 10px; }
.thread-head .rank { color: var(--text-subtle); font-size: 12px; width: 20px; }
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
.metric .sub { font-size: 12px; color: var(--text-subtle); margin-top: 2px; }
.metric .sub.bench { color: oklch(55% 0.14 145); }

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

.tier-pill { display: inline-block; padding: 1px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; color: #fff; background: oklch(70% 0.04 250); margin-left: 6px; }
.tier-pill.tierchampion { background: oklch(55% 0.14 145); }
.tier-pill.tierpower { background: oklch(55% 0.13 250); }
.tier-pill.tierregular { background: oklch(65% 0.08 250); color: #1a1a1a; }
.tier-pill.tieroccasional { background: oklch(80% 0.04 250); color: #1a1a1a; }
.tier-pill.tieronetime { background: oklch(88% 0.02 250); color: #1a1a1a; }
.tier-pill.tierlurker { background: oklch(92% 0.01 250); color: #6b6b6b; }

.risk-table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.risk-table td { padding: 8px 10px 8px 0; border-bottom: 1px solid var(--border); vertical-align: middle; }
.risk-table tr:last-child td { border-bottom: none; }
.risk { display: flex; align-items: center; gap: 8px; width: 140px; }
.risk-bar { flex: 1; height: 6px; background: var(--surface); border-radius: 3px; overflow: hidden; }
.risk-fill { height: 100%; }
.risk-num { font-size: 12px; color: var(--text-muted); min-width: 24px; text-align: right; }

.tier-dist { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: 13px; margin-bottom: 12px; }
.tier-dist td { padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.tier-dist tr:last-child td { border-bottom: none; }
.tier-dist .tier-label, .tier-dist .stage-label { width: 160px; }
.tier-dist .count { width: 50px; color: var(--text-muted); }
.tier-dist .bar-cell { width: 60%; }
.tier-dist .pct { width: 50px; text-align: right; color: var(--text-muted); }

.filter-bar { display: flex; gap: 6px; margin: 12px 0 8px; flex-wrap: wrap; }
.filter-pill { background: transparent; border: 1px solid var(--border); color: var(--text-muted); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: inherit; letter-spacing: 0.04em; }
.filter-pill:hover { border-color: var(--border-strong); color: var(--text); }
.filter-pill.active { background: var(--text); color: #fff; border-color: var(--text); }

.member-intel { width: 100%; border-collapse: collapse; font-size: 12px; font-variant-numeric: tabular-nums; }
.member-intel th, .member-intel td { padding: 6px 8px; border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap; }
.member-intel th { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-subtle); }
.member-intel th.sortable { cursor: pointer; user-select: none; }
.member-intel th.sortable:hover { color: var(--text); }
.member-intel th.sortable::after { content: ' ⇅'; color: var(--text-subtle); opacity: 0.4; }
.member-intel th.sortable[data-dir="asc"]::after { content: ' ↑'; opacity: 1; }
.member-intel th.sortable[data-dir="desc"]::after { content: ' ↓'; opacity: 1; }
.member-intel tr:last-child td { border-bottom: none; }
.member-intel .rank { width: 24px; color: var(--text-subtle); }
.member-intel .name { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.member-intel .num { text-align: right; }
.member-intel .spark { width: 100px; padding: 2px 8px; }
.sparkline { vertical-align: middle; }
.table-scroll { overflow-x: auto; }

.mini { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.mini td { padding: 6px 8px; border-bottom: 1px solid var(--border); }
.mini tr:last-child td { border-bottom: none; }
.mini .count { text-align: right; color: var(--text-muted); font-size: 12px; }
.dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }

.mix-bar { width: 100%; height: 14px; display: block; margin-bottom: 12px; border-radius: 3px; overflow: hidden; }

.topic-list { columns: 2; column-gap: 32px; padding-left: 0; list-style: none; margin: 8px 0; }
.topic-list li { break-inside: avoid; padding: 4px 0; font-size: 14px; }
.topic-list .when { color: var(--text-subtle); font-size: 12px; margin-left: 6px; }

.pair-list { list-style: none; padding: 0; margin: 8px 0; font-size: 13px; font-variant-numeric: tabular-nums; }
.pair-list li { padding: 4px 0; border-bottom: 1px solid var(--border); }
.pair-list li:last-child { border-bottom: none; }
.pair-list .when { color: var(--text-subtle); font-size: 12px; margin-left: 8px; }

.health-wrap { display: grid; grid-template-columns: 200px 1fr; gap: 32px; align-items: center; }
.health-gauge { flex-shrink: 0; }
.health-components table { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.health-components td { padding: 6px 8px; border-bottom: 1px solid var(--border); }
.health-components td:first-child { color: var(--text-muted); }
.health-components td.bar-cell { width: 50%; }
.health-components td.num { text-align: right; width: 50px; }

.network-wrap { border: 1px solid var(--border); border-radius: 4px; background: var(--surface); margin: 12px 0; }
.network-svg { display: block; width: 100%; height: auto; }
.node { cursor: pointer; }
.node:hover circle { stroke: var(--text); stroke-width: 2; }

.intros { width: 100%; border-collapse: collapse; font-size: 12px; }
.intros th, .intros td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
.intros th { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-subtle); }
.intros tr:last-child td { border-bottom: none; }
.confidence { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; }
.confidence-high { background: oklch(55% 0.14 145); color: #fff; }
.confidence-med { background: oklch(60% 0.13 200); color: #fff; }
.confidence-low { background: oklch(92% 0.01 250); color: var(--text-muted); }

.member-link { cursor: pointer; border-bottom: 1px dashed var(--accent-soft); }
.member-link:hover { color: var(--accent); border-bottom-color: var(--accent); }

.modal { position: fixed; inset: 0; display: none; z-index: 100; }
.modal[aria-hidden="false"] { display: block; }
.modal-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); }
.modal-panel { position: relative; max-width: 480px; margin: 10vh auto; background: var(--bg); border-radius: 6px; padding: 32px 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-panel h3 { font-size: 18px; text-transform: none; letter-spacing: normal; color: var(--text); margin: 0 0 16px; font-weight: 500; }
.modal-close { position: absolute; top: 12px; right: 16px; background: transparent; border: none; font-size: 22px; color: var(--text-subtle); cursor: pointer; }
.modal-close:hover { color: var(--text); }
.kv-dl { display: grid; grid-template-columns: 140px 1fr; gap: 8px 16px; font-size: 13px; margin: 0 0 16px; }
.kv-dl dt { color: var(--text-muted); }
.kv-dl dd { margin: 0; font-variant-numeric: tabular-nums; }

.agent-fill { border-left: 2px solid var(--accent-soft); padding-left: 14px; margin-top: 18px; }
.agent-fill.card { border-left-width: 2px; }
.jtbd-list, .reco-list, .today-list, .week-list, .month-list, .decisions-list { padding-left: 20px; margin: 8px 0; }
.jtbd-list li, .reco-list li, .today-list li, .week-list li, .month-list li, .decisions-list li { margin: 12px 0; }
.draft-placeholder { padding: 12px 14px; background: var(--surface); border-radius: 4px; }

.cm-subnav { display: flex; flex-wrap: wrap; gap: 2px; padding: 12px 0 8px; margin: 0 0 20px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); z-index: 10; }

.horizon-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.horizon-header h2 { margin: 0; }
.horizon-pill { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; }
.pill-today { background: oklch(55% 0.16 30); }
.pill-week { background: oklch(55% 0.13 250); }
.pill-month { background: oklch(55% 0.14 145); }
.pill-decisions { background: oklch(55% 0.14 300); }

.horizon-today { border-left: 3px solid oklch(55% 0.16 30); }
.horizon-week { border-left: 3px solid oklch(55% 0.13 250); }
.horizon-month { border-left: 3px solid oklch(55% 0.14 145); }
.horizon-decisions { border-left: 3px solid oklch(55% 0.14 300); }

.draft-card, .decision-card, .action-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 14px 16px; margin: 10px 0; }
.draft-card-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; }
.draft-card-header h4 { font-size: 13px; font-weight: 600; margin: 0; color: var(--text); text-transform: none; letter-spacing: 0; }
.draft-card-meta { font-size: 11px; color: var(--text-subtle); }
.draft-text { background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 10px 12px; font-size: 13px; color: var(--text); margin: 8px 0; white-space: pre-wrap; }
.draft-actions { display: flex; gap: 8px; margin-top: 8px; }
.btn-copy, .btn-dismiss { background: transparent; border: 1px solid var(--border); padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; color: var(--text-muted); font-family: inherit; letter-spacing: 0.04em; text-transform: uppercase; }
.btn-copy:hover, .btn-dismiss:hover { color: var(--text); border-color: var(--border-strong); }
.btn-copy { background: var(--text); color: var(--bg); border-color: var(--text); }
.btn-copy:hover { background: oklch(25% 0.01 250); color: #fff; }
.why-data { font-size: 11px; color: var(--text-subtle); margin-top: 6px; font-style: italic; }

.supporting { margin-top: 24px; border-top: 1px solid var(--border); padding-top: 12px; }
.supporting summary { cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-subtle); padding: 8px 0; user-select: none; }
.supporting summary:hover { color: var(--text); }
.supporting[open] summary { color: var(--text); margin-bottom: 16px; }
.supporting-grid { margin-top: 8px; }

.legend { display: flex; flex-wrap: wrap; gap: 12px; margin: 8px 0 12px; font-size: 11px; }
.legend-chip { display: inline-flex; align-items: center; gap: 5px; color: var(--text-muted); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.net-edge { transition: opacity 0.15s; }
.node { transition: opacity 0.15s; }

code { font-family: 'SF Mono', ui-monospace, Menlo, monospace; font-size: 0.88em; background: var(--surface); padding: 1px 5px; border-radius: 3px; border: 1px solid var(--border); }

footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 11px; letter-spacing: 0.04em; color: var(--text-subtle); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
footer a { color: var(--text-subtle); text-decoration: none; }
footer a:hover { color: var(--text); }

@media print {
  html, body { background: #fff; color: #1a1a1a; font-size: 10.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { padding: 0; max-width: none; }
  nav.tabs, .print-btn, .subnav, .filter-bar, .modal, .modal-close { display: none !important; }
  body[data-active-tab="cm"] #tab-business, body[data-active-tab="business"] #tab-cm { display: none !important; }
  .card { border: 1px solid #e5e5e5; page-break-inside: avoid; }
  h1 { font-size: 20pt; }
  .metric .value { font-size: 18pt; }
  .cm-grid, .business-grid { grid-template-columns: 1fr; }
  .health-wrap { grid-template-columns: 140px 1fr; }
  .member-intel { font-size: 9pt; }
  @page { margin: 18mm 16mm; @bottom-center { content: "Powered by Vibra · getvibra.co"; font-size: 9pt; color: #9a9a9a; } }
}

@media (max-width: 900px) {
  .cm-grid, .business-grid, .metrics, .two-col, .topic-list, .health-wrap { grid-template-columns: 1fr !important; columns: 1 !important; }
  .page { padding: 32px 20px; }
  .metrics { gap: 16px; }
  .subnav { overflow-x: auto; flex-wrap: nowrap; }
}
`;
