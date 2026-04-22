export function parseArgs(argv, { extraFlags = {} } = {}) {
  const defaultOutputDir = process.env.CLAUDE_PLUGIN_OPTION_DEFAULT_OUTPUT_DIR || './vibra-output';
  const defaultLang = process.env.CLAUDE_PLUGIN_OPTION_DEFAULT_LANG || null;

  const out = { path: null, since: null, until: null, outputDir: defaultOutputDir, lang: defaultLang };
  for (const key of Object.keys(extraFlags)) out[key] = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--since') out.since = argv[++i];
    else if (a === '--until') out.until = argv[++i];
    else if (a === '--output-dir') out.outputDir = argv[++i];
    else if (a === '--lang') out.lang = argv[++i];
    else if (a.startsWith('--') && extraFlags[a.slice(2)]) out[a.slice(2)] = argv[++i];
    else if (!out.path) out.path = a;
  }
  return out;
}

export function isoFromDate(d) { return d ? new Date(d + 'T00:00:00').toISOString() : null; }
export function isoFromDateEnd(d) { return d ? new Date(d + 'T23:59:59').toISOString() : null; }
