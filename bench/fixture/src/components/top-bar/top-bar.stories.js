import './top-bar.js';

/** Top bar (design/components/top-bar.md; Figma 4:536). Fixed at the top of the screen, as on the page. */
export default {
  title: 'Components/Top bar',
  component: 'df-top-bar',
  parameters: {edgeToEdge: true},
  args: {label: 'Read the process', href: 'https://github.com/kidCubi/design-fence/blob/main/PROCESS.md'},
  render: ({label, href}) => {
    const bar = document.createElement('df-top-bar');
    bar.setAttribute('href', href);
    bar.textContent = label;
    return bar;
  },
};

export const Default = {};

/** Viewport Mobile: under 768px (Figma's Mobile variant). */
export const Mobile = {globals: {viewport: {value: 'phone', isRotated: false}}};
