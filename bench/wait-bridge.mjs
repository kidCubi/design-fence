// Starts figma-console for an agent that has no way to wait for it (Codex: no SessionStart hook), and holds the agent's
// tool calls until the Desktop Bridge plugin has found the new server: the counterpart of the 45 s wait the Claude Code
// runs have. Startup and the tool list go through at once; the first calls wait (no tokens, only time) while this
// script asks the server, itself, whether the bridge answers (`figma_get_status`, probe), every 2 s, for up to 90 s.
// Usage, as an MCP server's command: node bench/wait-bridge.mjs <command> [args...]
import {spawn} from 'node:child_process';

const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, {stdio: ['pipe', 'pipe', 'inherit'], env: process.env});
const queue = [];
let ready = false;
let probes = 0;

const open = () => {
  if (ready) return;
  ready = true;
  for (const line of queue) child.stdin.write(line + '\n');
  queue.length = 0;
};
const probe = () => {
  if (ready) return;
  if (++probes > 45) return open(); // 90 s: let the calls through, and fail as they would
  const msg = {jsonrpc: '2.0', id: `wait-bridge-${probes}`, method: 'tools/call', params: {name: 'figma_get_status', arguments: {probe: true}}};
  child.stdin.write(JSON.stringify(msg) + '\n');
};

// Newline-delimited JSON-RPC both ways, as MCP's stdio transport is.
const lines = (stream, each) => {
  let buffer = '';
  stream.on('data', chunk => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i);
      buffer = buffer.slice(i + 1);
      if (line.trim()) each(line);
    }
  });
};
const parse = line => {
  try {
    return JSON.parse(line);
  } catch {
    return {};
  }
};

lines(process.stdin, line => {
  const msg = parse(line);
  if (msg.method === 'tools/call' && !ready) return queue.push(line);
  child.stdin.write(line + '\n');
  if (msg.method === 'notifications/initialized') probe();
});
lines(child.stdout, line => {
  const msg = parse(line);
  if (typeof msg.id === 'string' && msg.id.startsWith('wait-bridge-')) {
    const text = msg.result?.content?.find(c => c.type === 'text')?.text ?? '';
    if (parse(text).setup?.probeResult?.success) open();
    else setTimeout(probe, 2000);
    return;
  }
  process.stdout.write(line + '\n');
});

child.on('exit', code => process.exit(code ?? 0));
process.stdin.on('end', () => child.kill());
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
