#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';
import { buildActionList } from '../src/analyzers/action-list.js';
import { parseArgs, isoFromDate, isoFromDateEnd } from '../src/cli/args.js';

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'community'; }

function main() {
  const { path: filePath, since, until, outputDir, lang } = parseArgs(process.argv.slice(2));
  if (!filePath) {
    console.error('Usage: vibra-action-list <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--output-dir <dir>] [--lang <code>]');
    process.exit(2);
  }
  if (!existsSync(filePath)) { console.error(`Can't find that file: ${filePath}`); process.exit(1); }

  const { messages } = parseWhatsAppChat(readFileSync(filePath, 'utf8'));
  const community = extractCommunityName(messages) ?? '(unnamed)';

  const result = buildActionList(messages, { sinceIso: isoFromDate(since), untilIso: isoFromDateEnd(until) });
  result.community = community;
  result.lang = lang;

  const outDir = path.resolve(outputDir);
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `action-list-${slugify(community)}-${result.untilIso.slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`Community: ${community}`);
  console.log(`Window: ${result.sinceIso.slice(0, 10)} → ${result.untilIso.slice(0, 10)}`);
  console.log(`${result.silentJoiners.length} silent joiners (window), ${result.longSilentMembers.length} long-silent (30+ days, never posted), ${result.welcomeGaps.length} welcome gaps, ${result.frustrationCandidates.length} frustration candidates, ${result.shoutoutCandidates.length} shoutout candidates.`);
  console.log(`Roster: ${result.rosterStats.activeInWindow}/${result.rosterStats.rosterSize} active this window.`);
  console.log(`Action-list data: ${outPath}`);
  console.log('');
  console.log('Next: the agent should judge the frustration candidates, draft shoutouts, and render the final markdown action list.');
}

main();
