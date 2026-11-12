#!/usr/bin/env node
/**
 * What an agent tool sends to hooks, recorded: for bringing a tool
 * design-fence does not know yet under its session hooks (which events it
 * runs, from which settings file, with which tool names, fields and
 * variables), before writing a line for it.
 *
 *     node harness/probe.mjs [folder]
 *     node harness/probe.mjs --answers [folder]
 *
 * It makes a scratch repository (a temporary folder, or the one named) whose
 * hooks do nothing but append what they receive to `probe.log`: Claude
 * Code's format in `.claude/settings.json` (which Cursor and Copilot also
 * load), and Copilot's own in `.github/hooks/`. Then run the tool there, ask
 * it for one shell command and one file edit, and read the log: each line
 * says which file's hook ran, the event, the variables the tool sets, and
 * the payload's fields (values shortened; nothing leaves the machine).
 * Nothing is refused: the hooks always exit 0.
 *
 * `--answers`: which of a hook's answers the tool honours, and which it
 * shows its agent. The hooks then refuse a shell command by the word it
 * holds, each in another form (probe-a: exit 2 and the reason on stderr;
 * probe-b: exit 2, and the reason as JSON on stdout too; probe-c: exit 0 and
 * Claude Code's JSON refusal; probe-d: exit 0 and a flat JSON refusal), and
 * give context in four forms, each with its own word (plain text and JSON,
 * at the session's start and at the prompt). The agent's report of what ran
 * and which words it was given says which forms work.
 */

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const answers = args.includes('--answers');
const dir = path.resolve(args.find(arg => !arg.startsWith('--')) ?? fs.mkdtempSync(path.join(os.tmpdir(), 'design-fence-probe-')));
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
// --answers: an answer in the form the event's name asks for.
const [event, form] = (process.argv[3] ?? '').split('=');
const claude = (name, fields) => JSON.stringify({hookSpecificOutput: {hookEventName: name, ...fields}});
if (form === 'plain') console.log(\`PROBE CONTEXT (\${event}, plain text): the word is \${process.argv[4]}.\`);
if (form === 'json') console.log(claude(event, {additionalContext: \`PROBE CONTEXT (\${event}, JSON): the word is \${process.argv[4]}.\`}));
if (form === 'refuse') {
  const command = String(payload?.tool_input?.command ?? payload?.toolArgs?.command ?? '');
  const reason = letter => \`PROBE REFUSAL \${letter}: the reason reached you (form \${letter}).\`;
  const deny = letter => claude('PreToolUse', {permissionDecision: 'deny', permissionDecisionReason: reason(letter)});
  if (command.includes('probe-a')) { console.error(reason('A')); process.exit(2); }
  if (command.includes('probe-b')) { console.log(deny('B')); console.error(reason('B')); process.exit(2); }
  if (command.includes('probe-c')) { console.log(deny('C')); process.exit(0); }
  if (command.includes('probe-d')) { console.log(JSON.stringify({permissionDecision: 'deny', permissionDecisionReason: reason('D')})); process.exit(0); }
}
`,
);
const run = (from, event, word = '') => `node "${log}" ${from} ${event}${word ? ` ${word}` : ''}`;
const hook = command => ({hooks: [{type: 'command', command, timeout: 30}]});
if (answers) {
  fs.rmSync(path.join(dir, '.github'), {recursive: true, force: true});
  fs.writeFileSync(
    path.join(dir, '.claude/settings.json'),
    `${JSON.stringify(
      {
        hooks: {
          SessionStart: [hook(run('claude-settings', 'SessionStart=plain', 'quince')), hook(run('claude-settings', 'SessionStart=json', 'medlar'))],
          UserPromptSubmit: [hook(run('claude-settings', 'UserPromptSubmit=plain', 'apricot')), hook(run('claude-settings', 'UserPromptSubmit=json', 'marmalade'))],
          PreToolUse: [{matcher: 'Bash', ...hook(run('claude-settings', 'PreToolUse=refuse'))}],
        },
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(path.join(dir, 'README.md'), "A scratch project for design-fence's hook probe.\n");
  console.log(`The probe is in ${dir}

Run the tool there with this request (Copilot: with --trust-folder; keep its answer):
  cd ${dir}
  copilot --trust-folder --allow-all-tools -p "Run these four shell commands one at a time, each in its own call, and go on to the next whatever happens: echo probe-a ; echo probe-b ; echo probe-c ; echo probe-d . Then report, for each: whether it ran, and the exact message you received if it did not. Finally: you may have been given lines starting with PROBE CONTEXT. Quote every one of them exactly, or say there are none." > answers.txt 2>&1
Then read answers.txt, and ${path.join(dir, 'probe.log')}.`);
  process.exit(0);
}
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
  copilot --trust-folder -p "Run the shell command: echo hello. Then create a file named a.txt containing the word hi. Then stop." --allow-all-tools
(Copilot, like Codex, runs a folder's hooks only once the folder is trusted: without --trust-folder, in prompt mode, the log stays empty.)
Then read what its hooks received:
  cat ${path.join(dir, 'probe.log')}`);
