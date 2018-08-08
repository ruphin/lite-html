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

import { isSerializable, isArray, AttributePart, CommentPart, NodePart } from '../../src/lib/parts.js';
import { TemplateResult } from '../../src/lib/templates.js';

const html = (strings, ...values) => new TemplateResult(strings, values);

const expect = chai.expect;

describe('parts', () => {
  describe('isSerializable', () => {
    it('should return a truthy value for strings, numbers, and booleans', () => {
      expect(!!isSerializable('')).to.be.true;
      expect(!!isSerializable(0)).to.be.true;
      expect(!!isSerializable(true)).to.be.true;
    });

    it('should return a falsy value for other things', () => {
      expect(!!isSerializable(null)).to.be.false;
      expect(!!isSerializable(undefined)).to.be.false;
      expect(!!isSerializable(Symbol())).to.be.false;
      expect(!!isSerializable({})).to.be.false;
      expect(!!isSerializable([])).to.be.false;
      expect(!!isSerializable(html``)).to.be.false;
      expect(!!isSerializable(function() {})).to.be.false;
      expect(!!isSerializable(() => {})).to.be.false;
    });
  });

  describe('isArray', () => {
    it('should return a truthy value for array-like non-primitives', () => {
      expect(!!isArray([])).to.be.true;
      expect(!!isArray(new Map())).to.be.true;
      expect(!!isArray(new Set())).to.be.true;
      expect(!!isArray(new Int8Array(0))).to.be.true;
    });

    it('should return a falsy value for non-array-like non-primitives', () => {
      expect(!!isArray({})).to.be.false;
      expect(!!isArray(html``)).to.be.false;
      expect(!!isArray(function() {})).to.be.false;
      expect(!!isArray(() => {})).to.be.false;
      expect(!!isArray(Symbol())).to.be.false;
    });
  });

  describe('AttributePart', () => {
    it('remembers the node it belongs to', () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '' });
      expect(part.node === node).to.be.true;
    });

    it('remembers the attribute name', () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: 'a' });
      expect(part.name).to.equal('a');
    });

    it(`detects '.' '?' and '@' prefixes and sets the name correctly`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '.a' });
      expect(part.name).to.equal('a');
      part = new AttributePart({ node, attribute: '?a' });
      expect(part.name).to.equal('a');
      part = new AttributePart({ node, attribute: '@a' });
      expect(part.name).to.equal('a');
    });

    it(`uses the correct render function`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: 'a' });
      expect(part.render === part._renderAttribute).to.be.true;
      part = new AttributePart({ node, attribute: '.a' });
      expect(part.render === part._renderProperty).to.be.true;
      part = new AttributePart({ node, attribute: '?a' });
      expect(part.render === part._renderBoolean).to.be.true;
      part = new AttributePart({ node, attribute: '@a' });
      expect(part.render === part._renderEvent).to.be.true;
    });

    it(`renders attributes`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: 'a' });
      part.render('one');
      expect(node.getAttribute('a')).to.equal('one');
      part.render('two');
      expect(node.getAttribute('a')).to.equal('two');
    });

    it(`renders properties`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '.a' });
      part.render('one');
      expect(node.a).to.equal('one');
      part.render('two');
      expect(node.a).to.equal('two');
    });

    it(`renders booleans`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '?a' });
      part.render(true);
      expect(node.hasAttribute('a')).to.be.true;
      part.render(false);
      expect(node.hasAttribute('a')).to.be.false;
    });

    it(`renders event handlers`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '@click' });
      let counterOne = 0;
      const handlerOne = () => {
        counterOne += 1;
      };
      let counterTwo = 0;
      const handlerTwo = () => {
        counterTwo += 1;
      };
      part.render(handlerOne);
      expect(counterOne).to.equal(0);
      node.click();
      expect(counterOne).to.equal(1);

      part.render(handlerTwo);
      expect(counterTwo).to.equal(0);
      node.click();
      expect(counterTwo).to.equal(1);
    });

    it(`clears old event handlers`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '@click' });
      let counter = 0;
      const handler = () => {
        counter += 1;
      };
      part.render(handler);
      node.click();
      expect(counter).to.equal(1);
      part.render(() => {});
      node.click();
      expect(counter).to.equal(1);
    });

    it(`does not remove other event handlers`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '@click' });
      let counter = 0;
      const handler = () => {
        counter += 1;
      };
      let otherCounter = 0;
      const otherHandler = () => {
        otherCounter += 1;
      };
      node.addEventListener('click', otherHandler);
      part.render(handler);
      expect(counter).to.equal(0);
      expect(otherCounter).to.equal(0);
      node.click();
      expect(counter).to.equal(1);
      expect(otherCounter).to.equal(1);
      part.render(() => {});
      node.click();
      expect(counter).to.equal(1);
      expect(otherCounter).to.equal(2);
    });
  });

  describe('CommentPart', () => {
    it(`remembers the node it belongs to`, () => {
      const node = document.createComment('test');
      let part = new CommentPart({ node, attribute: '' });
      expect(part.node === node).to.be.true;
    });

    it(`renders comments`, () => {
      const node = document.createComment('test');
      let part = new CommentPart({ node, attribute: '' });
      expect(node.textContent).to.equal('test');
      part.render('one');
      expect(node.textContent).to.equal('one');
      part.render('two');
      expect(node.textContent).to.equal('two');
    });
  });

  describe('NodePart', () => {
    let setupNodes = () => {
      const parent = document.createElement('div');
      const node = document.createComment('marker');
      const before = document.createElement('span');
      const after = document.createElement('span');
      parent.appendChild(before);
      parent.appendChild(node);
      parent.appendChild(after);
      return { node, parent, before, after };
    };

    it(`remembers what node it represents`, () => {
      const { node } = setupNodes();
      const part = new NodePart({ node });
      expect(part.node === node).to.be.true;
    });

    it(`knows what the parent node is`, () => {
      const { node, parent } = setupNodes();
      let part = new NodePart({ parent });
      expect(part.parentNode === parent).to.be.true;
      part = new NodePart({ node });
      expect(part.parentNode === parent).to.be.true;
    });

    describe('_renderText', () => {
      it(`renders strings`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part._renderText('string');
        expect(parent.outerHTML).to.equal('<div><span></span>string<span></span></div>');
      });
      it(`renders numbers as strings`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part._renderText(2);
        expect(parent.outerHTML).to.equal('<div><span></span>2<span></span></div>');
      });
      it(`renders booleans as strings`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part._renderText(true);
        expect(parent.outerHTML).to.equal('<div><span></span>true<span></span></div>');
      });
    });

    // it(`test`, () => {
    //   const { node, parent } = setupNodes();
    //   let part = new NodePart({ parent });
    //   expect(part.parentNode === parent).to.be.true;
    //   part = new NodePart({ node });
    //   expect(part.parentNode === parent).to.be.true;
    // });
  });
});
