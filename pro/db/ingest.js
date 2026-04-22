import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { parseWhatsAppChat, extractCommunityName } from '../parser/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

export function openDb(dbPath) {
  const db = new Database(dbPath);
  db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
  return db;
}

function hashFile(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

function upsertMember(db, name, sentAt) {
  const row = db.prepare('SELECT id FROM members WHERE canonical_name = ?').get(name);
  if (row) {
    db.prepare('UPDATE members SET last_seen_at = ? WHERE id = ? AND last_seen_at < ?').run(sentAt, row.id, sentAt);
    return { id: row.id, created: false };
  }
  const info = db.prepare('INSERT INTO members (canonical_name, first_seen_at, last_seen_at) VALUES (?, ?, ?)').run(name, sentAt, sentAt);
  return { id: info.lastInsertRowid, created: true };
}

export function parseFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const fileHash = hashFile(raw);
  const { messages, dateFormat } = parseWhatsAppChat(raw);
  const communityName = extractCommunityName(messages);
  return { raw, fileHash, messages, communityName, dateFormat };
}

export function ingest(dbPath, parsed, filePath) {
  const { fileHash, messages, communityName } = parsed;

  const db = openDb(dbPath);
  const startedAt = new Date().toISOString();

  const runId = db.prepare(
    'INSERT INTO ingest_runs (started_at, source_file_hash, source_file_path) VALUES (?, ?, ?)'
  ).run(startedAt, fileHash, filePath).lastInsertRowid;

  if (communityName) {
    db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('community_name', communityName);
  }

  const insertMsg = db.prepare(`
    INSERT OR IGNORE INTO messages
      (member_id, sent_at, text, kind, media_kind, was_edited, was_deleted, content_hash, ingest_run_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let messagesAdded = 0;
  let membersAdded = 0;

  const run = db.transaction(() => {
    for (const m of messages) {
      const isSystemSender = /end-to-end encrypted/i.test(m.text) && m.kind === 'system';
      let memberId = null;
      if (m.sender && !isSystemSender) {
        const { id, created } = upsertMember(db, m.sender, m.sentAt);
        memberId = id;
        if (created) membersAdded++;
      }
      const info = insertMsg.run(
        memberId, m.sentAt, m.text, m.kind, m.mediaKind, m.wasEdited, m.wasDeleted, m.contentHash, runId,
      );
      if (info.changes > 0) messagesAdded++;
    }
  });
  run();

  db.prepare('UPDATE ingest_runs SET finished_at = ?, messages_added = ?, members_added = ? WHERE id = ?')
    .run(new Date().toISOString(), messagesAdded, membersAdded, runId);

  const totals = db.prepare('SELECT COUNT(*) AS n FROM messages').get();
  const totalMembers = db.prepare('SELECT COUNT(*) AS n FROM members').get();

  db.close();

  return {
    communityName,
    messagesParsed: messages.length,
    messagesAdded,
    membersAdded,
    totalMessages: totals.n,
    totalMembers: totalMembers.n,
    runId,
  };
}
