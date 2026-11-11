/**
 * A Section's entrance (design/components/section.md, "States"), shared with the footer's "Get started" and its scene
 * (footer.md, "Motion"): when a head is a quarter of the way up the viewport, its title's characters rise into place
 * one after another (anime.js `splitText`), then its text fades in.
 */
import {animate, splitText, stagger} from 'animejs';

/** How far up the viewport a head comes before it comes in: its top past this share of the viewport's height, from
 *  the top (not as soon as the band's first line shows). */
export const ENTER_AT = 0.75;

/** Calls `enter` once, the first time `target`'s top is past ENTER_AT; returns the observer, to disconnect. */
export function onEnter(target, enter) {
  const observer = new IntersectionObserver(
    entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      enter();
    },
    {rootMargin: `0px 0px -${(1 - ENTER_AT) * 100}% 0px`},
  );
  observer.observe(target);
  return observer;
}

/** The motion tokens, in ms, as `host` reads them. */
export function durations(host) {
  const style = getComputedStyle(host);
  const read = name => Number(style.getPropertyValue(`--duration-${name}`));
  return {fast: read('fast'), base: read('base'), slow: read('slow')};
}

/** The title's characters rise into place over duration/slow, a tenth of duration/fast apart (the spec's "one after
 *  another"); then `text` fades in over duration/base. `host` loses its `data-pending` (its CSS holds them hidden). */
export function rise(host, title, text) {
  const {fast, base, slow} = durations(host);
  const {chars} = splitText(title, {chars: {wrap: 'clip'}, accessible: true});
  host.removeAttribute('data-pending');
  animate(chars, {translateY: ['100%', '0%'], duration: slow, delay: stagger(fast / 10), ease: 'out(3)'});
  animate(text, {opacity: [0, 1], duration: base, delay: slow});
}
