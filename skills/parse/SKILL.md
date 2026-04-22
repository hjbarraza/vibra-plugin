---
name: parse
description: Parse a WhatsApp chat export file into normalized JSON. Use when the user hands you a WhatsApp export path and wants the structured messages extracted.
argument-hint: <path-to-whatsapp-export.txt>
allowed-tools: Bash(vibra-parse.js *)
---

Run the parse CLI. The plugin's `bin/` directory is added to PATH while the plugin is enabled:

```bash
vibra-parse.js "$ARGUMENTS"
```

The script parses the file, auto-detects the date format (locale-agnostic), extracts the community name from the first system message, and writes normalized JSON to `./vibra-output/parsed-<filename>.json`.

Report the output back to the user in plain language: community name, message count, detected date format, and JSON path.
