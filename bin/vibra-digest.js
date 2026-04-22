#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';
import { buildDigest } from '../src/analyzers/digest.js';
import { parseArgs, isoFromDate, isoFromDateEnd } from '../src/cli/args.js';

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'community';
}

function main() {
  const { path: filePath, since, until, outputDir, lang } = parseArgs(process.argv.slice(2));
  if (!filePath) {
    console.error('Usage: vibra-digest <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--output-dir <dir>] [--lang <code>]');
    process.exit(2);
  }
  if (!existsSync(filePath)) { console.error(`Can't find that file: ${filePath}`); process.exit(1); }

  const { messages } = parseWhatsAppChat(readFileSync(filePath, 'utf8'));
  const community = extractCommunityName(messages) ?? '(unnamed)';

  const digest = buildDigest(messages, { sinceIso: isoFromDate(since), untilIso: isoFromDateEnd(until) });
  digest.community = community;
  digest.lang = lang;

  const outDir = path.resolve(outputDir);
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `digest-${slugify(community)}-${digest.untilIso.slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(digest, null, 2));

  console.log(`Community: ${community}`);
  console.log(`Window: ${digest.sinceIso.slice(0, 10)} → ${digest.untilIso.slice(0, 10)}`);
  console.log(`${digest.totalMessages} messages, ${digest.topThreads.length} top threads, ${digest.openAsks.length} open asks, ${digest.quiet.length} went quiet, ${digest.newMembers.length} new members.`);
  console.log(`Digest data: ${outPath}`);
  console.log('');
  console.log('Next: the host agent should read the JSON and render the final digest markdown.');
}

main();
