/**
 * A menu in the terminal, with node alone (design-fence has no dependencies):
 * a list to tick (`choose`) and a yes or no (`confirm`). The arrow keys (or
 * j and k) move, space ticks, enter goes on, ctrl-c leaves. For a terminal
 * only: `bin/setup.mjs` takes flags everywhere else.
 */

import readline from 'node:readline';

const colors = process.stdout.isTTY && process.stdout.hasColors?.() && !process.env.NO_COLOR;
const paint = code => text => (colors ? `\x1b[${code}m${text}\x1b[0m` : String(text));
export const bold = paint(1);
export const dim = paint(2);
export const red = paint(31);
export const green = paint(32);
export const yellow = paint(33);
export const cyan = paint(36);

/** `['a', 'b', 'c']` as "a, b and c". */
export const and = items => new Intl.ListFormat('en', {type: 'conjunction'}).format(items);

/** Draws `lines` in place of what the previous call drew. */
function painter(output) {
  let drawn = 0;
  return lines => {
    if (drawn) {
      output.write(`\x1b[${drawn}A\x1b[0J`);
    }
    output.write(`${lines.join('\n')}\n`);
    drawn = lines.length;
  };
}

/** Calls `onKey(name)` on each key until it returns something, which it resolves to. */
function keys(input, output, onKey) {
  readline.emitKeypressEvents(input);
  input.setRawMode(true);
  input.resume();
  output.write('\x1b[?25l');
  return new Promise(resolve => {
    const done = () => {
      input.off('keypress', handler);
      input.setRawMode(false);
      input.pause();
      output.write('\x1b[?25h');
    };
    const handler = (text, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        done();
        output.write('\n');
        process.exit(130);
      }
      const result = onKey(key.name ?? text);
      if (result !== undefined) {
        done();
        resolve(result);
      }
    };
    input.on('keypress', handler);
  });
}

/**
 * A list to tick: `options` are `{label, value, checked, hint}`; resolves to
 * the values ticked, at least one.
 */
export async function choose(question, options, {input = process.stdin, output = process.stdout} = {}) {
  const ticked = options.map(option => Boolean(option.checked));
  let at = 0;
  let warning = '';
  const draw = painter(output);
  const render = () =>
    draw([
      `${cyan('?')} ${bold(question)} ${dim('(space ticks, enter goes on)')}`,
      ...options.map((option, i) => {
        const pointer = i === at ? cyan('❯') : ' ';
        const box = ticked[i] ? green('◼') : dim('◻');
        const hint = option.hint ? ` ${dim(`· ${option.hint}`)}` : '';
        return `${pointer} ${box} ${i === at ? bold(option.label) : option.label}${hint}`;
      }),
      ...(warning ? [yellow(warning)] : []),
    ]);
  render();
  const values = await keys(input, output, key => {
    warning = '';
    if (key === 'up' || key === 'k') {
      at = (at + options.length - 1) % options.length;
    } else if (key === 'down' || key === 'j') {
      at = (at + 1) % options.length;
    } else if (key === 'space') {
      ticked[at] = !ticked[at];
    } else if (key === 'return' || key === 'enter') {
      if (ticked.some(Boolean)) {
        return options.filter((_, i) => ticked[i]).map(option => option.value);
      }
      warning = 'Tick at least one (space).';
    }
    render();
    return undefined;
  });
  draw([`${green('✔')} ${bold(question)} ${and(options.filter((_, i) => ticked[i]).map(option => option.label))}`]);
  return values;
}

/** A yes or no, `yes` by default; resolves to a boolean. */
export async function confirm(question, {yes = true, input = process.stdin, output = process.stdout} = {}) {
  const draw = painter(output);
  draw([`${cyan('?')} ${bold(question)} ${dim(yes ? '(Y/n)' : '(y/N)')}`]);
  const answer = await keys(input, output, key =>
    key === 'y' ? true : key === 'n' ? false : key === 'return' || key === 'enter' ? yes : undefined,
  );
  draw([`${green('✔')} ${bold(question)} ${answer ? 'Yes' : 'No'}`]);
  return answer;
}
