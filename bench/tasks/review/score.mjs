import {check, run} from '../../score-lib.mjs';

export default function score({dir, answer}) {
  const text = answer.toLowerCase();
  const stat = run('git', ['-C', dir, 'diff', '--stat', 'HEAD']).out;
  const untouched = /2 files changed, 1[5-9] insertions\(\+\), 2 deletions/.test(stat);
  return [
    check('says it cannot be committed as it is', /(can ?not|can't|should ?n[o']t|must not|do not|don't|not ready|no[,.:] )[^.]{0,80}commit|does not hold|blocker|not (ready|mergeable|acceptable)|needs? (changes|work)|must change/.test(text)),
    check('finds the colour written raw', /#ff5a36|#141414|hex|raw (colou?r|value)|hard-?coded|literal (colou?r|value)|not (a |from the )?tokens?/.test(text)),
    check('finds the spacing or radius written raw', /10px|18px|6px|padding|radius/.test(text)),
    check('finds that the kind was never designed (spec, Figma or approval)', /tertiary/.test(text) && /spec|figma|approved|approval|design(ed| gate| system)|not (in|part of) the/.test(text)),
    check('finds the motion (raw duration or reduced motion)', /200ms|reduced[- ]motion|prefers-reduced|duration|transition|animation/.test(text)),
    check('changed nothing', untouched, stat.trim().split('\n').pop()),
  ];
}
