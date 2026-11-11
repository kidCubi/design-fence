// Where a run's tokens went (bench/README.md): what entered its context, from its log (Claude Code's or Codex's),
// grouped by what it was (a file read, a command, a Figma call, a screenshot), with its size and how long it stayed.
// Whatever enters the context is sent again with every later request, so what is read early, and is large, costs
// the most: "carried" is its size times the requests after it, about what it added to the run's total.
// Sizes are estimated from characters (about 3.5 a token); a screenshot is counted apart, as an image.
// Usage: node bench/where.mjs <run.jsonl> [<run.jsonl> ...] [--top <n>]
import {readFileSync} from 'node:fs';

const args = process.argv.slice(2);
const top = args.includes('--top') ? Number(args[args.indexOf('--top') + 1]) : 15;
const files = args.filter((a, i) => a.endsWith('.jsonl') && args[i - 1] !== '--top');
const tok = chars => Math.round(chars / 3.5);
const big = n => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const short = s => String(s ?? '').replace(/\s+/g, ' ').slice(0, 70);
const filesIn = cmd =>
  [...String(cmd).matchAll(/[\w./-]+\.(?:md|mjs|js|json|css|yml|yaml|html)\b/g)].map(m => m[0]).slice(0, 3).join(' ');

function parse(file) {
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
  const entries = []; // {label, chars, images, at}: `at` is the request after which it entered
  let requests = 0;
  if (events[0]?.type === 'thread.started') {
    // Codex: each tool call ends a request; its result enters the next.
    for (const e of events) {
      if (e.type !== 'item.completed') continue;
      const it = e.item;
      let label, content;
      if (it.type === 'mcp_tool_call') {
        label = `figma ${it.tool}`;
        content = it.result?.content ?? it.error;
      } else if (it.type === 'command_execution') {
        label = `read ${filesIn(it.command) || short(it.command.replace(/^\S+ -lc /, ''))}`;
        content = it.aggregated_output;
      } else continue;
      requests++;
      const parts = Array.isArray(content) ? content : [{type: 'text', text: content}];
      entries.push({
        label,
        at: requests,
        chars: parts.filter(p => p.type !== 'image').reduce((s, p) => s + JSON.stringify(p.text ?? p).length, 0),
        images: parts.filter(p => p.type === 'image').length,
      });
    }
  } else {
    // Claude Code: one request per assistant message (its blocks arrive as several events with one id).
    const seen = new Set();
    const uses = {};
    for (const m of events) {
      if (m.type === 'assistant') {
        if (!seen.has(m.message.id)) seen.add(m.message.id), requests++;
        for (const b of m.message.content ?? []) if (b.type === 'tool_use') uses[b.id] = b;
      }
      if (m.type !== 'user') continue;
      for (const b of m.message?.content ?? []) {
        if (b.type !== 'tool_result') continue;
        const use = uses[b.tool_use_id] ?? {};
        const i = use.input ?? {};
        const label = /figma/i.test(use.name ?? '')
          ? `figma ${use.name.split('__').pop()}`
          : use.name === 'Read'
            ? `read ${i.file_path?.split('/').slice(-3).join('/')}`
            : use.name === 'Bash'
              ? `read ${filesIn(i.command) || short(i.command)}`
              : use.name === 'Skill'
                ? `skill ${i.skill}`
                : `${use.name} ${short(i.pattern ?? i.file_path ?? '')}`;
        const parts = Array.isArray(b.content) ? b.content : [{type: 'text', text: b.content}];
        entries.push({
          label,
          at: requests,
          chars: parts.filter(p => p.type !== 'image').reduce((s, p) => s + String(p.text ?? '').length, 0),
          images: parts.filter(p => p.type === 'image').length,
        });
      }
    }
  }
  return {entries, requests};
}

for (const file of files) {
  const {entries, requests} = parse(file);
  const groups = {};
  for (const e of entries) {
    const g = (groups[e.label] ??= {n: 0, tokens: 0, images: 0, carried: 0, first: e.at});
    g.n++;
    g.tokens += tok(e.chars);
    g.images += e.images;
    g.carried += tok(e.chars) * (requests - e.at);
  }
  const rows = Object.entries(groups).sort((a, b) => b[1].carried - a[1].carried);
  const sum = k => rows.reduce((s, [, g]) => s + g[k], 0);
  console.log(`\n${file}: ${requests} requests, ${entries.length} tool results, ${big(sum('tokens'))} tokens in, ${big(sum('carried'))} carried, ${sum('images')} images`);
  console.log('carried   in      n  from  what');
  for (const [label, g] of rows.slice(0, top))
    console.log(
      `${big(g.carried).padStart(6)} ${big(g.tokens).padStart(6)} ${String(g.n).padStart(4)} ${String(g.first).padStart(5)}  ${label}${g.images ? ` (+${g.images} images)` : ''}`,
    );
}
