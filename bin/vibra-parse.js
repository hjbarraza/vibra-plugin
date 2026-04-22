#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';
import { parseArgs } from '../src/cli/args.js';

function main() {
  const { path: filePath, outputDir, lang } = parseArgs(process.argv.slice(2));
  if (!filePath) {
    console.error('Usage: vibra-parse <path-to-whatsapp-export.txt> [--output-dir <dir>] [--lang <code>]');
    process.exit(2);
  }
  if (!existsSync(filePath)) { console.error(`Can't find that file: ${filePath}`); process.exit(1); }

  const { messages, dateFormat } = parseWhatsAppChat(readFileSync(filePath, 'utf8'));
  const community = extractCommunityName(messages);

  const outDir = path.resolve(outputDir);
  mkdirSync(outDir, { recursive: true });
  const base = path.basename(filePath, path.extname(filePath));
  const outPath = path.join(outDir, `parsed-${base}.json`);
  writeFileSync(outPath, JSON.stringify({ community, dateFormat, messageCount: messages.length, lang, messages }, null, 2));

  console.log(`Community: ${community ?? '(unnamed)'}`);
  console.log(`Parsed ${messages.length} messages (${dateFormat.toUpperCase()} date format).`);
  console.log(`Normalized JSON: ${outPath}`);
}

main();
