#!/usr/bin/env node
/**
 * What an agent tool sends to hooks, recorded: for bringing a tool
 * design-fence does not know yet under its session hooks (which events it
 * runs, from which settings file, with which tool names, fields and
 * variables), before writing a line for it.
 *
 *     node harness/probe.mjs [folder]
 *
 * It makes a scratch repository (a temporary folder, or the one named) whose
 * hooks do nothing but append what they receive to `probe.log`: Claude
 * Code's format in `.claude/settings.json` (which Cursor and Copilot also
 * load), and Copilot's own in `.github/hooks/`. Then run the tool there, ask
 * it for one shell command and one file edit, and read the log: each line
 * says which file's hook ran, the event, the variables the tool sets, and
 * the payload's fields (values shortened; nothing leaves the machine).
 * Nothing is refused: the hooks always exit 0.
 */

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = path.resolve(process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-probe-')));
fs.mkdirSync(path.join(dir, '.claude'), {recursive: true});
fs.mkdirSync(path.join(dir, '.github/hooks'), {recursive: true});
if (!fs.existsSync(path.join(dir, '.git'))) execFileSync('git', ['-C', dir, 'init', '-q']);

const log = path.join(dir, 'probe-log.mjs');
fs.writeFileSync(
  log,
  `import fs from 'node:fs';
let input = '';
try { input = fs.readFileSync(0, 'utf8'); } catch {}
let payload = null;
try { payload = JSON.parse(input); } catch {}
const short = value => (typeof value === 'string' ? value.slice(0, 120) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, short(v)])) : value);
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => /^(CLAUDE|COPILOT|GITHUB_COPILOT|CODEX|CURSOR|GEMINI|WINDSURF|DEVIN)/.test(k)).map(([k, v]) => [k, /TOKEN|KEY|SECRET/i.test(k) ? '(set)' : String(v).slice(0, 80)]));
fs.appendFileSync(new URL('./probe.log', import.meta.url), JSON.stringify({from: process.argv[2], event: process.argv[3], cwd: process.cwd(), env, payload: payload ? short(payload) : input.slice(0, 400)}) + '\\n');
`,
);
const run = (from, event) => `node "${log}" ${from} ${event}`;
fs.writeFileSync(
  path.join(dir, '.claude/settings.json'),
  `${JSON.stringify(
    {
      hooks: {
        SessionStart: [{hooks: [{type: 'command', command: run('claude-settings', 'SessionStart'), timeout: 30}]}],
        UserPromptSubmit: [{hooks: [{type: 'command', command: run('claude-settings', 'UserPromptSubmit'), timeout: 30}]}],
        PreToolUse: [
          {matcher: 'Bash|Edit|Write|MultiEdit|NotebookEdit|apply_patch|mcp__.*', hooks: [{type: 'command', command: run('claude-settings', 'PreToolUse:design-fence-matcher'), timeout: 30}]},
          {hooks: [{type: 'command', command: run('claude-settings', 'PreToolUse:any'), timeout: 30}]},
        ],
      },
    },
    null,
    2,
  )}\n`,
);
fs.writeFileSync(
  path.join(dir, '.github/hooks/design-fence-probe.json'),
  `${JSON.stringify(
    {
      version: 1,
      hooks: Object.fromEntries(['sessionStart', 'userPromptSubmitted', 'preToolUse'].map(event => [event, [{type: 'command', bash: run('github-hooks', event), timeoutSec: 30}]])),
    },
    null,
    2,
  )}\n`,
);
fs.writeFileSync(path.join(dir, 'README.md'), 'A scratch project for design-fence\'s hook probe.\n');

console.log(`The probe is in ${dir}

Run the tool there and ask it for one shell command and one edit, for example:
  cd ${dir}
  copilot -p "Run the shell command: echo hello. Then create a file named a.txt containing the word hi. Then stop." --allow-all-tools
Then read what its hooks received:
  cat ${path.join(dir, 'probe.log')}`);
