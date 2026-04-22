-- Vibra plugin — per-community SQLite schema. One DB file per community.
-- Location: ~/.getvibra/communities/<slug>.db

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingest_runs (
  id                INTEGER PRIMARY KEY,
  started_at        TEXT NOT NULL,
  finished_at       TEXT,
  source_file_hash  TEXT NOT NULL,
  source_file_path  TEXT NOT NULL,
  messages_added    INTEGER NOT NULL DEFAULT 0,
  members_added     INTEGER NOT NULL DEFAULT 0,
  error             TEXT
);

CREATE TABLE IF NOT EXISTS members (
  id              INTEGER PRIMARY KEY,
  canonical_name  TEXT NOT NULL UNIQUE,
  first_seen_at   TEXT NOT NULL,
  last_seen_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_aliases (
  alias      TEXT PRIMARY KEY,
  member_id  INTEGER NOT NULL REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id             INTEGER PRIMARY KEY,
  member_id      INTEGER REFERENCES members(id),
  sent_at        TEXT NOT NULL,
  text           TEXT NOT NULL DEFAULT '',
  kind           TEXT NOT NULL DEFAULT 'message'
                 CHECK (kind IN ('message','system','joined','left','created')),
  media_kind     TEXT
                 CHECK (media_kind IS NULL OR media_kind IN ('image','video','audio','sticker','document')),
  was_edited     INTEGER NOT NULL DEFAULT 0,
  was_deleted    INTEGER NOT NULL DEFAULT 0,
  content_hash   TEXT NOT NULL UNIQUE,
  ingest_run_id  INTEGER NOT NULL REFERENCES ingest_runs(id)
);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at     ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_member_sent ON messages(member_id, sent_at);

CREATE TABLE IF NOT EXISTS question_detections (
  message_id   INTEGER PRIMARY KEY REFERENCES messages(id),
  is_question  INTEGER NOT NULL,
  topic        TEXT,
  judged_at    TEXT NOT NULL,
  model        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS answered_checks (
  question_id      INTEGER NOT NULL REFERENCES messages(id),
  answered_state   TEXT NOT NULL CHECK (answered_state IN ('yes','no','partial')),
  reason           TEXT,
  window_end_at    TEXT NOT NULL,
  judged_at        TEXT NOT NULL,
  model            TEXT NOT NULL,
  PRIMARY KEY (question_id, judged_at)
);
