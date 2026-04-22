import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat } from '../src/parser/parser.js';
import { buildActionList } from '../src/analyzers/action-list.js';

const UNANS_FIX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'unanswered-fixture.txt');
const load = p => parseWhatsAppChat(readFileSync(p, 'utf8')).messages;

test('action-list returns all four candidate lists as arrays', () => {
  const a = buildActionList(load(UNANS_FIX));
  assert.ok(Array.isArray(a.silentJoiners));
  assert.ok(Array.isArray(a.welcomeGaps));
  assert.ok(Array.isArray(a.frustrationCandidates));
  assert.ok(Array.isArray(a.shoutoutCandidates));
});

test('action-list catches frustration heuristic matches', () => {
  const synthetic = [
    { kind: 'message', wasDeleted: false, sender: 'Alice', sentAt: '2026-04-15T10:00:00.000Z', text: 'sigo esperando una respuesta' },
    { kind: 'message', wasDeleted: false, sender: 'Bob', sentAt: '2026-04-15T11:00:00.000Z', text: 'hola' },
  ];
  const a = buildActionList(synthetic, {
    sinceIso: '2026-04-15T00:00:00.000Z',
    untilIso: '2026-04-15T23:59:59.000Z',
  });
  assert.equal(a.frustrationCandidates.length, 1);
  assert.equal(a.frustrationCandidates[0].sender, 'Alice');
});

test('action-list detects silent joiner (joined in window, zero posts)', () => {
  const synthetic = [
    { kind: 'joined', wasDeleted: false, sender: 'Ghost', sentAt: '2026-04-15T10:00:00.000Z', text: '' },
    { kind: 'message', wasDeleted: false, sender: 'Alice', sentAt: '2026-04-15T11:00:00.000Z', text: 'hola' },
  ];
  const a = buildActionList(synthetic, {
    sinceIso: '2026-04-15T00:00:00.000Z',
    untilIso: '2026-04-15T23:59:59.000Z',
  });
  assert.equal(a.silentJoiners.length, 1);
  assert.equal(a.silentJoiners[0].sender, 'Ghost');
});
