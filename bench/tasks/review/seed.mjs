// The change to review, left uncommitted: a third kind of Button nobody designed, with values written raw, an
// animation that ignores reduced motion, and a story for it.
import fs from 'node:fs';
import path from 'node:path';

export default function seed({dir}) {
  const edit = (file, change) => fs.writeFileSync(path.join(dir, file), change(fs.readFileSync(path.join(dir, file), 'utf8')));
  edit('src/components/button/button.css', css =>
    css.replace(
      '.status[hidden],',
      `/* Tertiary: for the pricing teaser. */
:host([tertiary]) .control {
  padding: 10px 18px;
  border-radius: 6px;
  background: #ff5a36;
  box-shadow: none;
  color: #141414;
  transition: transform 200ms ease-out;
}

:host([tertiary]) .control:hover {
  transform: scale(1.04);
}

.status[hidden],`,
    ),
  );
  edit('src/components/button/button.stories.js', stories =>
    stories
      .replace("args: {label: 'Copy the commands', secondary: false, href: ''},", "args: {label: 'Copy the commands', secondary: false, tertiary: false, href: ''},")
      .replace('render: ({label, secondary, href}) => {', 'render: ({label, secondary, tertiary, href}) => {')
      .replace("if (secondary) button.setAttribute('secondary', '');", "if (secondary) button.setAttribute('secondary', '');\n    if (tertiary) button.setAttribute('tertiary', '');") +
      "\nexport const Tertiary = {args: {label: 'See pricing', tertiary: true}};\n",
  );
}
