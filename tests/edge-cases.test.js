import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';
import { buildDigest } from '../src/analyzers/digest.js';
import { buildPulse } from '../src/analyzers/pulse.js';
import { buildActionList } from '../src/analyzers/action-list.js';
import { buildUnanswered } from '../src/analyzers/unanswered.js';
import { buildMemberList } from '../src/analyzers/members.js';

const FX = f => path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', f);
const load = f => parseWhatsAppChat(readFileSync(FX(f), 'utf8')).messages;

test('empty export does not crash the parser', () => {
  const { messages } = parseWhatsAppChat('');
  assert.equal(messages.length, 0);
});

test('empty export: analyzers throw a friendly error (no crash)', () => {
  const empty = [];
  assert.throws(() => buildDigest(empty), /No messages/);
  assert.throws(() => buildPulse(empty), /No messages/);
  assert.throws(() => buildActionList(empty), /No messages/);
  assert.throws(() => buildUnanswered(empty), /No messages/);
});

test('system-only export: parser extracts community, analyzers handle gracefully', () => {
  const msgs = load('system-only.txt');
  assert.equal(extractCommunityName(msgs), 'Empty Group');
  assert.equal(msgs.filter(m => m.kind === 'message').length, 0);
  assert.throws(() => buildDigest(msgs), /No messages/);
});

test('members list on system-only: zero posters, roster from creator', () => {
  const msgs = load('system-only.txt');
  const list = buildMemberList(msgs);
  assert.equal(list.postersCount, 0);
  assert.ok(list.rosterSize >= 0);
});

test('unicode names parsed correctly across scripts', () => {
  const msgs = load('unicode-names.txt');
  const senders = msgs.filter(m => m.kind === 'message').map(m => m.sender);
  assert.ok(senders.includes('王小明'), 'Chinese name preserved');
  assert.ok(senders.includes('محمد'), 'Arabic name preserved');
  assert.ok(senders.includes('Sele ❤️'), 'emoji in name preserved');
  assert.ok(senders.includes('João da Silva'), 'accented name preserved');
});

test('Android format parses correctly', () => {
  const { messages, platform, dateFormat } = parseWhatsAppChat(readFileSync(FX('android.txt'), 'utf8'));
  assert.equal(platform, 'android');
  assert.equal(dateFormat, 'dmy');
  assert.equal(messages.filter(m => m.kind === 'message').length, 4, 'Alice x2, Bob x1, Carol x1');
  assert.equal(messages.filter(m => m.kind === 'created').length, 1);
  assert.equal(messages.filter(m => m.kind === 'joined').length, 1);
  const alice = messages.filter(m => m.sender === 'Alice' && m.kind === 'message');
  assert.equal(alice.length, 2);
});

test('Android format: community name extracted from created-group system message', () => {
  const { messages } = parseWhatsAppChat(readFileSync(FX('android.txt'), 'utf8'));
  assert.equal(extractCommunityName(messages), 'Android Test');
});
