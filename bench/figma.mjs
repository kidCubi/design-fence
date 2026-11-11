// Runs a plugin script in Figma through figma-console, outside any agent: no model, no tokens. It starts its own
// figma-console server, waits for the Desktop Bridge to connect to it, runs the script with `figma_execute` and prints
// its result as JSON. Used between the measured runs (bench/README.md): the audit, the reset, the pre-run check.
//
//   node bench/figma.mjs <script.js> [--key <file key>]    the script's body, as figma_execute runs it
//   node bench/figma.mjs -e '<code>' [--key <file key>]
//
// --key: refuse to run unless the bridge's file is that one. Exit code 1 when the script fails.
import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';

const args = process.argv.slice(2);
const opt = name => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const code = opt('-e') ?? readFileSync(args[0], 'utf8');
const key = opt('--key');

const server = spawn('npx', ['-y', 'figma-console-mcp@latest'], {stdio: ['pipe', 'pipe', 'ignore'], env: process.env});
const pending = new Map();
let id = 0;
let buffer = '';
server.stdout.on('data', chunk => {
  buffer += chunk;
  let i;
  while ((i = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, i).trim();
    buffer = buffer.slice(i + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    if (msg.id != null && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});
const send = (method, params) =>
  new Promise(resolve => {
    const n = ++id;
    pending.set(n, resolve);
    server.stdin.write(JSON.stringify({jsonrpc: '2.0', id: n, method, params}) + '\n');
  });
const call = async (name, args) => {
  const r = await send('tools/call', {name, arguments: args});
  const text = r.result?.content?.find(c => c.type === 'text')?.text ?? JSON.stringify(r.error ?? r.result);
  try {
    return JSON.parse(text);
  } catch {
    return {text};
  }
};
const fail = message => {
  console.log(JSON.stringify({ok: false, error: message}));
  server.kill();
  process.exit(1);
};
const timer = setTimeout(() => fail('timed out'), 180_000);

await send('initialize', {protocolVersion: '2025-06-18', capabilities: {}, clientInfo: {name: 'bench', version: '1'}});
server.stdin.write(JSON.stringify({jsonrpc: '2.0', method: 'notifications/initialized'}) + '\n');

// The bridge plugin finds a new server on its own within seconds; wait for it, as the runs' SessionStart hook does.
let status;
for (let t = 0; t < 30; t++) {
  status = await call('figma_get_status', {probe: true});
  if (status.setup?.probeResult?.success) break;
  await new Promise(r => setTimeout(r, 3000));
}
if (!status.setup?.probeResult?.success) fail(`the bridge did not connect: ${status.setup?.message ?? status.text}`);
if (key && status.currentFileKey !== key)
  fail(`the bridge is on "${status.currentFileName}" (${status.currentFileKey}), not ${key}`);

const r = await call('figma_execute', {code, timeout: 120_000});
clearTimeout(timer);
console.log(JSON.stringify({ok: r.success === true, file: status.currentFileName, result: r.result ?? r.error ?? r}));
server.kill();
process.exit(r.success === true ? 0 : 1);
