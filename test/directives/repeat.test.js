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

import { repeat } from '../../src/directives/repeat.js';
import { render, html } from '../../src/lite-html.js';
import { innerHTML } from '../helpers.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('repeat', () => {
  let container;
  const keyed = items => html`<ul>${repeat(items, item => item, item => html`<li>${item}</li>`)}</ul>`;
  const listItems = () => [...container.querySelectorAll('li')];
  const text = () => listItems().map(li => li.textContent).join('');

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('renders items without a keyFn', () => {
    render(html`<ul>${repeat([1, 2, 3], (item, index) => html`<li>${index}:${item}</li>`)}</ul>`, container);
    expect(listItems().map(li => li.textContent)).to.deep.equal(['0:1', '1:2', '2:3']);
  });

  it('renders items with a keyFn', () => {
    render(keyed([1, 2, 3]), container);
    expect(innerHTML(container)).to.equal('<ul><li>1</li><li>2</li><li>3</li></ul>');
  });

  it('passes the index to keyFn and template', () => {
    render(html`${repeat(['a', 'b'], (item, index) => index, (item, index) => `${index}${item}`)}`, container);
    expect(container.textContent).to.equal('0a1b');
  });

  it('moves the DOM of keyed items when the order changes', () => {
    render(keyed([1, 2, 3, 4]), container);
    const [one, two, three, four] = listItems();
    render(keyed([4, 2, 1, 3]), container);
    expect(text()).to.equal('4213');
    listItems().forEach((li, i) => expect(li).to.equal([four, two, one, three][i]));
  });

  it('adds and removes keyed items', () => {
    render(keyed([1, 2, 3]), container);
    const [, two] = listItems();
    render(keyed([0, 2, 4]), container);
    expect(text()).to.equal('024');
    expect(listItems()[1]).to.equal(two);
    render(keyed([]), container);
    expect(innerHTML(container)).to.equal('<ul></ul>');
    render(keyed([5, 6]), container);
    expect(text()).to.equal('56');
  });

  it('renders all items when keys are duplicated', () => {
    render(keyed([1, 1, 2]), container);
    expect(text()).to.equal('112');
    render(keyed([2, 1, 1, 1]), container);
    expect(text()).to.equal('2111');
    render(keyed([1]), container);
    expect(text()).to.equal('1');
  });

  it('keeps surrounding content in place', () => {
    const template = items => html`<ul><li>a</li>${repeat(items, item => item, item => html`<li>${item}</li>`)}<li>z</li></ul>`;
    render(template([1, 2]), container);
    render(template([2, 3, 1]), container);
    expect(text()).to.equal('a231z');
    render(template([]), container);
    expect(text()).to.equal('az');
  });

  it('works when alternated with other renders', () => {
    const template = value => html`<ul>${value}</ul>`;
    render(template(repeat([1, 2], item => item, item => html`<li>${item}</li>`)), container);
    render(template('text'), container);
    expect(innerHTML(container)).to.equal('<ul>text</ul>');
    render(template(repeat([2, 1], item => item, item => html`<li>${item}</li>`)), container);
    expect(innerHTML(container)).to.equal('<ul><li>2</li><li>1</li></ul>');
    render(template('text'), container);
    expect(innerHTML(container)).to.equal('<ul>text</ul>');
    render(template(repeat([1, 2], item => html`<li>${item}</li>`)), container);
    expect(innerHTML(container)).to.equal('<ul><li>1</li><li>2</li></ul>');
  });

  it('does not break when the parent is normalized', () => {
    render(keyed([1, 2, 3]), container);
    container.normalize();
    render(keyed([3, 1]), container);
    expect(text()).to.equal('31');
    render(keyed([1, 2, 3]), container);
    expect(text()).to.equal('123');
  });

  it('accepts any iterable', () => {
    render(keyed(new Set([1, 2])), container);
    expect(text()).to.equal('12');
  });
});
