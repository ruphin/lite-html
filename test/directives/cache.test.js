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

import { cache } from '../../src/directives/cache.js';
import { render, html } from '../../src/lite-html.js';
import { innerHTML } from '../helpers.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('cache', () => {
  let container;
  const one = value => html`<p>${value}</p>`;
  const two = value => html`<i>${value}</i>`;
  const template = value => html`<div>${cache(value)}</div>`;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders the value', () => {
    render(template(one(1)), container);
    expect(innerHTML(container)).to.equal('<div><p>1</p></div>');
    render(template('text'), container);
    expect(innerHTML(container)).to.equal('<div>text</div>');
  });

  it('keeps the DOM of templates that are no longer rendered', () => {
    render(template(one(1)), container);
    const p = container.querySelector('p');
    render(template(two(2)), container);
    const i = container.querySelector('i');
    expect(innerHTML(container)).to.equal('<div><i>2</i></div>');
    render(template(one(3)), container);
    expect(innerHTML(container)).to.equal('<div><p>3</p></div>');
    expect(container.querySelector('p')).to.equal(p);
    render(template(two(4)), container);
    expect(innerHTML(container)).to.equal('<div><i>4</i></div>');
    expect(container.querySelector('i')).to.equal(i);
  });

  it('keeps the DOM of templates when rendering other values in between', () => {
    render(template(one(1)), container);
    const p = container.querySelector('p');
    render(template('text'), container);
    expect(innerHTML(container)).to.equal('<div>text</div>');
    render(template(null), container);
    render(template(one(2)), container);
    expect(innerHTML(container)).to.equal('<div><p>2</p></div>');
    expect(container.querySelector('p')).to.equal(p);
  });

  it('does not keep the DOM of templates without the directive', () => {
    const uncached = value => html`<div>${value}</div>`;
    render(uncached(one(1)), container);
    const p = container.querySelector('p');
    render(uncached(two(2)), container);
    render(uncached(one(3)), container);
    expect(innerHTML(container)).to.equal('<div><p>3</p></div>');
    expect(container.querySelector('p')).to.not.equal(p);
  });
});
