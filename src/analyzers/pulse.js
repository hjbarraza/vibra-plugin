import { detectThreads } from './threads.js';
import { computeRoster } from './roster.js';
import { buildActionList } from './action-list.js';
import { buildDigest } from './digest.js';
import { buildUnanswered } from './unanswered.js';
import { buildContentIdeas } from './content-ideas.js';
import { buildPersonas } from './personas.js';
import { buildTopics } from './topics.js';
import { buildMemberList } from './members.js';
import { buildNetworkMap } from './network-map.js';
import { buildAsksOffers } from './asks-offers.js';
import { buildGratitude } from './gratitude.js';
import { buildContentMix } from './content-mix.js';
import { buildStickiness } from './stickiness.js';
import { computeForceLayout } from './force-graph.js';
import { buildCmContext } from './cm-context.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 42;

export function buildPulse(parsedMessages, { sinceIso, untilIso } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted);

  if (!untilIso) untilIso = real.reduce((m, x) => x.sentAt > m ? x.sentAt : m, '');
  if (!sinceIso && untilIso) sinceIso = new Date(new Date(untilIso).getTime() - DEFAULT_WINDOW_DAYS * DAY_MS).toISOString();
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

  const actionList = buildActionList(parsedMessages, { sinceIso, untilIso });
  const digest = buildDigest(parsedMessages, { sinceIso, untilIso });
  const unanswered = buildUnanswered(parsedMessages, { sinceIso, untilIso });
  const content = buildContentIdeas(parsedMessages, { sinceIso, untilIso });
  const personas = buildPersonas(parsedMessages, { sinceIso, untilIso, rosterSize: roster.rosterSize });
  const topics = buildTopics(parsedMessages, { sinceIso, untilIso });
  const memberList = buildMemberList(parsedMessages, { sinceIso, untilIso });
  const network = buildNetworkMap(parsedMessages, { sinceIso, untilIso });
  const asksOffers = buildAsksOffers(parsedMessages, { sinceIso, untilIso });
  const gratitude = buildGratitude(parsedMessages, { sinceIso, untilIso });
  const contentMix = buildContentMix(parsedMessages, { sinceIso, untilIso });
  const stickiness = buildStickiness(parsedMessages, { sinceIso, untilIso });
  const cmContext = buildCmContext(parsedMessages, { sinceIso, untilIso, personas, topics });

  const previousSinceIso = new Date(new Date(sinceIso).getTime() - DEFAULT_WINDOW_DAYS * DAY_MS).toISOString();
  const prevReal = real.filter(m => m.sentAt >= previousSinceIso && m.sentAt < sinceIso);
  const prevActive = new Set(prevReal.map(m => m.sender).filter(Boolean)).size;
  const prevRoster = computeRoster(parsedMessages, { windowStartIso: previousSinceIso, windowEndIso: sinceIso });

  const memberDaily = computeMemberDaily(inWindow, sinceIso, untilIso, personas.members.slice(0, 25).map(m => m.name));
  const activityByTier = computeActivityByTier(inWindow, sinceIso, untilIso, personas.members);
  const growthRatio = prevReal.length === 0 ? 0 : (totalMessages - prevReal.length) / prevReal.length;
  const healthScore = computeHealthScore({ responseRate, roster, gini, growth: growthRatio });
  const forceNodes = personas.members.slice(0, 40).map(m => ({ id: m.name, tier: m.tier, influence: m.influence, messages: m.messages }));
  const forceEdges = network.topPairs.slice(0, 60).map(e => ({ source: e.a, target: e.b, weight: e.count }));
  const validIds = new Set(forceNodes.map(n => n.id));
  const filteredEdges = forceEdges.filter(e => validIds.has(e.source) && validIds.has(e.target));
  const forcePositions = computeForceLayout(forceNodes, filteredEdges, { width: 900, height: 520 });

  return {
    sinceIso, untilIso,
    windowDays: DEFAULT_WINDOW_DAYS,
    totalMessages, distinctMembers,
    messagesByDay, messagesByHourOfWeek,
    contributors, gini, responseRate, threadStats, roster,
    growth: {
      previousPeriod: {
        sinceIso: previousSinceIso, untilIso: sinceIso,
        totalMessages: prevReal.length,
        distinctMembers: prevActive,
        rosterSize: prevRoster.rosterSize,
      },
    },
    actions: {
      silentJoiners: actionList.silentJoiners,
      longSilentMembers: actionList.longSilentMembers,
      welcomeGaps: actionList.welcomeGaps,
      frustrationCandidates: actionList.frustrationCandidates,
      shoutoutCandidates: actionList.shoutoutCandidates,
    },
    openQuestionBundles: unanswered.bundles,
    topThreads: digest.topThreads,
    quietMembers: digest.quiet,
    newMembers: digest.newMembers,
    content: {
      links: content.links,
      quotableCandidates: content.quotableCandidates,
      mentions: content.mentions,
    },
    personas,
    topics,
    memberList: memberList.members.slice(0, 30),
    network: { ...network, forceNodes, forcePositions, forceEdges: filteredEdges },
    asksOffers,
    gratitude,
    contentMix,
    stickiness,
    memberDaily,
    activityByTier,
    healthScore,
    cmContext,
  };
}

function computeMemberDaily(msgs, sinceIso, untilIso, memberNames) {
  const start = new Date(sinceIso); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(untilIso); end.setUTCHours(0, 0, 0, 0);
  const days = [];
  for (let d = start.getTime(); d <= end.getTime(); d += DAY_MS) days.push(new Date(d).toISOString().slice(0, 10));
  const map = new Map(memberNames.map(n => [n, Object.fromEntries(days.map(d => [d, 0]))]));
  for (const m of msgs) {
    const day = m.sentAt.slice(0, 10);
    const entry = map.get(m.sender);
    if (entry && entry[day] != null) entry[day]++;
  }
  const out = {};
  for (const [name, counts] of map) out[name] = days.map(d => counts[d]);
  return { days, perMember: out };
}

function computeActivityByTier(msgs, sinceIso, untilIso, members) {
  const tierOf = new Map(members.map(m => [m.name, m.tier]));
  const start = new Date(sinceIso); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(untilIso); end.setUTCHours(0, 0, 0, 0);
  const days = [];
  for (let d = start.getTime(); d <= end.getTime(); d += DAY_MS) days.push(new Date(d).toISOString().slice(0, 10));
  const tiers = ['Champion', 'Power', 'Regular', 'Occasional', 'One-time'];
  const series = {};
  for (const t of tiers) series[t] = Object.fromEntries(days.map(d => [d, 0]));
  for (const m of msgs) {
    const t = tierOf.get(m.sender) ?? 'One-time';
    const day = m.sentAt.slice(0, 10);
    if (series[t]?.[day] != null) series[t][day]++;
  }
  return {
    days,
    series: Object.fromEntries(Object.entries(series).map(([tier, byDay]) => [tier, days.map(d => byDay[d])])),
  };
}

function computeHealthScore({ responseRate, roster, gini, growth }) {
  const rrScore = responseRate.rate == null ? 50 : Math.min(100, Math.round(responseRate.rate * 100));
  const activation = roster.rosterSize > 0 ? (roster.activeInWindow / roster.rosterSize) : 0;
  const actScore = Math.min(100, Math.round(activation * 150));
  const giniScore = Math.max(0, Math.round((1 - Math.min(1, gini)) * 100));
  const growthScore = Math.max(0, Math.min(100, Math.round(50 + growth * 100)));
  const composite = Math.round(rrScore * 0.35 + actScore * 0.3 + giniScore * 0.2 + growthScore * 0.15);
  const label = composite >= 75 ? 'Thriving' : composite >= 60 ? 'Healthy' : composite >= 45 ? 'Needs attention' : 'Critical';
  return { score: composite, label, components: { responseRate: rrScore, activation: actScore, distribution: giniScore, growth: growthScore } };
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
