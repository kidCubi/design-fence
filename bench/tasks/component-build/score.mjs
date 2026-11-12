// Against the component as the project really built it from this design (reference/, kept out of the copy).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {addedText, check, rawValues, read} from '../../score-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const tokensIn = text => new Set([...text.matchAll(/var\((--[\w-]+)/g)].map(match => match[1]));

export default function score(run) {
  const {dir, changed, answer} = run;
  const folder = path.join(dir, 'src/components/command');
  const files = fs.existsSync(folder) ? fs.readdirSync(folder) : [];
  const all = files.map(file => read(path.join(folder, file))).join('\n');
  const css = addedText(run, file => /^src\/components\/command\/.*\.(css|js)$/.test(file) && !/stories/.test(file));
  const raw = rawValues(css).filter(value => !/^76[78]px$/.test(value)); // the breakpoint: no token holds one (the spec's deviation)
  const want = tokensIn(read(path.join(HERE, 'reference/command.css')));
  const got = tokensIn(all);
  const missing = [...want].filter(token => !got.has(token));
  const extra = [...got].filter(token => !want.has(token));
  const stories = files.filter(file => /\.stories\./.test(file)).map(file => read(path.join(folder, file))).join('\n');
  // Its own folder, the design's records, and what an install or a build of Storybook leaves.
  const outside = changed.filter(file => !/^(src\/components\/command\/|design\/|storybook-static\/|package-lock\.json$|node_modules\b)/.test(file));
  return [
    check('the element df-command is defined', /customElements\.define\(\s*['"]df-command['"]/.test(all)),
    check('its stories are titled Components/Command', /title:\s*['"]Components\/Command['"]/.test(stories)),
    check('a story with the copy button and one without', (stories.match(/export const /g) ?? []).length >= 2 && /copy/i.test(stories)),
    check('no value written raw', raw.length === 0, raw.slice(0, 6).join(' ')),
    check("the design's tokens, all of them", missing.length === 0, `missing ${missing.join(' ')}`),
    check('no token the design does not use', extra.length <= 1, `extra ${extra.join(' ')}`),
    check('the copy button is the library\'s Button', /df-button/.test(all) && /button\/button\.js/.test(all)),
    check('a pre holding a code (the spec\'s accessibility)', /<pre[\s>]/.test(all) && /<code[\s>]/.test(all)),
    check('nothing else in the project changed', outside.length === 0, outside.join(', ')),
    check('the report names what it checked', /storybook|build|test|check|lint|ran /i.test(answer)),
  ];
}
