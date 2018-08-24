/**
 * @license
 * MIT License
 *
 * Copyright (c) 2018 Goffert van Gool
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

const expect = chai.expect;

describe('unsafeHTML', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should render a string as HTML', () => {
    const HTML = '<span></span>';
    render(html`${unsafeHTML(HTML)}`, container);
    expect(container.innerHTML).to.equal(HTML);
  });

  it('works when alternated with other renders', () => {
    const HTML = '<span></span>';
    render(html`${unsafeHTML(HTML)}`, container);
    render(html`<div></div>`, container);
    expect(container.innerHTML).to.equal('<div></div>');
    render(html`${unsafeHTML(HTML)}`, container);
    expect(container.innerHTML).to.equal(HTML);
  });

  it('works with promises', async () => {
    const HTML = '<span></span>';
    const promise = Promise.resolve(unsafeHTML(HTML));
    render(html`${promise}`, container);
    await promise;
    expect(container.innerHTML).to.equal(HTML);
  });
});
