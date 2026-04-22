#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';
import { buildMemberList } from '../src/analyzers/members.js';
import { parseArgs, isoFromDate, isoFromDateEnd } from '../src/cli/args.js';

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'community'; }

function main() {
  const { path: filePath, since, until, outputDir } = parseArgs(process.argv.slice(2));
  if (!filePath) {
    console.error('Usage: vibra-members <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--output-dir <dir>]');
    process.exit(2);
  }
  if (!existsSync(filePath)) { console.error(`Can't find that file: ${filePath}`); process.exit(1); }

  const { messages } = parseWhatsAppChat(readFileSync(filePath, 'utf8'));
  const community = extractCommunityName(messages) ?? '(unnamed)';

  const result = buildMemberList(messages, { sinceIso: isoFromDate(since), untilIso: isoFromDateEnd(until) });
  result.community = community;

  const outDir = path.resolve(outputDir);
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `members-${slugify(community)}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`Community: ${community}`);
  console.log(`Roster: ${result.rosterSize} visible members — ${result.postersCount} have posted, ${result.neverPosted} never posted (${result.longSilentCount} long-silent).`);
  console.log(`Top 5 posters:`);
  for (const m of result.members.slice(0, 5)) {
    console.log(`  ${m.messageCount.toString().padStart(4)}  ${m.sender}`);
  }
  console.log(`Members data: ${outPath}`);
}

main();
