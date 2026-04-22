import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fx = f => readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');

test('parses iOS AM/PM bracket format and detects mdy', () => {
  const { messages, dateFormat } = parseWhatsAppChat(fx('ios-ampm.txt'));
  assert.equal(dateFormat, 'mdy');
  assert.equal(messages.length, 8);
});

test('strips ~ prefix and U+200E from senders', () => {
  const { messages } = parseWhatsAppChat(fx('ios-ampm.txt'));
  const senders = messages.map(m => m.sender);
  assert.ok(senders.includes('Alice'), 'tilde stripped');
  assert.ok(senders.includes('Bob'));
  assert.ok(senders.includes('Carol'));
  assert.ok(!senders.some(s => s.startsWith('~') || s.includes('‎')));
});

test('classifies kinds correctly', () => {
  const { messages } = parseWhatsAppChat(fx('ios-ampm.txt'));
  const kinds = messages.map(m => m.kind);
  assert.equal(kinds.filter(k => k === 'system').length, 1, 'e2e encrypted line');
  assert.equal(kinds.filter(k => k === 'created').length, 1);
  assert.equal(kinds.filter(k => k === 'joined').length, 1);
  assert.equal(kinds.filter(k => k === 'message').length, 5);
});

test('detects media placeholders', () => {
  const { messages } = parseWhatsAppChat(fx('ios-ampm.txt'));
  const withMedia = messages.filter(m => m.mediaKind);
  assert.equal(withMedia.length, 1);
  assert.equal(withMedia[0].mediaKind, 'image');
});

test('flags edited and deleted messages', () => {
  const { messages } = parseWhatsAppChat(fx('ios-ampm.txt'));
  assert.equal(messages.filter(m => m.wasEdited).length, 1);
  assert.equal(messages.filter(m => m.wasDeleted).length, 1);
  const deleted = messages.find(m => m.wasDeleted);
  assert.equal(deleted.text, '', 'deleted msg has empty text');
});

test('merges multi-line message bodies', () => {
  const { messages } = parseWhatsAppChat(fx('ios-ampm.txt'));
  const multi = messages.find(m => m.text.includes('línea dos'));
  assert.ok(multi, 'continuation line merged');
  assert.ok(multi.text.includes('mensaje'), 'original first line preserved');
});

test('extracts community name from e2e-encrypted system line', () => {
  const { messages } = parseWhatsAppChat(fx('ios-ampm.txt'));
  assert.equal(extractCommunityName(messages), 'Collective Tech');
});

test('detects EU format (dmy) from 24h fixture', () => {
  const { messages, dateFormat } = parseWhatsAppChat(fx('eu-24h.txt'));
  assert.equal(dateFormat, 'dmy');
  assert.equal(messages.length, 3);
  assert.equal(new Date(messages[0].sentAt).getUTCMonth(), 3, 'April = month index 3');
});

test('detects US format (mdy) from 24h fixture where second number > 12', () => {
  const { messages, dateFormat } = parseWhatsAppChat(fx('us-24h.txt'));
  assert.equal(dateFormat, 'mdy');
  assert.equal(messages.length, 2);
  assert.equal(new Date(messages[0].sentAt).getUTCMonth(), 3, 'April = month 3');
});

test('content hashes are stable across parses', () => {
  const a = parseWhatsAppChat(fx('ios-ampm.txt')).messages.map(m => m.contentHash);
  const b = parseWhatsAppChat(fx('ios-ampm.txt')).messages.map(m => m.contentHash);
  assert.deepEqual(a, b);
});

const REAL_EXPORT = '/tmp/vibra-export/_chat.txt';
test('parses real Collective Tech export (if present)', { skip: !existsSync(REAL_EXPORT) }, () => {
  const { messages, dateFormat } = parseWhatsAppChat(readFileSync(REAL_EXPORT, 'utf8'));
  assert.equal(dateFormat, 'mdy');
  assert.equal(messages.length, 775);
  const kinds = Object.fromEntries(['message','system','joined','left','created'].map(k =>
    [k, messages.filter(m => m.kind === k).length]));
  assert.equal(kinds.created, 1);
  assert.equal(kinds.joined, 17);
  assert.equal(kinds.system, 1);
  assert.equal(messages.filter(m => m.mediaKind).length > 100, true);
  assert.equal(extractCommunityName(messages), 'Collective Tech');
});
