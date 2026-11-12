// One run's numbers, from its log: Claude Code's `claude -p --output-format stream-json`, or Codex's `codex exec --json`
// (told apart by their first event). Tokens (per model, summed), cost from bench/prices.json (and, for Claude Code,
// the cost it reports itself), turns, seconds, and the tool calls by name, Figma's apart.
// Usage: node measure.mjs <run.jsonl> [--json]
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
const here = path.dirname(new URL(import.meta.url).pathname);
const prices = JSON.parse(readFileSync(path.join(here, 'prices.json'), 'utf8')).models;
const events = readFileSync(file, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map(l => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);
const agent = events[0]?.type === 'thread.started' ? 'codex' : 'claude';
const M = n => (n ?? 0) / 1e6;

// What a model's tokens cost at list price; null when bench/prices.json does not have the model.
function price(model, t) {
  const p = prices[model];
  if (!p) return null;
  return (
    M(t.input) * p.input +
    M(t.cacheRead) * p.cachedInput +
    M(t.cacheWrite5m) * (p.cacheWrite5m ?? p.cacheWrite) +
    M(t.cacheWrite1h) * (p.cacheWrite1h ?? p.cacheWrite) +
    M(t.output) * p.output
  );
}

const tools = {};
const failed = {};
// figma-console reports a failed call in its result's text, not as a tool error.
const failedText = content => /\\*"success\\*"\s*:\s*false/.test(JSON.stringify(content ?? ''));
const count = (bag, name) => (bag[name] = (bag[name] ?? 0) + 1);
const t = {input: 0, cacheWrite: 0, cacheRead: 0, output: 0};
const byModel = {};
let out;

if (agent === 'claude') {
  const names = {};
  for (const m of events) {
    for (const b of m.message?.content ?? []) {
      if (m.type === 'assistant' && b.type === 'tool_use') {
        count(tools, b.name);
        names[b.id] = b.name;
      }
      if (m.type === 'user' && b.type === 'tool_result' && (b.is_error || failedText(b.content)))
        count(failed, names[b.tool_use_id] ?? '?');
    }
  }
  const result = events.findLast(m => m.type === 'result') ?? {};
  const init = events.find(m => m.type === 'system' && m.subtype === 'init') ?? {};
  let cost = 0;
  for (const [model, u] of Object.entries(result.modelUsage ?? {})) {
    const cacheWrite1h = u.cacheCreationEphemeral1hInputTokens ?? 0;
    const c = price(model, {
      input: u.inputTokens,
      cacheRead: u.cacheReadInputTokens,
      cacheWrite5m: (u.cacheCreationInputTokens ?? 0) - cacheWrite1h,
      cacheWrite1h,
      output: u.outputTokens,
    });
    byModel[model] = {cost: c, reportedCost: u.costUSD};
    cost += c ?? u.costUSD ?? 0; // a model with no price in prices.json: Claude Code's own count
    t.input += u.inputTokens ?? 0;
    t.cacheWrite += u.cacheCreationInputTokens ?? 0;
    t.cacheRead += u.cacheReadInputTokens ?? 0;
    t.output += u.outputTokens ?? 0;
  }
  const figmaServers = (init.mcp_servers ?? []).filter(s => /figma/i.test(s.name));
  out = {
    ok: result.subtype === 'success' && !result.is_error,
    subtype: result.subtype,
    model: init.model,
    agentVersion: init.claude_code_version,
    // The servers at the start: the run counts with figma-console connected and no other Figma server.
    figmaServers: figmaServers.map(s => `${s.name}:${s.status}`),
    connected:
      figmaServers.some(s => s.name === 'figma-console' && s.status === 'connected') &&
      figmaServers.every(s => s.name === 'figma-console'),
    cost,
    reportedCost: result.total_cost_usd,
    turns: result.num_turns,
    seconds: Math.round((result.duration_ms ?? 0) / 1000),
    answer: result.result ?? '',
  };
} else {
  // Codex: one turn per `codex exec`; its usage is that turn's, input including the cached part.
  for (const e of events) {
    if (e.type !== 'item.completed') continue;
    const it = e.item;
    const name =
      it.type === 'mcp_tool_call'
        ? `mcp__${it.server}__${it.tool}`
        : it.type === 'command_execution'
          ? 'shell'
          : it.type === 'file_change'
            ? 'edit'
            : it.type === 'agent_message' || it.type === 'reasoning'
              ? null
              : it.type;
    if (!name) continue;
    count(tools, name);
    if (
      it.status === 'failed' ||
      it.error ||
      it.result?.isError ||
      failedText(it.result) ||
      (it.type === 'command_execution' && it.exit_code)
    )
      count(failed, name);
  }
  const usage = {input: 0, cached: 0, cacheWrite: 0, output: 0};
  for (const e of events.filter(e => e.type === 'turn.completed')) {
    usage.input += e.usage?.input_tokens ?? 0;
    usage.cached += e.usage?.cached_input_tokens ?? 0;
    usage.cacheWrite += e.usage?.cache_write_input_tokens ?? 0;
    usage.output += e.usage?.output_tokens ?? 0; // reasoning included
  }
  t.cacheRead = usage.cached;
  t.cacheWrite = usage.cacheWrite;
  t.input = usage.input - usage.cached - usage.cacheWrite;
  t.output = usage.output;
  // The model and the seconds are not in Codex's events: run.mjs writes them beside the log.
  const meta = file.replace(/\.jsonl$/, '.meta.json');
  const info = existsSync(meta) ? JSON.parse(readFileSync(meta, 'utf8')) : {};
  // Priced at the standard rate: a request over 272k input tokens costs more, and Codex's log does not say which.
  const cost = price(info.model, {input: t.input, cacheRead: t.cacheRead, cacheWrite5m: t.cacheWrite, output: t.output});
  byModel[info.model ?? '?'] = {cost};
  const figmaOk = Object.keys(tools).some(k => k.startsWith('mcp__figma-console__') && tools[k] > (failed[k] ?? 0));
  out = {
    ok: events.some(e => e.type === 'turn.completed') && !events.some(e => e.type === 'turn.failed'),
    subtype: events.some(e => e.type === 'turn.failed') ? 'turn.failed' : events.some(e => e.type === 'turn.completed') ? 'success' : 'unfinished',
    model: info.model,
    agentVersion: info.agentVersion,
    figmaServers: Object.keys(tools).some(k => k.startsWith('mcp__figma-console__')) ? ['figma-console'] : [],
    connected: figmaOk && !Object.keys(tools).some(k => /^mcp__/.test(k) && !k.startsWith('mcp__figma-console__') && /figma/i.test(k)),
    cost,
    reportedCost: null,
    turns: null,
    seconds: info.seconds ?? null,
    answer: events.filter(e => e.type === 'item.completed' && e.item?.type === 'agent_message').at(-1)?.item?.text ?? '',
  };
}

const sum = (bag, test) =>
  Object.entries(bag)
    .filter(([k]) => test.test(k))
    .reduce((s, [, v]) => s + v, 0);
Object.assign(out, {
  agent,
  tokens: t,
  total: t.input + t.cacheWrite + t.cacheRead + t.output,
  fresh: t.input + t.cacheWrite + t.output, // what is not a cache read
  figmaCalls: sum(tools, /figma/i),
  failedFigmaCalls: sum(failed, /figma/i),
  // Asked for, and taken: a screenshot design-fence's hook refused was asked for and not taken.
  screenshots: sum(tools, /screenshot/i),
  screenshotsTaken: sum(tools, /screenshot/i) - sum(failed, /screenshot/i),
  failed,
  tools,
  byModel,
});
console.log(process.argv.includes('--json') ? JSON.stringify(out) : out);
