---
name: report
description: Generate a monthly stakeholder-facing report on community health and growth. Use when the CM needs to report up to a founder, owner, or board — quarterly reviews, sponsor updates, retention reviews.
argument-hint: <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-report.js *)
---

No external API calls. Narrative synthesis happens inside this agent session.

Step 1 — run the script:

```bash
vibra-report.js $ARGUMENTS
```

Default window is the last 30 days of data in the export.

Step 2 — read the JSON. Structure:
- `community`, `sinceIso`, `untilIso`
- `thisPeriod`: `{ totalMessages, distinctMembers, newMembers, responseRate, gini, threadStats, topContributors, roster }` — where `roster` is `{ rosterSize, activeInWindow, neverPosted, rosterIsLowerBound, longSilent }`
- `previousPeriod`: `{ totalMessages, distinctMembers, rosterActive, rosterSize }` — use this to show deltas
- `topThreads`, `openAsks`, `newMembers`, `quiet`

Step 3 — audience is the owner/founder/board, NOT the CM. Frame for stakeholder ears:
- Lead with the headline (growth, engagement, health direction)
- Narrative over stats dump — the numbers support the story, not vice versa
- Show deltas vs previous period, but give context (why up/down beyond the number)
- Recognize specific members who shaped the period
- Flag risks honestly (churn signals, concentration, silent joiners)

Step 4 — render markdown at `./vibra-output/report-<slug>-<YYYY-MM-DD>.md`:

```
# <community> — monthly report
_<since> → <until>_

## Headline
<one paragraph — the story of the period. Growth, engagement, key moments.>

## Numbers
| Metric | This period | Prior period | Δ |
|---|---|---|---|
| Messages | N | M | +X% |
| Roster (visible) | N | M | +X% |
| Posted this period | N of X (Y%) | M of Y (Z%) | +A pts |
| New members | N | — | — |
| Response rate | X% | — | — |
| Concentration (Gini) | 0.XX | — | — |

> Note on roster: the count is a lower bound — members who joined before the export started and never posted are invisible. Frame for the stakeholder accordingly.

## What happened
<Narrative walkthrough of the top 3-5 threads this period. Not verbatim summaries — what they signify for the community.>

## Who shaped this month
<Recognition paragraph — the members whose contributions moved things. 3-5 named.>

## What needs attention
<Churn risks, engagement concentration, unresolved issues. Written honestly, not alarmist.>

## Looking forward
<Brief — one paragraph about what the CM is planning or asking the owner to consider.>
```

Use the owner's likely language — if the community is Spanish-led, the report is Spanish. If mixed, pick the one the owner speaks.

Step 5 — report back: headline numbers + file path. Offer to open.
