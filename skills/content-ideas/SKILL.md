---
name: content-ideas
description: Mine the community for newsletter, social, or marketing content. Surface best links, quotable member messages, and tool/product mentions. Use when the CM is preparing a newsletter, social posts, or content queue.
argument-hint: <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-content-ideas.js *)
---

No external API calls. All curation happens inside this agent session.

Step 1 — run the script:

```bash
vibra-content-ideas.js $ARGUMENTS
```

Step 2 — read the JSON:
- `links`: `[{ url, sharedBy, sharedAt, context, engagement }]` — engagement = replies within 30 min from other members
- `quotableCandidates`: `[{ sender, sentAt, text }]` — heuristic-filtered, NOT yet curated
- `mentions.names`: `[{ name, count, sample }]` — CamelCase tokens appearing 2+ times (likely tool/product names)
- `mentions.domains`: `[{ domain, count }]` — URL domain frequency

Step 3 — curate.

**Links** — pick the 5 highest-value, prioritizing high engagement AND substantive topics. Skip duplicates and low-value links (shortened URLs with no context, tracking links).

**Quotables** — read candidates, pick 3-5 that are genuinely insight-rich. Good quotable: clear takeaway, attributable, no in-group jargon requiring context. Skip: questions, requests for help, jokes that don't land without context, anything that would embarrass the member.

**Mentions** — filter false positives. Keep ones that are clearly tools/products/brands (Cursor, Linear, Claude, Ollama, etc.). Drop proper nouns that are names of people or generic capitalizations.

Step 4 — render markdown at `./vibra-output/content-ideas-<slug>-<YYYY-MM-DD>.md`:

```
# <community> — content ideas
_<since> → <until>_

## 🔗 Top links
1. **[<domain or short title>](<url>)** — shared by **<sender>** (<date>)
   _<1-line context from the message or your summary>_
   _<engagement note if >2: "sparked X replies">_

## 💬 Quotables
- **<sender>**: "<text, minimally trimmed>"

## 🛠 Tools & mentions
- **<Tool name>** — mentioned N times
- Domains: <domain1> (N), <domain2> (N), ...
```

Use the community's dominant language for framing. Quotes stay in original language.

Step 5 — report back to the user: counts picked + the file path. Offer to open.
