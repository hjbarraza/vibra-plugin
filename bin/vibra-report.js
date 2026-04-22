#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { parseWhatsAppChat, extractCommunityName } from '../src/parser/parser.js';
import { buildReport } from '../src/analyzers/report.js';
import { parseArgs, isoFromDate, isoFromDateEnd } from '../src/cli/args.js';

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'community'; }

function main() {
  const { path: filePath, since, until, outputDir, lang } = parseArgs(process.argv.slice(2));
  if (!filePath) {
    console.error('Usage: vibra-report <path-to-export.txt> [--since YYYY-MM-DD] [--until YYYY-MM-DD] [--output-dir <dir>] [--lang <code>]');
    process.exit(2);
  }
  if (!existsSync(filePath)) { console.error(`Can't find that file: ${filePath}`); process.exit(1); }

  const { messages } = parseWhatsAppChat(readFileSync(filePath, 'utf8'));
  const community = extractCommunityName(messages) ?? '(unnamed)';

  const result = buildReport(messages, { sinceIso: isoFromDate(since), untilIso: isoFromDateEnd(until) });
  result.community = community;
  result.lang = lang;

  const outDir = path.resolve(outputDir);
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `report-${slugify(community)}-${result.untilIso.slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2));

  const tp = result.thisPeriod, pp = result.previousPeriod;
  const msgsDelta = pp.totalMessages === 0 ? '—' : `${(((tp.totalMessages - pp.totalMessages) / pp.totalMessages) * 100).toFixed(0)}%`;
  console.log(`Community: ${community}`);
  console.log(`Period: ${result.sinceIso.slice(0, 10)} → ${result.untilIso.slice(0, 10)} (default 30 days)`);
  console.log(`Messages: ${tp.totalMessages} (vs ${pp.totalMessages} prior period, ${msgsDelta})`);
  console.log(`Roster: ${tp.roster.activeInWindow}/${tp.roster.rosterSize} posted this period${tp.roster.rosterIsLowerBound ? ' (roster lower bound)' : ''} — vs ${pp.rosterActive}/${pp.rosterSize} prior.`);
  console.log(`New members: ${tp.newMembers}. Response rate: ${tp.responseRate.rate == null ? '—' : Math.round(tp.responseRate.rate * 100) + '%'}`);
  console.log(`Report data: ${outPath}`);
  console.log('');
  console.log('Next: the agent should read the JSON and write a stakeholder-facing monthly report (growth narrative, health narrative, top threads, recognition).');
}

main();
