#!/usr/bin/env node
/**
 * Installs design-fence into the project holding it (as a submodule, by
 * convention at `.agents/design-fence`). Run from anywhere in the project,
 * once per clone and after each update:
 *
 *     node .agents/design-fence/install.mjs [--design] [--agents claude,codex,opencode]
 *
 * It only adds what is missing, and refreshes what is its own, so running it
 * again changes nothing:
 *
 * - the git hooks: `core.hooksPath` set to this directory's `hooks/`, in this
 *   clone (git does not share it: every clone runs this once);
 * - `AGENTS.md`, `.agents/validate.json`, `.agents/ENFORCEMENT.md` and the
 *   CI workflow `.github/workflows/design-fence.yml`: from the templates,
 *   for the project to fill in, if it has none;
 * - design-fence's block in `AGENTS.md` (`templates/agents-block.md`: which
 *   playbook for which work, and the process's non-negotiables), between its
 *   markers, added or replaced: every agent loads `AGENTS.md`;
 * - the playbooks as skills (`skills/`), linked into `.agents/skills/` (Codex)
 *   and `.claude/skills/` (Claude Code), or copied when design-fence is not at
 *   `.agents/design-fence` or links fail;
 * - in an existing `CLAUDE.md` (Claude Code reads it instead of `AGENTS.md`):
 *   `@AGENTS.md`, and no import of `PROCESS.md`. No `CLAUDE.md` is created:
 *   without one, Claude Code reads `AGENTS.md`;
 * - the agent tools' hooks (`lib/agent-hooks.mjs`, what the git hooks cannot
 *   see between two commits): in `.claude/settings.json` (Claude Code) and
 *   `.codex/hooks.json` (Codex), merged with what is there, and as
 *   `.opencode/plugins/design-fence.js` (OpenCode), for the project's agent
 *   tools: `agents` in `.agents/validate.json`, which `--agents` adds to
 *   (`--agents other`: none of the three; where it has no list yet, to the
 *   tools wired already); without either, all three;
 * - with `--design`, the design module (PROCESS.md, "The design module"): a
 *   `design` section in `.agents/validate.json` if it has none, with the
 *   check `design-fence design` among its checks, the `design/`
 *   templates the project does not have, the design playbooks' skills, and
 *   the Figma server (figma-console, over its Desktop Bridge: no token) in
 *   `.mcp.json`, `.codex/config.toml` and `opencode.json` (the project's
 *   agent tools'), unless declared.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  AGENT_FILES,
  BLOCK_END,
  BLOCK_START,
  CONVENTION,
  FIGMA_CONSOLE,
  agentHooksState,
  blockIn,
  hooksState as hooksStateAt,
  isBlockStart,
  readText,
  relativeTo,
} from './lib/fence.mjs';
import {git, projectRoot} from './lib/git.mjs';
import {section} from './lib/markdown.mjs';

export {AGENT_FILES, agentHooksState, blockIn};

const HOME = path.dirname(fileURLToPath(import.meta.url));

const read = readText;

/** Whether the project's git hooks are design-fence's (`lib/fence.mjs`), by default this design-fence's. */
export const hooksState = (root, home = HOME) => hooksStateAt(root, home);

/** The playbooks installed as skills (`skills/design-fence-<name>`): always, and with the design module. */
const SKILLS = ['ship', 'reflect'];
const DESIGN_SKILLS = ['start', 'design', 'component', 'flows', 'figma'];

/** Where agents look for a project's skills: Codex (and others), Claude Code. */
const SKILL_DIRS = ['.agents/skills', '.claude/skills'];

const skillNames = design => (design ? [...SKILLS, ...DESIGN_SKILLS] : SKILLS);

/** The agent tools design-fence wires into a project (`AGENT_FILES`, `MCP_FILES`). */
export const AGENTS = ['claude', 'codex', 'opencode', 'copilot'];

/**
 * The project's agent tools: `agents` in its `validate.json`, else all
 * three; with `add` (`--agents`, null without it) added, to the list, or,
 * where there is none yet, to the tools design-fence's hooks are in already.
 * Names other than `AGENTS` (`other`) add none.
 */
export function agentsFor(root, config, add = null) {
  // Copilot runs Claude Code's hooks: their file being there does not say Copilot is one of the project's tools.
  const wired = () => Object.entries(agentHooksState(root)).filter(([tool, on]) => on && tool !== 'copilot').map(([tool]) => tool);
  const base = Array.isArray(config.agents) ? config.agents : add ? wired() : AGENTS;
  // No list and no --agents: the tools with files of their own (Copilot's are Claude Code's).
  if (!Array.isArray(config.agents) && !add) return AGENTS.filter(tool => tool !== 'copilot');
  return AGENTS.filter(tool => base.includes(tool) || (add ?? []).includes(tool));
}

/** `--name a,b` or `--name=a,b`, as a list; null without it. */
export function listFlag(argv, name) {
  const at = argv.findIndex(arg => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (at < 0) {
    return null;
  }
  const value = argv[at].includes('=') ? argv[at].slice(argv[at].indexOf('=') + 1) : (argv[at + 1] ?? '');
  return value.split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
}


/** design-fence's block for `AGENTS.md`, its paths relative to the project's root. */
export function agentsBlock(relative, design, home = HOME) {
  const at = name => `\`${relative}/playbooks/${name}.md\``;
  const routes = [
    `| A request or an issue, to the default branch | ${at('ship')} |`,
    ...(design
      ? [
          `| Anything users see (a component, a view, a token, a change to any of them) | ${at('design')}, then ${at('component')}; ${at('flows')} first when a view, a route or a path is new or moves. ${at('start')} instead while \`design/index.md\` lists nothing yet, or when the way is unclear |`,
          `| Any Figma read or write | ${at('figma')}, "Connect" first |`,
        ]
      : []),
    `| Before committing code | ${at('reflect')}: its verdict is the commit's \`Reflect:\` line |`,
  ];
  const rules = section(read(path.join(home, 'PROCESS.md')), 'non-negotiables').split('\n').slice(1).join('\n').trim();
  return read(path.join(home, 'templates/agents-block.md'))
    .replaceAll(CONVENTION, relative)
    .replace('{{routes}}', routes.join('\n'))
    .replace('{{non-negotiables}}', rules)
    .trim();
}

/**
 * `AGENTS.md` with design-fence's block: replaced between its markers, or
 * added after the title and its first paragraph.
 */
export function withBlock(text, block) {
  const wrapped = [BLOCK_START, '', block.trim(), '', BLOCK_END];
  const lines = text.split('\n');
  const start = lines.findIndex(isBlockStart);
  const end = lines.findIndex((line, i) => i > start && line.trim() === BLOCK_END);
  if (start >= 0 && end > start) {
    return [...lines.slice(0, start), ...wrapped, ...lines.slice(end + 1)].join('\n');
  }
  const title = lines.findIndex(line => line.startsWith('# '));
  if (title < 0) {
    return [...wrapped, '', ...lines].join('\n');
  }
  let at = title + 1;
  while (at < lines.length && !lines[at].trim()) at++;
  while (at < lines.length && lines[at].trim()) at++;
  const rest = lines.slice(at);
  return [...lines.slice(0, at), '', ...wrapped, ...(rest.length ? rest : [''])].join('\n');
}

/**
 * The agent tools' hooks: the events `design-fence agent-hook` takes, and the
 * tool calls it looks at (the shell, the edit tools: Claude Code's, Codex's
 * apply_patch; the MCP servers'); the files they go in (`AGENT_FILES`); and
 * the command each tool runs, from the project's root (`$CLAUDE_PROJECT_DIR`
 * in Claude Code, the repository's root where another tool runs these hooks
 * without it; Codex runs hooks in the session's directory). The plugin's
 * `harness/plugin/hooks/hooks.json` has the same matcher.
 */
export const PRE_TOOL_MATCHER = 'Bash|Edit|Write|MultiEdit|NotebookEdit|apply_patch|mcp__.*';
const AGENT_EVENTS = [
  ['SessionStart', 'session-start'],
  ['UserPromptSubmit', 'user-prompt'],
  ['PreToolUse', 'pre-tool-use', PRE_TOOL_MATCHER],
];
const agentCommands = relative => {
  // Other tools run Claude Code's hooks too (Copilot, Cursor), not all with its variable: the repository's root then.
  const claude = name => `node "\${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/${relative}/bin/design-fence.mjs" agent-hook ${name}`;
  return {
    claude,
    copilot: claude,
    codex: name => `node "$(git rev-parse --show-toplevel)/${relative}/bin/design-fence.mjs" agent-hook ${name}`,
  };
};
const isAgentHook = hook => /design-fence\.mjs" agent-hook /.test(hook?.command ?? '');

/**
 * A tool's settings (`{hooks: {<event>: [{matcher, hooks: [{type,
 * command}]}]}}`, Claude Code's and Codex's shape) with design-fence's agent
 * hooks: its own taken out wherever they are, then added, one group per
 * event. Everything else stays as it was.
 */
export function withAgentHooks(settings, command) {
  const hooks = {...(settings.hooks ?? {})};
  for (const [event, name, matcher] of AGENT_EVENTS) {
    const others = (hooks[event] ?? [])
      .map(group => ({...group, hooks: (group.hooks ?? []).filter(hook => !isAgentHook(hook))}))
      .filter(group => group.hooks.length > 0);
    const ours = {...(matcher ? {matcher} : {}), hooks: [{type: 'command', command: command(name), timeout: 30}]};
    hooks[event] = [...others, ours];
  }
  return {...settings, hooks};
}

/**
 * The agent tools' hooks, into the project, for its `tools`: merged into the
 * tools' settings (a file that is not JSON is left alone, and named in
 * `skipped`), and OpenCode's plugin copied. Returns `{written, skipped}`.
 */
function installAgentHooks(root, relative, write, tools) {
  const written = [];
  const skipped = [];
  for (const [tool, command] of Object.entries(agentCommands(relative))) {
    if (!tools.includes(tool)) {
      continue;
    }
    const file = AGENT_FILES[tool];
    const text = read(path.join(root, file));
    let settings;
    try {
      settings = text.trim() ? JSON.parse(text) : {};
    } catch {
      skipped.push(file);
      continue;
    }
    const next = `${JSON.stringify(withAgentHooks(settings, command), null, 2)}\n`;
    if (next !== text) {
      write(file, next);
      if (!written.includes(file)) written.push(file);
    }
  }
  const plugin = read(path.join(HOME, 'harness/opencode/design-fence.js'));
  if (tools.includes('opencode') && read(path.join(root, AGENT_FILES.opencode)) !== plugin) {
    write(AGENT_FILES.opencode, plugin);
    written.push(AGENT_FILES.opencode);
  }
  return {written, skipped};
}

/**
 * The design module's Figma server, figma-console (`playbooks/figma.md`):
 * over its Desktop Bridge it needs no token (only its REST tools do, which
 * design-fence does not use), so nothing personal goes into the repository.
 * Declared for each agent tool, in the project's own file for it.
 */
const FIGMA_SERVER = {name: 'figma-console', command: 'npx', args: ['-y', FIGMA_CONSOLE]};
/** design-fence's own declaration of an earlier version (or of `@latest`), which it brings to the pinned one. */
const isOwnFigmaArgs = args => Array.isArray(args) && args.length === 2 && args[0] === '-y' && /^figma-console-mcp@[\w.]+$/.test(args[1]) && args[1] !== FIGMA_CONSOLE;
export const MCP_FILES = {claude: '.mcp.json', codex: '.codex/config.toml', opencode: 'opencode.json', copilot: '.mcp.json'};
const CODEX_FIGMA = [
  '',
  "# design-fence's design module: Figma through figma-console's Desktop Bridge (no token needed).",
  `[mcp_servers.${FIGMA_SERVER.name}]`,
  `command = "${FIGMA_SERVER.command}"`,
  `args = [${FIGMA_SERVER.args.map(arg => `"${arg}"`).join(', ')}]`,
  '',
].join('\n');

/**
 * figma-console, at the version design-fence works with (`FIGMA_CONSOLE`,
 * `lib/fence.mjs`), declared where the project's agent `tools` look for their
 * MCP servers, unless the file already declares it (a declaration design-fence
 * wrote at another version is brought to this one; one with a token or other
 * arguments is the project's own, and stays): `.mcp.json` (Claude
 * Code), `.codex/config.toml` (Codex), `opencode.json` (OpenCode). A file
 * that cannot be read as JSON (or an `opencode.jsonc`) is left alone, and
 * named in `skipped`. Returns `{written, skipped}`.
 */
function installFigmaServer(root, write, tools) {
  const written = [];
  const skipped = [];
  const json = (file, add) => {
    const text = read(path.join(root, file));
    let settings;
    try {
      settings = text.trim() ? JSON.parse(text) : null;
    } catch {
      skipped.push(file);
      return;
    }
    const next = add(settings);
    if (next) {
      write(file, `${JSON.stringify(next, null, 2)}\n`);
      written.push(file);
    }
  };
  // Declared by design-fence before, at another version (no token, no other argument): brought to the pinned one.
  const ownClaude = settings => {
    const entry = settings?.mcpServers?.[FIGMA_SERVER.name];
    return entry && entry.command === FIGMA_SERVER.command && isOwnFigmaArgs(entry.args) && !entry.env;
  };
  const ownOpencode = settings => {
    const entry = settings?.mcp?.[FIGMA_SERVER.name];
    return entry && entry.type === 'local' && entry.command?.[0] === FIGMA_SERVER.command && isOwnFigmaArgs(entry.command.slice(1)) && !entry.environment;
  };
  json(MCP_FILES.claude, settings =>
    !(tools.includes('claude') || tools.includes('copilot')) || (settings?.mcpServers?.[FIGMA_SERVER.name] && !ownClaude(settings))
      ? null
      : {
          ...settings,
          mcpServers: {...settings?.mcpServers, [FIGMA_SERVER.name]: {command: FIGMA_SERVER.command, args: FIGMA_SERVER.args}},
        },
  );
  if (!tools.includes('opencode')) {
    // Not one of the project's tools.
  } else if (fs.existsSync(path.join(root, 'opencode.jsonc'))) {
    skipped.push('opencode.jsonc');
  } else {
    json(MCP_FILES.opencode, settings =>
      settings?.mcp?.[FIGMA_SERVER.name] && !ownOpencode(settings)
        ? null
        : {
            ...(settings ?? {$schema: 'https://opencode.ai/config.json'}),
            mcp: {...settings?.mcp, [FIGMA_SERVER.name]: {type: 'local', command: [FIGMA_SERVER.command, ...FIGMA_SERVER.args]}},
          },
    );
  }
  const codex = read(path.join(root, MCP_FILES.codex));
  // design-fence's own table as it wrote it (its two lines, nothing added under them), at another version.
  const own = new RegExp(`(\\[mcp_servers\\.${FIGMA_SERVER.name}\\]\\ncommand = "${FIGMA_SERVER.command}"\\nargs = \\["-y", ")(figma-console-mcp@[\\w.]+)("\\]\\n(?![\\w"]))`);
  if (tools.includes('codex') && !new RegExp(`^\\s*\\[mcp_servers\\.("?)${FIGMA_SERVER.name}\\1\\]`, 'm').test(codex)) {
    write(MCP_FILES.codex, `${codex}${codex && !codex.endsWith('\n') ? '\n' : ''}${codex ? CODEX_FIGMA : CODEX_FIGMA.slice(1)}`);
    written.push(MCP_FILES.codex);
  } else if (tools.includes('codex') && own.test(codex) && own.exec(codex)[2] !== FIGMA_CONSOLE) {
    write(MCP_FILES.codex, codex.replace(own, `$1${FIGMA_CONSOLE}$3`));
    written.push(MCP_FILES.codex);
  }
  return {written, skipped};
}

/** The comment design-fence's `CLAUDE.md` template had, dropped with its import of `PROCESS.md`. */
const OLD_POINTER = "<!-- Claude Code reads CLAUDE.md; the rules live in AGENTS.md (read by every agent) and in design-fence's process. -->";

/**
 * An existing `CLAUDE.md`, with `@AGENTS.md` (Claude Code reads `CLAUDE.md`
 * rather than `AGENTS.md` where both exist) and without design-fence's import
 * of `PROCESS.md` (`AGENTS.md`'s block says which playbook to read). No file
 * stays no file.
 */
export function claudeNext(text, relative) {
  if (!text) {
    return text;
  }
  const drop = [OLD_POINTER, `@${relative}/PROCESS.md`];
  const kept = text.split('\n').filter(line => !drop.includes(line.trim()));
  let next = kept.join('\n').replace(/^\n+/, '');
  if (!kept.some(line => line.trim() === '@AGENTS.md')) {
    next = `${next}${next && !next.endsWith('\n') ? '\n' : ''}${next.trim() ? '\n' : ''}@AGENTS.md\n`;
  }
  return next.trim() === text.trim() ? text : next;
}

/** A skill's file, its paths rewritten for where design-fence is. */
const skillText = (home, name, relative) =>
  read(path.join(home, 'skills', `design-fence-${name}`, 'SKILL.md')).replaceAll(CONVENTION, relative);

/**
 * What agents load from the project: `{block, skills, wanted, claude}`:
 * whether `AGENTS.md` has design-fence's block, how many of the `wanted`
 * skills each skills folder has, and `CLAUDE.md` as `none`, `imports` (it
 * imports `AGENTS.md`) or `missing` (it does not).
 */
export function agentsState(root, home = HOME, design = false) {
  const agents = read(path.join(root, 'AGENTS.md')).split('\n');
  const names = skillNames(design);
  const skills = Object.fromEntries(
    SKILL_DIRS.map(dir => [
      dir,
      names.filter(name => fs.existsSync(path.join(root, dir, `design-fence-${name}`, 'SKILL.md'))).length,
    ]),
  );
  const claudePath = path.join(root, 'CLAUDE.md');
  const claude = !fs.existsSync(claudePath)
    ? 'none'
    : read(claudePath).split('\n').some(line => line.trim() === '@AGENTS.md')
      ? 'imports'
      : 'missing';
  return {
    block: agents.some(isBlockStart) && agents.some(line => line.trim() === BLOCK_END),
    skills,
    wanted: names.length,
    claude,
  };
}

/** A directory link, `false` where the system refuses one (Windows without the right). */
function symlink(target, link) {
  try {
    fs.mkdirSync(path.dirname(link), {recursive: true});
    fs.symlinkSync(target, link, 'dir');
    return true;
  } catch {
    return false;
  }
}

/**
 * The skills, into each skills folder: a link to `skills/<name>` where
 * design-fence is at its conventional path (an update of the submodule
 * updates them), a copy with its paths rewritten otherwise. A link that
 * resolves is left as it is, a broken one replaced, a copy refreshed.
 */
function installSkills(root, relative, names, write) {
  const added = [];
  for (const dir of SKILL_DIRS) {
    for (const name of names) {
      const file = `${dir}/design-fence-${name}`;
      const link = path.join(root, file);
      let stat = null;
      try {
        stat = fs.lstatSync(link);
      } catch {
        // Not there.
      }
      if (stat?.isSymbolicLink()) {
        if (fs.existsSync(link)) {
          continue;
        }
        fs.unlinkSync(link);
      } else if (stat) {
        const text = skillText(HOME, name, relative);
        if (read(path.join(link, 'SKILL.md')) !== text) {
          write(`${file}/SKILL.md`, text);
          added.push(file);
        }
        continue;
      }
      const source = path.join(HOME, 'skills', `design-fence-${name}`);
      if (!(relative === CONVENTION && symlink(path.relative(path.dirname(link), source), link))) {
        write(`${file}/SKILL.md`, skillText(HOME, name, relative));
      }
      added.push(file);
    }
  }
  return added;
}

/** The design module's templates (`templates/design/`), copied to its folder. */
const DESIGN = ['PHILOSOPHY.md', 'tokens.md', 'index.md', 'flows.yml'];

function install(root, {design = false, addAgents = null} = {}) {
  const relative = relativeTo(root, HOME);
  const done = [];
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.writeFileSync(path.join(root, file), content);
    if (!done.includes(file)) {
      done.push(file);
    }
  };
  const template = name => fs.readFileSync(path.join(HOME, name), 'utf8');
  const fill = (file, source) => {
    if (!fs.existsSync(path.join(root, file))) {
      write(
        file,
        template(source)
          .replaceAll('{{project}}', path.basename(root))
          .replaceAll(CONVENTION, relative),
      );
    }
  };

  const claude = read(path.join(root, 'CLAUDE.md'));
  const claudeAfter = claudeNext(claude, relative);
  if (claudeAfter !== claude) {
    write('CLAUDE.md', claudeAfter);
  }

  const fresh = [
    ['AGENTS.md', 'templates/AGENTS.md'],
    ['.agents/validate.json', 'templates/validate.json'],
    ['.agents/ENFORCEMENT.md', 'ENFORCEMENT.md'],
    ['.github/workflows/design-fence.yml', 'templates/design-fence.yml'],
  ];
  for (const [file, source] of fresh) {
    fill(file, source);
  }

  const config = JSON.parse(fs.readFileSync(path.join(root, '.agents/validate.json'), 'utf8'));
  const tools = agentsFor(root, config, addAgents);
  const saveConfig = () => write('.agents/validate.json', `${JSON.stringify(config, null, 2)}\n`);
  if (addAgents && JSON.stringify(config.agents) !== JSON.stringify(tools)) {
    config.agents = tools;
    saveConfig();
  }
  if (design) {
    if (!config.design) {
      config.design = {dir: 'design'};
      saveConfig();
    }
    for (const name of DESIGN) {
      fill(`${config.design.dir ?? 'design'}/${name}`, `templates/design/${name}`);
    }
  }

  if (config.design) {
    // The design module's check, with the others, unless the project already runs it (or `specs`, its earlier name).
    const runsIt = (config.checks ?? []).some(check => /design-fence\.mjs["']?\s+(design|specs)\b/.test(check.run ?? ''));
    if (!runsIt) {
      const dir = config.design.dir ?? 'design';
      const library = (config.design.library ?? '').replace(/^\.\//, '').replace(/\/$/, '');
      config.checks = [
        ...(config.checks ?? []),
        {
          name: 'design',
          when: [`${dir}/**`, '**/*.stories.*', ...(library ? [`${library}/**`] : []), ...(config.design.tokens?.file ? [config.design.tokens.file] : [])],
          run: `node ${relative}/bin/design-fence.mjs design`,
        },
      ];
      saveConfig();
  }
  }

  const agents = read(path.join(root, 'AGENTS.md'));
  const agentsAfter = withBlock(agents, agentsBlock(relative, Boolean(config.design)));
  if (agentsAfter !== agents) {
    write('AGENTS.md', agentsAfter);
  }

  const skills = installSkills(root, relative, skillNames(Boolean(config.design)), write).map(file =>
    path.basename(file),
  );

  const agentHooks = installAgentHooks(root, relative, write, tools);
  const figmaServer = config.design ? installFigmaServer(root, write, tools) : {written: [], skipped: []};

  const hooks = hooksState(root);
  if (hooks.state === 'off') {
    git(root, ['config', 'core.hooksPath', hooks.wanted]);
  }
  return {done, skills: [...new Set(skills)], agentHooks, figmaServer, hooks, tools};
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = projectRoot(process.cwd());
  if (!root) {
    console.error('Run this inside the project (a git repository).');
    process.exit(2);
  }
  const {done, skills, agentHooks, figmaServer, hooks, tools} = install(root, {
    design: process.argv.includes('--design'),
    addAgents: listFlag(process.argv, 'agents'),
  });
  const own = [...Object.values(AGENT_FILES), ...figmaServer.written];
  const wrote = done.filter(file => !SKILL_DIRS.some(dir => file.startsWith(`${dir}/`)) && !own.includes(file));
  console.log(wrote.length ? `Wrote: ${wrote.join(', ')}` : 'The project files are there: nothing to write.');
  if (skills.length) {
    console.log(`Skills written to ${SKILL_DIRS.join('/ and ')}/: ${skills.join(', ')}`);
  }
  if (agentHooks.written.length) {
    console.log(`Agent hooks written to: ${agentHooks.written.join(', ')}`);
  }
  if (!tools.length) {
    console.log('Agent hooks: none written (no Claude Code, Codex or OpenCode in .agents/validate.json "agents").');
  }
  for (const file of agentHooks.skipped) {
    console.log(`Agent hooks NOT in ${file}: it is not JSON. Fix it and run this again.`);
  }
  if (figmaServer.written.length) {
    console.log(`Figma's server (figma-console, over the Desktop Bridge, no token) declared in: ${figmaServer.written.join(', ')}`);
  }
  for (const file of figmaServer.skipped) {
    console.log(`Figma's server NOT declared in ${file}: it is not plain JSON. Add figma-console there by hand (npx -y ${FIGMA_CONSOLE}).`);
  }
  if (hooks.state === 'other') {
    console.log(
      `Git hooks NOT on: core.hooksPath is already ${hooks.current}. Point it to ${hooks.wanted}, ` +
        'or call its pre-commit, commit-msg and pre-push from your own hooks.',
    );
  } else {
    console.log(`Git hooks on: core.hooksPath ${hooks.wanted} (this clone).`);
  }
  console.log('Commit what it wrote.');
}
