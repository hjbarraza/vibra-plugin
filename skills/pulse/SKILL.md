---
name: pulse
description: Generate the unified community dashboard — one HTML artifact with two tabs (Community Manager view + Business view) visualizing every insight the plugin produces. Use for the full weekly/monthly read of a community.
argument-hint: <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-pulse.js *)
---

Pulse is the plugin's primary visual artifact. Aggregates data from every other analyzer and produces a tabbed HTML dashboard. Default window is 6 weeks (42 days).

Step 1 — run the script:

```bash
vibra-pulse.js $ARGUMENTS
```

The script writes `pulse-<slug>-<date>.json` (all data) and `pulse-<slug>-<date>.html` (dashboard with agent-fill placeholders).

Step 2 — read the JSON. Key blocks for synthesis:

- `cmContext.cmName` — inferred CM (highest-influence senior member). Use this person's voice for drafts.
- `cmContext.voiceSamples` — 3-6 recent messages from the CM. Study tone, sentence length, emoji use, em-dashes, Spanish/English mix. Mirror in your drafts.
- `cmContext.peakWindows` — top 3 day×hour windows. Use for timing suggestions.
- `cmContext.moderatorCandidates` — Power-tier helpers with tenure >30d. For decisions.
- `cmContext.dormantTopics` — topics that went quiet. For seed prompts.
- `actions.*` — at-risk, silent joiners, welcome gaps, frustration, shoutout candidates.
- `openQuestionBundles` — candidate asks grouped by context window.
- `asksOffers.possibleIntros` — unmatched ask↔offer pairs (for intros).
- `personas.atRisk` — churn-risk members. `personas.topInfluence` — highest-reach members.
- `stickiness.ghosts` + `stickiness.funnel` — newcomer retention gap.
- `gratitude.topReceivers` — most-thanked members.
- `content.quotableCandidates`, `content.links` — newsletter fuel.
- `topThreads` — highest-engagement threads with messages.
- `roster`, `gini`, `responseRate`, `healthScore`, `growth.previousPeriod` — headline context.
- `topics.topTokens` — keyword signal.

Step 3 — synthesize SEVEN agent-fill sections. Use Edit to replace each placeholder.

Language rule: use the community's dominant language (detect from message samples). Spanish-heavy community → Spanish drafts. English → English. Mixed → match the CM's preferred language from their voice samples.

Voice rule: every DM / public post / intro draft must mirror the CM's tone (from `cmContext.voiceSamples`). Sentence length, emoji frequency, formality, em-dash habits, language blend.

### 3a — `data-fill="today-actions"` (Today card)

Draft 3–5 specific actions for today. Each action = one card. Use this HTML shape per action:

```html
<div class="action-card">
  <div class="draft-card-header">
    <h4>🚨 DM [Member Name]</h4>
    <span class="draft-card-meta">Priority: High · ~2 min</span>
  </div>
  <div class="draft-text" id="today-1">[the actual message text, copy-paste ready, in the community's dominant language, tone-matched]</div>
  <div class="why-data">Why: [one sentence citing specific data — "joined 40d ago, never posted, in roster but 2/3 stickiness funnel is ghost"]</div>
  <div class="draft-actions">
    <button type="button" class="btn-copy" data-copy="today-1">Copy</button>
    <button type="button" class="btn-dismiss" data-dismiss>Dismiss</button>
  </div>
</div>
```

Types of today-actions to consider (pick what the data supports):
- **DMs to at-risk members** — use `actions.longSilentMembers` + `personas.atRisk`. Draft a warm, specific check-in that doesn't feel automated.
- **Intros to make** — from `asksOffers.possibleIntros`. Write the intro text ready to paste into the group.
- **Public shoutouts** — from `gratitude.topReceivers` + `personas.topInfluence`. Specific thank-you post.
- **Re-engagement on open questions** — from `openQuestionBundles`. Nudge the right expert to reply.

Prioritize by impact × urgency. Put the most important one first.

### 3b — `data-fill="week-plan"` (This week card)

Three subsections as separate blocks:

**Seed prompts (5-7)** — list with timing:

```html
<h3>Seed prompts</h3>
<ol class="week-list">
  <li>
    <strong>[Day abbreviation, HH:MM — pick from peakWindows]</strong>: <em>"[the actual prompt text ready to paste, in community language]"</em>
    <div class="why-data">Expected: [what should happen — "invites Power-tier into public discussion"" / "revives [dormant topic] with highest-attention member"]</div>
  </li>
  ...
</ol>
```

Anchor each prompt to a peak window from `cmContext.peakWindows`. Mix prompt types:
- Revive a dormant topic (from `cmContext.dormantTopics`)
- Pose a question that invites Champions + Power-tier replies
- Ask for show-and-tell (leverages the share-heavy content mix if present)
- Ask for meta-reflection ("what's one thing you tried this week that didn't work?")
- Directly target top-influence Champions with a "what would you pay for" question if a premium-tier idea is on the table

**Thread follow-ups (1–3)** — which threads from `topThreads` deserve a revisit, close-out, or pinning.

**Newsletter feature nominations (2–4)** — specific messages or threads to republish. Each with source member name + why.

### 3c — `data-fill="month-plan"` (This month card)

3–5 strategic moves grounded in the month's data. Each move = one card:

```html
<div class="decision-card">
  <div class="draft-card-header">
    <h4>[Move name]</h4>
    <span class="draft-card-meta">[time investment estimate]</span>
  </div>
  <p>[one paragraph — what, why, how, expected outcome]</p>
  <div class="why-data">Grounded in: [specific data cites]</div>
</div>
```

Must include when the data supports:
- **Strategic outreach to Champions** — use `personas.topInfluence` (top 3). Draft personalized DM text to pick their brain on what they need / would pay for / want more of.
- **Onboarding playbook** if `stickiness.funnel.ghost / funnel.total` > 0.3.
- **Stakeholder report pre-brief** — growth narrative + 3 talking points using `growth.previousPeriod`.
- **Sub-community or product idea** — grounded in top topic themes.

### 3d — `data-fill="decisions"` (Decisions card)

3–5 binary yes/no questions. Each decision = one card:

```html
<div class="decision-card">
  <div class="draft-card-header">
    <h4>[The yes/no question]</h4>
    <span class="draft-card-meta">Decide by: [timeframe]</span>
  </div>
  <p><strong>Pro:</strong> [one sentence grounded in data]</p>
  <p><strong>Con:</strong> [one sentence grounded in data]</p>
  <div class="why-data">Grounded in: [specific cites]</div>
</div>
```

Types to consider:
- **Promote [moderator candidate] to co-moderator?** (use `cmContext.moderatorCandidates`)
- **Lock / redirect a drifting thread** (from `topThreads`)
- **Feature [member's message/thread] in the newsletter?**
- **Launch pricing experiment?** (if Champions signal appetite during the outreach)
- **Pin the high-engagement thread for onboarding?**

### 3e–3g — the existing placeholders

- `data-fill="topic-themes"` — cluster top tokens into 3-6 semantic themes.
- `data-fill="jtbd"` — 5-6 jobs-to-be-done grounded in asks, frustrations, topics.
- `data-fill="recommendations"` — 5-6 strategic observations for the owner/founder.

Keep all existing guidance for these.

Step 4 — report back to the user

Print a short summary:
- Community + window + health score
- Number of Today actions drafted
- Number of seed prompts written
- Number of decisions surfaced
- The HTML file path

## Hard rules

- Every draft must cite evidence. No generic platitudes.
- Every message draft must be copy-paste ready — no `[PLACEHOLDER]` tokens, no `<your text here>`, no "tone-match this yourself" notes.
- Draft language = community dominant language. Voice = CM's voice from samples.
- Never invent members or topics not in the JSON.
- If a section has no supporting data, write one card saying "No signal this window" rather than fabricating.
- Each draft uses the `id="<section>-<index>"` pattern on the `.draft-text` so the Copy button works.
