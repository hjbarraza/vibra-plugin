---
name: unanswered
description: Surface community questions that weren't substantively answered. Use when the user wants a follow-up list, asks who's waiting for a reply, or wants to see open questions.
argument-hint: <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-unanswered.js *)
---

No external API calls. All judgment happens inside this agent session.

Step 1 — run the script to produce candidate bundles (the plugin's `bin/` is on PATH):

```bash
vibra-unanswered.js $ARGUMENTS
```

Step 2 — read the JSON. Structure:
- `community`, `sinceIso`, `untilIso`, `candidateCount`
- `bundles[]`: each bundle is a set of candidate asks that share a time window
  - `questions[]`: `{ id, sender, sentAt, text }` — the candidate asks
  - `sharedContext[]`: `{ sender, sentAt, text }` — ALL other messages inside the bundle's window, in chronological order

Step 3 — for each bundle, judge every question in it. Crucial rules:

- Multiple questions in the same bundle compete for replies. Attribute each reply to the specific question it addresses — don't give the same reply credit for two different questions.
- A casual acknowledgment ("let me check", "interesting") is NOT an answer.
- A partial or indirect answer is `partial`, not `yes`.
- A message that says "I don't know" or "no idea" is an honest non-answer — mark as `no` with that reason.
- If the candidate isn't actually a substantive question (rhetorical "right?", filler), mark it and skip.

Step 4 — write the final markdown at `./vibra-output/unanswered-<slug>-<YYYY-MM-DD>.md` with three sections:

```
# <community> — open questions
_<since> → <until>_

## Unanswered — needs follow-up
- **<sender>** (<date>, <time>): <question text>
  _<reason in the community's dominant language>_

## Partially answered — worth a nudge
- **<sender>** (<date>, <time>): <question text>
  _<reason>_

## Fully answered (reference)
- **<sender>** (<date>, <time>): <question text>
  _<reason>_
```

Step 5 — report back to the user: unanswered count + partial count. Offer to open the file.
