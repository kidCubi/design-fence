import './button.js';

/** Button (design/components/button.md; Figma 2:193). Hover and pressed are the browser's: point and press. */
export default {
  title: 'Components/Button',
  component: 'df-button',
  args: {label: 'Copy the commands', secondary: false, href: ''},
  render: ({label, secondary, href}) => {
    const button = document.createElement('df-button');
    button.textContent = label;
    if (secondary) button.setAttribute('secondary', '');
    if (href) button.setAttribute('href', href);
    return button;
  },
};

export const Default = {};

export const Focus = {
  play: async ({canvasElement}) => canvasElement.querySelector('df-button').focus(),
};

export const Copied = {
  name: 'After its action',
  play: async ({canvasElement}) => canvasElement.querySelector('df-button').announce('Copied'),
};

/** Kind Secondary, going to another page: a link, unframed at rest ("See on GitHub"). */
export const Secondary = {
  args: {label: 'See on GitHub', secondary: true, href: 'https://github.com/kidCubi/design-fence'},
};

export const SecondaryFocus = {
  args: Secondary.args,
  play: async ({canvasElement}) => canvasElement.querySelector('df-button').focus(),
};
