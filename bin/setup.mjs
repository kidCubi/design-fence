#!/usr/bin/env node
/**
 * design-fence's installer, for a person in a terminal or for their agent:
 * run in the project's folder,
 *
 *     npx github:kidCubi/design-fence [--agents claude,codex,opencode,other] [--design | --no-design] [--yes]
 *
 * it does everything design-fence needs to work, and says what is left for
 * the person to do in their tools (what no command can do for them):
 *
 * 1. checks Node (20 or newer) and git, and that the folder is a git
 *    repository (`--git-init` makes it one; in a terminal, it asks);
 * 2. asks which agent tools the person uses (those found on the machine are
 *    ticked) and whether they design in Figma: in a terminal, a menu; for an
 *    agent, `--agents` and `--design`, with `--yes`;
 * 3. adds design-fence as a git submodule at `.agents/design-fence`, or
 *    checks it out where the project has it already (a fresh clone);
 * 4. runs that submodule's `install.mjs` (the project's version of it): git
 *    hooks, `AGENTS.md`, skills, CI, the agent tools' hooks, the design module
 *    and the Figma server;
 * 5. installs design-fence's plugin in each of the person's tools, outside
 *    the repository, where their agent cannot edit it (`--no-plugin` skips):
 *    Claude Code and Codex from the marketplace, OpenCode's file copied;
 * 6. with the design module: prepares figma-console's Desktop Bridge plugin
 *    (`figma-console-mcp --print-path`), for Figma Desktop to import;
 * 7. prints what to commit (it never commits), and what is left to do.
 *
 * Running it again changes nothing that is there. Every clone runs it once
 * (git does not share the hooks' setting), each person for their own tools.
 * Exits 0 when design-fence is installed, 1 when a step failed, 2 when it
 * needs an answer it cannot ask for.
 */

import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {AGENTS, listFlag} from '../install.mjs';
import {CONVENTION, designFenceHome, hooksState, readText, relativeTo} from '../lib/fence.mjs';
import {git, parseStatus, projectRoot} from '../lib/git.mjs';
import {and, bold, choose, confirm, cyan, dim, green, red, yellow} from '../lib/prompt.mjs';

/** Where design-fence comes from: the submodule's repository, and the plugins' marketplace. */
export const REPOSITORY = 'https://github.com/kidCubi/design-fence.git';
const MARKETPLACE = 'kidCubi/design-fence';
/** How a person runs this again (a teammate, after cloning). */
export const COMMAND = 'npx github:kidCubi/design-fence';
const NODE_MAJOR = 20;
const NAMES = {claude: 'Claude Code', codex: 'Codex', opencode: 'OpenCode', other: 'Another agent'};
const REFLECT = "Reflect: design-fence's files, installed as they come";

const USAGE = `Installs design-fence into the project in this folder (a git repository).

  ${COMMAND} [options]

  --agents <list>   the agent tools you use: claude, codex, opencode, other
                    (comma-separated; asked in a terminal, else those found)
  --design          with the design module (Figma, Storybook); asked in a terminal
  --no-design       without it
  --yes             ask nothing: what is not given takes its default
  --git-init        make this folder a git repository if it is not one
  --no-plugin       do not install design-fence's plugin in your tools
  --source <url>    where to take design-fence from (default: ${REPOSITORY})
  --help            this text`;

const flag = (argv, name) => argv.includes(`--${name}`);
function option(argv, name) {
  const at = argv.findIndex(arg => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (at < 0) {
    return null;
  }
  return argv[at].includes('=') ? argv[at].slice(argv[at].indexOf('=') + 1) : (argv[at + 1] ?? null);
}

/** Runs a command, never throwing: `{ok, out}` (stdout and stderr, trimmed). */
function run(command, args, {cwd, timeout = 180_000} = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  return {
    ok: result.status === 0,
    out: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() || (result.error ? String(result.error.message) : ''),
  };
}

/** Whether `name` is a command on the PATH. */
function onPath(name) {
  const extensions = process.platform === 'win32' ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : [''];
  return (process.env.PATH ?? '').split(path.delimiter).some(dir =>
    extensions.some(extension => {
      try {
        const file = path.join(dir, `${name}${extension}`);
        fs.accessSync(file, fs.constants.X_OK);
        return fs.statSync(file).isFile();
      } catch {
        return false;
      }
    }),
  );
}

/** Figma Desktop on this machine: true, false, or null where it cannot tell. */
function figmaDesktop() {
  if (process.platform === 'darwin') {
    return ['/Applications/Figma.app', path.join(os.homedir(), 'Applications/Figma.app')].some(dir => fs.existsSync(dir));
  }
  if (process.platform === 'win32') {
    return fs.existsSync(path.join(process.env.LOCALAPPDATA ?? '', 'Figma'));
  }
  return null;
}

const say = line => console.log(line);
const step = (mark, text) => say(`${mark} ${text}`);
const ok = text => step(green('◇'), text);
const warn = text => step(yellow('▲'), text);
const fail = text => step(red('■'), text);
const indent = text =>
  text
    .split('\n')
    .filter(Boolean)
    .forEach(line => say(`  ${dim('│')} ${line}`));
const last = (text, lines = 6) => text.split('\n').slice(-lines).join('\n');
/** A path in the home folder as `~/…`, as a person types it. */
const tilde = file => (file.startsWith(`${os.homedir()}${path.sep}`) ? `~${file.slice(os.homedir().length)}` : file);

/** The paths `git status` lists, with untracked folders whole. */
const statusPaths = root => parseStatus(git(root, ['status', '--porcelain', '-z']));

/** The plugin in Claude Code: installed (or enabled) from the marketplace; `{ok, note}`. */
function claudePlugin(marketplace) {
  if (!onPath('claude')) {
    return {
      ok: false,
      note: `claude is not on the PATH. In Claude Code, type /plugin marketplace add ${MARKETPLACE}, then /plugin install design-fence@design-fence.`,
    };
  }
  const listed = run('claude', ['plugin', 'list', '--json']);
  let entry = null;
  try {
    entry = JSON.parse(listed.out).find(plugin => plugin.id === 'design-fence@design-fence') ?? null;
  } catch {
    // An older Claude Code: install, which says when it is there.
  }
  if (entry?.enabled === false) {
    const enabled = run('claude', ['plugin', 'enable', 'design-fence@design-fence']);
    return enabled.ok ? {ok: true, note: 'plugin enabled again'} : {ok: false, note: last(enabled.out)};
  }
  if (entry) {
    return {ok: true, note: 'plugin already installed'};
  }
  const installed = run('claude', ['plugin', 'install', 'design-fence', '--marketplace', marketplace]);
  return installed.ok
    ? {ok: true, note: 'plugin installed'}
    : {ok: false, note: `${last(installed.out)}\nIn Claude Code, type /plugin marketplace add ${MARKETPLACE}, then /plugin install design-fence@design-fence.`};
}

/** The plugin in Codex: the marketplace added, the plugin added; `{ok, note}`. */
function codexPlugin(marketplace) {
  if (!onPath('codex')) {
    return {ok: false, note: `codex is not on the PATH. Run codex plugin marketplace add ${MARKETPLACE}, then install design-fence from /plugins.`};
  }
  // A marketplace named design-fence added before, from elsewhere (a local copy), stays: the plugin comes from it.
  const added = run('codex', ['plugin', 'marketplace', 'add', marketplace]);
  const plugin = run('codex', ['plugin', 'add', 'design-fence@design-fence']);
  if (plugin.ok) {
    return {ok: true, note: added.ok ? 'plugin installed' : 'plugin installed, from the design-fence marketplace Codex already has'};
  }
  return {ok: false, note: `${last([added.ok ? '' : added.out, plugin.out].filter(Boolean).join('\n'))}\nIn Codex, type /plugins and install design-fence.`};
}

/** OpenCode's plugin, copied into the person's plugins folder; `{ok, note}`. */
function opencodePlugin(home) {
  const dir = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'opencode', 'plugins');
  const target = path.join(dir, 'design-fence.js');
  const plugin = readText(path.join(home, 'harness/opencode/design-fence.js'));
  if (!plugin) {
    return {ok: false, note: `this design-fence has no OpenCode plugin (${relativeTo(process.cwd(), home)}/harness/opencode/): update it.`};
  }
  if (readText(target) === plugin) {
    return {ok: true, note: `plugin already in ${tilde(target)}`};
  }
  try {
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(target, plugin);
    return {ok: true, note: `plugin copied to ${tilde(target)}`};
  } catch (error) {
    return {ok: false, note: `could not write ${target}: ${error.message}`};
  }
}

/** figma-console's Desktop Bridge plugin, put where Figma imports it from; its manifest's path, or null. */
function figmaBridge() {
  if (!onPath('npx')) {
    return null;
  }
  const result = run('npx', ['-y', 'figma-console-mcp@latest', '--print-path'], {timeout: 300_000});
  const manifest = result.out.split('\n').find(line => line.trim().endsWith('manifest.json'))?.trim();
  return result.ok && manifest && fs.existsSync(manifest) ? manifest : null;
}

export async function main(argv = process.argv.slice(2)) {
  if (flag(argv, 'help') || flag(argv, 'h')) {
    say(USAGE);
    return 0;
  }
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !flag(argv, 'yes');
  const source = option(argv, 'source') ?? REPOSITORY;
  const local = !/^[a-z+]+:\/\/|^git@/.test(source);
  const marketplace = source === REPOSITORY ? MARKETPLACE : local ? path.resolve(source) : source;
  const left = [];

  say(`${bold('design-fence')} ${dim('· a process for building software with AI agents')}\n`);

  // 1. What it needs.
  const major = Number(process.versions.node.split('.')[0]);
  if (major < NODE_MAJOR) {
    fail(`Node ${process.versions.node}: design-fence needs Node ${NODE_MAJOR} or newer. Install it from https://nodejs.org, then run this again.`);
    return 1;
  }
  const gitVersion = run('git', ['--version']);
  if (!gitVersion.ok) {
    fail(
      process.platform === 'darwin'
        ? 'git is not installed. Run xcode-select --install (or install it from https://git-scm.com), then run this again.'
        : 'git is not installed. Install it from https://git-scm.com, then run this again.',
    );
    return 1;
  }
  ok(`Node ${process.versions.node}, ${gitVersion.out.replace(/^git version /, 'git ')}`);

  let root = projectRoot(process.cwd());
  if (!root) {
    const init =
      flag(argv, 'git-init') ||
      (interactive && (await confirm(`${process.cwd()} is not a git repository. Make it one (git init)?`, {yes: true})));
    if (!init) {
      fail(
        `${process.cwd()} is not a git repository, and design-fence works through git. ` +
          (interactive ? 'Run this in your project\'s folder.' : 'Run this in the project\'s folder, or again with --git-init to make this folder one.'),
      );
      return 2;
    }
    const made = run('git', ['init'], {cwd: process.cwd()});
    if (!made.ok) {
      fail(`git init failed:\n${made.out}`);
      return 1;
    }
    root = projectRoot(process.cwd());
    ok(`Made ${root} a git repository`);
  } else {
    ok(`Project: ${root}`);
  }

  // 2. The person's choices.
  const config = (() => {
    try {
      return JSON.parse(readText(path.join(root, '.agents/validate.json')) || '{}');
    } catch {
      return {};
    }
  })();
  const found = AGENTS.filter(onPath);
  let agents = listFlag(argv, 'agents');
  if (agents) {
    const unknown = agents.filter(name => !(name in NAMES));
    if (unknown.length || !agents.length) {
      fail(`--agents takes ${Object.keys(NAMES).join(', ')}; not ${unknown.join(', ') || 'nothing'}.`);
      return 2;
    }
  } else if (interactive) {
    agents = await choose(
      'Which agents do you use?',
      [...AGENTS, 'other'].map(value => ({
        value,
        label: NAMES[value],
        checked: found.includes(value) || (config.agents ?? []).includes(value),
        hint: value === 'other' ? 'Cursor, Copilot, Gemini…: AGENTS.md and the git hooks' : found.includes(value) ? 'found on this machine' : '',
      })),
    );
  } else {
    agents = found.length ? found : ['other'];
  }
  let design;
  if (flag(argv, 'design') || flag(argv, 'no-design')) {
    design = flag(argv, 'design');
  } else if (config.design) {
    design = true;
  } else {
    design = interactive ? await confirm('Do you design in Figma? (adds the design module)', {yes: true}) : false;
  }
  const plugins = !flag(argv, 'no-plugin');
  if (interactive) {
    say('');
    say(`  Into ${bold(root)}: design-fence${design ? ' with its design module' : ''}, for ${and(agents.map(name => NAMES[name]))}.`);
    if (plugins && agents.some(name => AGENTS.includes(name))) {
      say(`  And its plugin into your own ${and(agents.filter(name => AGENTS.includes(name)).map(name => NAMES[name]))}, outside the project.`);
    }
    if (!(await confirm('Go?', {yes: true}))) {
      say('Nothing done.');
      return 0;
    }
    say('');
  } else {
    ok(`For ${and(agents.map(name => NAMES[name]))}${design ? ', with the design module' : ''}`);
  }

  const before = new Set(statusPaths(root));

  // 3. The submodule.
  let home = designFenceHome(root);
  if (home) {
    ok(`design-fence is there: ${relativeTo(root, home)}`);
  } else {
    const registered = [...readText(path.join(root, '.gitmodules')).matchAll(/^\s*path\s*=\s*(.+?)\s*$/gm)]
      .map(match => match[1])
      .find(dir => dir === CONVENTION || /design-fence/.test(dir));
    const local_ = local ? ['-c', 'protocol.file.allow=always'] : [];
    const result = registered
      ? run('git', [...local_, 'submodule', 'update', '--init', '--', registered], {cwd: root})
      : run('git', [...local_, 'submodule', 'add', '--', local ? path.resolve(source) : source, CONVENTION], {cwd: root});
    home = designFenceHome(root);
    if (!result.ok || !home) {
      fail(`Could not ${registered ? 'check out' : 'add'} design-fence (git submodule):`);
      indent(last(result.out, 10));
      return 1;
    }
    ok(registered ? `design-fence checked out: ${registered}` : `design-fence added as a git submodule: ${CONVENTION}`);
  }

  // 4. The project's installer.
  const installArgs = [path.join(home, 'install.mjs'), '--agents', agents.join(','), ...(design ? ['--design'] : [])];
  const installed = run(process.execPath, installArgs, {cwd: root});
  if (!installed.ok) {
    fail('The installer failed:');
    indent(last(installed.out, 15));
    return 1;
  }
  ok('Installed into the project:');
  indent(installed.out.split('\n').filter(line => line !== 'Commit what it wrote.').join('\n'));
  const hooks = hooksState(root, home);
  if (hooks.state === 'other') {
    left.push(
      `Your project already has git hooks (core.hooksPath is ${hooks.current}): call design-fence's from them (${hooks.wanted}/pre-commit, commit-msg, pre-push), or point core.hooksPath to ${hooks.wanted}.`,
    );
  }

  // 5. The plugin, in the person's tools.
  const tools = agents.filter(name => AGENTS.includes(name));
  let failed = false;
  if (plugins) {
    for (const tool of tools) {
      const result = tool === 'claude' ? claudePlugin(marketplace) : tool === 'codex' ? codexPlugin(marketplace) : opencodePlugin(home);
      if (result.ok) {
        ok(`${NAMES[tool]}: ${result.note}`);
      } else {
        warn(`${NAMES[tool]}: plugin not installed.`);
        indent(result.note);
        failed = true;
      }
    }
  }

  // 6. Figma.
  let manifest = null;
  if (design) {
    manifest = figmaBridge();
    if (manifest) {
      ok(`Figma's Desktop Bridge plugin is ready: ${tilde(manifest)}`);
    } else {
      warn("Figma's Desktop Bridge plugin is not ready yet: it will be once your agent starts figma-console (npx -y figma-console-mcp@latest --print-path says where).");
    }
  }

  // 7. What to commit, and what is left.
  const added = statusPaths(root).filter(file => !before.has(file));
  say('');
  if (added.length) {
    say(bold('To commit the install') + dim(' (it does not commit; design-fence\'s commit hook wants the Reflect line):'));
    say(cyan(`  git add ${added.map(file => (/[\s"'$]/.test(file) ? JSON.stringify(file) : file)).join(' ')}`));
    say(cyan(`  git commit -m "chore: install design-fence" -m "${REFLECT}"`));
    say('');
  }

  const restart = name => `Quit ${name} and open it again in this folder`;
  for (const tool of agents) {
    if (tool === 'claude') {
      left.push(`${restart('Claude Code')}${design ? '; when it asks, approve the project\'s MCP server figma-console' : ''}.`);
    } else if (tool === 'codex') {
      left.push(
        `${restart('Codex')}, and trust the project when it asks. Then type /hooks and trust design-fence's hooks (the plugin's and the project's).` +
          (design ? ' design-fence figma needs the network, which Codex\'s sandbox keeps off: see .agents/design-fence/playbooks/figma.md.' : ''),
      );
    } else if (tool === 'opencode') {
      left.push(`${restart('OpenCode')}.`);
    } else {
      left.push(
        'In your other agent: if it does not read AGENTS.md, add one line to its own instructions file: "Read AGENTS.md first."' +
          (design ? ' Add the MCP server figma-console to its settings (command: npx -y figma-console-mcp@latest).' : ''),
      );
    }
  }
  if (design) {
    const desktop = figmaDesktop();
    left.push(
      (desktop === false ? 'Install Figma Desktop (https://www.figma.com/downloads/): the bridge runs in the app, not in the browser. ' : '') +
        `In Figma Desktop, with your file open: Plugins → Development → Import plugin from manifest → ${manifest ? tilde(manifest) : '~/.figma-console-mcp/plugin/manifest.json'}` +
        (process.platform === 'darwin' ? ' (in the dialog, Cmd+Shift+G lets you type the path)' : '') +
        ', then run "Figma Desktop Bridge".',
    );
  }
  left.push(`Each teammate, in their clone: ${COMMAND} (it checks design-fence out, turns its git hooks on, and installs the plugin in their tools).`);
  left.push(`Then ask your agent: "Read ${relativeTo(root, home)}/playbooks/start.md and tell me the first step it suggests."`);

  say(bold('Left for you:'));
  left.forEach((line, i) => say(`  ${i + 1}. ${line}`));
  return failed ? 1 : 0;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    code => process.exit(code),
    error => {
      console.error(error?.stack ?? String(error));
      process.exit(1);
    },
  );
}
