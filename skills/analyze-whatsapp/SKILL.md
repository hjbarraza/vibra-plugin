---
name: analyze-whatsapp
description: Orchestrate WhatsApp community export analysis. Invoke when the user references a WhatsApp export path or asks for community insights — catch-up digest, unanswered questions, health dashboard, action list, content ideas, member profile, or stakeholder report.
when_to_use: User mentions analyzing a WhatsApp chat, drops an export file path, asks what happened in their community, who has unanswered questions, who needs follow-up, wants a weekly overview, a health dashboard, newsletter content, a member dossier, or a stakeholder report.
---

Help a community manager get intelligence from their WhatsApp group chat export.

## Workflow

1. Confirm the user has an export file path. If not, tell them how to export (iOS: Group chat → Export Chat → Without Media; Android: ⋮ → More → Export chat → Without media) and ask for the path.
2. If the user provides a `.zip`, unzip it via Bash first (`unzip -p <zip> _chat.txt > <target>.txt` or `unzip <zip> -d <dir>`) and use the extracted `.txt` path for the command. WhatsApp .zip exports contain `_chat.txt` plus media files — we only need the .txt.
3. Pick the right command based on what they want:

| User intent | Command |
| --- | --- |
| Weekly catch-up, what happened | `/vibra:digest <path>` |
| Who's waiting for a reply, follow-up list | `/vibra:unanswered <path>` |
| Community health dashboard, activity curves, heatmap | `/vibra:pulse <path>` |
| Monday-morning DM queue — silent joiners, frustration, shoutouts | `/vibra:action-list <path>` |
| Newsletter content, quotes, tool mentions | `/vibra:content-ideas <path>` |
| Dossier on a specific member | `/vibra:profile <path> --member "<name>"` |
| Monthly report for owner/founder/board | `/vibra:report <path>` |
| List members / look up names | `/vibra:members <path>` |
| Just normalize to JSON | `/vibra:parse <path>` |

4. Pass `--since YYYY-MM-DD` / `--until YYYY-MM-DD` if the user named a window.
5. For a cross-period comparison ("this week vs last week"), run the relevant command twice with different windows and compare the two JSON outputs yourself — no dedicated compare script needed.
6. For "give me everything" requests, run digest + unanswered + action-list + pulse in sequence and summarize each.
7. Each command writes JSON or HTML; read the JSON, do the language/judgment work, render the final markdown.
8. Summarize back to the user in plain language — highlight the key numbers and offer to open the file.

## Hard rules

- Never fabricate analysis. If a command fails or returns empty, say so.
- Never quote member messages verbatim in public-facing summaries without the user's explicit OK.
- No external API keys. All LLM synthesis (thread summaries, topic detection, answered-ness judgments, member dossiers, narrative reports) happens inside this agent session — the scripts produce structured data, you do the language work.
- Scripts are the deterministic layer (parse, query, cluster, rank, count). You are the judgment layer (summarize, classify, narrate, curate). Don't reimplement the deterministic parts in your prompt.
- Everything is stateless. Each command takes a file path, analyzes in-memory, writes an artifact, exits. No cross-run state. (Persistent state lives in the Pro version — see `docs/PRO_ROADMAP.md`.)
- If the script output includes a `lang` field, use that language for your rendering. Otherwise detect the community's dominant language from the messages.
