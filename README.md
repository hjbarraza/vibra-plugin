# Vibra — WhatsApp community intelligence

A Claude Code plugin that turns a WhatsApp chat export into a community manager's working artifacts: weekly digests, follow-up lists, action queues, content ideas, member dossiers, and stakeholder reports.

Everything runs locally. No external API keys. Your community data stays on your laptop.

## What you get

| Skill | What it does |
| --- | --- |
| `/vibra:digest` | Weekly catch-up — what happened, top threads, open asks, new members, who went quiet |
| `/vibra:unanswered` | LLM-judged list of questions that didn't get a real answer — your follow-up queue |
| `/vibra:pulse` | Interactive HTML dashboard — activity curve, hour-by-day heatmap, top contributors, response rate, concentration |
| `/vibra:action-list` | Your Monday-morning DM queue — silent joiners, welcome gaps, frustration signals, shoutout candidates |
| `/vibra:content-ideas` | Newsletter/social fuel — best links, member quotables, tool mentions |
| `/vibra:profile` | One-page dossier on a specific member — who they are, how they engage, who they're in dialogue with |
| `/vibra:report` | Monthly report for your owner/founder/board — growth, health, narrative |
| `/vibra:parse` | Normalized JSON dump, for piping into other tools |

## Requirements

- [Claude Code](https://claude.com/claude-code) (or another MCP-compatible agent)
- Node.js 20+

## Install

```bash
# Clone (or download) the plugin somewhere on your machine
git clone <repo-url> vibra-plugin

# Enable it for a Claude Code session (any working directory)
claude --plugin-dir /absolute/path/to/vibra-plugin
```

No `npm install` needed — the Normal tier has zero runtime dependencies. Just Node 20+.

At first launch Claude Code will prompt for two optional settings (default output dir, default language). Accept defaults or set your own.

For a permanent install, publish the plugin to a plugin marketplace and install via `/plugin install`.

## Get your WhatsApp export

On iOS:
1. Open the group chat
2. Tap the group name → scroll to bottom → **Export Chat**
3. Choose **Without Media** (the .txt is all we need)
4. Save or AirDrop the `.zip` to your Mac

On Android:
1. Open the group chat
2. Tap the three dots → **More** → **Export chat**
3. Choose **Without media**
4. Save the `.txt`

## Use it

Drop the export path into any skill. Default window is the last 7 days of data (30 for `/vibra:report`).

```
/vibra:digest ~/Downloads/_chat.txt
/vibra:unanswered ~/Downloads/_chat.txt --since 2026-04-15
/vibra:pulse ~/Downloads/_chat.txt
/vibra:action-list ~/Downloads/_chat.txt
/vibra:content-ideas ~/Downloads/_chat.txt
/vibra:profile ~/Downloads/_chat.txt --member "Josu San Martin"
/vibra:report ~/Downloads/_chat.txt
```

Or just ask Claude naturally: **"analyze this WhatsApp export at ~/Downloads/_chat.txt"** — the orchestrator skill picks the right command.

### Flags available on every skill

- `--since YYYY-MM-DD` / `--until YYYY-MM-DD` — explicit window
- `--output-dir <dir>` — where artifacts land (default: `./vibra-output`)
- `--lang <code>` — force output language (`en`, `es`, `pt`, `fr`, …). Default: auto-detected from the conversation.

## What goes where

All artifacts land in `./vibra-output/` by default, named `<kind>-<community-slug>-<date>.<ext>`:

- JSON (machine-readable): `digest-*.json`, `unanswered-*.json`, etc.
- Markdown (what the agent renders for you): `digest-*.md`, `unanswered-*.md`, `action-list-*.md`, etc.
- HTML (interactive): `pulse-*.html`

Open any HTML file directly in your browser. Open any markdown file in your editor.

## Privacy

- Your export never leaves your machine.
- No network calls from the plugin scripts — all LLM synthesis happens inside the agent session you already have open.
- No API keys required.
- Output goes to your local filesystem, nowhere else.

## Supported formats

- iOS WhatsApp export (`[M/D/YY, H:MM:SS AM]` timestamps)
- 24-hour bracket format (`[DD/MM/YYYY, HH:MM:SS]`)
- Date format auto-detected — works for any locale
- System messages and media placeholders recognized in English, Spanish, Portuguese, French

## Status

This is the **Normal** tier of the plugin — stateless, file-in, artifact-out, runs anywhere. A **Pro** tier with persistent storage, incremental ingest, member deduplication, local embeddings, and longitudinal metrics is planned. See `docs/PRO_ROADMAP.md` for what's deferred.

## Development

```bash
npm test            # runs the test suite
node bin/vibra-digest.js path/to/export.txt   # run a single CLI directly
```
