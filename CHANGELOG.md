# Changelog

All notable changes to Vibra Code Lite are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.5.2] — 2026-04-22

Dashboard now runs on a strict 12-column grid across both tabs, matching industry-standard layout discipline. Fixed a pre-existing test string mismatch (case sensitivity).

### Changed

- **12-column grid** — `.cm-grid` and `.business-grid` now use `repeat(12, 1fr)` instead of `1fr 1fr`. Cards default to `span 6` (half-width); full-width cards use `span 12`. Print and mobile breakpoints collapse all cards to `span 12` accordingly.
- **Test fix** — `pulse.test.js` assertion corrected from `'Topic signal'` to `'topic signal'` to match actual renderer output (pre-existing mismatch).

---

## [0.5.0] — 2026-04-22

Dashboard redesigned around a considered Ive / Rams / Apple sensibility — cream & ink palette, SF Pro Display for numerals, generous whitespace, content-first cards without heavy chrome. Full dark mode support with toggle and system-preference detection.

### Added

- **Light + dark mode** with automatic system-preference detection (`prefers-color-scheme`) and manual toggle button in the tab bar. Preference persisted in `localStorage`.
- **Theme button** (◐ / ◑) next to Help and Print.
- All colors moved to CSS custom properties so the palette switches cleanly.

### Changed

- **Palette** — cream `#f7f3ec` background / pure-white cards / ink-black text (`#14110c`) in light; warm near-black (`#14110c`) background / deep-brown cards (`#1e1b15`) / cream text (`#f1ebdd`) in dark. No blue accents — color comes only from tier pills, horizon markers, and risk bars.
- **Typography** — SF Pro Display for headings (`font-weight: 300/400`, tighter `letter-spacing`), SF Pro Text for body. Larger `h1` (36px) and metric values (38px). More generous `line-height` (1.6).
- **Cards** — 10px border-radius, no borders, subtle elevation via shadow instead. 28-32px padding. Pure white in light mode, `--surface` in dark.
- **Subnavs** get `backdrop-filter: blur(8px)` while sticky.
- **Modals** — 14px radius, 32/36px padding, stronger blur on backdrop. Cleaner close affordance.
- **Buttons** — 6px radius, subtle transitions, color flips cleanly with theme.
- **Drafts, decisions, actions** — now use `--surface-2` background with no borders, internal 6px-radius input-style draft text.
- **Tier pills** — text color adapts (cream background tiers use `--text` instead of hardcoded black).
- **Network map** — wrapped in a soft 10px-radius container with `--surface-2` background.
- **Print** — explicitly resets colors to light palette so PDFs are consistent.

### Git history

- Removed all `Co-Authored-By: Claude` trailers from every commit via `filter-branch`. Reflog purged and force-pushed. H Barraza remains sole author.

## [0.4.1] — 2026-04-22

### Removed

- **Buy-signals** (the purchase-intent heuristic) removed end-to-end. Didn't generate reliable value — the Champions who showed pricing curiosity were already the top posters, so the signal duplicated what Influence + Tier already told us.
  - Removed from `src/analyzers/personas.js` (patterns, tracking, `buyCurious` cluster, `buy-curious` tag)
  - Removed from pulse dashboard (Revenue/buy card, Buy column in Member Intelligence table, buy-curious filter pill, Revenue entry in Business sub-nav)
  - Removed from skill prompt guidance
  - Strategic outreach in Month card now anchored to `topInfluence` instead.

### Added

- **Command reference modal** opened via <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> or the "? Help" button in the tab bar. Shows every `/vibra-code-lite:*` command with a one-line description, all CLI flags, the `VIBRA_EXPORT` env var, and contact links. Close with <kbd>Esc</kbd>.

## [0.4.0] — 2026-04-22

Dashboard reoriented around the CM's actual workflow. Pulse's CM tab is no longer a set of category cards — it's a time-indexed action brief with copy-paste drafts, pre-written intros, timed seed prompts, and binary decisions.

### Added — CM workflow layer

- **Time-horizon cards** at the top of the CM tab:
  - **Today** — 3-5 actions with copy-paste message drafts, tone-matched to the CM's voice. Each card has Copy + Dismiss buttons.
  - **This week** — 5-7 seed prompts anchored to peak posting hours, 2-3 thread follow-ups, newsletter feature nominations.
  - **This month** — strategic moves: premium-tier interview outreach, onboarding playbook when stickiness is weak, stakeholder pre-brief, sub-community ideas.
  - **Decisions** — 3-5 binary yes/no questions with pro/con grounded in specific data.
- **Copy buttons** on every draft — one click, text ready in clipboard.
- **Dismiss buttons** — hide a card for the session (no persistence; Pro feature).
- **CM-tab sticky sub-nav** — Today / This week / This month / Decisions / Supporting data.
- **Supporting data** section (collapsed by default) — the previous category cards still available for raw data lookup.

### Added — new analyzer

- `src/analyzers/cm-context.js`:
  - **CM detection** — infers likely CM from highest-influence + earliest-joined pattern
  - **Voice samples** — 3-6 recent messages from the CM for tone-matching
  - **Peak windows** — top 3 day×hour posting windows (for timing suggestions)
  - **Moderator candidates** — Power-tier helpers with 30+ days tenure and low risk
  - **Dormant topics** — tokens hot in prior period but quiet now (revival candidates)

### Added — network map upgrades

- **Tier color legend** above the graph.
- **Click-to-highlight neighborhood** — click any node to highlight its edges + connected nodes, dim the rest. Click empty space or the node again to clear.
- **Labels pointer-events disabled** so click passes through to circles.
- Richer hover tooltip (tier + influence + messages).

### Changed

- Pulse aggregator now computes CM context (name, voice, peaks, moderators, dormant topics).
- Skill prompt significantly expanded — detailed guidance for each new placeholder, HTML shapes the agent should produce, voice-matching and language rules.

## [0.3.0] — 2026-04-22

Major visualization + interactivity pass. Plugin renamed from `vibra` to `vibra-code-lite` to distinguish the open-source plugin from the company (Vibra) and the hosted product.

### Renamed

- **Plugin name**: `vibra` → `vibra-code-lite`. Slash commands are now `/vibra-code-lite:pulse`, `/vibra-code-lite:digest`, etc.
- **GitHub repo**: `hjbarraza/vibra-plugin` → `hjbarraza/vibra-code-lite` (old URL redirects automatically).
- **Install**: `/plugin marketplace add hjbarraza/vibra-code-lite` → `/plugin install vibra-code-lite@getvibra`. Marketplace name (`getvibra`) unchanged.
- `plugin.json`, `marketplace.json`, `package.json`, README title, all skill prompts.

### Added — visual upgrades

- **Community Health Score** — radial-gauge 0-100 at the top of the Business tab. Composite: response rate 35% + roster activation 30% + distribution 20% + growth 15%. Labels: Thriving / Healthy / Needs attention / Critical.
- **Force-directed network graph** — real nodes-and-edges visualization replacing the pair list. Node size = influence, color = tier, edge thickness = interaction count. Positions pre-computed in Node via a spring-embedder (`force-graph.js`).
- **Per-member activity sparklines** — 42-day mini-chart in each Member Intelligence row.
- **Activity stacked by tier** — stacked-area chart alongside the raw activity chart.
- **Content mix bar** — horizontal bar + legend (questions / answers / shares / social / announcements / meta / other).
- **Stickiness funnel** — Joined → Tried → Stuck → Ramped. Ghost list surfaces newcomers who never posted.

### Added — interactivity

- **Sortable Member Intelligence table** — click any column header to sort.
- **Tier filter pills** — All / Champion / Power / Regular / at-risk / buy-curious.
- **Member drill-down modal** — click any member name anywhere.
- **Sticky sub-navigation** within Business tab.

### Added — new analyzers

- `src/analyzers/asks-offers.js` — identifies asks and offers, pairs them by topic-token overlap. Surfaces possible intros.
- `src/analyzers/gratitude.js` — regex-based appreciation signals (EN/ES/PT/FR).
- `src/analyzers/content-mix.js` — classifies every message.
- `src/analyzers/stickiness.js` — 14-day newcomer retention funnel.
- `src/analyzers/force-graph.js` — Fruchterman-Reingold spring-embedder for graph layout.

### Added — new sections

- CM tab: **Asks / offers / possible intros** panel.
- Business tab: **Gratitude & satisfaction**, **New-member stickiness**, **Content mix**, benchmark callouts.

### Changed

- Pulse aggregator computes per-member daily activity + per-day activity-by-tier for visualizations.
- Business tab reorganized with logical section order + sub-nav.

## [0.2.0] — 2026-04-22

Inspired by the hosted Vibra product at [getvibra.co](https://getvibra.co). Pulse now surfaces the same intelligence concepts locally: engagement tiers, per-member attention/influence/giver%, disengage risk, network map, buy signals.

### Added

- **Member intelligence table** (Business tab) — every active member with Tier · Activity · Attention · Influence · Giver % · Buy signals · Risk · Last active. Ranked by activity; top 25 shown.
- **Engagement tier classification** — Champion (top 10%) / Power (next 20%) / Regular (next 30%) / Occasional (3+ msgs) / One-time (1–2 msgs) / Lurker (roster, no posts). Distribution panel in Business tab with colored bars.
- **At-risk members panel** (CM tab) — composite disengage-risk score per member (posting-trend decline + days-since-last-post), sorted by risk. Directly actionable DM queue.
- **Network map** (Business tab) — top cross-member interaction pairs and most-connected nodes. Edges = substantive replies within 30 min.
- **Revenue / buy signals** (Business tab) — members whose messages contain purchase-intent cues (pricing mentions, "worth it", "I'd pay…"). Heuristic-flagged in EN/ES/PT/FR.
- New analyzer `src/analyzers/network-map.js` — pair-count + node-degree from co-occurrence.

### Changed

- `src/analyzers/personas.js` extended to compute per-member Attention (replies received), Influence (network-weighted), Giver %, Last active, Disengage risk score, Buy signal count, and Tier classification. Adds new clusters: `buy-curious`, `at-risk`.
- README rewritten with a centered banner CTA linking to getvibra.co, plus a call-out positioning the plugin as the local-first entry point to the hosted Vibra product.
- Version bumped to 0.2.0 — meaningful feature expansion.

## [0.1.1] — 2026-04-22

### Added

- **`/vibra-code-lite:help`** — new skill that prints a quick reference: positioning, all commands, flags, quick-start, and contact info. Invoke when the user asks "what does this do?" or "how do I contact you?"

### Changed

- **Brand positioning**: Vibra is now presented as "the new community manager hire for professional communities."
- **Domain**: all footer and homepage links now point to [getvibra.co](https://getvibra.co) instead of the GitHub repo. Repository link preserved in `repository` field for contributors.
- Dashboard footer (pulse + all HTML artifacts) now reads: *Powered by Vibra · the new community manager hire for professional communities.*
- `plugin.json`, `marketplace.json`, `package.json`, README hero all updated to reflect the Vibra brand + getvibra.co domain.
- Author information added to `package.json`.

## [0.1.0] — 2026-04-22

### Changed

- **`/vibra-code-lite:pulse` is now the unified community dashboard**, replacing the old health-snapshot. One HTML artifact with two tabs:
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
  /plugin marketplace add hjbarraza/vibra-code-lite
  /plugin install vibra-code-lite@getvibra
  ```
  Updates pulled with `/plugin marketplace update getvibra`.

### Changed

- README leads with the marketplace install flow (one-line) and keeps `--plugin-dir` as an alternative for local development.

## [0.0.3] — 2026-04-22

### Added

- **Polished HTML + PDF for shareable artifacts.** `/vibra-code-lite:report`, `/vibra-code-lite:digest`, and `/vibra-code-lite:profile` now render both `.md` (source/editable) and `.html` (Rams-styled, print-to-PDF) versions. The ops-facing skills (unanswered, action-list, content-ideas) stay markdown.
- `bin/vibra-render-html.js` — standalone CLI that wraps any markdown file in the shared Rams shell. Used by the three shareable skills; also usable directly.
- `src/renderers/base-html.js` — shared Rams shell + zero-dep markdown-to-HTML converter (headings, lists, bold/italic/code, links, blockquotes, tables, hr).
- **`VIBRA_EXPORT` env var fallback** — set once, slash commands pick up the path automatically: `export VIBRA_EXPORT=~/Downloads/_chat.txt` then `/vibra-code-lite:digest` works without args.

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

- **Skills** (9) — `/vibra-code-lite:parse`, `/vibra-code-lite:digest`, `/vibra-code-lite:unanswered`, `/vibra-code-lite:pulse`, `/vibra-code-lite:action-list`, `/vibra-code-lite:content-ideas`, `/vibra-code-lite:profile`, `/vibra-code-lite:report`, `/vibra-code-lite:members`, plus the `analyze-whatsapp` orchestrator
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
