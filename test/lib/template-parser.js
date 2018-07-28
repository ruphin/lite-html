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

import {
  attributeMarkerTag,
  commentMarkerTag,
  nodeMarkerTag,
  attributeContext,
  commentContext,
  nodeContext,
  unchangedContext,
  parseContext,
  parseTemplate,
  buildTemplate
} from '/src/lib/template-parser.js';
import { attributeMarker, commentMarker, nodeMarker } from '/src/lib/markers.js';

const expect = chai.expect;
const html = strings => strings;

describe('templateParser', () => {
  describe('parseContext', () => {
    it(`detects open comments`, () => {
      expect(parseContext('<!--').type).to.equal(commentContext);
    });

    it(`detects closed comments`, () => {
      expect(parseContext('<!-- -->').commentClosed).to.be.true;
      expect(parseContext('<!-->').commentClosed).to.be.true;
    });
  });

  describe('parseTemplate', () => {
    it(`inserts nodeMarkerTags`, () => {
      expect(parseTemplate(html`<div>${0}</div>`)).to.equal(`<div>${nodeMarkerTag}</div>`);
      expect(parseTemplate(html`${0}`)).to.equal(`${nodeMarkerTag}`);
      expect(parseTemplate(html`a${0}`)).to.equal(`a${nodeMarkerTag}`);
      expect(parseTemplate(html`${0}a`)).to.equal(`${nodeMarkerTag}a`);
      expect(parseTemplate(html`${0}${0}`)).to.equal(`${nodeMarkerTag}${nodeMarkerTag}`);
      expect(parseTemplate(html`a${0}${0}`)).to.equal(`a${nodeMarkerTag}${nodeMarkerTag}`);
      expect(parseTemplate(html`${0}b${0}`)).to.equal(`${nodeMarkerTag}b${nodeMarkerTag}`);
      expect(parseTemplate(html`${0}${0}c`)).to.equal(`${nodeMarkerTag}${nodeMarkerTag}c`);
      expect(parseTemplate(html`a${0}b${0}c`)).to.equal(`a${nodeMarkerTag}b${nodeMarkerTag}c`);
    });

    it(`inserts attributeMarkerTags`, () => {
      expect(parseTemplate(html`<div a=${0}>`)).to.equal(`<div a=${attributeMarkerTag}>`);
      expect(parseTemplate(html`<div a=${0}>`)).to.equal(`<div a=${attributeMarkerTag}>`);
      expect(parseTemplate(html`<div a=${0}></div>`)).to.equal(`<div a=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a=${0} b=${0}></div>`)).to.equal(`<div a=${attributeMarkerTag} b=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a="0" b=${0}></div>`)).to.equal(`<div a="0" b=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a=${0} b="0"></div>`)).to.equal(`<div a=${attributeMarkerTag} b="0"></div>`);
      expect(parseTemplate(html`<div a=${0} b="0" c=${0}></div>`)).to.equal(`<div a=${attributeMarkerTag} b="0" c=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a=${0} b></div>`)).to.equal(`<div a=${attributeMarkerTag} b></div>`);
      expect(parseTemplate(html`<div a b=${0}></div>`)).to.equal(`<div a b=${attributeMarkerTag}></div>`);
    });

    it(`raises on incorrect attribute tag usage`, () => {
      expect(() => parseTemplate(html`<div a="${0}">`)).to.throw();
      expect(() => parseTemplate(html`<div a="a${0}">`)).to.throw();
      expect(() => parseTemplate(html`<div a="${0}a">`)).to.throw();
      expect(() => parseTemplate(html`<div ${0}>`)).to.throw();
      expect(() => parseTemplate(html`<div a= ${0}>`)).to.throw();
    });

    it(`inserts commentMarkerTags`, () => {
      expect(parseTemplate(html`<!--${0}-->`)).to.equal(`<!--${commentMarkerTag}-->`);
      expect(parseTemplate(html`<div><!--${0}--></div>`)).to.equal(`<div><!--${commentMarkerTag}--></div>`);
      expect(parseTemplate(html`<div><!--${0}-->`)).to.equal(`<div><!--${commentMarkerTag}-->`);
      expect(parseTemplate(html`a<!--${0}-->`)).to.equal(`a<!--${commentMarkerTag}-->`);
      expect(parseTemplate(html`<!--a${0}-->`)).to.equal(`<!--a${commentMarkerTag}-->`);
      expect(parseTemplate(html`<!--${0}a-->`)).to.equal(`<!--${commentMarkerTag}a-->`);
      expect(parseTemplate(html`<!--a${0}b-->`)).to.equal(`<!--a${commentMarkerTag}b-->`);
    });

    it('inserts correct tags in different part type sequences', () => {
      expect(parseTemplate(html`<div a=${0} b=${0}>${0}${0}<!--${0}${0}--></div>`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}${nodeMarkerTag}<!--${commentMarkerTag}${commentMarkerTag}--></div>`
      );
      expect(parseTemplate(html`<div a=${0} b=${0}>${0}${0}</div><!--${0}${0}-->`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}${nodeMarkerTag}</div><!--${commentMarkerTag}${commentMarkerTag}-->`
      );
      expect(parseTemplate(html`<div a=${0} b=${0}>${0}</div>${0}<!--${0}${0}-->`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}</div>${nodeMarkerTag}<!--${commentMarkerTag}${commentMarkerTag}-->`
      );
      expect(parseTemplate(html`<div a=${0} b=${0}>${0}</div><!--${0}${0}-->${0}`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}</div><!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<div a=${0} b=${0}></div><!--${0}${0}-->${0}${0}`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}></div><!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<!--${0}${0}--><div a=${0} b=${0}>${0}${0}</div>`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}--><div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}${nodeMarkerTag}</div>`
      );
      expect(parseTemplate(html`<!--${0}${0}--><div a=${0} b=${0}>${0}</div>${0}`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}--><div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}</div>${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<!--${0}${0}-->${0}<div a=${0} b=${0}>${0}</div>`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}</div>`
      );
      expect(parseTemplate(html`<!--${0}${0}--><div a=${0} b=${0}></div>${0}${0}`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}--><div a=${attributeMarkerTag} b=${attributeMarkerTag}></div>${nodeMarkerTag}${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<!--${0}${0}-->${0}${0}<div a=${0} b=${0}></div>`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}></div>`
      );
      expect(parseTemplate(html`${0}${0}<div a=${0} b=${0}><!--${0}${0}--></div>`)).to.equal(
        `${nodeMarkerTag}${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}><!--${commentMarkerTag}${commentMarkerTag}--></div>`
      );
      expect(parseTemplate(html`${0}${0}<div a=${0} b=${0}></div><!--${0}${0}-->`)).to.equal(
        `${nodeMarkerTag}${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}></div><!--${commentMarkerTag}${commentMarkerTag}-->`
      );
      expect(parseTemplate(html`${0}<div a=${0} b=${0}>${0}<!--${0}${0}--></div>`)).to.equal(
        `${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}<!--${commentMarkerTag}${commentMarkerTag}--></div>`
      );
      expect(parseTemplate(html`${0}<div a=${0} b=${0}><!--${0}${0}-->${0}</div>`)).to.equal(
        `${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}><!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}</div>`
      );
      expect(parseTemplate(html`${0}<div a=${0} b=${0}><!--${0}${0}--></div>${0}`)).to.equal(
        `${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}><!--${commentMarkerTag}${commentMarkerTag}--></div>${nodeMarkerTag}`
      );
    });
  });

  describe('buildTemplate', () => {
    it(`injects a commentNode for node parts`, () => {
      expect(buildTemplate(html`${0}`).content.firstChild.nodeType).to.equal(8);
      expect(buildTemplate(html`${0}`).content.firstChild.textContent).to.equal(nodeMarker);
      expect(buildTemplate(html`<div>${0}</div>`).content.firstChild.firstChild.nodeType).to.equal(8);
      expect(buildTemplate(html`<div>${0}</div>`).content.firstChild.firstChild.textContent).to.equal(nodeMarker);
    });

    it(`injects a commentNode in between comment strings`, () => {
      expect(buildTemplate(html`<!--${0}-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!-- ${0} -->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--${0}-->`).content.childNodes[1].textContent).to.equal(commentMarker);
    });

    it(`does not create extra empty text nodes`, () => {
      expect(buildTemplate(html`<div>${0}</div>`).content.childNodes[0].childNodes.length).to.equal(1);
      expect(buildTemplate(html`${0}`).content.childNodes.length).to.equal(1);
      expect(buildTemplate(html`a${0}`).content.childNodes.length).to.equal(2);
      expect(buildTemplate(html`${0}a`).content.childNodes.length).to.equal(2);
      expect(buildTemplate(html`${0}${0}`).content.childNodes.length).to.equal(2);
      expect(buildTemplate(html`a${0}${0}`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`${0}b${0}`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`${0}${0}c`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`a${0}b${0}c`).content.childNodes.length).to.equal(5);
    });

    it(`does not break on comment-like comment content`, () => {
      expect(buildTemplate(html`<!--${0}>-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--${0}->-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--<${0}-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--<!${0}-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--<!-${0}-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--<!--${0}-->`).content.childNodes.length).to.equal(3);
    });
  });
});
