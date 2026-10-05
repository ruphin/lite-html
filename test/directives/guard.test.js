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

import { guard } from '../../src/directives/guard.js';
import { render, html } from '../../src/lite-html.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('guard', () => {
  let container;
  let calls;
  const template = (dependencies, value) =>
    html`<p title=${guard(dependencies, () => value)}>${guard(dependencies, () => (calls++, value))}</p>`;

  beforeEach(() => {
    container = document.createElement('div');
    calls = 0;
  });

  it('renders the result of valueFn', () => {
    render(template([1], 'a'), container);
    expect(container.innerHTML).to.equal('<p title="a">a</p>');
    expect(calls).to.equal(1);
  });

  it('does not call valueFn when the dependencies are unchanged', () => {
    const object = {};
    render(template([1, object], 'a'), container);
    render(template([1, object], 'b'), container);
    expect(container.innerHTML).to.equal('<p title="a">a</p>');
    expect(calls).to.equal(1);
  });

  it('calls valueFn when a dependency changes identity', () => {
    render(template([1, {}], 'a'), container);
    render(template([1, {}], 'b'), container);
    expect(container.innerHTML).to.equal('<p title="b">b</p>');
    expect(calls).to.equal(2);
  });

  it('calls valueFn when the number of dependencies changes', () => {
    render(template([1], 'a'), container);
    render(template([1, 2], 'b'), container);
    expect(container.innerHTML).to.equal('<p title="b">b</p>');
  });

  it('is not affected by mutations of the dependencies array', () => {
    const dependencies = [1];
    render(template(dependencies, 'a'), container);
    dependencies[0] = 2;
    render(template(dependencies, 'b'), container);
    expect(container.innerHTML).to.equal('<p title="b">b</p>');
  });
});
