/**
 * @license
 * MIT License
 *
 * Copyright (c) 2026 Goffert van Gool
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { unsafeHTML } from '../../src/directives/unsafe-html.js';
import { render, html } from '../../src/lite-html.js';
import { innerHTML } from '../helpers.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('unsafeHTML', () => {
  let container;

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
    const template = string => html`<p>${unsafeHTML(string)}</p>`;
    render(template('constructor'), container);
    expect(innerHTML(container)).to.equal('<p>constructor</p>');
    render(template('__proto__'), container);
    expect(innerHTML(container)).to.equal('<p>__proto__</p>');
  });

  it('does not render again when the string is unchanged', () => {
    const template = string => html`<p>${unsafeHTML(string)}</p>`;
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
