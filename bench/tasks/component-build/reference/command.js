/**
 * `<df-command copy>git submodule add …</df-command>`: a command or a program's output, as typed or as printed
 * (design/components/command.md): the element's text, in the monospace font, lines kept. With `copy`, a Button
 * copies the text and says "Copied"; its label is the attribute's value (`copy="Copy the terminal commands"`), or
 * "Copy" when it has none.
 */
import '../button/button.js';
import css from './command.css?inline';

export class Command extends HTMLElement {
  static observedAttributes = ['copy'];

  #code;
  #button;

  constructor() {
    super();
    const root = this.attachShadow({mode: 'open'});
    root.innerHTML = `<style>${css}</style><div class="command" part="command"><pre part="pre"><code></code></pre><df-button hidden>Copy</df-button></div>`;
    this.#code = root.querySelector('code');
    this.#button = root.querySelector('df-button');
    this.#button.addEventListener('click', () => this.#copy());
  }

  connectedCallback() {
    this.#update();
  }

  attributeChangedCallback() {
    this.#update();
  }

  #update() {
    this.#code.textContent = this.#text();
    this.#button.hidden = !this.hasAttribute('copy');
    this.#button.textContent = this.getAttribute('copy') || 'Copy';
  }

  /** The text as written in the page, its first and last empty lines and the indent they share left out. */
  #text() {
    const lines = (this.textContent ?? '').replace(/^\s*\n|\n\s*$/g, '').split('\n');
    const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
    return lines.map(l => l.slice(indent)).join('\n');
  }

  async #copy() {
    try {
      await navigator.clipboard.writeText(this.#text());
      this.#button.announce('Copied');
    } catch {
      this.#button.announce('Select the text to copy it');
    }
  }
}

if (!customElements.get('df-command')) customElements.define('df-command', Command);
