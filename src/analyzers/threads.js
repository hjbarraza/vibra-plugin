const THREAD_GAP_MS = 30 * 60 * 1000;

export function detectThreads(messages) {
  const threads = [];
  let cur = null;
  for (const m of messages) {
    const t = new Date(m.sent_at).getTime();
    if (!cur || t - cur.endMs > THREAD_GAP_MS) {
      if (cur) threads.push(finalize(cur));
      cur = { messages: [], participants: new Set(), startMs: t, endMs: t };
    }
    cur.messages.push(m);
    if (m.canonical_name) cur.participants.add(m.canonical_name);
    cur.endMs = t;
  }
  if (cur) threads.push(finalize(cur));
  return threads;
}

function finalize(t) {
  return {
    messages: t.messages,
    participants: [...t.participants],
    startAt: new Date(t.startMs).toISOString(),
    endAt: new Date(t.endMs).toISOString(),
    messageCount: t.messages.length,
    score: t.participants.size * Math.log(1 + t.messages.length),
  };
}
