import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRoster } from '../src/analyzers/roster.js';

function mkMsg(sender, sentAt, kind = 'message') {
  return { sender, sentAt, kind, wasDeleted: false, text: 'hi' };
}

test('roster union of posters and joined events', () => {
  const msgs = [
    mkMsg('Alice', '2026-04-01T10:00:00.000Z', 'joined'),
    mkMsg('Bob', '2026-04-05T10:00:00.000Z'),
    mkMsg('Carol', '2026-04-10T10:00:00.000Z', 'joined'),
  ];
  const r = computeRoster(msgs);
  assert.equal(r.rosterSize, 3);
  assert.equal(r.everPosted, 1);
  assert.equal(r.neverPosted, 2);
});

test('roster identifies long-silent members (30+ days, never posted)', () => {
  const msgs = [
    mkMsg('Alice', '2026-01-01T10:00:00.000Z', 'joined'),
    mkMsg('Bob', '2026-04-20T10:00:00.000Z', 'joined'),
    mkMsg('Carol', '2026-04-22T10:00:00.000Z'),
  ];
  const r = computeRoster(msgs, { windowStartIso: '2026-04-01T00:00:00.000Z', windowEndIso: '2026-04-22T23:59:59.000Z' });
  const alice = r.longSilent.find(m => m.sender === 'Alice');
  const bob = r.longSilent.find(m => m.sender === 'Bob');
  assert.ok(alice, 'Alice joined in Jan, never posted — should be long-silent');
  assert.ok(!bob, 'Bob joined 2 days ago — not long-silent yet');
  assert.ok(alice.silentDays >= 100);
});

test('roster activeInWindow respects window bounds', () => {
  const msgs = [
    mkMsg('Alice', '2026-04-05T10:00:00.000Z'),
    mkMsg('Bob', '2026-04-20T10:00:00.000Z'),
  ];
  const r = computeRoster(msgs, { windowStartIso: '2026-04-15T00:00:00.000Z', windowEndIso: '2026-04-22T23:59:59.000Z' });
  assert.equal(r.activeInWindow, 1);
  assert.equal(r.silentInWindow, 1);
});
