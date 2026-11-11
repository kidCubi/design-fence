/**
 * `<df-link href="…">Read the process</df-link>`: a text link to another page (design/components/link.md).
 * Its text is its label; `href` its destination.
 */
import css from './link.css?inline';

export class Link extends HTMLElement {
  static observedAttributes = ['href'];

  #anchor;

  constructor() {
    super();
    const root = this.attachShadow({mode: 'open', delegatesFocus: true});
    root.innerHTML = `<style>${css}</style><a part="link"><span class="underline"><slot></slot></span></a>`;
    this.#anchor = root.querySelector('a');
  }

  connectedCallback() {
    this.#update();
  }

  attributeChangedCallback() {
    this.#update();
  }

  #update() {
    const href = this.getAttribute('href');
    if (href) this.#anchor.setAttribute('href', href);
    else this.#anchor.removeAttribute('href');
  }
}

if (!customElements.get('df-link')) customElements.define('df-link', Link);
