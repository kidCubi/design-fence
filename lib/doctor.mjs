/**
 * `design-fence doctor`: what is in place for design-fence to work in this
 * project and on this machine, and for each thing that is not, the one
 * command or step that puts it right. For a person, or for their agent to
 * read out. It changes nothing.
 *
 * It looks at: Node and git; the submodule and the git hooks; what the
 * installer wrote, against what this design-fence would write now (a
 * submodule updated without `install.mjs` run again); the agent tools'
 * hooks, for the project's tools; with the design module, its check, the
 * Figma server's version in each tool's settings, the Desktop Bridge plugin
 * on the machine, and, with `--bridge`, whether the bridge answers.
 *
 * `doctor()` returns `[{state, what, fix}]`, the state `ok`, `off` (to put
 * right) or `note` (worth knowing, nothing to do).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {AGENTS, MCP_FILES, agentsBlock, agentsFor, agentsState} from '../install.mjs';
import {loadConfig} from './check.mjs';
import {checkDesign} from './design-check.mjs';
import {FIGMA_CONSOLE, agentHooksState, blockIn, hooksState, readText, relativeTo} from './fence.mjs';
import {git} from './git.mjs';

const NAMES = {claude: 'Claude Code', codex: 'Codex', opencode: 'OpenCode', copilot: 'GitHub Copilot'};

export function doctor(root, home, {homedir = os.homedir(), platform = process.platform} = {}) {
  const lines = [];
  const say = (state, what, fix = '') => lines.push({state, what, fix});
  const at = relativeTo(root, home);
  const install = `node ${at}/install.mjs`;

  const major = Number(process.versions.node.split('.')[0]);
  say(major >= 20 ? 'ok' : 'off', `Node ${process.versions.node}`, 'design-fence needs Node 20 or newer: https://nodejs.org');

  // The submodule: checked out, and at the commit the project pins.
  let pinned = '';
  try {
    pinned = git(root, ['submodule', 'status', '--', at]).trim();
  } catch {
    // Not a submodule (a copy): nothing to compare.
  }
  if (pinned.startsWith('+')) {
    say('note', `${at} is at another commit than the project pins`, `if that is an update, run ${install} and commit it; if not, git submodule update --init ${at}`);
  } else if (pinned.startsWith('-')) {
    say('off', `${at} is not checked out`, `git submodule update --init ${at}`);
  } else {
    say('ok', `design-fence is at ${at}${pinned ? ' (a submodule, at the commit the project pins)' : ''}`);
  }

  const hooks = hooksState(root, home);
  say(
    hooks.state === 'on' ? 'ok' : 'off',
    hooks.state === 'on' ? `The git hooks are on (core.hooksPath ${hooks.wanted})` : hooks.state === 'other' ? `The git hooks are another's (core.hooksPath ${hooks.current})` : 'The git hooks are off in this clone',
    hooks.state === 'other' ? `call ${hooks.wanted}/pre-commit, commit-msg and pre-push from them, or point core.hooksPath to ${hooks.wanted}` : install,
  );

  const config = loadConfig(root);
  if (!config) {
    say('off', 'No .agents/validate.json', install);
    return lines;
  }
  const design = config.design;
  const agents = agentsState(root, home, Boolean(design));
  const block = blockIn(readText(path.join(root, 'AGENTS.md')));
  const current = block === agentsBlock(at, Boolean(design), home).trim();
  say(
    agents.block && current ? 'ok' : 'off',
    !agents.block ? "AGENTS.md has no design-fence block" : current ? "AGENTS.md has design-fence's block, as this version writes it" : "AGENTS.md's design-fence block is an earlier version's",
    install,
  );
  const missing = Object.entries(agents.skills).filter(([, n]) => n < agents.wanted);
  say(missing.length ? 'off' : 'ok', missing.length ? `Skills missing in ${missing.map(([dir]) => dir).join(', ')}` : `The playbooks' skills are installed (${agents.wanted})`, install);
  if (agents.claude === 'missing') say('off', 'CLAUDE.md does not import AGENTS.md, so Claude Code does not read it', install);

  const tools = agentsFor(root, config);
  const wired = agentHooksState(root);
  for (const tool of tools) {
    say(wired[tool] ? 'ok' : 'off', `${NAMES[tool]}: the session hooks are ${wired[tool] ? 'in the project' : 'not in the project'}`, install);
  }
  if (!tools.length) say('note', 'No agent tool with session hooks is named ("agents" in .agents/validate.json): the git hooks and CI are the fence');
  if (tools.includes('codex')) say('note', 'Codex runs hooks only once trusted: /hooks, in a trusted project');
  if (tools.includes('copilot')) say('note', "GitHub Copilot runs the project's hooks (Claude Code's file) only in a folder it trusts");
  if (tools.includes('opencode')) {
    const own = path.join(process.env.XDG_CONFIG_HOME || path.join(homedir, '.config'), 'opencode/plugins/design-fence.js');
    const same = readText(own) === readText(path.join(home, 'harness/opencode/design-fence.js'));
    say(same ? 'ok' : 'off', `OpenCode: your own copy of the plugin is ${fs.existsSync(own) ? (same ? 'this version' : "another version's") : 'not there'}`, `copy ${at}/harness/opencode/design-fence.js to ${own}`);
  }

  if (!design) {
    say('note', 'The design module is off', `${install} --design turns it on`);
    return lines;
  }
  const wiredCheck = (config.checks ?? []).some(check => /design-fence\.mjs["']?\s+(design|specs)\b/.test(check.run ?? ''));
  say(wiredCheck ? 'ok' : 'off', `The design module's check is ${wiredCheck ? '' : 'not '}among the project's checks`, install);
  const {problems, warnings} = checkDesign(root, design);
  say(problems.length ? 'off' : 'ok', problems.length ? `The design does not hold: ${problems.length} problem(s)` : `The design holds${warnings.length ? ` (${warnings.length} to bring in step)` : ''}`, `node ${at}/bin/design-fence.mjs design`);
  for (const [key, why] of [['fileKey', 'the Figma commands run on whatever file the bridge has open'], ['tokens', 'the tokens export needs its flags each time, and the tokens file is not held']]) {
    if (!design[key]) say('note', `design.${key} is not in .agents/validate.json: ${why}`);
  }

  // Figma's server, as each tool's settings declare it, against the version design-fence works with.
  for (const tool of tools.filter(name => AGENTS.includes(name))) {
    const text = readText(path.join(root, MCP_FILES[tool]));
    const declared = /figma-console-mcp@([\w.]+)/.exec(text)?.[0];
    if (!declared) {
      say('off', `${NAMES[tool]}: Figma's server is not declared (${MCP_FILES[tool]})`, `${install} --design`);
    } else {
      say(declared === FIGMA_CONSOLE ? 'ok' : 'off', `${NAMES[tool]}: Figma's server is ${declared}${declared === FIGMA_CONSOLE ? '' : `; design-fence works with ${FIGMA_CONSOLE}`}`, `${install} (it brings its own declaration up to date; one with a token is yours to change)`);
    }
  }
  const manifest = path.join(homedir, '.figma-console-mcp/plugin/manifest.json');
  const version = readText(path.join(homedir, '.figma-console-mcp/plugin/.version')).trim();
  say(
    fs.existsSync(manifest) ? 'ok' : 'off',
    fs.existsSync(manifest) ? `The Desktop Bridge plugin's files are on this machine${version ? ` (${version})` : ''}` : "The Desktop Bridge plugin's files are not on this machine",
    `npx -y ${FIGMA_CONSOLE} --print-path, then in Figma Desktop: Plugins → Development → Import plugin from manifest`,
  );
  if (platform === 'darwin') {
    const app = ['/Applications/Figma.app', path.join(homedir, 'Applications/Figma.app')].some(dir => fs.existsSync(dir));
    say(app ? 'ok' : 'off', `Figma Desktop is ${app ? '' : 'not '}installed`, 'https://www.figma.com/downloads/ (the bridge runs in the app, not in the browser)');
  }
  return lines;
}

/** The doctor's lines as text, and whether anything is off. */
export function doctorText(lines) {
  const mark = {ok: 'ok  ', off: 'OFF ', note: 'note'};
  return {
    text: lines.map(line => `${mark[line.state]} ${line.what}${line.state === 'off' && line.fix ? `\n       → ${line.fix}` : line.state === 'note' && line.fix ? ` (${line.fix})` : ''}`).join('\n'),
    off: lines.filter(line => line.state === 'off').length,
  };
}
