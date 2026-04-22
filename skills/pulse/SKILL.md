---
name: pulse
description: Generate an HTML dashboard with community health metrics — activity curve, heatmap, top contributors, Gini concentration, response rate, thread depth. Use for Monday-morning glance at community health.
argument-hint: <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD]
allowed-tools: Bash(vibra-pulse.js *)
---

Run the pulse CLI:

```bash
vibra-pulse.js $ARGUMENTS
```

The script parses the file, computes community health metrics, and writes a self-contained HTML dashboard at `./vibra-output/pulse-<slug>-<date>.html`.

Metrics it surfaces:
- Total messages + active members in window
- **Roster vs active** — of the N members visible in the export, how many posted this window. The retention signal.
- Response rate (questions answered within 30 min)
- Gini concentration (healthy distribution vs dangerously concentrated posting)
- Activity curve by day
- Heatmap (day × hour) — when the community is most alive
- Top 10 contributors ranked
- Thread stats: count, average length, average participants

Report back to the user: the headline numbers (total messages, active members, response rate, concentration label) plus the file path. Offer to open the HTML.

If the user wants a PDF: tell them to open the HTML in their browser and use Cmd+P (⌘P) → "Save as PDF". The stylesheet includes `@media print` rules (system fonts, single-column grid, "Powered by getvibra" page footer) so the PDF looks clean. No extra tool or dependency required.
