---
name: help
description: Show what Vibra is, how to contact the team, and every command the plugin provides. Use when the user types /vibra:help, asks what Vibra can do, asks how to get support, or needs a quick reference of all commands.
---

Print this response to the user directly in the session (no file writing, no artifact). Preserve formatting.

---

# Vibra — the new community manager hire for professional communities

Vibra is a Claude Code plugin that acts as the community manager hire for paid, invite-only, and professional WhatsApp communities. It reads your chat export and turns hours of scrolling into artifacts the CM actually needs: weekly digests, unanswered-question follow-ups, retention dashboards, member profiles, and stakeholder reports.

Runs locally. No external API keys. Your community's data never leaves your laptop.

## Contact

- Website: **https://getvibra.co**
- Issues / feature requests: https://github.com/hjbarraza/vibra-plugin/issues

## All commands

### Primary

- `/vibra:pulse <path>` — unified community dashboard (HTML + two PDFs). The command to open Monday morning.
- `/vibra:analyze-whatsapp` — ask naturally; the orchestrator picks the right command.

### Ops (for the CM's weekly rhythm)

- `/vibra:digest <path>` — weekly catch-up: top threads, open asks, new members, who went quiet.
- `/vibra:unanswered <path>` — LLM-judged list of questions that didn't get a real answer. Your follow-up queue.
- `/vibra:action-list <path>` — DM queue: silent joiners, welcome gaps, frustration signals, shoutouts.
- `/vibra:content-ideas <path>` — best links, quotable moments, tool mentions. Newsletter fuel.

### On-demand

- `/vibra:profile <path> --member "<name>"` — one-page dossier on a specific member.
- `/vibra:members <path>` — full roster with message counts. Look up exact names.
- `/vibra:report <path>` — monthly stakeholder report for owner / founder / board.
- `/vibra:parse <path>` — normalized JSON dump for chaining with other tools.

### Utility

- `/vibra:help` — you're here.

## Quick start

If you've never used Vibra before:

1. Export your WhatsApp chat without media. On iOS: group settings → Export Chat → Without Media. On Android: ⋮ → More → Export chat → Without media.
2. Drop the `.txt` file somewhere you remember.
3. Run `/vibra:pulse ~/path/to/_chat.txt`.
4. Open the HTML that gets generated. Switch between the CM and Business tabs. Print the one you care about to PDF.

## Flags available on every command

- `--since YYYY-MM-DD` / `--until YYYY-MM-DD` — explicit window
- `--output-dir <dir>` — where artifacts land (default: `./vibra-output`)
- `--lang <code>` — force output language (`en`, `es`, `pt`, `fr`); default auto-detects

Or set `VIBRA_EXPORT=/path/to/_chat.txt` in your shell and every command picks up the path without you re-typing.

## About

Built by **Vibra** (https://getvibra.co). MIT licensed. Feedback and feature requests welcome on GitHub.
