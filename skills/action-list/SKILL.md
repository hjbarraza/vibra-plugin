---
name: action-list
description: Produce the CM's weekly DM queue — silent joiners, welcome gaps, frustration signals, and shoutout candidates in one markdown artifact. Use when the user asks who needs follow-up, who to message, or wants a CM action list.
argument-hint: <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-action-list.js *)
---

No external API calls. All judgment happens inside this agent session.

Step 1 — run the script:

```bash
vibra-action-list.js $ARGUMENTS
```

Step 2 — read the JSON. Structure:
- `community`, `sinceIso`, `untilIso`
- `rosterStats`: `{ rosterSize, activeInWindow, neverPosted }` — use to frame the headline
- `silentJoiners`: `[{ sender, joinedAt }]` — joined IN window, zero messages posted since
- `longSilentMembers`: `[{ sender, firstSeenAt, silentDays }]` — on roster 30+ days, NEVER posted (biggest CM retention lever)
- `welcomeGaps`: `[{ sender, joinedAt, firstMessageAt, firstMessage }]` — first message got no reply within 24 hours
- `frustrationCandidates`: `[{ sender, sentAt, text }]` — messages matching frustration-heuristic patterns. NOT CONFIRMED — you judge
- `shoutoutCandidates`: `[{ sender, helpCount, sample: { question, reply, at } }]` — members who replied substantively (>30 chars, within 30min) to 2+ questions

Step 3 — judge frustration candidates. For each, decide:
- `confirmed`: true if the message is a real frustration / churn signal; false if it's a false positive (reference to someone else's frustration, humorous use, unrelated context)
- `reason`: one sentence in the community's dominant language

Step 4 — draft shoutouts. Pick the top 3-5 candidates and write a one-sentence shoutout for each, in the community's language, referencing the type of help they gave (without quoting the member's exact words unless quoting is clearly flattering).

Step 5 — render the final markdown at `./vibra-output/action-list-<slug>-<YYYY-MM-DD>.md`:

```
# <community> — weekly action list
_<since> → <until>_

## Roster snapshot
**X/Y active this window · Z never posted** — if the never-posted count is worryingly high, lead with it.

## 🚨 Frustration signals
<only confirmed ones. Skip section if empty.>
- **<sender>** (<date>, <time>): <quoted message>
  _<reason>_

## 👻 Long-silent members (30+ days on roster, never posted)
<The highest-leverage CM outreach queue. Skip section if empty.>
- **<sender>** — silent <N> days (first seen <date>)

## 👋 Silent joiners (joined this window but never posted)
- **<sender>** (joined <date>)

## 🎯 Welcome gaps (first message got no reply)
- **<sender>** (<date>): "<first message truncated>"

## 🙌 Shoutouts (helpful members this week)
- **<sender>** — <your one-sentence shoutout>
```

Step 6 — report back to the user: counts of each section plus the file path. Offer to open.
