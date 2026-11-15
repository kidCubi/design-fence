/** @type { import('@storybook/web-components-vite').Preview } */
import '../src/fonts.css';
import '@fontsource/public-sans/300.css';
import '@fontsource/jetbrains-mono/300.css';
import '../src/tokens.css';

// Every story on the page's surface (AGENTS.md, "The design system").
// Edge to edge when a story's parameters say so (the hero, whose cubes come in from the screen's edge).
const onPage = (story, {parameters}) => {
  const page = document.createElement('div');
  const padding = parameters.edgeToEdge ? '0' : 'var(--space-12)';
  page.style.cssText = `background: var(--surface-page); padding: ${padding}; font-family: var(--font-family);`;
  const content = story();
  page.append(content instanceof Node ? content : document.createTextNode(String(content)));
  return page;
};

// The page's widths: a phone (Mobile, under 768px) and a tablet in portrait (768px: the Desktop variants, and the Tablet ones).
const viewports = {
  phone: {name: 'Phone (390)', styles: {width: '390px', height: '844px'}, type: 'mobile'},
  tablet: {name: 'Tablet portrait (768)', styles: {width: '768px', height: '1024px'}, type: 'tablet'},
};

const preview = {
  decorators: [onPage],
  parameters: {layout: 'fullscreen', viewport: {options: viewports}},
};

export default preview;
