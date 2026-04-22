const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_MS = 3 * 60 * 60 * 1000;
const WINDOW_MSGS = 15;

const ASK_STARTERS = new RegExp(
  String.raw`^\s*(?:` +
  [
    'does anyone', 'has anyone', 'anyone', 'someone',
    'looking for', 'need help', 'need a', 'need an', 'need someone',
    'recommend', 'any recommendation',
    '¿alguien', 'alguien', 'busco', 'necesito', '¿cómo', '¿qué', '¿dónde', '¿cuándo', '¿por qué', '¿quién',
    'recomiendan', 'recomendación',
    'alguém', 'procuro', 'preciso', 'recomenda',
    "quelqu'un", 'cherche', 'besoin', 'recommande',
  ].join('|') +
  String.raw`)\b`,
  'i',
);

export function isCandidateAsk(text) {
  if (!text) return false;
  if (/[?¿]/.test(text)) return true;
  return ASK_STARTERS.test(text);
}

export function bundleQuestions(windowMessages) {
  const candidates = windowMessages
    .map((m, i) => ({ ...m, _idx: i }))
    .filter(m => isCandidateAsk(m.text));

  const bundles = [];
  for (const q of candidates) {
    const qMs = new Date(q.sent_at).getTime();
    const windowEndMs = qMs + WINDOW_MS;
    const windowEndIdx = Math.min(q._idx + WINDOW_MSGS, windowMessages.length - 1);
    const windowEndTs = Math.min(
      windowEndMs,
      new Date(windowMessages[windowEndIdx].sent_at).getTime(),
    );

    const last = bundles[bundles.length - 1];
    const lastEnd = last ? last._endMs : -Infinity;
    if (last && qMs <= lastEnd) {
      last.questions.push(q);
      last._endMs = Math.max(last._endMs, windowEndTs);
    } else {
      bundles.push({ questions: [q], _startMs: qMs, _endMs: windowEndTs });
    }
  }

  return bundles.map((b, i) => {
    const startMs = new Date(b.questions[0].sent_at).getTime();
    const endMs = b._endMs;
    const sharedContext = windowMessages.filter(m => {
      const ms = new Date(m.sent_at).getTime();
      if (ms < startMs) return false;
      if (ms > endMs) return false;
      return !b.questions.some(q => q.id === m.id);
    }).map(m => ({ sender: m.canonical_name, sentAt: m.sent_at, text: m.text }));

    return {
      bundleId: i + 1,
      questions: b.questions.map(q => ({
        id: q.id, sender: q.canonical_name, sentAt: q.sent_at, text: q.text,
      })),
      sharedContext,
    };
  });
}

export function buildUnanswered(parsedMessages, { sinceIso, untilIso } = {}) {
  const realMessages = parsedMessages
    .filter(m => m.kind === 'message' && !m.wasDeleted)
    .map((m, i) => ({
      id: i + 1,
      sent_at: m.sentAt,
      text: m.text,
      media_kind: m.mediaKind,
      canonical_name: m.sender,
    }));

  if (!untilIso) {
    untilIso = realMessages.reduce((max, m) => m.sent_at > max ? m.sent_at : max, '');
  }
  if (!sinceIso && untilIso) {
    sinceIso = new Date(new Date(untilIso).getTime() - 7 * DAY_MS).toISOString();
  }
  if (!sinceIso || !untilIso) {
    throw new Error('No messages in this export.');
  }

  const contextEndIso = new Date(new Date(untilIso).getTime() + WINDOW_MS).toISOString();
  const windowMessages = realMessages.filter(m => m.sent_at >= sinceIso && m.sent_at <= contextEndIso);

  const bundles = bundleQuestions(windowMessages).filter(b =>
    b.questions.some(q => q.sentAt >= sinceIso && q.sentAt <= untilIso)
  );
  const inWindow = realMessages.filter(m => m.sent_at <= untilIso && m.sent_at >= sinceIso);
  const candidateCount = bundles.reduce((n, b) => n + b.questions.length, 0);

  return { sinceIso, untilIso, candidateCount, bundles, totalMessages: inWindow.length };
}
