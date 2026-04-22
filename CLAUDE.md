# CLAUDE.md — vibra-plugin

Behavioral guidance for Claude when working on this plugin.

## Tier discipline (hard rule)

There are two versions of this plugin:

- **Normal** — no SQL database. Stateless. Every command takes a file path, parses, analyzes in-memory, writes an artifact, exits. No persistence between runs.
- **Pro** — SQL database (SQLite). Persistent. Supports incremental ingest, judgment caching, longitudinal analytics, local embeddings, "don't re-alert" state, cross-run member tracking.

**Rule: finish the Normal version before any Pro work.**

When a use case or feature requires a database, embeddings, or any form of cross-run persistence:

1. Do not build it in the Normal version.
2. Remind H so we capture it in `docs/PRO_ROADMAP.md`.
3. Keep the Normal path clean and stateless.

This rule exists because the plugin was previously over-scoped on Day 1 and we retrenched. Don't re-litigate.

## What counts as Normal

- Pure parsing (regex over export file → structured messages)
- In-memory analysis: threads, stats, window filters, heuristic candidate filters
- Single-run commands that take a path, produce a JSON or markdown artifact, exit
- Agent-driven LLM work via slash-command prompts (no direct API calls)

## What counts as Pro

- Anything writing to SQLite
- Incremental ingest / dedupe across re-exports
- Judgment caching (question_detections, answered_checks)
- Community identity persisted across sessions
- Member deduplication across name variants (requires stored aliases)
- "Mark as handled" state for followups
- Historical metrics ("unanswered for 3 weeks")
- Local embeddings via Jina AI / BGE / GTE
- Cross-community analytics

## Coding rules (inherited from ~/.claude/coding-guidelines.md)

1. Think before coding — state assumptions, push back when simpler exists.
2. Simplicity first — minimum code that solves the problem.
3. Surgical changes — touch only what the request requires.
4. Goal-driven execution — define verifiable success before coding.

## Plugin-specific rules

- No external API keys. All LLM work happens inside the host agent (Claude Code, Claude Desktop, etc.) via slash-command prompts.
- Non-technical CM tone — plain English errors, zero jargon ("schema drift" → "looks like the file changed").
- Locale-agnostic by construction — date format detected from data, system messages cover EN/ES/PT/FR at minimum.
- Scripts = deterministic work (parse, cluster, rank). Agent = judgment work (summarize, classify, narrate).
