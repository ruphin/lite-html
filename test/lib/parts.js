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
const fragmentString = documentFragment => [].map.call(documentFragment.childNodes, node => node.outerHTML).join('');

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

    describe('clear', () => {
      it(`removes nodes that this NodePart represents from the DOM`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part.clear();
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          part.clear();
          expect(parent.outerHTML).to.equal('<div></div>');
        }
      });

      it(`moves nodes back into the DocumentFragment when clearing after rendering a TemplateResult`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = html`<ul><li></li></ul>`;
          part.render(templateResult);

          const templateInstance = part.templateInstances.get(templateResult.template);
          expect(fragmentString(templateInstance.fragment)).to.equal('');
          expect(parent.outerHTML).to.equal('<div><span></span><ul><li></li></ul><span></span></div>');
          part.clear();
          expect(fragmentString(templateInstance.fragment)).to.equal('<ul><li></li></ul>');
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const templateResult = html`<ul><li></li></ul>`;
          part.render(templateResult);

          const templateInstance = part.templateInstances.get(templateResult.template);
          expect(fragmentString(templateInstance.fragment)).to.equal('');
          expect(parent.outerHTML).to.equal('<div><ul><li></li></ul></div>');
          part.clear();
          expect(fragmentString(templateInstance.fragment)).to.equal('<ul><li></li></ul>');
          expect(parent.outerHTML).to.equal('<div></div>');
        }
      });
    });

    describe('_renderText', () => {
      it(`renders strings`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part._renderText('one');
          expect(parent.outerHTML).to.equal('<div><span></span>one<span></span></div>');
          part._renderText('two');
          expect(parent.outerHTML).to.equal('<div><span></span>two<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          part._renderText('one');
          expect(parent.outerHTML).to.equal('<div>one</div>');
          part._renderText('two');
          expect(parent.outerHTML).to.equal('<div>two</div>');
        }
      });

      it(`renders numbers as strings`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part._renderText(1);
          expect(parent.outerHTML).to.equal('<div><span></span>1<span></span></div>');
          part._renderText(2);
          expect(parent.outerHTML).to.equal('<div><span></span>2<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          part._renderText(1);
          expect(parent.outerHTML).to.equal('<div>1</div>');
          part._renderText(2);
          expect(parent.outerHTML).to.equal('<div>2</div>');
        }
      });

      it(`renders booleans as strings in the node`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part._renderText(true);
          expect(parent.outerHTML).to.equal('<div><span></span>true<span></span></div>');
          part._renderText(false);
          expect(parent.outerHTML).to.equal('<div><span></span>false<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          part._renderText(true);
          expect(parent.outerHTML).to.equal('<div>true</div>');
          part._renderText(false);
          expect(parent.outerHTML).to.equal('<div>false</div>');
        }
      });

      it(`renders different types in succession`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part._renderText('string');
        expect(parent.outerHTML).to.equal('<div><span></span>string<span></span></div>');
        part._renderText(1);
        expect(parent.outerHTML).to.equal('<div><span></span>1<span></span></div>');
        part._renderText(true);
        expect(parent.outerHTML).to.equal('<div><span></span>true<span></span></div>');
      });
    });

    describe('_renderNode', () => {
      it(`renders a node`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const nodeOne = document.createElement('div');
          nodeOne.setAttribute('node', 1);
          part._renderNode(nodeOne);
          expect(parent.outerHTML).to.equal('<div><span></span><div node="1"></div><span></span></div>');
          const nodeTwo = document.createElement('div');
          nodeTwo.setAttribute('node', 2);
          part._renderNode(nodeTwo);
          expect(parent.outerHTML).to.equal('<div><span></span><div node="2"></div><span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const nodeOne = document.createElement('div');
          nodeOne.setAttribute('node', 1);
          part._renderNode(nodeOne);
          expect(parent.outerHTML).to.equal('<div><div node="1"></div></div>');
          const nodeTwo = document.createElement('div');
          nodeTwo.setAttribute('node', 2);
          part._renderNode(nodeTwo);
          expect(parent.outerHTML).to.equal('<div><div node="2"></div></div>');
        }
      });
    });

    describe('_renderIterable', () => {
      it(`renders an array of primitives`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>hello1true<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div>hello1true</div>');
        }
      });

      it(`renders an array of different value types`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', html`<div></div>`, document.createElement('i')];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>hello<div></div><i></i><span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const array = ['hello', html`<div></div>`, document.createElement('i')];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div>hello<div></div><i></i></div>');
        }
      });

      it(`renders additions to the array in subsequent renders`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', 1];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>hello1<span></span></div>');
          array.unshift(true);
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>truehello1<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const array = ['hello', 1];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div>hello1</div>');
          array.unshift(true);
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div>truehello1</div>');
        }
      });

      it(`removes elements when the array shrinks`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>hello1true<span></span></div>');
          array.pop();
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>hello1<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div>hello1true</div>');
          array.pop();
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div>hello1</div>');
        }
      });

      it(`does not break when rendering another thing in between arrays`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>hello1true<span></span></div>');
          part._renderText('string');
          expect(parent.outerHTML).to.equal('<div><span></span>string<span></span></div>');
          part._renderIterable([1, 2, 3, 4, 5]);
          expect(parent.outerHTML).to.equal('<div><span></span>12345<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div>hello1true</div>');
          part._renderText('string');
          expect(parent.outerHTML).to.equal('<div>string</div>');
          part._renderIterable([1, 2]);
          expect(parent.outerHTML).to.equal('<div>12</div>');
        }
      });
    });

    describe('_renderPromise', () => {
      it(`does nothing until the promise resolves`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const promise = new Promise(() => {});
          part._renderPromise(promise);
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const promise = new Promise(() => {});
          part._renderPromise(promise);
          expect(parent.outerHTML).to.equal('<div></div>');
        }
      });

      it(`renders a promise that is already resolved`, async () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const promise = Promise.resolve('string');
          part._renderPromise(promise);
          await promise;
          expect(parent.outerHTML).to.equal('<div><span></span>string<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const promise = Promise.resolve('string');
          part._renderPromise(promise);
          await promise;
          expect(parent.outerHTML).to.equal('<div>string</div>');
        }
      });

      it(`renders the promise result once it resolves`, async () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const promise = new Promise(function(resolve) {
            setTimeout(() => resolve('string'), 10);
          });
          part._renderPromise(promise);
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
          await promise;
          expect(parent.outerHTML).to.equal('<div><span></span>string<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const promise = new Promise(function(resolve) {
            setTimeout(() => resolve('string'), 10);
          });
          part._renderPromise(promise);
          expect(parent.outerHTML).to.equal('<div></div>');
          await promise;
          expect(parent.outerHTML).to.equal('<div>string</div>');
        }
      });

      it(`only renders the last promise`, async () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const firstPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('bad'), 10);
          });
          const secondPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('good'), 20);
          });
          part._renderPromise(firstPromise);
          part._renderPromise(secondPromise);
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
          await secondPromise;
          expect(parent.outerHTML).to.equal('<div><span></span>good<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const firstPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('bad'), 10);
          });
          const secondPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('good'), 20);
          });
          part._renderPromise(firstPromise);
          part._renderPromise(secondPromise);
          expect(parent.outerHTML).to.equal('<div></div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div></div>');
          await secondPromise;
          expect(parent.outerHTML).to.equal('<div>good</div>');
        }
      });

      it(`does not override values rendered after the promise`, async () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const firstPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('bad'), 10);
          });
          part._renderPromise(firstPromise);
          part._renderText('good');
          expect(parent.outerHTML).to.equal('<div><span></span>good<span></span></div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div><span></span>good<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const firstPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('bad'), 10);
          });
          part._renderPromise(firstPromise);
          part._renderText('good');
          expect(parent.outerHTML).to.equal('<div>good</div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div>good</div>');
        }
      });

      it(`works when rendering another thing in between promises`, async () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const firstPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('bad'), 10);
          });
          const secondPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('good'), 20);
          });
          part._renderPromise(firstPromise);
          part._renderText('notgood');
          part._renderPromise(secondPromise);
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
          await secondPromise;
          expect(parent.outerHTML).to.equal('<div><span></span>good<span></span></div>');
        }
        {
          const { parent } = setupNodes();
          const part = new NodePart({ parent });
          const firstPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('bad'), 10);
          });
          const secondPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('good'), 20);
          });
          part._renderPromise(firstPromise);
          part._renderText('notgood');
          part._renderPromise(secondPromise);
          expect(parent.outerHTML).to.equal('<div></div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div></div>');
          await secondPromise;
          expect(parent.outerHTML).to.equal('<div>good</div>');
        }
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
