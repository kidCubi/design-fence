import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {check, run} from '../../score-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export default function score({dir, answer, changed}) {
  const hidden = run(process.execPath, ['--test', path.join(HERE, 'hidden.test.mjs')], {env: {...process.env, OUTLINE: path.join(dir, 'tools/outline.mjs')}});
  const own = run(process.execPath, ['--test', 'test/'], {cwd: dir});
  const outside = changed.filter(file => !/^(tools\/|test\/|(design\/)?issues\.md$)/.test(file));
  const commits = run('git', ['-C', dir, 'rev-list', '--count', 'HEAD']).out.trim();
  return [
    check('the issue is fixed (its own test)', hidden.ok, hidden.ok ? '' : hidden.out.split('\n').filter(l => /not ok|expected|actual/.test(l)).slice(0, 4).join(' | ')),
    check("the project's tests pass", own.ok),
    check('a test covers the fix', changed.some(file => file.startsWith('test/'))),
    check('nothing else changed', outside.length === 0, outside.join(', ')),
    check('not committed', commits === '1', `${commits} commits`),
    check('the report names what ran', /node --test|npm (run )?test|tests? (pass|ran|run)|\d+ (tests?|pass)/i.test(answer)),
  ];
}
