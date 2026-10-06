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

import { ifDefined } from '../../src/directives/if-defined.js';
import { render, html } from '../../src/lite-html.js';
import { innerHTML } from '../helpers.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('ifDefined', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('sets the attribute when the value is defined', () => {
    render(html`<p a=${ifDefined('value')}></p>`, container);
    expect(innerHTML(container)).to.equal('<p a="value"></p>');
    render(html`<p a=${ifDefined('')}></p>`, container);
    expect(innerHTML(container)).to.equal('<p a=""></p>');
  });

  it('removes the attribute when the value is undefined or null', () => {
    const template = value => html`<p a=${ifDefined(value)}></p>`;
    render(template('value'), container);
    render(template(undefined), container);
    expect(innerHTML(container)).to.equal('<p></p>');
    render(template('value'), container);
    render(template(null), container);
    expect(innerHTML(container)).to.equal('<p></p>');
  });

  it('sets the attribute again after it was removed', () => {
    const template = value => html`<p a=${ifDefined(value)}></p>`;
    render(template('value'), container);
    render(template(undefined), container);
    render(template('value'), container);
    expect(innerHTML(container)).to.equal('<p a="value"></p>');
  });

  it('does not set the attribute when the first value is undefined', () => {
    render(html`<p a=${ifDefined(undefined)}></p>`, container);
    expect(innerHTML(container)).to.equal('<p></p>');
  });

  it('renders the value as usual in other parts', () => {
    render(html`<p .prop=${ifDefined(undefined)} ?hidden=${ifDefined(undefined)}>${ifDefined(undefined)}</p>`, container);
    expect(innerHTML(container)).to.equal('<p></p>');
    expect(container.querySelector('p')).to.have.property('prop', undefined);
  });
});
