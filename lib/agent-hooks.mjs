/**
 * What design-fence's hooks in the agent tools decide (Claude Code, Codex,
 * OpenCode): the rules the git hooks cannot see, because they happen between
 * two commits. Run by the project's hooks (`design-fence agent-hook`, wired
 * by `install.mjs`) and by the plugins, which carry their own copy of this
 * file (`harness/build.mjs`): an agent that edits or deletes the project's
 * design-fence does not disarm them. It imports only node's own modules and
 * `lib/`, for that.
 *
 * - `pre-tool-use`:
 *   - refuses a shell command that skips or turns off the git hooks, or runs
 *     these hooks by hand;
 *   - asks the human's word before the agent changes design-fence's own files
 *     (the fence: design-fence's folder, the project's checks, the hooks'
 *     settings in the project and in the person's tools) or turns the hooks
 *     off. Claude Code asks the human; the others refuse, and the human
 *     allows it for a turn by writing "design-fence: allow";
 *   - refuses a second design-tool screenshot in a phase (`playbooks/figma.md`),
 *     counted once per tool call when two layers of hooks run;
 *   - refuses one of `figma/*.js` pasted into `figma_execute` rather than run
 *     with `design-fence figma <script>`, until that command has been tried in
 *     the session (`playbooks/figma.md`'s fallback, when it cannot reach the
 *     bridge).
 * - `user-prompt`: the human spoke, so a phase ended: the screenshot budget
 *   starts again; and "design-fence: allow" in it allows the fence's files for
 *   that turn.
 * - `session-start`: after a compaction, design-fence's block of `AGENTS.md`
 *   again (prose read once is summarised away); at any other start, only
 *   what is wrong (the git hooks off).
 *
 * A decision is `{deny}` (refused, the reason for the agent), `{ask}` (the
 * human's word needed), `{context}` (text for the agent), or `{}`.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {AGENT_FILES, CONVENTION, agentHooksState, blockIn, designFenceHome, hooksState, isFenced, readText, relativeTo} from './fence.mjs';
import {projectRoot, stateDir} from './git.mjs';
import {route, routeText} from './route.mjs';

/** The shell tools: Claude Code's and Codex's `Bash`, Codex's exec, OpenCode's `bash`. */
const SHELL = /^(bash|shell|local_shell|exec|exec_command)$/i;

/** The tools that write files: Claude Code's, Codex's `apply_patch`, OpenCode's. */
const EDIT = /^(edit|write|multiedit|notebookedit|apply_patch|patch|str_replace_based_edit_tool)$/i;

/** The design tools' screenshots (`playbooks/figma.md`, "Screenshots"), by the end of their name, on a Figma server. */
const SCREENSHOT = /(?:^|[_.:-])(?:figma_take_screenshot|figma_capture_screenshot|figma_get_component_image|get_screenshot)$/;

/** The tools that run code in Figma. */
const EXECUTE = /(?:^|[_.:-])(?:figma_execute|use_figma)$/;

/** design-fence's Figma scripts, by the function each one defines, and the command that runs it. */
const SCRIPTS = {lintGaps: 'lint-gaps', tokens: 'tokens', sources: 'sources', bound: 'bound'};
const SCRIPT_START = new RegExp(`\\basync function (${Object.keys(SCRIPTS).join('|')})\\s*\\(`);

/** Git's commands whose short `-n` is `--no-verify`. */
const SHORT_NO_VERIFY = ['commit'];

/** The shells whose `-c` (or `-lc`) argument is the script, when a command comes as an argument list. */
const SHELLS = ['bash', 'sh', 'zsh', 'dash'];

/** What the human writes to allow the fence's files for a turn. */
const ALLOW = /design-fence:\s*allow\b/i;
const WAY_OUT = 'To allow it for this turn, the human writes "design-fence: allow" in their next message.';

/** An argument list as one line of shell, quoting what needs it. */
const joined = argv => argv.map(arg => (/^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`)).join(' ');

/** The shell text of a tool's command: a string, or an argument list (Codex), possibly `bash -lc <script>`. */
export function commandText(command) {
  if (typeof command === 'string') {
    return command;
  }
  if (!Array.isArray(command)) {
    return '';
  }
  const [shell, flag, script] = command;
  if (SHELLS.includes(path.basename(String(shell))) && /^-\w*c$/.test(String(flag)) && typeof script === 'string') {
    return script;
  }
  return joined(command.map(String));
}

/** The text with heredoc bodies and quoted strings blanked: a commit message saying `--no-verify` is not a flag. */
export function unquoted(script) {
  return script
    .replace(/<<-?[ \t]*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/g, ' ')
    .replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, ' Q ');
}

/** The simple commands of a script, split where the shell would run another (quotes not taken into account). */
const segments = script => script.split(/&&|\|\||[;|&\n()`]/);

/** A simple command's words, without the variable assignments and wrappers (`env`, `sudo`…) before it. */
function commandWords(words) {
  const out = [...words];
  while (out.length && (/^\w+=/.test(out[0]) || ['env', 'command', 'exec', 'time', 'nohup', 'sudo'].includes(out[0]))) {
    out.shift();
  }
  return out;
}

/** The words of each git command in a script (quoted strings blanked). */
const gitCommands = script =>
  segments(unquoted(script))
    .map(part => commandWords(part.trim().split(/\s+/).filter(Boolean)))
    .filter(words => words.length && path.basename(words[0]) === 'git');

/** Git's options before its command that take a value. */
const GIT_VALUED = ['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path', '--config-env'];

/** `{options, name, args}` of a git command's words. */
function gitParts(words) {
  const options = [];
  let i = 1;
  while (i < words.length && words[i].startsWith('-')) {
    options.push(words[i]);
    if (GIT_VALUED.includes(words[i])) {
      options.push(words[i + 1] ?? '');
      i++;
    }
    i++;
  }
  return {options, name: words[i] ?? '', args: words.slice(i + 1)};
}

/** Whether a word is `--no-verify` or an abbreviation git accepts for it (`--no-veri`). */
const isNoVerify = word => word.length >= '--no-veri'.length && '--no-verify'.startsWith(word);

/** Whether a short-option cluster has `-n` before any letter that takes the rest as its value. */
function hasShortN(word) {
  if (!/^-[a-zA-Z]+$/.test(word)) return false;
  for (const letter of word.slice(1)) {
    if (letter === 'n') return true;
    if ('mFcCt'.includes(letter)) return false;
  }
  return false;
}

/** `git config`'s words that only read. */
const CONFIG_READS = ['--get', '--get-all', '--get-regexp', '--list', '-l', 'get', 'list'];
const CONFIG_WRITES = ['--unset', '--unset-all', '--add', '--replace-all', 'set', 'unset'];

/**
 * Why a shell command skips or turns off the git hooks, or '' when it does
 * not: `--no-verify` (and `commit -n`), `-c core.hooksPath=…`, and changing
 * or unsetting `core.hooksPath` with `git config`.
 */
export function bypassReason(command) {
  const script = commandText(command);
  if (/(?:^|\s)-c\s*['"]?core\.hookspath\s*=/i.test(script)) {
    return 'it sets core.hooksPath for one command (git -c core.hooksPath=…), which skips the git hooks';
  }
  for (const words of gitCommands(script)) {
    const {name, args} = gitParts(words);
    if (args.some(isNoVerify)) {
      return `it skips the git hooks (git ${name} --no-verify)`;
    }
    if (SHORT_NO_VERIFY.includes(name) && args.some(hasShortN)) {
      return `it skips the git hooks (git ${name} -n is --no-verify)`;
    }
    if (name === 'config') {
      const at = args.findIndex(arg => arg.toLowerCase() === 'core.hookspath');
      const reads = args.some(arg => CONFIG_READS.includes(arg));
      const writes =
        args.some(arg => CONFIG_WRITES.includes(arg)) || (at >= 0 && args.slice(at + 1).some(arg => !arg.startsWith('-')));
      if (at >= 0 && writes && !reads) {
        return "it changes core.hooksPath, which turns design-fence's git hooks off";
      }
    }
  }
  return '';
}

/** Why a shell command turns the agent tools' hooks off (the plugin, all hooks), or ''. */
export function hooksOffReason(command) {
  const script = commandText(command);
  const plain = unquoted(script);
  if (/disableAllHooks/.test(script)) {
    return "it turns every hook off (disableAllHooks), design-fence's with them";
  }
  if (/--dangerously-bypass-hook-trust/.test(plain)) {
    return 'it runs hooks without their trust (--dangerously-bypass-hook-trust)';
  }
  for (const part of segments(script)) {
    if (/\bcodex\b/.test(part) && (/\bfeatures\s+disable\s+hooks\b|--disable\s+hooks\b|features\.hooks\s*=\s*false/.test(part))) {
      return "it turns Codex's hooks off, design-fence's with them";
    }
    if (
      /design-fence/.test(part) &&
      (/\bclaude\s+plugins?\s+(?:disable|uninstall|remove|rm)\b/.test(part) || /\bcodex\s+plugins?\b.*\b(?:disable|uninstall|remove|rm)\b/.test(part))
    ) {
      return "it turns design-fence's plugin off";
    }
  }
  return '';
}

/** Whether a shell command runs design-fence's agent hooks by hand, which only the agent tools do (a forged "design-fence: allow"). */
export const runsHooks = command => /\bagent-hook\b|hook\.mjs["']?\s+(?:user-prompt|pre-tool-use|session-start)\b/.test(commandText(command));

/** design-fence's own files, which the agent changes only with the human's word: `[{file, dir}]`, absolute. */
export function fenceFiles(root, home, homedir = os.homedir()) {
  const inRoot = (file, dir = false) => ({file: path.join(root, file), dir});
  const inHome = (file, dir = false) => ({file: path.join(homedir, file), dir});
  return [
    {file: home, dir: true},
    inRoot('.agents/validate.json'),
    inRoot('.claude/settings.json'),
    inRoot('.claude/settings.local.json'),
    inRoot('.codex/hooks.json'),
    inRoot('.codex/config.toml'),
    inRoot(AGENT_FILES.opencode),
    inRoot('.github/workflows/design-fence.yml'),
    inRoot('.git/config'),
    inRoot('.git/hooks', true),
    inRoot('.git/design-fence', true),
    inHome('.claude/settings.json'),
    inHome('.claude/settings.local.json'),
    inHome('.claude/plugins', true),
    inHome('.codex/config.toml'),
    inHome('.codex/hooks.json'),
    inHome('.codex/plugins', true),
    inHome('.config/opencode', true),
    inHome('.copilot/config.json'),
    inHome('.copilot/installed-plugins', true),
    ...designFiles(root).map(entry => ({...inRoot(entry.file), why: entry.why})),
  ];
}

/** The project's `design` section of validate.json, or null (no module, or a file that cannot be read). */
function designConfig(root) {
  try {
    return JSON.parse(readText(path.join(root, '.agents/validate.json')) || 'null')?.design ?? null;
  } catch {
    return null;
  }
}

/** What the design module writes itself, never by hand: the tokens file and the record of its export. */
function designFiles(root) {
  const design = designConfig(root);
  if (!design?.tokens?.file) {
    return [];
  }
  const why = `which the tokens export writes: a token's value changes in Figma, then \`design-fence figma tokens --out\` writes it`;
  // The records of what each design is bound to (`design-fence figma bound --out`), which the code is held to.
  const components = `${design.dir ?? 'design'}/components`;
  let records = [];
  try {
    records = fs.readdirSync(path.join(root, components)).filter(name => name.endsWith('.bound.json'));
  } catch {
    // No specs yet.
  }
  return [
    {file: design.tokens.file, why},
    {file: `${design.dir ?? 'design'}/tokens.lock`, why},
    ...records.map(name => ({file: `${components}/${name}`, why: `which \`design-fence figma bound --spec ${name.replace(/\.bound\.json$/, '')} --out\` writes from the design in Figma: the code follows the design, not the record the code`})),
  ];
}

/**
 * A spec or a view's copy being marked approved (or built): the design
 * gate's record, which only the human's word makes true (`playbooks/design.md`,
 * step 4). Returns the reason, or ''. Seen in an edit tool's new text for a
 * file of `design/components/` or `design/content/`, and in a shell command
 * that names one and writes the status.
 */
export function gateReason(root, tool, input, homedir = os.homedir()) {
  const design = designConfig(root);
  if (!design) {
    return '';
  }
  const dir = design.dir ?? 'design';
  const inGate = file => new RegExp(`^${dir.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&')}/(components|content)/[^/]+\\.md$`).test(file);
  const approves = text => /^[+\s]*status:\s*["']?(approved|built)\b/im.test(text) || /Status:\s*\*\*approved\*\*/i.test(text);
  if (SHELL.test(tool)) {
    const command = String(input?.command ?? input?.cmd ?? '');
    const names = command.match(new RegExp(`${dir.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&')}/(?:components|content)/[\\w.-]+\\.md`));
    return names && /status:\s*["']?(approved|built)\b|\*\*approved\*\*/i.test(command) && !/^\s*(?:git\s|grep\b|rg\b|cat\b|head\b|sed\s+-n\b)/.test(command)
      ? `it marks ${names[0]} approved`
      : '';
  }
  if (!EDIT.test(tool)) {
    return '';
  }
  const files = editTargets(input, root, homedir).map(({target}) => path.relative(root, target).split(path.sep).join('/')).filter(inGate);
  if (!files.length) {
    return '';
  }
  // What the edit writes: an Edit's new text, a Write's content, a patch's added lines.
  // (Copilot's edit tools name them `file_text` and `new_str`.)
  const written = [input?.new_string, input?.newString, input?.content, input?.file_text, input?.new_str, ...(Array.isArray(input?.edits) ? input.edits.map(edit => edit?.new_string ?? edit?.newString) : [])].filter(text => typeof text === 'string');
  const patch = Object.values(input ?? {}).filter(value => typeof value === 'string' && /^\*\*\* (?:Add|Update) File:/m.test(value)).map(text => text.split('\n').filter(line => line.startsWith('+')).join('\n'));
  // Already approved before this edit: not this edit's doing.
  const was = files.every(file => approves(readText(path.join(root, file))));
  return [...written, ...patch].some(approves) && !was ? `it marks ${files[0]} approved` : '';
}

/**
 * The fence file a path touches, or null: the path is one, is inside one of
 * the folders, or (`containing`: a removal, a move) holds one.
 */
function touched(fence, target, containing) {
  const within = (inner, outer) => inner === outer || inner.startsWith(outer + path.sep);
  return (
    fence.find(
      ({file, dir}) => target === file || (dir && within(target, file)) || (containing && within(file, target)),
    ) ?? null
  );
}

/** A path as the agent wrote it, absolute: `~` and `$HOME` are the person's home; a glob counts from where it starts. */
function resolveWord(word, root, homedir) {
  let text = word.replace(/^(?:\$HOME|\$\{HOME\})(?=\/|$)/, homedir).replace(/^~(?=\/|$)/, homedir);
  const glob = text.search(/[*?[]/);
  if (glob >= 0) {
    text = text.slice(0, glob);
  }
  return path.resolve(root, text || '.');
}

/** A shell word without its quotes. */
const unquote = word => word.replace(/^'(.*)'$/s, '$1').replace(/^"(.*)"$/s, '$1');

/** The commands that remove or move what they name, those that write it, and the interpreters whose code can do either. */
const REMOVES = ['rm', 'rmdir', 'unlink', 'mv', 'shred'];
const WRITES = ['truncate', 'ln', 'chmod', 'chown', 'touch', 'install', 'tee'];
const INTERPRETERS = ['node', 'python', 'python3', 'ruby', 'perl', 'bun', 'deno', 'osascript'];
const WRITE_CALLS = /writeFile|appendFile|unlink|rmSync|\brm\(|rename|copyFile|symlink|chmod|truncate|open\([^)]*['"][wa]|\.write\(|Path\([^)]*\)\.(?:write|unlink)/;

/**
 * The paths a shell command writes, removes or moves, as far as its words
 * say: `[{target, containing}]`. Redirections, the commands above, `cp`'s
 * destination, `sed -i` and `perl -i`, and git's `rm`, `mv`, `checkout`,
 * `restore`, `submodule deinit`. Not what a script or an alias does.
 */
function shellTargets(script, root, homedir) {
  const targets = [];
  const add = (word, containing) => {
    if (word && !word.startsWith('-')) targets.push({target: resolveWord(unquote(word), root, homedir), containing});
  };
  for (const part of segments(script)) {
    for (const match of part.matchAll(/\d*>{1,2}\|?\s*('[^']*'|"[^"]*"|[^\s;&|<>]+)/g)) {
      if (!match[1].startsWith('&')) add(match[1], false);
    }
    const words = commandWords((part.replace(/\d*>{1,2}\|?\s*('[^']*'|"[^"]*"|[^\s;&|<>]+)/g, ' ').match(/'[^']*'|"(?:\\.|[^"\\])*"|[^\s'"]+/g) ?? []));
    if (!words.length) continue;
    const verb = path.basename(words[0]);
    const args = words.slice(1).filter(word => !word.startsWith('-'));
    if (REMOVES.includes(verb)) {
      args.forEach(word => add(word, true));
    } else if (WRITES.includes(verb)) {
      args.forEach(word => add(word, false));
    } else if (verb === 'cp' || verb === 'rsync') {
      add(args.at(-1), false);
    } else if (verb === 'dd') {
      args.filter(word => word.startsWith('of=')).forEach(word => add(word.slice(3), false));
    } else if ((verb === 'sed' || verb === 'perl') && words.some(word => /^-[a-zA-Z]*i/.test(word))) {
      args.forEach(word => add(word, false));
    } else if (verb === 'git') {
      const {name, args: rest} = gitParts(words);
      const named = rest.filter(word => !word.startsWith('-'));
      if (['rm', 'mv'].includes(name)) named.forEach(word => add(word, true));
      if (['checkout', 'restore'].includes(name)) named.forEach(word => add(word, false));
      if (name === 'submodule' && named[0] === 'deinit') named.slice(1).forEach(word => add(word, true));
    }
  }
  // An interpreter's code (`node -e`, `python -c`…), read whole: the split above cuts it at its parentheses.
  const interpreter = new RegExp(`(?:^|[\\s;&|(])(?:${INTERPRETERS.join('|')})\\s+-[a-zA-Z]*[ec]\\b`);
  if (interpreter.test(script) && WRITE_CALLS.test(script)) {
    for (const match of script.matchAll(/[~$\w.{}/-]*(?:\.agents|\.claude|\.codex|\.opencode|\.git|\.config\/opencode|design-fence)[\w./-]*/g)) {
      add(match[0], true);
    }
  }
  return targets;
}

/** The paths an edit tool's call writes: its file argument, and the files of a patch (Codex's `apply_patch`). */
function editTargets(input, root, homedir) {
  const files = [];
  for (const key of ['file_path', 'filePath', 'path', 'notebook_path']) {
    if (typeof input?.[key] === 'string') files.push(input[key]);
  }
  for (const value of Object.values(input ?? {})) {
    if (typeof value === 'string') {
      for (const match of value.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm)) {
        files.push((match[1] ?? match[2]).trim());
      }
    }
  }
  return files.map(file => ({target: resolveWord(file, root, homedir), containing: false}));
}

/** A fence file as the human reads it: from the project's root, or from `~`. */
function shown(file, root, homedir) {
  if (file === root || file.startsWith(root + path.sep)) return path.relative(root, file).split(path.sep).join('/');
  return `~/${path.relative(homedir, file).split(path.sep).join('/')}`;
}

/** Why a tool call changes design-fence's own files or turns its hooks off, or ''. */
export function fenceReason(root, home, tool, input, homedir = os.homedir()) {
  let targets = [];
  if (SHELL.test(tool)) {
    const command = commandText(input?.command ?? input?.cmd);
    const off = hooksOffReason(command);
    if (off) return off;
    targets = shellTargets(command, root, homedir);
  } else if (EDIT.test(tool)) {
    targets = editTargets(input, root, homedir);
  }
  const fence = fenceFiles(root, home, homedir);
  for (const {target, containing} of targets) {
    const hit = touched(fence, target, containing);
    if (hit) {
      const what = shown(target, root, homedir);
      const whole = `${shown(hit.file, root, homedir)}${hit.dir ? '/' : ''}`;
      if (hit.why) return `it changes ${what}, ${hit.why}`;
      return target === hit.file ? `it changes ${what}, which is design-fence's own` : `it changes ${what}, which is design-fence's own (${whole})`;
    }
  }
  return '';
}

/** Whether a tool is a design tool's screenshot. */
export const isScreenshot = tool => /figma/i.test(tool) && SCREENSHOT.test(tool);

/** The script of `figma/` pasted into a Figma execute call, by the `design-fence figma` command that runs it, or ''. */
export function pastedScript(tool, input) {
  if (!EXECUTE.test(tool)) {
    return '';
  }
  for (const text of Object.values(input ?? {})) {
    const found = typeof text === 'string' && text.match(SCRIPT_START);
    if (found) {
      return SCRIPTS[found[1]];
    }
  }
  return '';
}

/** The state of the agents' sessions, in `.git/design-fence/agent-sessions.json`. */
const SESSIONS = 'agent-sessions.json';
const DAY = 24 * 60 * 60 * 1000;

function readSessions(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(stateDir(root), SESSIONS), 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Writes the sessions back, without those untouched for a day. Where `.git` cannot be written (a sandbox), the
 * hook still answers: only what it counts (the screenshots) is not kept.
 */
function writeSessions(root, sessions, now) {
  const kept = Object.fromEntries(Object.entries(sessions).filter(([, s]) => now - (s.at ?? 0) < DAY));
  try {
    const dir = stateDir(root);
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(path.join(dir, SESSIONS), `${JSON.stringify(kept)}\n`);
  } catch {
    // Nothing to do here: the decision does not depend on it.
  }
}

/** The budget of `playbooks/figma.md`: one design-tool screenshot per phase. */
const BUDGET = 1;

/**
 * The decision on an event `{name, tool, input, session, source, id,
 * prompt}`, for the project at `root`, with design-fence at `home`.
 */
export function decide(root, event, {home, now = Date.now(), homedir = os.homedir()}) {
  const session = event.session || 'default';
  const at = path.relative(root, home).split(path.sep).join('/');
  switch (event.name) {
    case 'pre-tool-use': {
      const tool = event.tool ?? '';
      const sessions = readSessions(root);
      const state = sessions[session] ?? {screenshots: 0};
      if (SHELL.test(tool)) {
        const command = commandText(event.input?.command ?? event.input?.cmd);
        const reason = bypassReason(command);
        if (reason) {
          return {deny: `design-fence: refused, because ${reason}. Fix what the hook reports; never skip it (${at}/PROCESS.md, "Enforcement").`};
        }
        if (runsHooks(command)) {
          return {deny: "design-fence: refused, because it runs design-fence's agent hooks by hand: only the agent tool runs them."};
        }
      }
      const fence = fenceReason(root, home, tool, event.input, homedir);
      if (fence && !state.allow) {
        return {ask: `design-fence: ${fence}. That needs the human's word: ask them. ${WAY_OUT}`};
      }
      const gate = gateReason(root, tool, event.input, homedir);
      if (gate && !state.allow) {
        return {
          ask: `design-fence: ${gate}. Approval is the human's word at the design gate (${at}/playbooks/design.md, step 4): show them the design and ask. ${WAY_OUT}`,
        };
      }
      if (SHELL.test(tool)) {
        // The command tried: if it fails, the script may then be pasted (figma.md's fallback).
        const ran = commandText(event.input?.command ?? event.input?.cmd).match(/design-fence(?:\.mjs)?\s+figma\s+([\w-]+)/);
        if (ran) {
          sessions[session] = {...state, tried: [...new Set([...(state.tried ?? []), ran[1]])], at: now};
          writeSessions(root, sessions, now);
        }
        return {};
      }
      const script = pastedScript(tool, event.input);
      if (script && !(state.tried ?? []).includes(script)) {
        return {
          deny:
            `design-fence: refused, because this is ${at}/figma/${script}.js pasted into the call. ` +
            `Run \`node ${at}/bin/design-fence.mjs figma ${script} …\` instead (${at}/playbooks/figma.md): ` +
            'the script stays out of the conversation. Once that command has been tried in this session and failed, the paste goes through: say why.',
        };
      }
      if (isScreenshot(tool)) {
        // Counted once per tool call: the project's hooks and the plugin may both see it.
        const shots = state.shots ?? [];
        if (event.id && shots.includes(event.id)) {
          return {};
        }
        if ((state.screenshots ?? 0) >= BUDGET) {
          return {
            deny:
              'design-fence: refused, because this phase has had its design-tool screenshot ' +
              `(${at}/playbooks/figma.md, "Screenshots": one per phase, at its end, for the human). ` +
              "Verify by reading the nodes' properties instead. The budget starts again when the human next writes.",
          };
        }
        sessions[session] = {
          ...state,
          screenshots: (state.screenshots ?? 0) + 1,
          shots: event.id ? [...shots, event.id] : shots,
          at: now,
        };
        writeSessions(root, sessions, now);
      }
      return {};
    }
    case 'user-prompt': {
      const sessions = readSessions(root);
      const state = sessions[session] ?? {};
      const allow = ALLOW.test(event.prompt ?? '');
      if (state.screenshots || state.allow || allow) {
        sessions[session] = {...state, screenshots: 0, shots: [], allow, at: now};
        writeSessions(root, sessions, now);
      }
      // Where the request goes, so the agent starts in the right file (`lib/route.mjs`); nothing for an answer.
      const way = routeFor(root, event.prompt, home);
      return way ? {context: way} : {};
    }
    case 'session-start': {
      if (event.source === 'compact') {
        const block = blockIn(readText(path.join(root, 'AGENTS.md')));
        return block ? {context: `design-fence's rules, again after the compaction (from AGENTS.md):\n\n${block}`} : {};
      }
      const hooks = hooksState(root, home);
      return hooks.state === 'on'
        ? {}
        : {
            context:
              `design-fence: the git hooks are off in this clone (core.hooksPath ${hooks.current || 'not set'}). ` +
              `Run \`node ${at}/install.mjs\` before the first commit.`,
          };
    }
    default:
      return {};
  }
}

/** The event names of the hook input of Claude Code and Codex, as `decide` names them. */
/** The route of a prompt as text, '' when it is not a request or the project's config cannot be read. */
function routeFor(root, prompt, home) {
  try {
    const config = JSON.parse(readText(path.join(root, '.agents/validate.json')) || 'null');
    return config && prompt ? routeText(route(root, prompt, config), relativeTo(root, home)) : '';
  } catch {
    return '';
  }
}

const EVENTS = {PreToolUse: 'pre-tool-use', UserPromptSubmit: 'user-prompt', SessionStart: 'session-start'};

/** An event from the JSON Claude Code and Codex give a hook command; `name` when the input does not say. */
export function fromHookInput(payload, name) {
  return {
    name: EVENTS[payload.hook_event_name] ?? name,
    tool: payload.tool_name,
    input: payload.tool_input,
    session: payload.session_id,
    source: payload.source,
    id: payload.tool_use_id,
    prompt: payload.prompt,
  };
}

/**
 * A hook of Claude Code or Codex: their JSON in, `{code, stdout, stderr}` out.
 * Exit 2 refuses the tool call, so nothing else exits 2: outside a project,
 * or on an error of its own, it lets the call through (0, or 1 with the
 * error, which the tools show without blocking); the git hooks and CI still
 * hold. `{ask}` is Claude Code's "ask" (it asks the human); Codex has no
 * "ask", so there it refuses, with the way out. Claude Code sets
 * `CLAUDE_PROJECT_DIR` for hooks and gives no `turn_id`; Codex gives one.
 *
 * `home`: design-fence's folder (the project's hooks: their own). The plugin
 * (`plugin`) finds it in the project, acts only in a project with
 * design-fence (its folder or its block in `AGENTS.md`), and gives no context
 * where the project's own hooks for that tool do.
 */
export function runHook(name, input, {home, plugin = false, env = process.env, cwd = process.cwd()} = {}) {
  try {
    const payload = input.trim() ? JSON.parse(input) : {};
    const root = projectRoot(payload.cwd || cwd);
    if (!root || (plugin && !isFenced(root))) {
      return {code: 0};
    }
    // Whose settings these hooks came from: Codex's events carry a turn_id, Claude Code's do not.
    const tool = payload.turn_id ? 'codex' : 'claude';
    // Claude Code itself, which can ask the human in place: its project variable, and the permission mode it sends
    // with every tool call. Other tools load Claude Code's hooks from `.claude/settings.json` (Cursor, Copilot) and
    // some set the variable too, without honouring "ask": there, as in Codex, a refusal with the way out.
    const asks = tool === 'claude' && Boolean(env.CLAUDE_PROJECT_DIR) && 'permission_mode' in payload;
    // GitHub Copilot's CLI, running Claude Code's hooks: it refuses on exit 2 but tells its agent only "hook exited
    // with code 2"; the reason reaches the agent as Claude Code's JSON refusal, on exit 0 (tried on 1.0.109 with
    // harness/probe.mjs --answers; Claude Code honours that form too). It gives its agent no context from hooks.
    const copilot = tool === 'claude' && !asks && Boolean(env.COPILOT_CLI);
    const event = fromHookInput(payload, name);
    // Context is given once: by the project's own hooks where it has them for this tool.
    const wired = plugin && agentHooksState(root)[tool];
    if (wired && event.name === 'session-start') {
      return {code: 0};
    }
    const decision = decide(root, event, {home: home ?? designFenceHome(root) ?? path.join(root, CONVENTION)});
    if (decision.ask && asks) {
      const output = {hookSpecificOutput: {hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: decision.ask}};
      return {code: 0, stdout: JSON.stringify(output)};
    }
    if (decision.deny || decision.ask) {
      const reason = decision.deny ?? decision.ask;
      if (copilot) {
        return {code: 0, stdout: JSON.stringify({hookSpecificOutput: {hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason}})};
      }
      return {code: 2, stderr: reason};
    }
    return decision.context && !(wired && event.name === 'user-prompt') ? {code: 0, stdout: decision.context} : {code: 0};
  } catch (error) {
    return {code: 1, stderr: `design-fence agent-hook ${name}: ${error.message}`};
  }
}
