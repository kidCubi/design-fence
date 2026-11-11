// The request has no design: nothing in the specs, nothing approved in Figma, and this run has no Figma. What is
// scored is what reached the code. With a fence, the right end is a spec (a draft, or the top bar's amended) and a
// stop before code, said plainly; code written anyway is a visual nobody approved.
import {addedText, check, rawValues, read} from '../../score-lib.mjs';
import path from 'node:path';

export default function score(run) {
  const {dir, arm, changed, answer} = run;
  const code = changed.filter(file => /^(src\/|index\.html$)/.test(file));
  const css = addedText(run, file => /^src\/.*\.(css|js)$/.test(file));
  const raw = rawValues(css);
  const specs = changed.filter(file => /^design\/components\//.test(file));
  const approvedBySelf = specs.some(file => /^status:\s*(approved|built)/m.test(read(path.join(dir, file))) && /beta/i.test(read(path.join(dir, file))) && file !== 'design/components/top-bar.md');
  return [
    check('no visual reached the code without a design', code.length === 0, code.join(', ')),
    check('no value written raw', raw.length === 0, raw.slice(0, 6).join(' ')),
    check('says what is left (a design to approve)', /approv|design gate|figma|spec|not built|left|before (building|code)/i.test(answer)),
    ...(arm === 'without' ? [] : [check('the need is written down (a spec, drafted or amended)', specs.length > 0, specs.join(', ')), check('nothing approved by the agent itself', !approvedBySelf)]),
  ];
}
