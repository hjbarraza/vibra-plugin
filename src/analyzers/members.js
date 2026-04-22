import { computeRoster } from './roster.js';

export function buildMemberList(parsedMessages, { sinceIso, untilIso } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted && m.sender);
  const windowed = (sinceIso && untilIso)
    ? real.filter(m => m.sentAt >= sinceIso && m.sentAt <= untilIso)
    : real;

  const map = new Map();
  for (const m of windowed) {
    const cur = map.get(m.sender) ?? { sender: m.sender, messageCount: 0, firstSeenAt: m.sentAt, lastSeenAt: m.sentAt };
    cur.messageCount++;
    if (m.sentAt < cur.firstSeenAt) cur.firstSeenAt = m.sentAt;
    if (m.sentAt > cur.lastSeenAt) cur.lastSeenAt = m.sentAt;
    map.set(m.sender, cur);
  }

  const members = [...map.values()].sort((a, b) => b.messageCount - a.messageCount);
  const roster = computeRoster(parsedMessages, { windowStartIso: sinceIso, windowEndIso: untilIso });

  return {
    sinceIso: sinceIso ?? (real[0]?.sentAt ?? null),
    untilIso: untilIso ?? (real.at(-1)?.sentAt ?? null),
    rosterSize: roster.rosterSize,
    postersCount: members.length,
    neverPosted: roster.neverPosted,
    longSilentCount: roster.longSilent.length,
    members,
  };
}
