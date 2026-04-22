import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat } from '../src/parser/parser.js';
import { buildDigest } from '../src/analyzers/digest.js';
import { detectThreads } from '../src/analyzers/threads.js';

const FIX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'digest-fixture.txt');
const load = () => parseWhatsAppChat(readFileSync(FIX, 'utf8')).messages;

test('digest default window = last 7 days of data', () => {
  const d = buildDigest(load());
  assert.equal(d.untilIso.slice(0, 10), '2026-04-15');
  assert.equal(d.sinceIso.slice(0, 10), '2026-04-08');
});

test('digest counts messages and members in window', () => {
  const d = buildDigest(load());
  assert.equal(d.totalMessages, 4, 'only 4/15 messages fall in window');
  assert.equal(d.distinctMembers, 2, 'Bob + Carol');
});

test('digest surfaces new members from window', () => {
  const d = buildDigest(load());
  const names = d.newMembers.map(m => m.canonical_name);
  assert.deepEqual(names, ['Carol']);
});

test('digest surfaces quiet members (active previous 7d, silent in window)', () => {
  const d = buildDigest(load());
  assert.ok(d.quiet.includes('Alice'), 'Alice was active 4/5 but silent 4/8-4/15');
});

test('digest detects open asks (no reply within 30min from another participant)', () => {
  const d = buildDigest(load());
  const askTexts = d.openAsks.map(a => a.text);
  assert.ok(askTexts.some(t => t.includes('alguien tiene tiempo')), 'Carol\'s question — Bob replied 4hrs later');
});

test('thread detector groups messages by 30-min gap', () => {
  const msgs = [
    { sent_at: '2026-04-15T09:00:00Z', canonical_name: 'A' },
    { sent_at: '2026-04-15T09:10:00Z', canonical_name: 'B' },
    { sent_at: '2026-04-15T10:00:00Z', canonical_name: 'A' },
    { sent_at: '2026-04-15T14:00:00Z', canonical_name: 'B' },
  ];
  const threads = detectThreads(msgs);
  assert.equal(threads.length, 3);
  assert.equal(threads[0].messageCount, 2);
  assert.equal(threads[1].messageCount, 1);
  assert.equal(threads[2].messageCount, 1);
});

test('digest explicit since/until override default', () => {
  const d = buildDigest(load(), {
    sinceIso: new Date('2026-04-01T00:00:00').toISOString(),
    untilIso: new Date('2026-04-08T23:59:59').toISOString(),
  });
  assert.equal(d.totalMessages, 5, 'only 4/5 messages (5 real msgs)');
  assert.equal(d.distinctMembers, 2, 'Alice + Bob');
});
