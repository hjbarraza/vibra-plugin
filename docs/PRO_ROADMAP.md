# Pro version roadmap

Features that require a database, embeddings, or any form of persistence between runs. Deferred from Normal per `CLAUDE.md` tier discipline rule.

## Items already designed but not shipping in Normal

### Persistent storage (SQLite, one file per community)

- Schema: `meta`, `ingest_runs`, `members`, `member_aliases`, `messages`, `question_detections`, `answered_checks`
- Location: `~/.getvibra/communities/<slug>.db`
- Rationale: community data survives uninstall/reinstall; one file per community = obvious privacy posture

### Incremental ingest

- Parse export → content_hash per message → `INSERT OR IGNORE` dedupes across runs
- CM re-exports weekly, we only process new messages
- Requires schema + content_hash UNIQUE constraint

### Judgment caching

- Cache LLM-judged states (`is_question`, `answered_state`, reason) keyed by `message_id`
- Non-questions and fully-answered states persist permanently
- Partial/no states re-judged each run (new replies may flip state)
- Files already written: `src/db/record.js`, `bin/vibra-record-judgments.js`, cache-consult in `unanswered.js`
- Tests: `tests/record.test.js`

### Member deduplication across alias variants

- Same person with multiple display names or phone-number variants
- Requires persistent `member_aliases` table + LLM-judged alias resolution with CM confirmation
- Not possible statelessly

### "Mark as handled" state

- CM acknowledges a surfaced followup so it doesn't reappear next run
- Requires `followups_surfaced` table

### Historical metrics

- "This member was active in weeks 1-5, went silent in week 6"
- "Response rate declining over the last 3 months"
- "This question has been unanswered for 3 weeks"
- All require multi-run comparisons

### Local embeddings tier

- Jina AI v4 / BGE-small / GTE-small — any 8GB-RAM model
- Enables semantic topic clustering (vs keyword bag-of-words)
- Enables semantic ask/offer matching
- Enables vector-based /vibra-topic search
- Python likely the right stack for this (PyTorch/sentence-transformers ecosystem)
- Stored embeddings keyed by message_id in a dedicated table

### Cross-community analytics

- One CM manages multiple communities → aggregate insights across them
- Requires multi-DB orchestration

## Items that emerge from Normal and should land in Pro

_Fill as we go — every time Normal-tier development surfaces a "this needs persistence" moment, log it here._

- _(none yet — tracked from 2026-04-22)_

## Carryover from Normal

When Pro starts, the Normal plugin stays shipping — Pro is additive, gated behind the database. Normal users keep getting artifacts on-demand; Pro users unlock the longitudinal layer.
