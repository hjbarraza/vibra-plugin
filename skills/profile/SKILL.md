---
name: profile
description: Produce a one-page dossier on a specific community member — what they care about, how they engage, who they connect with. Use before a 1-on-1 call, sponsor outreach, or to understand a specific member deeply.
argument-hint: <path-to-export.txt> --member "<name>" [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-profile.js *)
---

No external API calls. The narrative synthesis happens inside this agent session.

Step 1 — run the script:

```bash
vibra-profile.js $ARGUMENTS
```

If the script exits with "No messages from <name>" — the member name doesn't exactly match. Run `vibra-members.js <path>` to get the full member list, find the closest match (case-insensitive substring), present the top 3-5 candidates to the user, and ask which one they meant. Don't guess silently — let the user pick.

Step 2 — read the JSON. Structure:
- `community`, `member`, `sinceIso`, `untilIso`
- `totalMessages`, `activeDays`, `firstSeenAt`, `lastSeenAt`
- `avgMessageLength`, `questionsAsked`, `repliesGiven`
- `peakHours[]`, `peakDays[]`
- `engagedWith[]`: top 5 members this person interacts with most
- `sampleMessages[]`: 10 longest messages from this member

Step 3 — write a narrative dossier (NOT a stats dump). Read the sample messages to understand:
- What topics they care about
- How they show up — asker, answerer, sharer, lurker
- Their tone — casual, formal, terse, verbose
- Who they're in dialogue with most
- Shifts over time if the window is long enough

Step 4 — render markdown at `./vibra-output/profile-<slug>-<member>.md`:

```
# <member> — profile
_<community>, <since> → <until>_

## Snapshot
- N messages across M active days
- X questions asked, Y substantive replies given
- Most active on <peak days> around <peak hours>

## Who they are
<One paragraph, narrative. What topics they care about, how they engage, the shape of their presence in the community.>

## Core relationships
- **<name1>** — <nature of the interaction>
- **<name2>** — <nature>
- ...

## Representative messages
<3-5 quotes that capture their voice. Shortest first.>

> "<quote>"

## Suggested angle for a 1-on-1
<One paragraph: what to open with, what they'd want to talk about, what might be missing from their community experience.>
```

Use the community's dominant language for framing. Quotes stay in original language.

Step 5 — report back: headline stats + file path. Offer to open.
