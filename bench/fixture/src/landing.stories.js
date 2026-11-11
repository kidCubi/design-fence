import './page.js';
import './page.css';
import html from '../index.html?raw';

/**
 * The page (design/flows.yml, view `landing`; Figma 4:266), composed from the library as the page is: its body is
 * index.html's own, so the story and the page cannot drift apart.
 */
const body = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;

export default {
  title: 'Pages/Landing',
  parameters: {edgeToEdge: true},
  render: () => {
    const page = document.createElement('div');
    page.innerHTML = body;
    return page;
  },
};

export const Desktop = {};

export const Phone = {globals: {viewport: {value: 'phone', isRotated: false}}};
