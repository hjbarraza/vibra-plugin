---
name: digest
description: Generate a weekly digest from a WhatsApp chat export. Use when the user asks what happened in their community, wants a catch-up, or requests a weekly summary.
argument-hint: <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-digest.js *)
---

No external API calls — all LLM synthesis happens inside this agent session.

Step 1 — run the script to produce the digest data (the plugin's `bin/` is on PATH while the plugin is enabled):

```bash
vibra-digest.js $ARGUMENTS
```

Note the output path it prints.

Step 2 — read the JSON. It contains:
- `community`, `sinceIso`, `untilIso`, `totalMessages`, `distinctMembers`
- `topThreads`: `[{ participants, messageCount, startAt, endAt, messages: [{sender, sentAt, text, mediaKind}] }]`
- `openAsks`: `[{ sender, sentAt, text }]`
- `newMembers`, `quiet`

Step 3 — for each thread in `topThreads`, write ONE sentence summarizing it in the thread's dominant language. No preamble.

Step 4 — write the final markdown to `./vibra-output/digest-<slug>-<YYYY-MM-DD>.md`:

```
# <community> — weekly digest
_<since> → <until>_

## Headline
- N messages from M members
- X top threads, Y open asks, Z new members, Q went quiet

## Top threads
### 1. <first 3 participants + "et al." if more> — N msgs
<your one-sentence summary in the thread's language>

## Open asks
_Questions with no reply within 30 minutes. The deeper LLM-judged version lives in /vibra-unanswered._
- **<sender>** (<date>): <truncated text>

## New members
- <name> (joined <date>)

## Went quiet this week
- <name>
```

Step 5 — report back to the user: headline stats plus the digest path. Offer to open it.
