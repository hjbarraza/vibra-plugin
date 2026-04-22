# Vibra

**Your WhatsApp community, finally readable.**

Vibra is a plugin for Claude Code that turns a WhatsApp group chat export into the artifacts a community manager actually needs: weekly digests, unanswered-question follow-up lists, member profiles, retention dashboards, newsletter content, stakeholder reports.

Everything runs on your laptop. No external services. No API keys. Your community data never leaves your machine.

[![License: MIT](https://img.shields.io/badge/license-MIT-black)](LICENSE) [![Version](https://img.shields.io/badge/version-0.0.2-black)](CHANGELOG.md) [![Tests](https://img.shields.io/badge/tests-44%20passing-black)](tests/)

---

## Who this is for

You run a paid or invite-only WhatsApp community. Maybe 50 members, maybe 500. Every week you scroll the chat to figure out what happened, who asked something that never got answered, who's gone quiet, who to DM. You write a weekly digest. You prepare a monthly report for the owner.

This takes hours. Vibra takes it down to minutes.

---

## What you get

Ten skills, each mapped to one job you already do.

| Skill | What it does |
| --- | --- |
| `/vibra:digest` | Weekly catch-up — top threads, open asks, new members, who went quiet |
| `/vibra:unanswered` | AI-judged list of questions that didn't get a real answer. Your follow-up queue |
| `/vibra:pulse` | Interactive HTML dashboard — activity curve, heatmap, response rate, roster-vs-active ratio. Cmd+P prints to PDF |
| `/vibra:action-list` | Monday-morning DM queue — silent joiners, welcome gaps, frustration signals, shoutout candidates |
| `/vibra:content-ideas` | Newsletter fuel — best links, quotable member messages, tool mentions |
| `/vibra:profile` | One-page dossier on a specific member. Before a 1-on-1 call |
| `/vibra:report` | Monthly report for your owner/founder/board |
| `/vibra:members` | Full member list with counts. Find exact names or audit the roster |
| `/vibra:parse` | Normalized JSON dump of the export. For chaining with your own tools |
| `/vibra:analyze-whatsapp` | Orchestrator — just drop a path and ask in plain language |

---

## Install

You need three things: **Claude Code**, **Node**, and **Vibra**. Takes 5 minutes.

### 1. Install Claude Code

If you don't already have it, follow Anthropic's official guide: https://claude.com/claude-code

You'll need a Claude account. Claude Code runs in your terminal.

### 2. Install Node

Vibra's scripts run on Node.js 20 or newer.

**macOS:** `brew install node` (you need [Homebrew](https://brew.sh) first)

**Windows:** download the installer from https://nodejs.org

**Linux:** `sudo apt install nodejs npm` or `nvm install 20`

Check it worked: `node --version` should print `v20.something` or higher.

### 3. Install Vibra

```bash
# Clone somewhere you'll remember
cd ~/Code   # or wherever you keep projects
git clone https://github.com/hjbarraza/vibra-plugin.git
```

That's it. No `npm install`, no dependencies to compile. The plugin is ready.

---

## Your first 5 minutes

### Step 1 — export a WhatsApp chat

**On iOS:**
1. Open the group chat
2. Tap the group name at the top
3. Scroll down → **Export Chat**
4. Choose **Without Media**
5. Save or AirDrop the `.zip` to your Mac

**On Android:**
1. Open the group chat
2. Tap ⋮ (three dots) → **More** → **Export chat**
3. Choose **Without media**
4. Save the `.txt`

If you got a `.zip`, unzip it. The file you actually need is `_chat.txt` (iOS) or `WhatsApp Chat with <name>.txt` (Android).

### Step 2 — open Claude Code with the plugin enabled

```bash
cd ~/your-working-folder       # where you want Vibra's output to land
claude --plugin-dir /absolute/path/to/vibra-plugin
```

First time: Claude Code will ask for two optional settings (where to save artifacts, preferred language). Accept the defaults.

### Step 3 — ask in plain language

In the Claude Code session:

> analyze my whatsapp export at ~/Downloads/_chat.txt

Claude picks the right skill and runs it. You'll see something like:

```
Community: Collective Tech
Window: 2026-04-15 → 2026-04-22
75 messages, 17 active members, 21 threads.
Roster: 17/86 active this window, 11 never posted.
Response rate: 86%.
Pulse dashboard: ./vibra-output/pulse-collective-tech-2026-04-22.html
```

Open the HTML in your browser. That's your community health snapshot.

Cmd+P (or Ctrl+P) → **Save as PDF** → you have a printable report with a "Powered by getvibra" footer.

---

## How to use each skill

You can call a skill directly with `/vibra:<name>` or just describe what you want.

### Weekly catch-up

```
/vibra:digest ~/Downloads/_chat.txt
```

Produces a markdown summary — top threads, open asks, new members this week, members who went quiet. Windowed to the last 7 days of data by default; override with `--since YYYY-MM-DD --until YYYY-MM-DD`.

### Who's waiting for a reply

```
/vibra:unanswered ~/Downloads/_chat.txt
```

Surfaces questions that didn't get a substantive answer. Not keyword matching — the agent reads the surrounding conversation and judges whether each question was actually addressed. Three sections: **unanswered**, **partially answered**, **fully answered**.

### Community dashboard (with PDF export)

```
/vibra:pulse ~/Downloads/_chat.txt
```

Interactive HTML — activity curve by day, day-by-hour heatmap, top contributors, roster-vs-active ratio, response rate, concentration (Gini). Open in browser. Cmd+P for PDF.

### Your DM queue

```
/vibra:action-list ~/Downloads/_chat.txt
```

Four sections in one markdown artifact:
- 🚨 **Frustration signals** — messages the AI flagged as real discontent
- 👻 **Long-silent members** — on the roster 30+ days, never posted
- 🎯 **Welcome gaps** — new joiners whose first message got ignored
- 🙌 **Shoutouts** — members who helped others this week

### Newsletter / content ideas

```
/vibra:content-ideas ~/Downloads/_chat.txt
```

Top links by engagement, quotable member messages, tools and products mentioned. Fuel for your weekly newsletter or socials.

### One-page member profile

```
/vibra:profile ~/Downloads/_chat.txt --member "Josu San Martin"
```

Who are they? What do they care about? Who do they engage with most? Before a 1-on-1 or a sponsor intro, you get a narrative dossier.

Don't know the exact name? Run `/vibra:members` first to see the full roster, or just ask Claude to find the right member — it'll fuzzy-match.

### Monthly stakeholder report

```
/vibra:report ~/Downloads/_chat.txt
```

30-day default window. Growth vs prior period, health, top threads, contributors, what needs attention, what's next. Framed for the owner / founder / board, not the CM.

### Member list / roster audit

```
/vibra:members ~/Downloads/_chat.txt
```

Every member, ranked by messages. Find exact names for profile lookups. See who's never posted.

---

## Common questions

**Do my messages get sent anywhere?**
No. Vibra runs entirely on your laptop. The AI part happens inside your Claude Code session — that's already running on your machine. There are no external API calls from the plugin itself. No keys to manage, no data leaving your disk.

**Does it work on Windows / Linux / Mac?**
Yes, anywhere Claude Code and Node 20+ run.

**iOS or Android exports — both work?**
Yes. The parser auto-detects format.

**What about non-English communities?**
System messages and common patterns are recognized in English, Spanish, Portuguese, and French out of the box. The AI-generated summaries always use your community's dominant language (auto-detected). You can force a language with `--lang es` (or `en`, `pt`, `fr`).

**What if my community has 10,000 members?**
Vibra's parser handles it. Processing is fast (seconds, not minutes). Artifacts scale gracefully — the dashboard caps at top 10 contributors, the digest caps at top 5 threads, the action list surfaces the highest-leverage items.

**Can I compare this week vs last week?**
Yes — run any command twice with different `--since` / `--until` windows and compare the outputs. Or ask Claude: _"digest for last week vs the week before"_.

**Where does the output go?**
`./vibra-output/` by default. You can change the default during plugin setup, or pass `--output-dir ~/Documents/my-community-artifacts` per command.

**How do I update Vibra?**
```bash
cd /path/to/vibra-plugin
git pull
```

**I'm stuck.**
Open an issue: https://github.com/hjbarraza/vibra-plugin/issues

---

## Privacy

The only thing that touches a network is Claude Code itself (which you're already running). The plugin scripts are pure local code — parser, analyzers, renderers. Your WhatsApp export, every member name, every message — it all stays on your disk. Artifacts land in a folder you control.

We ship a permissive MIT license and don't track anything.

---

## What's next (the Pro tier)

Vibra v0.x is the **Normal tier**: stateless, runs every command fresh against the current export. Simple, portable, zero-config.

A **Pro tier** is planned that adds persistent storage — so re-exporting weekly doesn't re-process everything, so judgments are cached, so we can show longitudinal metrics ("this question has been unanswered for 3 weeks", "response rate declining over the last quarter"), and so local semantic embeddings unlock things like topic search and ask/offer matchmaking. Details in `docs/PRO_ROADMAP.md`.

---

## For developers

```bash
cd /path/to/vibra-plugin

# Run the test suite (44 tests, <100ms)
node --test "tests/*.test.js"

# Run any skill directly as a CLI
node bin/vibra-digest.js /path/to/export.txt --since 2026-04-01
```

Pull requests welcome. See `CLAUDE.md` for the tier-discipline rules we follow when adding features.

---

_Built with Claude Code. Powered by getvibra._
