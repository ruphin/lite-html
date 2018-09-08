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

import { render, html } from '../src/lite-html.js';

const expect = chai.expect;

describe('render', () => {
  class TestElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }
    get template() {
      return html`
        <style>
          .blue {
            color: rgb(255, 0, 0);
          }
        </style>
        <div class="blue">Hello</div>
      `;
    }
    connectedCallback() {
      render(this.template, this.shadowRoot);
    }
  }
  customElements.define('test-element', TestElement);

  const container = document.createElement('div');
  container.style.display = 'none';
  document.body.appendChild(container);
  const setup = () => {
    container.innerHTML = '';
  };
  beforeEach(() => setup());

  it('renders a thing inside a shadowroot', () => {
    container.innerHTML = '<test-element></test-element>';
    const testElement = container.querySelector('test-element');
    expect(testElement instanceof TestElement).to.be.true;
    const style = window.getComputedStyle(testElement.shadowRoot.querySelector('div'));
    expect(style.getPropertyValue('color')).to.equal('rgb(255, 0, 0)');
  });
});
