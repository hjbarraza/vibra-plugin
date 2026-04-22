import { createHash } from 'node:crypto';

const LTR = /‎/g;

const IOS_HEADER = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([AP])M)?\]\s+([^:]+?):\s?(.*)$/i;
const ANDROID_HEADER = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s+-\s+(.*)$/;
const HEADER = IOS_HEADER;

const EDITED_TAG = /<This message was edited>\s*$|<Este mensaje fue editado>\s*$|<Mensagem editada>\s*$|<Message modifié>\s*$/i;
const DELETED_TAG = /^(This message was deleted\.?|Este mensaje fue eliminado\.?|Esta mensagem foi apagada\.?|Ce message a été supprimé\.?)\s*$/i;

const MEDIA = [
  ['image',    /image omitted|imagen omitida|imagem omitida|image omise/i],
  ['video',    /video omitted|v[ií]deo omitid[oa]|vid[eé]o omise/i],
  ['audio',    /audio omitted|audio omitido|[aá]udio omitido|audio omis/i],
  ['sticker',  /sticker omitted|sticker omitido|figurinha omitida|autocollant omis/i],
  ['document', /document omitted|documento omitido|document omis/i],
];

const SYSTEM_PATTERNS = {
  created: [
    /created this group/i, /created group/i,
    /cre[oó] este grupo/i, /cre[oó] el grupo/i,
    /criou este grupo/i, /criou o grupo/i,
    /a cr[eé][eé] ce groupe/i, /a cr[eé][eé] le groupe/i,
  ],
  joined: [
    /joined from the community/i, /joined using (this|the) (group('?s)?\s)?invite/i, /joined using (this|the) group/i,
    /se uni[oó] desde la comunidad/i, /se uni[oó] usando el enlace/i,
    /entrou pela comunidade/i, /entrou usando/i,
    /a rejoint depuis la communaut[eé]/i, /a rejoint (via|en utilisant)/i,
  ],
  left: [/\bleft\s*$/i, /\bsali[oó]\s*$/i, /\bsaiu\s*$/i, /\ba quitt[eé]\s*$/i],
  system: [
    /end-to-end encrypted/i, /cifrad[oa] de extremo a extremo/i, /criptografia de ponta a ponta/i, /chiffr[eé] de bout en bout/i,
    /\bwas added\b/i, /\bfue agregad[oa]\b/i, /\bfoi adicionad[oa]\b/i, /\ba [eé]t[eé] ajout[eé]\b/i,
    /changed (this group's|the group) (subject|icon|description)/i,
  ],
};

function classifyKind(text) {
  for (const [kind, pats] of Object.entries(SYSTEM_PATTERNS)) {
    for (const re of pats) if (re.test(text)) return kind;
  }
  return 'message';
}

function detectMedia(text) {
  for (const [kind, re] of MEDIA) if (re.test(text)) return kind;
  return null;
}

function stripAlias(sender) {
  return sender.replace(LTR, '').trim().replace(/^~\s+/, '');
}

function detectDateFormat(lines, header) {
  let dmySafe = true;
  let mdySafe = true;
  for (const line of lines) {
    const m = line.match(header);
    if (!m) continue;
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (b > 12) dmySafe = false;
    if (a > 12) mdySafe = false;
    if (!dmySafe && !mdySafe) break;
  }
  if (dmySafe && !mdySafe) return 'dmy';
  if (mdySafe && !dmySafe) return 'mdy';

  const tsFor = (order) => {
    const ts = [];
    for (const line of lines) {
      const m = line.match(header);
      if (!m) continue;
      const [, p1, p2, y, h, mi, s, ampm] = m;
      const [mo, d] = order === 'mdy' ? [p1, p2] : [p2, p1];
      ts.push(buildEpoch(d, mo, y, h, mi, s, ampm));
    }
    return ts;
  };
  const monotonic = arr => arr.reduce((c, v, i) => c + (i > 0 && v >= arr[i - 1] ? 1 : 0), 0);
  return monotonic(tsFor('dmy')) >= monotonic(tsFor('mdy')) ? 'dmy' : 'mdy';
}

function buildEpoch(d, mo, y, h, mi, s, ampm) {
  const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
  let hour = parseInt(h, 10);
  if (ampm) {
    const isPm = ampm.toUpperCase() === 'P';
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
  }
  return new Date(year, parseInt(mo, 10) - 1, parseInt(d, 10), hour, parseInt(mi, 10), s ? parseInt(s, 10) : 0).getTime();
}

function toIso(p1, p2, y, h, mi, s, ampm, format) {
  const [mo, d] = format === 'mdy' ? [p1, p2] : [p2, p1];
  return new Date(buildEpoch(d, mo, y, h, mi, s, ampm)).toISOString();
}

function detectPlatform(lines) {
  let ios = 0, android = 0;
  const sample = lines.slice(0, Math.min(200, lines.length));
  for (const line of sample) {
    if (IOS_HEADER.test(line)) ios++;
    else if (ANDROID_HEADER.test(line)) android++;
  }
  return ios >= android ? 'ios' : 'android';
}

function splitAndroidTail(tail) {
  const idx = tail.indexOf(': ');
  if (idx > 0 && idx < 80) return { sender: tail.slice(0, idx), text: tail.slice(idx + 2) };
  return { sender: '', text: tail };
}

export function parseWhatsAppChat(raw) {
  const lines = raw.replace(LTR, '').split(/\r?\n/);
  const platform = detectPlatform(lines);
  const header = platform === 'android' ? ANDROID_HEADER : IOS_HEADER;
  const format = detectDateFormat(lines, header);
  const msgs = [];
  let cur = null;

  for (const line of lines) {
    const m = line.match(header);
    if (m) {
      if (cur) msgs.push(finalize(cur));
      let rawSender, text, p1, p2, y, h, mi, s, ampm;
      if (platform === 'android') {
        [, p1, p2, y, h, mi, s] = m;
        ampm = null;
        ({ sender: rawSender, text } = splitAndroidTail(m[7]));
      } else {
        [, p1, p2, y, h, mi, s, ampm, rawSender, text] = m;
      }
      cur = {
        sender: stripAlias(rawSender),
        sentAt: toIso(p1, p2, y, h, mi, s, ampm, format),
        text: text ?? '',
      };
    } else if (cur) {
      cur.text += (cur.text ? '\n' : '') + line;
    }
  }
  if (cur) msgs.push(finalize(cur));
  return { messages: msgs, dateFormat: format, platform };
}

function finalize(m) {
  let text = m.text;
  let wasEdited = 0;
  let wasDeleted = 0;
  if (EDITED_TAG.test(text)) { wasEdited = 1; text = text.replace(EDITED_TAG, '').trimEnd(); }
  if (DELETED_TAG.test(text)) { wasDeleted = 1; text = ''; }
  const mediaKind = detectMedia(text);
  const kind = classifyKind(text);
  const contentHash = createHash('sha256').update(`${m.sentAt}|${m.sender}|${text}`).digest('hex');
  return { sender: m.sender, sentAt: m.sentAt, text, kind, mediaKind, wasEdited, wasDeleted, contentHash };
}

export function extractCommunityName(messages) {
  const first = messages[0];
  if (first && first.sender && SYSTEM_PATTERNS.system.some(re => re.test(first.text))) return first.sender;
  for (const m of messages) {
    const q = m.text.match(/(?:created group|cre[oó] el grupo|criou o grupo|a cr[eé][eé] le groupe)\s+["']([^"']+)["']/i);
    if (q) return q[1];
  }
  return null;
}
