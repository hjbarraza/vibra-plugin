# Changelog

All notable changes to Vibra are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.1] — 2026-04-22

### Added

- **`/vibra:help`** — new skill that prints a quick reference: positioning, all commands, flags, quick-start, and contact info. Invoke when the user asks "what does this do?" or "how do I contact you?"

### Changed

- **Brand positioning**: Vibra is now presented as "the new community manager hire for professional communities."
- **Domain**: all footer and homepage links now point to [getvibra.co](https://getvibra.co) instead of the GitHub repo. Repository link preserved in `repository` field for contributors.
- Dashboard footer (pulse + all HTML artifacts) now reads: *Powered by Vibra · the new community manager hire for professional communities.*
- `plugin.json`, `marketplace.json`, `package.json`, README hero all updated to reflect the Vibra brand + getvibra.co domain.
- Author information added to `package.json`.

## [0.1.0] — 2026-04-22

### Changed

- **`/vibra:pulse` is now the unified community dashboard**, replacing the old health-snapshot. One HTML artifact with two tabs:
  - **For the Community Manager** — action queue, open questions, top threads, content to amplify, membership flow. Fully deterministic; rendered from data.
  - **For the Business** — community vitals, growth vs prior period, activity charts, member personas, topic signal, jobs-to-be-done, strategic observations. Mix of deterministic (tables, metrics, token frequencies) + agent-synthesized (persona narratives, topic themes, JTBD, recommendations).
- **Default window widened to 6 weeks** (42 days) — enough horizon for meaningful trend + persona + topic analysis.
- **Per-tab print-to-PDF** — `window.print()` only prints the currently active tab, so you get two separate PDFs (CM report, Business report) instead of one combined document.

### Added

- `src/analyzers/personas.js` — heuristic clustering of members by behavior (helper, asker, connector, content-sharer, regular, newcomer, observer) + lurker count from roster.
- `src/analyzers/topics.js` — keyword-frequency extraction with stopword filtering (EN + ES), producing top tokens with distinct-member counts and sample messages per topic.
- `src/analyzers/pulse.js` rewritten as an aggregator — pulls from every other analyzer plus growth comparison to the prior 42-day window.
- `src/renderers/pulse-html.js` rewritten with tabbed UI, minimal JS (~15 lines), Rams aesthetic preserved.
- Skill prompt updated with detailed guidance on how the agent should synthesize each of the four Business-tab placeholders.

## [0.0.4] — 2026-04-22

### Added

- **`marketplace.json`** — the repo now doubles as a Claude Code marketplace. Users can install via the `/plugin` interface instead of cloning:
  ```
  /plugin marketplace add hjbarraza/vibra-plugin
  /plugin install vibra@getvibra
  ```
  Updates pulled with `/plugin marketplace update getvibra`.

### Changed

- README leads with the marketplace install flow (one-line) and keeps `--plugin-dir` as an alternative for local development.

## [0.0.3] — 2026-04-22

### Added

- **Polished HTML + PDF for shareable artifacts.** `/vibra:report`, `/vibra:digest`, and `/vibra:profile` now render both `.md` (source/editable) and `.html` (Rams-styled, print-to-PDF) versions. The ops-facing skills (unanswered, action-list, content-ideas) stay markdown.
- `bin/vibra-render-html.js` — standalone CLI that wraps any markdown file in the shared Rams shell. Used by the three shareable skills; also usable directly.
- `src/renderers/base-html.js` — shared Rams shell + zero-dep markdown-to-HTML converter (headings, lists, bold/italic/code, links, blockquotes, tables, hr).
- **`VIBRA_EXPORT` env var fallback** — set once, slash commands pick up the path automatically: `export VIBRA_EXPORT=~/Downloads/_chat.txt` then `/vibra:digest` works without args.

### Changed

- README clarifies that anyone with Claude Code already has Node (since Claude Code is itself an npm package). Also clarifies that **Claude Desktop** (the Mac/Windows app) is a different product from **Claude Code** (the CLI) and doesn't support plugins.

## [0.0.2] — 2026-04-22

### Changed

- **Pulse dashboard redesigned** to a Dieter Rams–inspired aesthetic — restrained palette, generous whitespace, system fonts, grid-based metric cards, single muted-blue accent (OKLCH), thin 1px borders, no gradients or shadows.
- SVG charts refined: gridlines on the activity chart, cleaner heatmap cells.
- Added `@media print` styles so the HTML prints to PDF cleanly via browser Cmd+P — single-column grid, system fonts, "Powered by getvibra" as running page footer.
- Added responsive breakpoint at 720px for mobile viewing.

### Added

- `footer` with "Powered by getvibra" linking back to the plugin repo.

## [0.0.1] — 2026-04-22

First public release — the Normal tier.

### Added

- **Skills** (9) — `/vibra:parse`, `/vibra:digest`, `/vibra:unanswered`, `/vibra:pulse`, `/vibra:action-list`, `/vibra:content-ideas`, `/vibra:profile`, `/vibra:report`, `/vibra:members`, plus the `analyze-whatsapp` orchestrator
- **Parser** — iOS bracket + Android dash formats, locale-agnostic date detection (bound-check + monotonicity fallback), multi-locale system-message patterns (EN/ES/PT/FR), U+200E stripping, tilde-prefix sender normalization
- **Analyzers** — thread clustering, digest ranking, unanswered-question bundling with shared-context attribution, pulse stats (activity/heatmap/Gini/response rate), action-list heuristics (silent joiners, welcome gaps, frustration candidates, shoutout candidates), content mining (links + quotables + mentions), member profiles, monthly reports, member lists, and roster-vs-active ratio
- **CLI flags** — `--since`, `--until`, `--output-dir`, `--lang` across every command
- **User config** — `default_output_dir` and `default_lang` persisted per plugin install
- **Tests** — 44 tests covering parser (iOS/Android/EU/US formats), analyzers, edge cases (empty, system-only, unicode names)

### Design principles

- **Stateless** — every command reads a file, analyzes in memory, writes an artifact, exits. No database, no caches between runs
- **No external API keys** — all LLM synthesis happens inside the host agent session
- **Privacy-first** — community data never leaves the CM's machine
- **Skill markdown instructs, scripts compute** — deterministic work in Node, judgment work in Claude

### Known limitations (deferred to Pro)

- No cross-run persistence (incremental ingest, judgment caching, member alias deduplication)
- No longitudinal metrics (e.g., "unanswered for 3 weeks")
- No local embedding tier (semantic topic search, cross-community matching)

See `docs/PRO_ROADMAP.md` for the full deferred list.
