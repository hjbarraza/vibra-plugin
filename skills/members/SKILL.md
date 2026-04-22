---
name: members
description: List all members of a community with message counts, first-seen and last-seen dates. Use when the user wants to see who's in the community, look up an exact member name for /vibra:profile, or audit the roster.
argument-hint: <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-members.js *)
---

Run the members CLI:

```bash
vibra-members.js $ARGUMENTS
```

The script outputs a JSON file at `./vibra-output/members-<slug>.json` with the roster summary and every member ranked by message count.

Structure:
- `community`, `sinceIso`, `untilIso`, `rosterSize`, `postersCount`, `neverPosted`, `longSilentCount`
- `members[]`: `{ sender, messageCount, firstSeenAt, lastSeenAt }` ranked by message count

Step 2 — render based on intent:

- If the user asked "who's in this community" or "show me the members" → list top 20 with message counts, mention the roster total (visible) and silent count.
- If the user said "find member X" or "look up X" and the exact name isn't an exact member → search `members[].sender` for close matches (case-insensitive substring, trimmed), show the top 5 candidates, ask which one.
- If the user asked about a specific member → give their stats inline (messages, active window, rank).

Step 3 — report back in plain language, not a raw JSON dump.
