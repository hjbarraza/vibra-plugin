const DAY_MS = 24 * 60 * 60 * 1000;
const LONG_SILENT_DAYS = 30;

export function computeRoster(parsedMessages, { windowStartIso, windowEndIso } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted && m.sender);
  const joined = parsedMessages.filter(m => m.kind === 'joined' && m.sender);

  const everPosted = new Set(real.map(m => m.sender));
  const roster = new Set([...everPosted, ...joined.map(m => m.sender)]);

  const firstSeen = new Map();
  for (const m of [...real, ...joined]) {
    if (!firstSeen.has(m.sender) || m.sentAt < firstSeen.get(m.sender)) {
      firstSeen.set(m.sender, m.sentAt);
    }
  }

  const activeInWindow = new Set();
  if (windowStartIso && windowEndIso) {
    for (const m of real) {
      if (m.sentAt >= windowStartIso && m.sentAt <= windowEndIso) activeInWindow.add(m.sender);
    }
  }

  const referenceIso = windowEndIso ?? real.reduce((max, m) => m.sentAt > max ? m.sentAt : max, '');
  const refMs = referenceIso ? new Date(referenceIso).getTime() : Date.now();

  const longSilent = [];
  for (const name of roster) {
    if (everPosted.has(name)) continue;
    const first = firstSeen.get(name);
    if (!first) continue;
    const silentDays = Math.floor((refMs - new Date(first).getTime()) / DAY_MS);
    if (silentDays >= LONG_SILENT_DAYS) longSilent.push({ sender: name, firstSeenAt: first, silentDays });
  }
  longSilent.sort((a, b) => b.silentDays - a.silentDays);

  return {
    rosterSize: roster.size,
    rosterIsLowerBound: true,
    everPosted: everPosted.size,
    neverPosted: roster.size - everPosted.size,
    activeInWindow: activeInWindow.size,
    silentInWindow: roster.size - activeInWindow.size,
    longSilent,
  };
}
