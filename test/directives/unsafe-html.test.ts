import { unsafeHTML } from '../../src/directives/unsafe-html.js';
import { render, html } from '../../src/lite-html.js';
import { innerHTML } from '../helpers.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('unsafeHTML', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should render a string as HTML', () => {
    const HTML = '<span></span>';
    render(html`${unsafeHTML(HTML)}`, container);
    expect(innerHTML(container)).to.equal(HTML);
  });

  it('works when alternated with other renders', () => {
    const HTML = '<span></span>';
    render(html`${unsafeHTML(HTML)}`, container);
    render(html`<div></div>`, container);
    expect(innerHTML(container)).to.equal('<div></div>');
    render(html`${unsafeHTML(HTML)}`, container);
    expect(innerHTML(container)).to.equal(HTML);
  });

  it('renders strings that are names of Object properties', () => {
    const template = (string: string) => html`<p>${unsafeHTML(string)}</p>`;
    render(template('constructor'), container);
    expect(innerHTML(container)).to.equal('<p>constructor</p>');
    render(template('__proto__'), container);
    expect(innerHTML(container)).to.equal('<p>__proto__</p>');
  });

  it('does not render again when the string is unchanged', () => {
    const template = (string: string) => html`<p>${unsafeHTML(string)}</p>`;
    render(template('<span></span>'), container);
    const span = container.querySelector('span');
    render(template('<span></span>'), container);
    expect(container.querySelector('span')).to.equal(span);
    render(template('<span></span><i></i>'), container);
    expect(innerHTML(container)).to.equal('<p><span></span><i></i></p>');
  });

  it('works with promises', async () => {
    const HTML = '<span></span>';
    const promise = Promise.resolve(unsafeHTML(HTML));
    render(html`${promise}`, container);
    await promise;
    expect(innerHTML(container)).to.equal(HTML);
  });
});
