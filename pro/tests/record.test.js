import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Database from 'better-sqlite3';
import { ingest, parseFile } from '../src/db/ingest.js';
import { recordJudgments } from '../src/db/record.js';
import { buildUnanswered } from '../src/analyzers/unanswered.js';

const FIX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'unanswered-fixture.txt');

function seed() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vibra-test-'));
  const dbPath = path.join(dir, 'test.db');
  ingest(dbPath, parseFile(FIX), FIX);
  return { dbPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test('recordJudgments writes detections and answered_checks', () => {
  const { dbPath, cleanup } = seed();
  try {
    const before = buildUnanswered(dbPath, {});
    const firstQ = before.bundles[0].questions[0];

    const { detectionsWritten, answersWritten } = recordJudgments(dbPath, {
      model: 'test-model',
      judgments: [
        { id: firstQ.id, is_question: true, answered_state: 'yes', reason: 'answered by Diana' },
      ],
    });
    assert.equal(detectionsWritten, 1);
    assert.equal(answersWritten, 1);

    const conn = new Database(dbPath);
    const det = conn.prepare('SELECT * FROM question_detections WHERE message_id = ?').get(firstQ.id);
    const ans = conn.prepare('SELECT * FROM answered_checks WHERE question_id = ?').get(firstQ.id);
    conn.close();
    assert.equal(det.is_question, 1);
    assert.equal(det.model, 'test-model');
    assert.equal(ans.answered_state, 'yes');
  } finally { cleanup(); }
});

test('cache consult skips settled candidates on second run', () => {
  const { dbPath, cleanup } = seed();
  try {
    const first = buildUnanswered(dbPath, {});
    const allIds = first.bundles.flatMap(b => b.questions.map(q => q.id));

    recordJudgments(dbPath, {
      model: 'test',
      judgments: allIds.map(id => ({ id, is_question: true, answered_state: 'yes', reason: 'settled' })),
    });

    const second = buildUnanswered(dbPath, {});
    assert.equal(second.candidateCount, 0, 'all candidates settled → no bundles to judge');
    assert.equal(second.bundles.length, 0);
    assert.equal(second.skippedByCache, allIds.length);
  } finally { cleanup(); }
});

test('cache consult re-judges partial/no answers on next run', () => {
  const { dbPath, cleanup } = seed();
  try {
    const first = buildUnanswered(dbPath, {});
    const firstQ = first.bundles[0].questions[0];

    recordJudgments(dbPath, {
      model: 'test',
      judgments: [{ id: firstQ.id, is_question: true, answered_state: 'partial', reason: 'only partial info' }],
    });

    const second = buildUnanswered(dbPath, {});
    const stillIncluded = second.bundles.flatMap(b => b.questions.map(q => q.id)).includes(firstQ.id);
    assert.equal(stillIncluded, true, 'partial answers get re-judged next run');
  } finally { cleanup(); }
});

test('cache consult skips messages judged as non-questions', () => {
  const { dbPath, cleanup } = seed();
  try {
    const first = buildUnanswered(dbPath, {});
    const rhetorical = first.bundles[0].questions[0];

    recordJudgments(dbPath, {
      model: 'test',
      judgments: [{ id: rhetorical.id, is_question: false, reason: 'rhetorical' }],
    });

    const second = buildUnanswered(dbPath, {});
    const stillIncluded = second.bundles.flatMap(b => b.questions.map(q => q.id)).includes(rhetorical.id);
    assert.equal(stillIncluded, false, 'non-questions are skipped permanently');
  } finally { cleanup(); }
});
