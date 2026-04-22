import { computeRoster } from './roster.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildPulse(parsedMessages, { sinceIso, untilIso } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted);

  if (!untilIso) untilIso = real.reduce((m, x) => x.sentAt > m ? x.sentAt : m, '');
  if (!sinceIso && untilIso) sinceIso = new Date(new Date(untilIso).getTime() - 7 * DAY_MS).toISOString();
  if (!sinceIso || !untilIso) throw new Error('No messages in this export.');

  const inWindow = real.filter(m => m.sentAt >= sinceIso && m.sentAt <= untilIso);
  const totalMessages = inWindow.length;
  const distinctMembers = new Set(inWindow.map(m => m.sender).filter(Boolean)).size;

  const messagesByDay = bucketByDay(inWindow, sinceIso, untilIso);
  const messagesByHourOfWeek = bucketByHourOfWeek(inWindow);
  const contributors = topContributors(inWindow);
  const gini = giniCoefficient(contributors.map(c => c.count));
  const responseRate = computeResponseRate(inWindow);
  const threadStats = computeThreadStats(inWindow);
  const roster = computeRoster(parsedMessages, { windowStartIso: sinceIso, windowEndIso: untilIso });

  return {
    sinceIso, untilIso,
    totalMessages, distinctMembers,
    messagesByDay,
    messagesByHourOfWeek,
    contributors,
    gini,
    responseRate,
    threadStats,
    roster,
  };
}

function bucketByDay(msgs, sinceIso, untilIso) {
  const buckets = new Map();
  const start = new Date(sinceIso); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(untilIso); end.setUTCHours(0, 0, 0, 0);
  for (let d = start.getTime(); d <= end.getTime(); d += DAY_MS) {
    buckets.set(new Date(d).toISOString().slice(0, 10), 0);
  }
  for (const m of msgs) {
    const day = m.sentAt.slice(0, 10);
    if (buckets.has(day)) buckets.set(day, buckets.get(day) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

function bucketByHourOfWeek(msgs) {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const m of msgs) {
    const d = new Date(m.sentAt);
    grid[d.getDay()][d.getHours()]++;
  }
  return grid;
}

function topContributors(msgs) {
  const counts = new Map();
  for (const m of msgs) {
    if (!m.sender) continue;
    counts.set(m.sender, (counts.get(m.sender) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}

function giniCoefficient(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((s, v) => s + v, 0);
  if (sum === 0) return 0;
  let cum = 0;
  for (let i = 0; i < n; i++) cum += (i + 1) * sorted[i];
  return (2 * cum) / (n * sum) - (n + 1) / n;
}

function computeResponseRate(msgs) {
  const questions = msgs.filter(m => /\?\s*$/.test((m.text ?? '').trim()));
  if (questions.length === 0) return { questions: 0, answered: 0, rate: null };
  let answered = 0;
  for (const q of questions) {
    const qMs = new Date(q.sentAt).getTime();
    const hasReply = msgs.some(m =>
      m.sender !== q.sender
      && new Date(m.sentAt).getTime() > qMs
      && new Date(m.sentAt).getTime() - qMs < 30 * 60 * 1000,
    );
    if (hasReply) answered++;
  }
  return { questions: questions.length, answered, rate: answered / questions.length };
}

function computeThreadStats(msgs) {
  if (msgs.length === 0) return { count: 0, avgLength: 0, avgParticipants: 0 };
  const gap = 30 * 60 * 1000;
  const threads = [];
  let cur = null;
  for (const m of msgs) {
    const t = new Date(m.sentAt).getTime();
    if (!cur || t - cur.lastMs > gap) {
      if (cur) threads.push(cur);
      cur = { msgs: 0, participants: new Set(), lastMs: t };
    }
    cur.msgs++;
    if (m.sender) cur.participants.add(m.sender);
    cur.lastMs = t;
  }
  if (cur) threads.push(cur);
  const avgLength = threads.reduce((s, t) => s + t.msgs, 0) / threads.length;
  const avgParticipants = threads.reduce((s, t) => s + t.participants.size, 0) / threads.length;
  return { count: threads.length, avgLength: +avgLength.toFixed(1), avgParticipants: +avgParticipants.toFixed(1) };
}
