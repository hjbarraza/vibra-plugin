#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';
import { buildProfile } from '../src/analyzers/profile.js';
import { parseArgs, isoFromDate, isoFromDateEnd } from '../src/cli/args.js';

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'community'; }

function main() {
  const { path: filePath, member, since, until, outputDir, lang } = parseArgs(process.argv.slice(2), { extraFlags: { member: true } });
  if (!filePath || !member) {
    console.error('Usage: vibra-profile <path-to-export.txt> --member "<canonical name>" [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--output-dir <dir>] [--lang <code>]');
    process.exit(2);
  }
  if (!existsSync(filePath)) { console.error(`Can't find that file: ${filePath}`); process.exit(1); }

  const { messages } = parseWhatsAppChat(readFileSync(filePath, 'utf8'));
  const community = extractCommunityName(messages) ?? '(unnamed)';

  const result = buildProfile(messages, { member, sinceIso: isoFromDate(since), untilIso: isoFromDateEnd(until) });
  result.community = community;
  result.lang = lang;

  if (result.notFound) {
    console.error(`No messages from "${member}" in this export (try a different name — exact match required).`);
    process.exit(1);
  }

  const outDir = path.resolve(outputDir);
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `profile-${slugify(community)}-${slugify(member)}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`Community: ${community} — member: ${member}`);
  console.log(`${result.totalMessages} messages across ${result.activeDays} active days (${result.firstSeenAt.slice(0,10)} → ${result.lastSeenAt.slice(0,10)}).`);
  console.log(`${result.questionsAsked} questions asked, ${result.repliesGiven} substantive replies given.`);
  console.log(`Profile data: ${outPath}`);
  console.log('');
  console.log('Next: the agent should read the JSON and write a narrative dossier (who this person is, what they care about, how they engage).');
}

main();
