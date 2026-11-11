/**
 * design-fence's Figma scripts (`figma/*.js`) run from the command line,
 * through figma-console's Desktop Bridge: `design-fence figma <script>`.
 * An agent that pastes a script into `figma_execute` reads its text and
 * writes it out again, and a tokens export comes back through the
 * conversation to be written to the file; run from here, only the result
 * does, or nothing when it goes to a file.
 *
 * It starts its own figma-console server (the server `playbooks/figma.md`
 * names; see `figmaServer`), waits for the bridge plugin to find it, runs
 * the script with `figma_execute`, and stops the server. In an agent's
 * sandbox, the server needs the network on (it listens on a local port).
 */

import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {FIGMA_CONSOLE} from './fence.mjs';

const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/**
 * The figma-console server to start: `DESIGN_FENCE_FIGMA_SERVER` (a command
 * line), else the pinned version (`FIGMA_CONSOLE`) where npx has already
 * fetched it (an agent's sandbox may not let npx write its cache), else npx
 * with that version.
 */
export function figmaServer(env = process.env, npxCache = path.join(os.homedir(), '.npm/_npx')) {
  if (env.DESIGN_FENCE_FIGMA_SERVER) return env.DESIGN_FENCE_FIGMA_SERVER.split(' ').filter(Boolean);
  const pinned = FIGMA_CONSOLE.split('@').at(-1);
  const cached = (fs.existsSync(npxCache) ? fs.readdirSync(npxCache) : [])
    .map(dir => path.join(npxCache, dir, 'node_modules/figma-console-mcp'))
    .filter(dir => fs.existsSync(path.join(dir, 'package.json')))
    .map(dir => ({dir, pkg: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))}))
    .map(({dir, pkg}) => ({version: pkg.version ?? '0', bin: typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.['figma-console-mcp'], dir}))
    .filter(found => found.bin && found.version === pinned);
  return cached.length ? [process.execPath, path.join(cached[0].dir, cached[0].bin)] : ['npx', '-y', FIGMA_CONSOLE];
}

const list = value => (value ? String(value).split(',').map(s => s.trim()).filter(Boolean) : undefined);

/** The scripts, each with the call that follows its text, from the command line's arguments. */
export const SCRIPTS = {
  'lint-gaps': {
    usage: 'lint-gaps <node id> [--properties <name,name…>]',
    call: ({args, options}) => {
      if (!args[0]) throw new Error('Name the node: design-fence figma lint-gaps <node id>');
      const spec = options.properties ? {properties: list(options.properties)} : {};
      return `return await lintGaps(${JSON.stringify(args[0])}, ${JSON.stringify(spec)});`;
    },
  },
  sources: {
    usage: 'sources',
    call: () => 'return await sources();',
  },
  tokens: {
    usage: 'tokens [--format dtcg|css] [--px <prefix,…>] [--ms <prefix,…>] [--hash-only] [--out <file>]',
    call: ({options}) => {
      const spec = {
        format: options.format ?? 'dtcg',
        px: list(options.px) ?? [],
        ms: list(options.ms) ?? [],
        hashOnly: Boolean(options['hash-only']),
      };
      return `return await tokens(${JSON.stringify(spec)});`;
    },
  },
};

/** `--name value` and `--flag` options apart from the arguments. */
export function parseArgs(argv) {
  const args = [];
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) {
      args.push(argv[i]);
      continue;
    }
    const name = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) options[name] = true;
    else options[name] = argv[++i];
  }
  return {args, options};
}

/** The code `figma_execute` runs for a script: its text, then its call. */
export function scriptCode(name, parsed) {
  const script = SCRIPTS[name];
  if (!script) throw new Error(`No Figma script "${name}": ${Object.keys(SCRIPTS).join(', ')}`);
  return `${fs.readFileSync(path.join(HOME, 'figma', `${name}.js`), 'utf8')}\n${script.call(parsed)}`;
}

/**
 * Runs `code` through a figma-console server started for it. Resolves to
 * `{file, result}`, or rejects with what failed (no bridge, another file,
 * the script's error).
 */
export function runInFigma(code, {fileKey, server = figmaServer(), wait = 90_000, every = 3000, timeout = 120_000} = {}) {
  const child = spawn(server[0], server.slice(1), {stdio: ['pipe', 'pipe', 'pipe']});
  const pending = new Map();
  let id = 0;
  let buffer = '';
  let errors = '';
  child.stderr.on('data', chunk => (errors = (errors + chunk).slice(-2000)));
  // A server that stops (or never starts: no npx, no network to fetch it) fails what waits on it.
  const exited = new Promise((resolve, reject) => {
    child.on('error', error => reject(new Error(`figma-console did not start (${server.join(' ')}): ${error.message}`)));
    child.on('exit', code =>
      reject(new Error(`figma-console stopped (exit ${code})${errors.trim() ? `: ${errors.trim().split('\n').slice(-3).join(' ')}` : ''}`)),
    );
  });
  exited.catch(() => {});
  child.stdout.on('data', chunk => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    }
  });
  const write = message => child.stdin.write(`${JSON.stringify({jsonrpc: '2.0', ...message})}\n`);
  const request = (method, params) =>
    Promise.race([
      new Promise(resolve => {
        pending.set(++id, resolve);
        write({id, method, params});
      }),
      exited,
    ]);
  const call = async (name, args) => {
    const response = await request('tools/call', {name, arguments: args});
    const text = response.result?.content?.find(c => c.type === 'text')?.text;
    try {
      return JSON.parse(text);
    } catch {
      return {error: text ?? response.error?.message ?? 'no answer'};
    }
  };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const work = (async () => {
    await request('initialize', {protocolVersion: '2025-06-18', capabilities: {}, clientInfo: {name: 'design-fence', version: '1'}});
    write({method: 'notifications/initialized'});
    // The plugin finds a new server on its own, within seconds.
    // What design-fence reads of the server's answers is not a documented interface: an answer in another shape
    // is said as such, with the version this was written against, rather than as a bridge that did not connect.
    const unknown = (tool, answer, field) =>
      new Error(
        `figma-console answered ${tool} without "${field}" (it has: ${Object.keys(answer ?? {}).join(', ') || 'nothing'}): its format changed. ` +
          `design-fence works with ${FIGMA_CONSOLE}; another version is running (${server.join(' ')}).`,
      );
    let status = {};
    for (const start = Date.now(); Date.now() - start < wait; await sleep(every)) {
      status = await call('figma_get_status', {probe: true});
      if (!('setup' in status) && !('error' in status)) throw unknown('figma_get_status', status, 'setup');
      if (status.setup?.probeResult?.success) break;
    }
    if (!status.setup?.probeResult?.success) {
      throw new Error(
        `The Desktop Bridge did not connect (${status.setup?.message ?? status.error ?? 'no answer'}): open the file in Figma's desktop app and run the plugin (playbooks/figma.md, "Connect").`,
      );
    }
    const files = status.transport?.websocket?.connectedFiles ?? [];
    if (fileKey && status.currentFileKey !== fileKey && !files.some(f => f.fileKey === fileKey)) {
      throw new Error(`The bridge is on "${status.currentFileName}" (${status.currentFileKey}), not ${fileKey}.`);
    }
    const result = await call('figma_execute', {code, timeout, ...(fileKey ? {fileKey} : {})});
    if (!('success' in result) && !('error' in result)) throw unknown('figma_execute', result, 'success');
    if (result.success !== true) throw new Error(`The script failed in Figma: ${result.error ?? JSON.stringify(result)}`);
    return {file: result.fileContext?.fileName ?? status.currentFileName, result: result.result};
  })();
  return work.finally(() => {
    child.removeAllListeners('exit');
    child.kill();
  });
}
