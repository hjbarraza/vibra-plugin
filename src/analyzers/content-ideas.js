const DAY_MS = 24 * 60 * 60 * 1000;
const URL_RE = /https?:\/\/[^\s)]+/gi;
const CAMEL_RE = /\b[A-Z][a-z]{2,}(?:[A-Z][a-z]+)*\b/g;
const STOP = new Set(['Messages', 'Collective', 'Tech', 'Community', 'WhatsApp', 'Image', 'Video', 'Audio', 'Sticker', 'Document', 'This', 'That']);

export function buildContentIdeas(parsedMessages, { sinceIso, untilIso } = {}) {
  const real = parsedMessages.filter(m => m.kind === 'message' && !m.wasDeleted);
  if (!untilIso) untilIso = real.reduce((m, x) => x.sentAt > m ? x.sentAt : m, '');
  if (!sinceIso && untilIso) sinceIso = new Date(new Date(untilIso).getTime() - 7 * DAY_MS).toISOString();
  if (!sinceIso || !untilIso) throw new Error('No messages in this export.');

  const inWindow = real.filter(m => m.sentAt >= sinceIso && m.sentAt <= untilIso);

  return {
    sinceIso, untilIso,
    links: rankLinks(inWindow),
    quotableCandidates: findQuotables(inWindow),
    mentions: findMentions(inWindow),
  };
}

function rankLinks(msgs) {
  const out = [];
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    const urls = (m.text ?? '').match(URL_RE);
    if (!urls) continue;
    const baseMs = new Date(m.sentAt).getTime();
    let engagement = 0;
    for (let j = i + 1; j < msgs.length; j++) {
      const rMs = new Date(msgs[j].sentAt).getTime();
      if (rMs - baseMs > 30 * 60 * 1000) break;
      if (msgs[j].sender !== m.sender) engagement++;
    }
    for (const u of urls) {
      out.push({ url: u, sharedBy: m.sender, sharedAt: m.sentAt, context: m.text, engagement });
    }
  }
  return out.sort((a, b) => b.engagement - a.engagement).slice(0, 15);
}

function findQuotables(msgs) {
  return msgs
    .filter(m => m.sender)
    .filter(m => {
      const t = (m.text ?? '').trim();
      if (t.length < 80 || t.length > 600) return false;
      if (URL_RE.test(t)) { URL_RE.lastIndex = 0; return false; }
      URL_RE.lastIndex = 0;
      if (/[?¿]\s*$/.test(t)) return false;
      if (/image omitted|video omitted|sticker omitted|audio omitted|document omitted/i.test(t)) return false;
      return true;
    })
    .map(m => ({ sender: m.sender, sentAt: m.sentAt, text: m.text }));
}

function findMentions(msgs) {
  const counts = new Map();
  const samples = new Map();
  const domainCounts = new Map();

  for (const m of msgs) {
    const text = m.text ?? '';
    for (const match of text.matchAll(CAMEL_RE)) {
      const w = match[0];
      if (STOP.has(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
      if (!samples.has(w)) samples.set(w, { sender: m.sender, sentAt: m.sentAt, snippet: text.slice(0, 200) });
    }
    const urls = text.match(URL_RE);
    if (urls) for (const u of urls) {
      try {
        const host = new URL(u).hostname.replace(/^www\./, '');
        domainCounts.set(host, (domainCounts.get(host) || 0) + 1);
      } catch {}
    }
  }

  const names = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count, sample: samples.get(name) }));

  const domains = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, count]) => ({ domain, count }));

  return { names, domains };
}
