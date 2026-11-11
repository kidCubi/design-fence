// The design itself is audited in Figma after the run (bench/audit.js): no value unbound, no frame without auto-layout.
import {check} from '../../score-lib.mjs';

export default function score({arm, changed, audit, measured}) {
  const code = changed.filter(file => /^(src\/|index\.html$)/.test(file));
  return [
    check('the design is there (its page was found)', Boolean(audit)),
    check('every value bound to a variable', audit && audit.unboundCount === 0, audit ? `${audit.unboundCount} unbound` : ''),
    check('every frame has auto-layout', audit && audit.framesWithoutAutoLayout === 0, audit ? `${audit.framesWithoutAutoLayout} without` : ''),
    check('not built in code', code.length === 0, code.join(', ')),
    check('one screenshot at most', (measured.screenshots ?? 0) <= 1, `${measured.screenshots} screenshots`),
    ...(arm === 'without' ? [] : [check('a draft spec is left', changed.some(file => /^design\/components\/.*badge.*\.md$/i.test(file)))]),
  ];
}
