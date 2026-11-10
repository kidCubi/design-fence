/**
 * What design-fence's hooks in the agent tools decide (Claude Code, Codex,
 * OpenCode): the rules the git hooks cannot see, because they happen between
 * two commits. Each tool's adapter turns its own event into one of these, and
 * the decision back into its own protocol (`design-fence agent-hook`, and
 * `templates/opencode-plugin.js`).
 *
 * - `pre-tool-use`: refuses a shell command that skips or turns off the git
 *   hooks; a second design-tool screenshot in a phase (`playbooks/figma.md`);
 *   one of `figma/*.js` pasted into `figma_execute` rather than run with
 *   `design-fence figma <script>`, until that command has been tried in the
 *   session (`playbooks/figma.md`'s fallback, when it cannot reach the bridge).
 * - `user-prompt`: the human spoke, so a phase ended: the screenshot budget
 *   starts again.
 * - `session-start`: after a compaction, design-fence's block of `AGENTS.md`
 *   again (prose read once is summarised away); at any other start, only
 *   what is wrong (the git hooks off).
 *
 * A decision is `{deny}` (the reason, for the agent) or `{context}` (text for
 * the agent), or `{}`.
 */

import fs from 'node:fs';
import path from 'node:path';

import {blockIn, hooksState} from '../install.mjs';
import {stateDir} from './git.mjs';

/** The shell tools: Claude Code's and Codex's `Bash`, Codex's exec, OpenCode's `bash`. */
const SHELL = /^(bash|shell|local_shell|exec|exec_command)$/i;

/** The design tools' screenshots (`playbooks/figma.md`, "Screenshots"), by the end of their name, on a Figma server. */
const SCREENSHOT = /(?:^|[_.:-])(?:figma_take_screenshot|figma_capture_screenshot|figma_get_component_image|get_screenshot)$/;

/** The tools that run code in Figma. */
const EXECUTE = /(?:^|[_.:-])(?:figma_execute|use_figma)$/;

/** design-fence's Figma scripts, by the function each one defines, and the command that runs it. */
const SCRIPTS = {lintGaps: 'lint-gaps', tokens: 'tokens', sources: 'sources'};
const SCRIPT_START = new RegExp(`\\basync function (${Object.keys(SCRIPTS).join('|')})\\s*\\(`);

/** Git's commands whose short `-n` is `--no-verify`. */
const SHORT_NO_VERIFY = ['commit'];

/** The shells whose `-c` (or `-lc`) argument is the script, when a command comes as an argument list. */
const SHELLS = ['bash', 'sh', 'zsh', 'dash'];

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

/** The words of each git command in a script, after its variable assignments and `env`/`command`. */
function gitCommands(script) {
  return unquoted(script)
    .split(/&&|\|\||[;|&\n()`]/)
    .map(part => {
      const words = part.trim().split(/\s+/).filter(Boolean);
      while (words.length && (/^\w+=/.test(words[0]) || ['env', 'command', 'exec', 'time', 'nohup'].includes(words[0]))) {
        words.shift();
      }
      return words;
    })
    .filter(words => words.length && path.basename(words[0]) === 'git');
}

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

/** Writes the sessions back, without those untouched for a day. */
function writeSessions(root, sessions, now) {
  const kept = Object.fromEntries(Object.entries(sessions).filter(([, s]) => now - (s.at ?? 0) < DAY));
  const dir = stateDir(root);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, SESSIONS), `${JSON.stringify(kept)}\n`);
}

/** The budget of `playbooks/figma.md`: one design-tool screenshot per phase. */
const BUDGET = 1;

/**
 * The decision on an event `{name, tool, input, session, source}`, for the
 * project at `root`, with design-fence at `home`.
 */
export function decide(root, event, {home, now = Date.now()}) {
  const session = event.session || 'default';
  const at = path.relative(root, home).split(path.sep).join('/');
  switch (event.name) {
    case 'pre-tool-use': {
      const tool = event.tool ?? '';
      if (SHELL.test(tool)) {
        const command = commandText(event.input?.command ?? event.input?.cmd);
        const reason = bypassReason(command);
        if (reason) {
          return {deny: `design-fence: refused, because ${reason}. Fix what the hook reports; never skip it (${at}/PROCESS.md, "Enforcement").`};
        }
        // The command tried: if it fails, the script may then be pasted (figma.md's fallback).
        const ran = command.match(/design-fence(?:\.mjs)?\s+figma\s+([\w-]+)/);
        if (ran) {
          const sessions = readSessions(root);
          const state = sessions[session] ?? {screenshots: 0};
          sessions[session] = {...state, tried: [...new Set([...(state.tried ?? []), ran[1]])], at: now};
          writeSessions(root, sessions, now);
        }
        return {};
      }
      const script = pastedScript(tool, event.input);
      if (script && !(readSessions(root)[session]?.tried ?? []).includes(script)) {
        return {
          deny:
            `design-fence: refused, because this is ${at}/figma/${script}.js pasted into the call. ` +
            `Run \`node ${at}/bin/design-fence.mjs figma ${script} …\` instead (${at}/playbooks/figma.md): ` +
            'the script stays out of the conversation. Once that command has been tried in this session and failed, the paste goes through: say why.',
        };
      }
      if (isScreenshot(tool)) {
        const sessions = readSessions(root);
        const state = sessions[session] ?? {screenshots: 0};
        if (state.screenshots >= BUDGET) {
          return {
            deny:
              'design-fence: refused, because this phase has had its design-tool screenshot ' +
              `(${at}/playbooks/figma.md, "Screenshots": one per phase, at its end, for the human). ` +
              "Verify by reading the nodes' properties instead. The budget starts again when the human next writes.",
          };
        }
        sessions[session] = {...state, screenshots: state.screenshots + 1, at: now};
        writeSessions(root, sessions, now);
      }
      return {};
    }
    case 'user-prompt': {
      const sessions = readSessions(root);
      if (sessions[session]?.screenshots) {
        sessions[session] = {...sessions[session], screenshots: 0, at: now};
        writeSessions(root, sessions, now);
      }
      return {};
    }
    case 'session-start': {
      if (event.source === 'compact') {
        const agents = path.join(root, 'AGENTS.md');
        const block = blockIn(fs.existsSync(agents) ? fs.readFileSync(agents, 'utf8') : '');
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
const EVENTS = {PreToolUse: 'pre-tool-use', UserPromptSubmit: 'user-prompt', SessionStart: 'session-start'};

/** An event from the JSON Claude Code and Codex give a hook command; `name` when the input does not say. */
export function fromHookInput(payload, name) {
  return {
    name: EVENTS[payload.hook_event_name] ?? name,
    tool: payload.tool_name,
    input: payload.tool_input,
    session: payload.session_id,
    source: payload.source,
  };
}
