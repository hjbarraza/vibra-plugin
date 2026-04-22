import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Database from 'better-sqlite3';
import { ingest, parseFile } from '../src/db/ingest.js';

const FIX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'ios-ampm.txt');

function tmpDb() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vibra-test-'));
  return { path: path.join(dir, 'test.db'), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test('first ingest populates messages and members', () => {
  const db = tmpDb();
  try {
    const parsed = parseFile(FIX);
    const res = ingest(db.path, parsed, FIX);
    assert.equal(res.communityName, 'Collective Tech');
    assert.ok(res.messagesAdded > 0);
    assert.ok(res.membersAdded > 0);
    assert.equal(res.totalMessages, res.messagesAdded);
  } finally { db.cleanup(); }
});

test('re-ingest is idempotent — zero new rows', () => {
  const db = tmpDb();
  try {
    const parsed = parseFile(FIX);
    const first = ingest(db.path, parsed, FIX);
    const second = ingest(db.path, parsed, FIX);
    assert.equal(second.messagesAdded, 0);
    assert.equal(second.membersAdded, 0);
    assert.equal(second.totalMessages, first.totalMessages);
  } finally { db.cleanup(); }
});

test('records every ingest in ingest_runs', () => {
  const db = tmpDb();
  try {
    const parsed = parseFile(FIX);
    ingest(db.path, parsed, FIX);
    ingest(db.path, parsed, FIX);
    const conn = new Database(db.path);
    const runs = conn.prepare('SELECT id, messages_added FROM ingest_runs ORDER BY id').all();
    conn.close();
    assert.equal(runs.length, 2);
    assert.ok(runs[0].messages_added > 0);
    assert.equal(runs[1].messages_added, 0);
  } finally { db.cleanup(); }
});

test('stores community_name in meta', () => {
  const db = tmpDb();
  try {
    const parsed = parseFile(FIX);
    ingest(db.path, parsed, FIX);
    const conn = new Database(db.path);
    const row = conn.prepare("SELECT value FROM meta WHERE key = 'community_name'").get();
    conn.close();
    assert.equal(row.value, 'Collective Tech');
  } finally { db.cleanup(); }
});
