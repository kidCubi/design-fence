/**
 * `<df-section heading="How it works"><p slot="lead">…</p>…</df-section>`: one band of the page
 * (design/components/section.md). Its title, and beside it its lead (the children with `slot="lead"`); under them
 * its wide content (the other children), shown only when there is some. With `statement`, no title is shown: the
 * lead alone, centred and set as a title, the section named by its `heading`.
 *
 * When its head is a quarter of the way up the viewport, its title's characters rise into place one after another
 * (anime.js `splitText`) and its text fades in (a statement's text fades in alone); nothing moves with
 * `prefers-reduced-motion`, and without script it is simply there.
 */
import {animate} from 'animejs';
import head from './head.css?inline';
import css from './section.css?inline';
import {durations, onEnter, rise} from './enter.js';

export class Section extends HTMLElement {
  static observedAttributes = ['heading', 'statement'];

  #section;
  #head;
  #title;
  #lead;
  #content;
  #observer = null;
  #resize = null;

  constructor() {
    super();
    const root = this.attachShadow({mode: 'open'});
    root.innerHTML = `<style>${head}${css}</style><section part="section"><div class="inner"><div class="head"><h2 class="title" id="title" part="title"></h2><div class="lead" part="lead"><slot name="lead"></slot></div></div><div class="content" part="content" hidden><slot></slot></div></div></section>`;
    this.#section = root.querySelector('section');
    this.#head = root.querySelector('.head');
    this.#title = root.querySelector('.title');
    this.#lead = root.querySelector('.lead');
    this.#content = root.querySelector('.content');
    root.querySelector('.content slot').addEventListener('slotchange', () => this.#wide());
  }

  connectedCallback() {
    this.#update();
    this.#wide();
    this.#stick();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || this.#observer) return;
    this.setAttribute('data-pending', '');
    this.#observer = onEnter(this.#head, () => this.#enter());
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#resize?.disconnect();
    window.removeEventListener('resize', this.#onResize);
    this.#resize = null;
  }

  /** Where it sticks: at the screen's top, or, taller than the screen, where its end meets the screen's bottom (a
   *  negative top), so its content scrolls with the page to its end before the next section slides over it. */
  #stick() {
    if (this.#resize) return;
    this.#resize = new ResizeObserver(this.#onResize);
    this.#resize.observe(this);
    window.addEventListener('resize', this.#onResize, {passive: true});
  }

  #onResize = () => this.style.setProperty('--stick', `${Math.min(0, innerHeight - this.offsetHeight)}px`);

  attributeChangedCallback() {
    this.#update();
  }

  /** The title's text, and the section's name: its title, or, for a statement, its `heading` alone. */
  #update() {
    const heading = this.getAttribute('heading') ?? '';
    this.#title.textContent = heading;
    if (this.hasAttribute('statement')) {
      this.#section.removeAttribute('aria-labelledby');
      this.#section.setAttribute('aria-label', heading);
    } else {
      this.#section.removeAttribute('aria-label');
      this.#section.setAttribute('aria-labelledby', 'title');
    }
  }

  /** Wide: the content shows only when the section has some (children without `slot="lead"`). */
  #wide() {
    this.#content.hidden = !this.#content.querySelector('slot').assignedElements().length;
  }

  /** The entrance (enter.js); a statement's text fades in alone, over duration/slow. */
  #enter() {
    if (!this.hasAttribute('statement')) return rise(this, this.#title, [this.#lead, this.#content]);
    this.removeAttribute('data-pending');
    animate([this.#lead, this.#content], {opacity: [0, 1], duration: durations(this).slow});
  }
}

if (!customElements.get('df-section')) customElements.define('df-section', Section);
