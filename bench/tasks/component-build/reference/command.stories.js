import './command.js';

/**
 * Command (design/components/command.md; Figma 4:568). "Output" without the copy button, "Install" with it: its
 * name says Copy, the property it shows, as a story's name does for each value its spec lists (design-fence design).
 */
export default {
  title: 'Components/Command',
  component: 'df-command',
  args: {text: 'ok   format (1091 ms)\nok   design specs (56 ms)', copy: false, label: ''},
  render: ({text, copy, label}) => {
    const command = document.createElement('df-command');
    command.textContent = text;
    if (copy) command.setAttribute('copy', label);
    return command;
  },
};

export const Output = {};

export const Install = {
  name: 'Install, with Copy',
  args: {
    text: 'git submodule add https://github.com/kidCubi/design-fence.git .agents/design-fence\nnode .agents/design-fence/install.mjs --design',
    copy: true,
    label: 'Copy the terminal commands',
  },
};

/** Viewport Mobile: under 768px, the button under the text (Figma's Mobile variant). */
export const InstallMobile = {args: Install.args, globals: {viewport: {value: 'phone', isRotated: false}}};
