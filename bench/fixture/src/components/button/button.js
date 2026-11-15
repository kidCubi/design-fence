/**
 * `<df-button>Copy the commands</df-button>`: an action on this page (design/components/button.md). Its text is
 * its label. After its action, the page calls `announce('Copied')`: the label says it for `duration/slow` × 4,
 * announced to assistive technology, then returns.
 *
 * `secondary`: unframed at rest, beside a Primary. With `href` (a Secondary going to another page, "See on
 * GitHub"), it is a link (`a`), not a `button`, styled the same.
 */
import css from './button.css?inline';

export class Button extends HTMLElement {
  static observedAttributes = ['href'];

  #control = null;
  #label;
  #status;
  #timer = 0;

  constructor() {
    super();
    this.attachShadow({mode: 'open', delegatesFocus: true});
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  /** A `button`, or a link when it has a destination; kept when only the destination changes. */
  #render() {
    const href = this.getAttribute('href');
    const tag = href ? 'a' : 'button';
    if (this.#control?.localName !== tag) {
      const open = href ? '<a class="control" part="button">' : '<button class="control" type="button" part="button">';
      this.shadowRoot.innerHTML = `<style>${css}</style>${open}<span class="label"><slot></slot></span><span class="status" aria-live="polite" hidden></span></${tag}>`;
      this.#control = this.shadowRoot.querySelector('.control');
      this.#label = this.shadowRoot.querySelector('.label');
      this.#status = this.shadowRoot.querySelector('.status');
    }
    if (href) this.#control.setAttribute('href', href);
  }

  /** Shows `message` in place of the label for a while: what the action did. */
  announce(message) {
    const slow = Number(getComputedStyle(this).getPropertyValue('--duration-slow')) || 600;
    this.#status.textContent = message;
    this.#status.hidden = false;
    this.#label.hidden = true;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#status.hidden = true;
      this.#status.textContent = '';
      this.#label.hidden = false;
    }, slow * 4);
  }
}

if (!customElements.get('df-button')) customElements.define('df-button', Button);
