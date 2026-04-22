const DAY_MS = 24 * 60 * 60 * 1000;
const REPLY_WINDOW_MS = 30 * 60 * 1000;

export function buildPersonas(parsedMessages, { sinceIso, untilIso, rosterSize } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted && m.sender);
  const inWindow = real.filter(m => m.sentAt >= sinceIso && m.sentAt <= untilIso);

  const stats = new Map();
  for (const m of inWindow) {
    const s = stats.get(m.sender) ?? {
      name: m.sender, messages: 0, questions: 0, repliesGiven: 0, repliesReceived: 0,
      linksShared: 0, mediaShared: 0,
      distinctPeopleReplied: new Set(), distinctReplyers: new Set(),
      firstAt: m.sentAt, lastAt: m.sentAt,
    };
    s.messages++;
    if (/[?¿]/.test(m.text ?? '')) s.questions++;
    if (/https?:\/\//.test(m.text ?? '')) s.linksShared++;
    if (m.mediaKind) s.mediaShared++;
    if (m.sentAt < s.firstAt) s.firstAt = m.sentAt;
    if (m.sentAt > s.lastAt) s.lastAt = m.sentAt;
    stats.set(m.sender, s);
  }

  for (let i = 0; i < inWindow.length; i++) {
    const q = inWindow[i];
    const qMs = new Date(q.sentAt).getTime();
    for (let j = i + 1; j < inWindow.length; j++) {
      const r = inWindow[j];
      const rMs = new Date(r.sentAt).getTime();
      if (rMs - qMs > REPLY_WINDOW_MS) break;
      if (!r.sender || r.sender === q.sender) continue;
      if ((r.text ?? '').length < 30) continue;

      const replier = stats.get(r.sender);
      const original = stats.get(q.sender);
      if (!replier || !original) continue;
      replier.repliesGiven++;
      replier.distinctPeopleReplied.add(q.sender);
      original.repliesReceived++;
      original.distinctReplyers.add(r.sender);
    }
  }

  const untilMs = new Date(untilIso).getTime();
  const windowStartMs = new Date(sinceIso).getTime();
  const halfMs = windowStartMs + (untilMs - windowStartMs) / 2;

  const firstEverBy = new Map();
  for (const m of real) {
    if (!firstEverBy.has(m.sender) || m.sentAt < firstEverBy.get(m.sender)) firstEverBy.set(m.sender, m.sentAt);
  }

  const messageCounts = [...stats.values()].map(s => s.messages).sort((a, b) => b - a);
  const p10 = percentileThreshold(messageCounts, 0.10);
  const p30 = percentileThreshold(messageCounts, 0.30);
  const p60 = percentileThreshold(messageCounts, 0.60);

  const members = [...stats.values()].map(s => {
    const qRatio = s.messages > 0 ? s.questions / s.messages : 0;
    const giverPct = s.messages > 0 ? s.repliesGiven / s.messages : 0;
    const distinctPartners = s.distinctPeopleReplied.size;
    const attention = s.repliesReceived;
    const influence = Math.round(Math.sqrt(Math.max(0, attention)) * 10 + s.distinctReplyers.size * 4);
    const firstEver = firstEverBy.get(s.name);
    const isNew = firstEver && new Date(firstEver).getTime() >= windowStartMs;
    const daysSinceActive = Math.floor((untilMs - new Date(s.lastAt).getTime()) / DAY_MS);

    const earlyCount = [...inWindow].filter(m => m.sender === s.name && new Date(m.sentAt).getTime() < halfMs).length;
    const lateCount = s.messages - earlyCount;
    const trendDecline = earlyCount > 0 ? Math.max(0, 1 - lateCount / earlyCount) : 0;
    const recencyRisk = daysSinceActive > 30 ? 1 : daysSinceActive > 14 ? 0.5 : daysSinceActive > 7 ? 0.2 : 0;
    const disengageRisk = Math.min(100, Math.round(trendDecline * 50 + recencyRisk * 50));

    let tier;
    if (s.messages >= p10) tier = 'Champion';
    else if (s.messages >= p30) tier = 'Power';
    else if (s.messages >= p60) tier = 'Regular';
    else if (s.messages >= 3) tier = 'Occasional';
    else tier = 'One-time';

    const tags = [];
    if (s.repliesGiven >= 3 && giverPct >= 0.25) tags.push('helper');
    if (s.questions >= 3 && qRatio >= 0.3) tags.push('asker');
    if (distinctPartners >= 5) tags.push('connector');
    if (s.linksShared >= 3) tags.push('content-sharer');
    if (isNew) tags.push('newcomer');
    if (disengageRisk >= 60) tags.push('at-risk');
    if (tags.length === 0 && s.messages >= 10) tags.push('regular');
    if (tags.length === 0) tags.push('observer');

    return {
      name: s.name,
      tier,
      messages: s.messages,
      questions: s.questions,
      repliesGiven: s.repliesGiven,
      attention,
      influence,
      giverPct: +giverPct.toFixed(2),
      distinctPartners,
      linksShared: s.linksShared,
      lastActive: s.lastAt.slice(0, 10),
      daysSinceActive,
      disengageRisk,
      tags,
    };
  });

  const activePostingSenders = new Set(members.map(m => m.name));
  const tierCounts = {
    Champion: members.filter(m => m.tier === 'Champion').length,
    Power: members.filter(m => m.tier === 'Power').length,
    Regular: members.filter(m => m.tier === 'Regular').length,
    Occasional: members.filter(m => m.tier === 'Occasional').length,
    'One-time': members.filter(m => m.tier === 'One-time').length,
    Lurker: rosterSize ? Math.max(0, rosterSize - activePostingSenders.size) : 0,
  };

  const clusterOrder = ['helper', 'asker', 'connector', 'content-sharer', 'newcomer', 'at-risk', 'regular', 'observer'];
  const clusters = {};
  for (const key of clusterOrder) {
    const list = members.filter(m => m.tags.includes(key));
    const sortKey = {
      helper: 'repliesGiven', asker: 'questions', connector: 'distinctPartners',
      'content-sharer': 'linksShared', newcomer: 'messages',
      'at-risk': 'disengageRisk', regular: 'messages', observer: 'messages',
    }[key];
    clusters[key] = list.sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  }
  clusters.lurker_count = tierCounts.Lurker;

  const atRisk = members.filter(m => m.disengageRisk >= 40).sort((a, b) => b.disengageRisk - a.disengageRisk).slice(0, 10);
  const topInfluence = [...members].sort((a, b) => b.influence - a.influence).slice(0, 10);
  const topGivers = members.filter(m => m.messages >= 5).sort((a, b) => b.giverPct - a.giverPct).slice(0, 10);

  return { members, clusters, tierCounts, atRisk, topInfluence, topGivers };
}

function percentileThreshold(sortedDesc, p) {
  if (sortedDesc.length === 0) return Infinity;
  const idx = Math.max(0, Math.ceil(sortedDesc.length * p) - 1);
  return sortedDesc[idx];
}
