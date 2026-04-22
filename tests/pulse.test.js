import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat } from '../src/parser/parser.js';
import { buildPulse } from '../src/analyzers/pulse.js';
import { renderPulseHtml } from '../src/renderers/pulse-html.js';

const FIX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'digest-fixture.txt');
const load = () => parseWhatsAppChat(readFileSync(FIX, 'utf8')).messages;

test('pulse counts messages and members in default window', () => {
  const p = buildPulse(load());
  assert.equal(p.totalMessages, 4);
  assert.equal(p.distinctMembers, 2);
});

test('pulse produces per-day activity buckets', () => {
  const p = buildPulse(load());
  assert.equal(p.messagesByDay.length, 8, 'default 7-day window = 8 daily buckets inclusive');
  assert.ok(p.messagesByDay.some(d => d.date === '2026-04-15' && d.count === 4));
});

test('pulse produces 7×24 heatmap', () => {
  const p = buildPulse(load());
  assert.equal(p.messagesByHourOfWeek.length, 7);
  assert.equal(p.messagesByHourOfWeek[0].length, 24);
  const sum = p.messagesByHourOfWeek.flat().reduce((s, v) => s + v, 0);
  assert.equal(sum, 4);
});

test('pulse ranks contributors', () => {
  const p = buildPulse(load());
  assert.deepEqual(p.contributors.map(c => c.name), ['Bob', 'Carol']);
  assert.equal(p.contributors[0].count, 2);
});

test('pulse computes Gini coefficient', () => {
  const p = buildPulse(load());
  assert.ok(p.gini >= 0 && p.gini <= 1);
});

test('pulse computes response rate', () => {
  const p = buildPulse(load());
  assert.equal(p.responseRate.questions, 1);
  assert.equal(p.responseRate.answered, 0, 'Carol\'s 10:00 question had no reply within 30min');
});

test('pulse HTML renders a full page with sections', () => {
  const p = buildPulse(load());
  const html = renderPulseHtml(p, { community: 'Test' });
  assert.ok(html.includes('<!doctype html>'));
  assert.ok(html.includes('Test'));
  assert.ok(html.includes('Community Pulse'));
  assert.ok(html.includes('Activity by day'));
  assert.ok(html.includes('heatmap'));
  assert.ok(html.includes('Top contributors'));
  assert.ok(html.includes('<svg'));
  assert.ok(html.includes('Powered by'), 'footer branding present');
  assert.ok(html.includes('@media print'), 'print styles for PDF export');
});
