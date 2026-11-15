import './link.js';

/** Link (design/components/link.md; Figma 2:184). Hover is the browser's: point at the link to see it. */
export default {
  title: 'Components/Link',
  component: 'df-link',
  args: {label: 'Read the process', href: 'https://github.com/kidCubi/design-fence/blob/main/PROCESS.md'},
  render: ({label, href}) => {
    const link = document.createElement('df-link');
    link.setAttribute('href', href);
    link.textContent = label;
    return link;
  },
};

export const Default = {};

export const Focus = {
  play: async ({canvasElement}) => canvasElement.querySelector('df-link').focus(),
};
