import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat } from '../src/parser/parser.js';
import { buildPulse } from '../src/analyzers/pulse.js';
import { renderPulseHtml } from '../src/renderers/pulse-html.js';

const FIX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'digest-fixture.txt');
const load = () => parseWhatsAppChat(readFileSync(FIX, 'utf8')).messages;

test('pulse default window is 42 days of data', () => {
  const p = buildPulse(load());
  assert.equal(p.windowDays, 42);
  assert.equal(p.untilIso.slice(0, 10), '2026-04-15');
  const expectedSince = new Date(new Date('2026-04-15T14:00:00').getTime() - 42 * 24 * 60 * 60 * 1000);
  assert.equal(p.sinceIso.slice(0, 10), expectedSince.toISOString().slice(0, 10));
});

test('pulse counts messages and members across the default window', () => {
  const p = buildPulse(load());
  assert.equal(p.totalMessages, 9);
  assert.equal(p.distinctMembers, 3);
});

test('pulse aggregates data from every analyzer', () => {
  const p = buildPulse(load());
  assert.ok(p.actions, 'actions block present');
  assert.ok(Array.isArray(p.actions.silentJoiners));
  assert.ok(Array.isArray(p.openQuestionBundles), 'openQuestionBundles present');
  assert.ok(Array.isArray(p.topThreads), 'topThreads present');
  assert.ok(p.content?.links !== undefined, 'content block present');
  assert.ok(p.personas, 'personas present');
  assert.ok(p.topics, 'topics present');
  assert.ok(p.growth?.previousPeriod, 'growth comparison present');
});

test('pulse produces per-day activity buckets', () => {
  const p = buildPulse(load());
  assert.equal(p.messagesByDay.length, 43, '42 days + inclusive start');
  assert.ok(p.messagesByDay.some(d => d.date === '2026-04-15' && d.count === 4));
});

test('pulse produces 7×24 heatmap', () => {
  const p = buildPulse(load());
  assert.equal(p.messagesByHourOfWeek.length, 7);
  assert.equal(p.messagesByHourOfWeek[0].length, 24);
  const sum = p.messagesByHourOfWeek.flat().reduce((s, v) => s + v, 0);
  assert.equal(sum, 9);
});

test('pulse ranks contributors', () => {
  const p = buildPulse(load());
  const names = p.contributors.map(c => c.name);
  assert.deepEqual(names.slice(0, 3).sort(), ['Alice', 'Bob', 'Carol']);
});

test('pulse computes Gini coefficient', () => {
  const p = buildPulse(load());
  assert.ok(p.gini >= 0 && p.gini <= 1);
});

test('pulse HTML renders both tabs with agent placeholders', () => {
  const p = buildPulse(load());
  const html = renderPulseHtml(p, { community: 'Test' });
  assert.ok(html.includes('<!doctype html>'));
  assert.ok(html.includes('Community Dashboard'));
  assert.ok(html.includes('data-tab="cm"'));
  assert.ok(html.includes('data-tab="business"'));
  assert.ok(html.includes('For the Community Manager'));
  assert.ok(html.includes('For the Business'));
  assert.ok(html.includes('Action queue'));
  assert.ok(html.includes('Open questions'));
  assert.ok(html.includes('Community vitals'));
  assert.ok(html.includes('Members'));
  assert.ok(html.includes('Member intelligence'));
  assert.ok(html.includes('Network map'));
  assert.ok(html.includes('Community health score'));
  assert.ok(html.includes('topic signal'));
  assert.ok(html.includes('Jobs to be done'));
  assert.ok(html.includes('Strategic observations'));
  assert.ok(html.includes('agent-fill'), 'agent placeholder sections present');
  assert.ok(html.includes('@media print'), 'print styles for PDF export');
  assert.ok(html.includes('Powered by'), 'footer branding');
});
