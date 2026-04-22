const DAY_MS = 24 * 60 * 60 * 1000;

export function buildCmContext(parsedMessages, { sinceIso, untilIso, personas, topics } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted && m.sender);
  const inWindow = real.filter(m => m.sentAt >= sinceIso && m.sentAt <= untilIso);

  const cmName = detectCM(personas?.members ?? [], real, sinceIso);
  const voiceSamples = cmName ? pickVoiceSamples(real, cmName) : [];
  const peakWindows = computePeakWindows(inWindow);
  const moderatorCandidates = findModeratorCandidates(personas?.members ?? [], real, sinceIso);
  const dormantTopics = findDormantTopics(topics, parsedMessages, sinceIso, untilIso);
  const activeTopHours = topHoursToday(inWindow, untilIso);

  return {
    cmName,
    voiceSamples,
    peakWindows,
    moderatorCandidates,
    dormantTopics,
    activeTopHours,
  };
}

function detectCM(members, allReal, sinceIso) {
  if (!members.length) return null;
  const sorted = [...members].sort((a, b) => b.influence - a.influence);
  const topInfluence = sorted.slice(0, 5);
  const firstSeenMap = new Map();
  for (const m of allReal) {
    if (!firstSeenMap.has(m.sender) || m.sentAt < firstSeenMap.get(m.sender)) firstSeenMap.set(m.sender, m.sentAt);
  }
  const scored = topInfluence.map(m => ({
    name: m.name,
    influence: m.influence,
    tenure: firstSeenMap.get(m.name) ?? '',
    score: m.influence + (firstSeenMap.get(m.name) && firstSeenMap.get(m.name) < sinceIso ? 30 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.name ?? null;
}

function pickVoiceSamples(realMessages, cmName) {
  const theirs = realMessages
    .filter(m => m.sender === cmName && (m.text ?? '').length > 40 && (m.text ?? '').length < 500)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .slice(0, 6);
  return theirs.map(m => ({ sentAt: m.sentAt, text: m.text }));
}

function computePeakWindows(inWindow) {
  const bucket = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const m of inWindow) {
    const d = new Date(m.sentAt);
    bucket[d.getDay()][d.getHours()]++;
  }
  const flat = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) flat.push({ day: d, hour: h, count: bucket[d][h] });
  flat.sort((a, b) => b.count - a.count);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return flat.slice(0, 3).map(p => ({
    label: `${dayNames[p.day]} ${String(p.hour).padStart(2, '0')}:00`,
    count: p.count,
    day: p.day, hour: p.hour,
  }));
}

function topHoursToday(inWindow, untilIso) {
  const hourCounts = Array(24).fill(0);
  for (const m of inWindow) hourCounts[new Date(m.sentAt).getHours()]++;
  const ranked = hourCounts.map((c, h) => ({ hour: h, count: c })).sort((a, b) => b.count - a.count).slice(0, 3);
  return ranked.map(r => ({ hour: r.hour, label: `${String(r.hour).padStart(2, '0')}:00` }));
}

function findModeratorCandidates(members, allReal, sinceIso) {
  const firstSeenMap = new Map();
  for (const m of allReal) {
    if (!firstSeenMap.has(m.sender) || m.sentAt < firstSeenMap.get(m.sender)) firstSeenMap.set(m.sender, m.sentAt);
  }
  const now = new Date(sinceIso).getTime();
  const candidates = members.filter(m => {
    const tenureDays = firstSeenMap.get(m.name) ? (now - new Date(firstSeenMap.get(m.name)).getTime()) / DAY_MS : 0;
    return (m.tier === 'Power' || (m.tier === 'Champion' && m.messages < 60))
      && m.tags.includes('helper')
      && tenureDays >= 30
      && m.disengageRisk < 40;
  });
  candidates.sort((a, b) => b.influence - a.influence);
  return candidates.slice(0, 5).map(m => ({ name: m.name, tier: m.tier, influence: m.influence, helpReplies: m.repliesGiven }));
}

function findDormantTopics(topics, parsedMessages, sinceIso, untilIso) {
  if (!topics || !topics.topTokens) return [];
  const windowStart = new Date(sinceIso).getTime();
  const windowEnd = new Date(untilIso).getTime();
  const prevStart = windowStart - (windowEnd - windowStart);
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted);

  const prevCounts = new Map();
  const nowCounts = new Map();
  for (const m of real) {
    const t = new Date(m.sentAt).getTime();
    const text = (m.text ?? '').toLowerCase();
    if (t >= prevStart && t < windowStart) {
      for (const tok of topics.topTokens) if (text.includes(tok.token)) prevCounts.set(tok.token, (prevCounts.get(tok.token) || 0) + 1);
    } else if (t >= windowStart && t <= windowEnd) {
      for (const tok of topics.topTokens) if (text.includes(tok.token)) nowCounts.set(tok.token, (nowCounts.get(tok.token) || 0) + 1);
    }
  }

  const dormant = [];
  for (const tok of topics.topTokens) {
    const prev = prevCounts.get(tok.token) || 0;
    const now = nowCounts.get(tok.token) || 0;
    if (prev >= 5 && now < prev * 0.3) {
      dormant.push({ token: tok.token, previousCount: prev, currentCount: now, drop: prev - now });
    }
  }
  dormant.sort((a, b) => b.drop - a.drop);
  return dormant.slice(0, 5);
}
