import { computeRoster } from './roster.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const FRUSTRATION_PATTERNS = [
  /still waiting|been waiting/i,
  /sigo esperando|llevo esperando/i,
  /ignored|feel ignored/i,
  /me ignoran|me siento ignorad/i,
  /frustrated|frustrating/i,
  /frustrad[oa]/i,
  /considering leaving|thinking of leaving|may leave/i,
  /me voy a ir|quiero cancelar|considerando cancelar/i,
  /waste of (time|money)/i,
  /no entiendo nada|sigo sin entender/i,
  /nadie (me )?(respond|contest|ayud)/i,
];

export function buildActionList(parsedMessages, { sinceIso, untilIso } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted);
  const joinedEvents = parsedMessages.filter(m => m.kind === 'joined');

  if (!untilIso) untilIso = real.reduce((m, x) => x.sentAt > m ? x.sentAt : m, '');
  if (!sinceIso && untilIso) sinceIso = new Date(new Date(untilIso).getTime() - 7 * DAY_MS).toISOString();
  if (!sinceIso || !untilIso) throw new Error('No messages in this export.');

  const silentJoiners = findSilentJoiners(joinedEvents, real, sinceIso, untilIso);
  const welcomeGaps = findWelcomeGaps(joinedEvents, real, sinceIso, untilIso);
  const frustrationCandidates = findFrustrationCandidates(real, sinceIso, untilIso);
  const shoutoutCandidates = findShoutoutCandidates(real, sinceIso, untilIso);
  const roster = computeRoster(parsedMessages, { windowStartIso: sinceIso, windowEndIso: untilIso });

  return {
    sinceIso, untilIso,
    silentJoiners,
    longSilentMembers: roster.longSilent,
    welcomeGaps,
    frustrationCandidates,
    shoutoutCandidates,
    rosterStats: {
      rosterSize: roster.rosterSize,
      activeInWindow: roster.activeInWindow,
      neverPosted: roster.neverPosted,
    },
  };
}

function findSilentJoiners(joined, real, sinceIso, untilIso) {
  const joinedInWindow = joined.filter(j => j.sentAt >= sinceIso && j.sentAt <= untilIso && j.sender);
  const out = [];
  for (const j of joinedInWindow) {
    const msgCount = real.filter(m => m.sender === j.sender && m.sentAt >= j.sentAt).length;
    if (msgCount === 0) out.push({ sender: j.sender, joinedAt: j.sentAt });
  }
  return out;
}

function findWelcomeGaps(joined, real, sinceIso, untilIso) {
  const joinedInWindow = joined.filter(j => j.sentAt >= sinceIso && j.sentAt <= untilIso && j.sender);
  const out = [];
  for (const j of joinedInWindow) {
    const firstMsg = real.find(m => m.sender === j.sender && m.sentAt >= j.sentAt);
    if (!firstMsg) continue;
    const fMs = new Date(firstMsg.sentAt).getTime();
    const replied = real.some(m =>
      m.sender !== j.sender
      && new Date(m.sentAt).getTime() > fMs
      && new Date(m.sentAt).getTime() - fMs < 24 * HOUR_MS,
    );
    if (!replied) {
      out.push({ sender: j.sender, joinedAt: j.sentAt, firstMessageAt: firstMsg.sentAt, firstMessage: firstMsg.text });
    }
  }
  return out;
}

function findFrustrationCandidates(real, sinceIso, untilIso) {
  return real
    .filter(m => m.sentAt >= sinceIso && m.sentAt <= untilIso)
    .filter(m => FRUSTRATION_PATTERNS.some(re => re.test(m.text ?? '')))
    .map(m => ({ sender: m.sender, sentAt: m.sentAt, text: m.text }));
}

function findShoutoutCandidates(real, sinceIso, untilIso) {
  const inWindow = real.filter(m => m.sentAt >= sinceIso && m.sentAt <= untilIso);
  const helperCounts = new Map();
  const helperSamples = new Map();

  for (let i = 0; i < inWindow.length; i++) {
    const q = inWindow[i];
    if (!/\?\s*$/.test((q.text ?? '').trim())) continue;
    const qMs = new Date(q.sentAt).getTime();
    for (let j = i + 1; j < inWindow.length; j++) {
      const r = inWindow[j];
      const rMs = new Date(r.sentAt).getTime();
      if (rMs - qMs > 30 * 60 * 1000) break;
      if (r.sender === q.sender || !r.sender) continue;
      if ((r.text ?? '').length < 30) continue;
      helperCounts.set(r.sender, (helperCounts.get(r.sender) || 0) + 1);
      if (!helperSamples.has(r.sender)) helperSamples.set(r.sender, { question: q.text, reply: r.text, at: r.sentAt });
    }
  }

  return [...helperCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ sender: name, helpCount: count, sample: helperSamples.get(name) }));
}
