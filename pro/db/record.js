import { openDb } from './ingest.js';

export function recordJudgments(dbPath, { model, judgments }) {
  const db = openDb(dbPath);
  const now = new Date().toISOString();
  try {
    const upsertDetection = db.prepare(`
      INSERT INTO question_detections (message_id, is_question, topic, judged_at, model)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(message_id) DO UPDATE SET
        is_question = excluded.is_question,
        topic       = excluded.topic,
        judged_at   = excluded.judged_at,
        model       = excluded.model
    `);
    const insertAnswered = db.prepare(`
      INSERT OR IGNORE INTO answered_checks
        (question_id, answered_state, reason, window_end_at, judged_at, model)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let detectionsWritten = 0;
    let answersWritten = 0;

    const tx = db.transaction(() => {
      for (const j of judgments) {
        upsertDetection.run(j.id, j.is_question ? 1 : 0, j.topic ?? null, now, model);
        detectionsWritten++;
        if (j.is_question && j.answered_state) {
          const info = insertAnswered.run(
            j.id, j.answered_state, j.reason ?? null, j.window_end_at ?? now, now, model,
          );
          if (info.changes > 0) answersWritten++;
        }
      }
    });
    tx();

    return { detectionsWritten, answersWritten };
  } finally { db.close(); }
}
