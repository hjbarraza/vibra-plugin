import { buildPulse } from './pulse.js';
import { buildDigest } from './digest.js';
import { computeRoster } from './roster.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildReport(parsedMessages, { sinceIso, untilIso } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted);
  const joinedEvents = parsedMessages.filter(m => m.kind === 'joined');

  if (!untilIso) untilIso = real.reduce((m, x) => x.sentAt > m ? x.sentAt : m, '');
  if (!sinceIso && untilIso) sinceIso = new Date(new Date(untilIso).getTime() - 30 * DAY_MS).toISOString();
  if (!sinceIso || !untilIso) throw new Error('No messages in this export.');

  const pulse = buildPulse(parsedMessages, { sinceIso, untilIso });
  const digest = buildDigest(parsedMessages, { sinceIso, untilIso });

  const newMemberCount = joinedEvents.filter(j => j.sentAt >= sinceIso && j.sentAt <= untilIso).length;
  const prevSinceIso = new Date(new Date(sinceIso).getTime() - 30 * DAY_MS).toISOString();
  const prevMessages = real.filter(m => m.sentAt >= prevSinceIso && m.sentAt < sinceIso).length;
  const prevActive = new Set(real.filter(m => m.sentAt >= prevSinceIso && m.sentAt < sinceIso).map(m => m.sender).filter(Boolean)).size;
  const prevRoster = computeRoster(parsedMessages, { windowStartIso: prevSinceIso, windowEndIso: sinceIso });

  return {
    sinceIso, untilIso,
    thisPeriod: {
      totalMessages: pulse.totalMessages,
      distinctMembers: pulse.distinctMembers,
      newMembers: newMemberCount,
      responseRate: pulse.responseRate,
      gini: pulse.gini,
      threadStats: pulse.threadStats,
      topContributors: pulse.contributors.slice(0, 10),
      roster: pulse.roster,
    },
    previousPeriod: {
      totalMessages: prevMessages,
      distinctMembers: prevActive,
      rosterActive: prevRoster.activeInWindow,
      rosterSize: prevRoster.rosterSize,
    },
    topThreads: digest.topThreads,
    openAsks: digest.openAsks,
    newMembers: digest.newMembers,
    quiet: digest.quiet,
  };
}
