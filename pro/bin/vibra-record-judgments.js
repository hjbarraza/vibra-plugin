#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { recordJudgments } from '../src/db/record.js';

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'community';
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--community') out.community = argv[++i];
    else if (argv[i] === '--input') out.input = argv[++i];
  }
  return out;
}

function main() {
  const { community, input } = parseArgs(process.argv.slice(2));
  if (!community || !input) {
    console.error('Usage: vibra-record-judgments --community <name> --input <judgments.json>');
    process.exit(2);
  }
  if (!existsSync(input)) {
    console.error(`Judgments file not found: ${input}`);
    process.exit(1);
  }

  const slug = slugify(community);
  const dbPath = path.join(os.homedir(), '.getvibra', 'communities', `${slug}.db`);
  if (!existsSync(dbPath)) {
    console.error(`No community database found for "${community}". Run vibra-parse first.`);
    process.exit(1);
  }

  const payload = JSON.parse(readFileSync(input, 'utf8'));
  const { detectionsWritten, answersWritten } = recordJudgments(dbPath, payload);

  console.log(`Recorded ${detectionsWritten} question detections, ${answersWritten} answered-check rows.`);
}

main();
