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

import { render, html, svg } from '../src/lite-html.js';
import { innerHTML } from './helpers.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('lite-html', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  describe('render', () => {
    it('replaces the content of the target', () => {
      container.innerHTML = '<span></span>';
      render(html`<p>${'a'}</p>`, container);
      expect(innerHTML(container)).to.equal('<p>a</p>');
      render('text', container);
      expect(innerHTML(container)).to.equal('text');
    });

    it('updates parts that are next to each other', () => {
      const template = (a, b) => html`${a}${b}`;
      render(template('a', 'b'), container);
      expect(innerHTML(container)).to.equal('ab');
      render(template(html`<b></b>`, null), container);
      expect(innerHTML(container)).to.equal('<b></b>');
      render(template(null, html`<i></i>`), container);
      expect(innerHTML(container)).to.equal('<i></i>');
      render(template([1, 2], [3]), container);
      expect(innerHTML(container)).to.equal('123');
      render(template([], 'b'), container);
      expect(innerHTML(container)).to.equal('b');
    });

    it('keeps the content after a nested template that ends with a part', () => {
      const template = value => html`<p>${html`${value}`}<i></i></p>`;
      render(template('a'), container);
      expect(innerHTML(container)).to.equal('<p>a<i></i></p>');
      render(template(html`<b></b>`), container);
      expect(innerHTML(container)).to.equal('<p><b></b><i></i></p>');
      render(template([1, 2]), container);
      expect(innerHTML(container)).to.equal('<p>12<i></i></p>');
    });

    it('does not leave markers in attributes', () => {
      render(html`<a href=${undefined} .b=${1} ?c=${false} @d=${null}></a>`, container);
      expect(innerHTML(container)).to.equal('<a href=""></a>');
    });
  });

  describe('html', () => {
    it(`renders '<' characters that do not open a tag as text`, () => {
      render(html`<p>1 < 2 ${'a'} <= ${'b'}</p>`, container);
      expect(container.textContent).to.equal('1 < 2 a <= b');
      render(html`1 < ${2} <b title=${'c'}>${3}</b>`, container);
      expect(innerHTML(container)).to.equal('1 &lt; 2 <b title="c">3</b>');
    });
  });

  describe('svg', () => {
    it('renders elements in the SVG namespace', () => {
      const template = radius => html`<svg>${svg`<circle r=${radius}></circle>`}</svg>`;
      render(template(1), container);
      expect(innerHTML(container)).to.equal('<svg><circle r="1"></circle></svg>');
      expect(container.querySelector('circle').namespaceURI).to.equal('http://www.w3.org/2000/svg');
      render(template(2), container);
      expect(innerHTML(container)).to.equal('<svg><circle r="2"></circle></svg>');
    });

    it('renders nested templates and lists', () => {
      const template = radii => svg`<g>${radii.map(radius => svg`<circle r=${radius}></circle>`)}</g>`;
      render(html`<svg>${template([1, 2])}</svg>`, container);
      expect(innerHTML(container)).to.equal('<svg><g><circle r="1"></circle><circle r="2"></circle></g></svg>');
      expect(container.querySelectorAll('circle')[1].namespaceURI).to.equal('http://www.w3.org/2000/svg');
    });
  });
});
