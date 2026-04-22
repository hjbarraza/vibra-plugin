import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat } from '../src/parser/parser.js';
import { buildUnanswered, isCandidateAsk, bundleQuestions } from '../src/analyzers/unanswered.js';

const FIX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'unanswered-fixture.txt');
const load = () => parseWhatsAppChat(readFileSync(FIX, 'utf8')).messages;

test('candidate filter catches questions and ask-phrases in multiple languages', () => {
  assert.equal(isCandidateAsk('¿alguien conoce?'), true);
  assert.equal(isCandidateAsk('anyone have a recommendation'), true);
  assert.equal(isCandidateAsk('busco diseñador'), true);
  assert.equal(isCandidateAsk('necesito ayuda con pricing'), true);
  assert.equal(isCandidateAsk('quelqu\'un connaît'), true);
  assert.equal(isCandidateAsk('procuro alguém'), true);
  assert.equal(isCandidateAsk('buenos días'), false);
  assert.equal(isCandidateAsk('gracias!'), false);
});

test('bundleQuestions merges overlapping-window questions into one bundle', () => {
  const msgs = [
    { id: 1, sent_at: '2026-04-15T10:05:00.000Z', text: '¿alguien conoce?', canonical_name: 'Bob' },
    { id: 2, sent_at: '2026-04-15T10:07:00.000Z', text: 'busco diseñador', canonical_name: 'Carol' },
    { id: 3, sent_at: '2026-04-15T10:15:00.000Z', text: 'Bob, contacto', canonical_name: 'Diana' },
    { id: 4, sent_at: '2026-04-15T10:20:00.000Z', text: 'Carol, no sé', canonical_name: 'Eve' },
  ];
  const bundles = bundleQuestions(msgs);
  assert.equal(bundles.length, 1);
  assert.equal(bundles[0].questions.length, 2);
  assert.equal(bundles[0].sharedContext.length, 2);
});

test('bundleQuestions keeps non-overlapping questions separate', () => {
  const msgs = [
    { id: 1, sent_at: '2026-04-15T09:00:00.000Z', text: '¿algo?', canonical_name: 'A' },
    { id: 2, sent_at: '2026-04-16T09:00:00.000Z', text: '¿otra cosa?', canonical_name: 'B' },
  ];
  const bundles = bundleQuestions(msgs);
  assert.equal(bundles.length, 2);
});

test('buildUnanswered on fixture creates 3 bundles', () => {
  const u = buildUnanswered(load());
  assert.equal(u.bundles.length, 3);
  const first = u.bundles[0];
  assert.equal(first.questions.length, 2);
  assert.ok(first.questions.some(q => q.sender === 'Bob'));
  assert.ok(first.questions.some(q => q.sender === 'Carol'));
  const contextSenders = first.sharedContext.map(m => m.sender);
  assert.ok(contextSenders.includes('Diana'));
  assert.ok(contextSenders.includes('Eve'));
  assert.ok(!contextSenders.includes('Frank'), 'Frank 4hrs after Bob is outside window');
});

test('buildUnanswered total candidate count tracks across bundles', () => {
  const u = buildUnanswered(load());
  assert.equal(u.candidateCount, 4, 'Bob, Carol, Grace, Iris');
});

test('buildUnanswered includes context messages that arrive after untilIso (up to 3hr past)', () => {
  const u = buildUnanswered(load(), {
    sinceIso: '2026-04-15T00:00:00.000Z',
    untilIso: '2026-04-15T10:10:00.000Z',
  });
  const bob = u.bundles[0];
  const ctxSenders = bob.sharedContext.map(m => m.sender);
  assert.ok(ctxSenders.includes('Diana'), 'Diana at 10:15 is after untilIso but inside Bob\'s 3hr window');
});
