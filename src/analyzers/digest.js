import { detectThreads } from './threads.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildDigest(parsedMessages, { sinceIso, untilIso } = {}) {
  const realMessages = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted);

  if (!untilIso) {
    untilIso = realMessages.reduce((max, m) => m.sentAt > max ? m.sentAt : max, '');
  }
  if (!sinceIso && untilIso) {
    sinceIso = new Date(new Date(untilIso).getTime() - 7 * DAY_MS).toISOString();
  }
  if (!sinceIso || !untilIso) {
    throw new Error('No messages in this export.');
  }

  const inWindow = realMessages
    .filter(m => m.sentAt >= sinceIso && m.sentAt <= untilIso)
    .map(m => ({ ...m, canonical_name: m.sender, sent_at: m.sentAt, media_kind: m.mediaKind }));

  const prevStartIso = new Date(new Date(sinceIso).getTime() - 7 * DAY_MS).toISOString();
  const newMembers = computeNewMembers(realMessages, sinceIso, untilIso);
  const quiet = computeQuietMembers(realMessages, prevStartIso, sinceIso, untilIso);

  const threads = detectThreads(inWindow);
  threads.sort((a, b) => b.score - a.score);
  const topThreads = threads.slice(0, 5).map(t => ({
    participants: t.participants,
    messageCount: t.messageCount,
    startAt: t.startAt,
    endAt: t.endAt,
    messages: t.messages.map(m => ({ sender: m.canonical_name, sentAt: m.sent_at, text: m.text, mediaKind: m.media_kind })),
  }));

  const openAsks = [];
  for (const q of inWindow) {
    if (!/\?\s*$/.test((q.text ?? '').trim())) continue;
    const qMs = new Date(q.sent_at).getTime();
    const replied = inWindow.some(m =>
      m.canonical_name !== q.canonical_name
      && new Date(m.sent_at).getTime() > qMs
      && new Date(m.sent_at).getTime() - qMs < 30 * 60 * 1000,
    );
    if (!replied) openAsks.push({ sender: q.canonical_name, sentAt: q.sent_at, text: q.text });
  }

  const distinctMembers = new Set(inWindow.map(m => m.canonical_name).filter(Boolean)).size;

  return {
    sinceIso, untilIso,
    totalMessages: inWindow.length,
    distinctMembers,
    topThreads,
    openAsks,
    newMembers,
    quiet,
  };
}

function computeNewMembers(messages, sinceIso, untilIso) {
  const firstSeen = new Map();
  for (const m of messages) {
    if (!m.sender) continue;
    if (!firstSeen.has(m.sender) || m.sentAt < firstSeen.get(m.sender)) {
      firstSeen.set(m.sender, m.sentAt);
    }
  }
  const out = [];
  for (const [name, firstAt] of firstSeen) {
    if (firstAt >= sinceIso && firstAt <= untilIso) {
      out.push({ canonical_name: name, first_seen_at: firstAt });
    }
  }
  return out.sort((a, b) => a.first_seen_at.localeCompare(b.first_seen_at));
}

function computeQuietMembers(messages, prevStart, windowStart, windowEnd) {
  const activePrev = new Set();
  const activeWindow = new Set();
  for (const m of messages) {
    if (!m.sender) continue;
    if (m.sentAt >= prevStart && m.sentAt < windowStart) activePrev.add(m.sender);
    if (m.sentAt >= windowStart && m.sentAt <= windowEnd) activeWindow.add(m.sender);
  }
  return [...activePrev].filter(n => !activeWindow.has(n)).slice(0, 10);
}
