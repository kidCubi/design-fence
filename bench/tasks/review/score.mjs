import {check, run} from '../../score-lib.mjs';

export default function score({dir, answer}) {
  const text = answer.toLowerCase();
  const stat = run('git', ['-C', dir, 'diff', '--stat', 'HEAD']).out.trim().split('\n').pop();
  return [
    check('says it cannot be committed as it is', /(can ?not|can't|should ?n[o']t|must not|do not|don't|not ready|no[,.:] )[^.]{0,80}commit|does not hold|blocker|not (yet )?(commit[- ]?ready|ready|mergeable|acceptable|committable)|needs? (changes|work)|must change|must be (fixed|changed)/.test(text)),
    check('finds that the kind was never designed (no spec, no approved design)', /tertiary/.test(text) && /spec|figma|approved|approval|design gate|not designed|no design/.test(text)),
    check('finds the padding written raw', /18px/.test(text)),
    check('finds the primitive where a role belongs', /mono-60/.test(text) && /primitive|semantic|text[-/]muted|role/.test(text)),
    check('finds the motion without reduced motion', /reduced[- ]motion|prefers-reduced/.test(text)),
    check('finds the label against the voice', /exclamation|superlative|voice|"best"|best pricing/.test(text)),
    check('changed nothing', /2 files changed, 18 insertions\(\+\), 2 deletions/.test(stat), stat),
  ];
}
