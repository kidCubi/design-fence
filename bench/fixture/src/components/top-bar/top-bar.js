/**
 * `<df-top-bar href="…">Read the process</df-top-bar>`: the page's top (design/components/top-bar.md): the
 * wordmark, and the link to the process (its text the element's text, `href` its destination). Fixed at the top
 * of the screen, above the page and the fencer.
 */
import '../link/link.js';
import css from './top-bar.css?inline';

export class TopBar extends HTMLElement {
  static observedAttributes = ['href'];

  #link;

  constructor() {
    super();
    const root = this.attachShadow({mode: 'open'});
    root.innerHTML = `<style>${css}</style><header part="top-bar"><span class="wordmark" part="wordmark">design-fence</span><df-link><slot></slot></df-link></header>`;
    this.#link = root.querySelector('df-link');
  }

  connectedCallback() {
    this.#update();
  }

  attributeChangedCallback() {
    this.#update();
  }

  #update() {
    const href = this.getAttribute('href');
    if (href) this.#link.setAttribute('href', href);
    else this.#link.removeAttribute('href');
  }
}

if (!customElements.get('df-top-bar')) customElements.define('df-top-bar', TopBar);
