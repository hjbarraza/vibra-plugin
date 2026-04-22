#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';
import { buildUnanswered } from '../src/analyzers/unanswered.js';
import { parseArgs, isoFromDate, isoFromDateEnd } from '../src/cli/args.js';

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'community';
}

function main() {
  const { path: filePath, since, until, outputDir, lang } = parseArgs(process.argv.slice(2));
  if (!filePath) {
    console.error('Usage: vibra-unanswered <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--output-dir <dir>] [--lang <code>]');
    process.exit(2);
  }
  if (!existsSync(filePath)) { console.error(`Can't find that file: ${filePath}`); process.exit(1); }

  const { messages } = parseWhatsAppChat(readFileSync(filePath, 'utf8'));
  const community = extractCommunityName(messages) ?? '(unnamed)';

  const result = buildUnanswered(messages, { sinceIso: isoFromDate(since), untilIso: isoFromDateEnd(until) });
  result.community = community;
  result.lang = lang;

  const outDir = path.resolve(outputDir);
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `unanswered-${slugify(community)}-${result.untilIso.slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`Community: ${community}`);
  console.log(`Window: ${result.sinceIso.slice(0, 10)} → ${result.untilIso.slice(0, 10)}`);
  console.log(`${result.candidateCount} candidate asks across ${result.bundles.length} bundles.`);
  console.log(`Candidates data: ${outPath}`);
  console.log('');
  console.log('Next: the host agent should read the JSON, judge each candidate in its bundle\'s shared context, then render the final markdown action list.');
}

main();
