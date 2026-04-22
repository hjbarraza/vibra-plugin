export function buildProfile(parsedMessages, { member, sinceIso, untilIso } = {}) {
  if (!member) throw new Error('Profile requires a --member name.');

  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted);
  const effectiveSince = sinceIso ?? (real[0]?.sentAt ?? null);
  const effectiveUntil = untilIso ?? (real.at(-1)?.sentAt ?? null);
  if (!effectiveSince || !effectiveUntil) throw new Error('No messages in this export.');

  const inWindow = real.filter(m => m.sentAt >= effectiveSince && m.sentAt <= effectiveUntil);
  const mine = inWindow.filter(m => m.sender === member);
  if (mine.length === 0) return { member, sinceIso: effectiveSince, untilIso: effectiveUntil, notFound: true };

  const activeDays = new Set(mine.map(m => m.sentAt.slice(0, 10))).size;
  const lengths = mine.map(m => (m.text ?? '').length);
  const avgLength = lengths.reduce((s, v) => s + v, 0) / lengths.length;
  const questionsAsked = mine.filter(m => /[?¿]/.test(m.text ?? '')).length;

  const hourCounts = Array(24).fill(0);
  const dayCounts = Array(7).fill(0);
  for (const m of mine) {
    const d = new Date(m.sentAt);
    hourCounts[d.getHours()]++;
    dayCounts[d.getDay()]++;
  }
  const peakHours = hourCounts
    .map((c, h) => ({ h, c })).sort((a, b) => b.c - a.c).slice(0, 3)
    .filter(x => x.c > 0).map(x => x.h);
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const peakDays = dayCounts
    .map((c, d) => ({ d, c })).sort((a, b) => b.c - a.c).slice(0, 3)
    .filter(x => x.c > 0).map(x => DAYS[x.d]);

  const repliesGiven = countRepliesGiven(inWindow, member);
  const engagedWith = mostEngagedWith(inWindow, member);

  const sampleMessages = [...mine]
    .sort((a, b) => (b.text ?? '').length - (a.text ?? '').length)
    .slice(0, 10)
    .map(m => ({ sentAt: m.sentAt, text: m.text }));

  return {
    member,
    sinceIso: effectiveSince, untilIso: effectiveUntil,
    totalMessages: mine.length,
    firstSeenAt: mine[0].sentAt,
    lastSeenAt: mine.at(-1).sentAt,
    activeDays,
    avgMessageLength: +avgLength.toFixed(1),
    questionsAsked,
    repliesGiven,
    peakHours,
    peakDays,
    engagedWith,
    sampleMessages,
  };
}

function countRepliesGiven(msgs, member) {
  let count = 0;
  for (let i = 0; i < msgs.length; i++) {
    const q = msgs[i];
    if (!/[?¿]/.test(q.text ?? '') || q.sender === member) continue;
    const qMs = new Date(q.sentAt).getTime();
    for (let j = i + 1; j < msgs.length; j++) {
      const rMs = new Date(msgs[j].sentAt).getTime();
      if (rMs - qMs > 30 * 60 * 1000) break;
      if (msgs[j].sender === member && (msgs[j].text ?? '').length > 10) { count++; break; }
    }
  }
  return count;
}

function mostEngagedWith(msgs, member) {
  const counts = new Map();
  for (let i = 0; i < msgs.length; i++) {
    if (msgs[i].sender !== member) continue;
    const t = new Date(msgs[i].sentAt).getTime();
    for (let j = Math.max(0, i - 3); j <= Math.min(msgs.length - 1, i + 3); j++) {
      if (j === i) continue;
      if (!msgs[j].sender || msgs[j].sender === member) continue;
      if (Math.abs(new Date(msgs[j].sentAt).getTime() - t) > 30 * 60 * 1000) continue;
      counts.set(msgs[j].sender, (counts.get(msgs[j].sender) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
}
