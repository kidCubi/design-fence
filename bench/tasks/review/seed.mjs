// The change to review, left uncommitted: a third kind of Button nobody designed. It mostly looks right (tokens,
// the file's own style). What is wrong with it: the kind is in no spec and no approved design; a colour is a
// primitive where a role belongs (design/tokens.md, rule 2); one padding is written raw; its transition ignores
// reduced motion (AGENTS.md, "Code style"); and its label has an exclamation mark and a superlative (the voice).
import fs from 'node:fs';
import path from 'node:path';

export default function seed({dir}) {
  const edit = (file, change) => fs.writeFileSync(path.join(dir, file), change(fs.readFileSync(path.join(dir, file), 'utf8')));
  edit('src/components/button/button.css', css =>
    css.replace(
      '.status[hidden],',
      `/* Tertiary: quieter than a Secondary, for the pricing teaser. */
:host([tertiary]) .control {
  padding: var(--space-2) 18px;
  box-shadow: none;
  color: var(--mono-60);
  transition: color calc(var(--duration-fast) * 1ms) ease-out;
}

:host([tertiary]) .control:hover {
  color: var(--text-default);
}

.status[hidden],`,
    ),
  );
  edit('src/components/button/button.stories.js', stories =>
    stories
      .replace("args: {label: 'Copy the commands', secondary: false, href: ''},", "args: {label: 'Copy the commands', secondary: false, tertiary: false, href: ''},")
      .replace('render: ({label, secondary, href}) => {', 'render: ({label, secondary, tertiary, href}) => {')
      .replace("if (secondary) button.setAttribute('secondary', '');", "if (secondary) button.setAttribute('secondary', '');\n    if (tertiary) button.setAttribute('tertiary', '');") +
      "\n/** Kind Tertiary: the label alone, muted. */\nexport const Tertiary = {args: {label: 'See our best pricing!', tertiary: true}};\n",
  );
}
