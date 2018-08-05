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

import { Template, TemplateResult, TemplateInstance } from '../../src/lib/templates.js';
import { findParts } from '../../src/lib/node-walker.js';
import { buildTemplate } from '../../src/lib/template-parser.js';

const expect = chai.expect;
const html = (strings, ...values) => new TemplateResult(strings, values);
const htmlStrings = strings => strings;

describe('templates', () => {
  describe('TemplateResult', () => {
    it(`stores the strings and values`, () => {
      const strings = ['<div>', '</div>'];
      const values = [0];
      const templateResultFromArrays = new TemplateResult(strings, values);
      expect(templateResultFromArrays.strings).to.deep.equal(strings);
      expect(templateResultFromArrays.values).to.deep.equal(values);
      const templateResult = html`<div>${0}</div>`;
      expect(templateResult.strings).to.deep.equal(strings);
      expect(templateResult.values).to.deep.equal(values);
    });

    it(`holds a template`, () => {
      const templateResult = html``;
      expect(templateResult.template instanceof Template).to.be.true;
    });

    it(`lazily loads the template`, () => {
      const templateResult = html``;
      expect(templateResult._template).to.be.undefined;
      expect(templateResult.template instanceof Template).to.be.true;
      expect(templateResult._template instanceof Template).to.be.true;
    });

    it(`returns the same template from different TemplateResults create with the same literal`, () => {
      const template = () => html``;
      const templateResultOne = template();
      const templateResultTwo = template();
      expect(templateResultOne).to.not.equal(templateResultTwo);
      expect(templateResultOne.template).to.equal(templateResultTwo.template);
    });
  });

  describe('Template', () => {
    it(`stores the strings that constructed the template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const template = new Template(strings);
      expect(template.strings).to.deep.equal(strings);
    });

    it(`constructs a template element that holds a DOM template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const template = new Template(strings);
      expect(template.element instanceof HTMLTemplateElement).to.be.true;
    });

    it(`computes the parts for the template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const templateElement = buildTemplate(strings);
      const template = new Template(strings);
      expect(template.parts).to.deep.equal(findParts(strings, templateElement));
    });
  });

  describe('TemplateInstance', () => {
    it(`contains a Template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const template = new Template(strings);
      expect(template.strings).to.deep.equal(strings);
    });

    it(`constructs a template element that holds a DOM template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const template = new Template(strings);
      expect(template.element instanceof HTMLTemplateElement).to.be.true;
    });

    it(`computes the parts for the template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const templateElement = buildTemplate(strings);
      const template = new Template(strings);
      expect(template.parts).to.deep.equal(findParts(strings, templateElement));
    });
  });
});
