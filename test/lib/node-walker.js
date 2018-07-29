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

import { buildTemplate } from '../../src/lib/template-parser.js';
import { findParts } from '../../src/lib/node-walker.js';
import { AttributePart, CommentPart, NodePart } from '../../src/lib/parts.js';

const expect = chai.expect;
const html = strings => strings;

describe('nodeWalker', () => {
  describe('findParts', () => {
    it(`Correctly detects part types`, () => {
      const strings = html`<!--${0}--><div a=${1}>${2}</div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0].type).to.equal(CommentPart);
      expect(parts[1].type).to.equal(AttributePart);
      expect(parts[2].type).to.equal(NodePart);
    });

    it(`Returns the correct path for node parts`, () => {
      const strings = html`<div>${0}<div>${0}</div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0].path).to.deep.equal([0, 0]);
      expect(parts[1].path).to.deep.equal([0, 1, 0]);
    });

    it(`Considers text nodes in paths`, () => {
      const strings = html`<div> ${0} <div> ${0}</div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0].path).to.deep.equal([0, 1]);
      expect(parts[1].path).to.deep.equal([0, 3, 1]);
    });

    it(`Considers comment nodes in paths`, () => {
      const strings = html`<div><!-- -->${0}<!-- --><div><!-- -->${0}</div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0].path).to.deep.equal([0, 1]);
      expect(parts[1].path).to.deep.equal([0, 3, 1]);
    });

    it(`Returns the correct path for attribute parts`, () => {
      const strings = html`<div a=${0}><div></div><div a=${0}></div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0].path).to.deep.equal([0]);
      expect(parts[1].path).to.deep.equal([0, 1]);
    });

    it(`Returns the correct path for attribute parts`, () => {
      const strings = html`<div a=${0}><div></div><div a=${0}></div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0].path).to.deep.equal([0]);
      expect(parts[1].path).to.deep.equal([0, 1]);
    });

    it(`Preserves original attribute names`, () => {
      const strings = html`
        <div 
          a=${0}
          a-b=${1}
          👍=${2}
          (a)=${3}
          [a]=${4}
          a$=${5}
          $a=${6}>
        </div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0].attribute).to.equal('a');
      expect(parts[1].attribute).to.equal('a-b');
      expect(parts[2].attribute).to.equal('👍');
      expect(parts[3].attribute).to.equal('(a)');
      expect(parts[4].attribute).to.equal('[a]');
      expect(parts[5].attribute).to.equal('a$');
      expect(parts[6].attribute).to.equal('$a');
    });

    it(`Preserves prefixes in the attribute name`, () => {
      const strings = html`
        <div 
          .a=${0}
          ?a=${1}
          @a=${2}>
        </div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0].attribute).to.equal('.a');
      expect(parts[1].attribute).to.equal('?a');
      expect(parts[2].attribute).to.equal('@a');
    });
  });
});
