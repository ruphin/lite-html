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

import { noChange, isSerializable, isIterable, AttributePart, CommentPart, NodePart } from '../../src/lib/parts.js';
import { TemplateResult } from '../../src/lib/templates.js';
import { when } from '../../src/directives/when.js';

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

  describe('isIterable', () => {
    it('should return a truthy value for array-like non-primitives', () => {
      expect(!!isIterable([])).to.be.true;
      expect(!!isIterable(new Map())).to.be.true;
      expect(!!isIterable(new Set())).to.be.true;
      expect(!!isIterable(new Int8Array(0))).to.be.true;
    });

    it('should return a falsy value for non-array-like non-primitives', () => {
      expect(!!isIterable({})).to.be.false;
      expect(!!isIterable(html``)).to.be.false;
      expect(!!isIterable(function() {})).to.be.false;
      expect(!!isIterable(() => {})).to.be.false;
      expect(!!isIterable(Symbol())).to.be.false;
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
      expect(part._render === part._renderAttribute).to.be.true;
      part = new AttributePart({ node, attribute: '.a' });
      expect(part._render === part._renderProperty).to.be.true;
      part = new AttributePart({ node, attribute: '?a' });
      expect(part._render === part._renderBoolean).to.be.true;
      part = new AttributePart({ node, attribute: '@a' });
      expect(part._render === part._renderEvent).to.be.true;
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

    it(`renders directives`, () => {
      const node = document.createElement('div');
      const part = new AttributePart({ node, attribute: 'a' });
      part.render(when(true, 'true', 'false'));
      expect(node.getAttribute('a')).to.equal('true');
      part.render(when(false, 'true', 'false'));
      expect(node.getAttribute('a')).to.equal('false');
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
      const part = new NodePart({ node });
      expect(part.parentNode === parent).to.be.true;
    });

    describe('render', () => {
      it(`renders directives`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part.render(when(true, 'true', 'false'));
        expect(parent.outerHTML).to.equal('<div><span></span>true<span></span></div>');
        part.render(when(false, 'true', 'false'));
        expect(parent.outerHTML).to.equal('<div><span></span>false<span></span></div>');
      });

      it(`does nothing when rendering 'noChange'`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part.render('test');
        expect(parent.outerHTML).to.equal('<div><span></span>test<span></span></div>');
        part.render(noChange);
        expect(parent.outerHTML).to.equal('<div><span></span>test<span></span></div>');
      });

      it(`resists XSS attacks`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part.render('<script>alert(true)</script>');
        expect(parent.outerHTML).to.equal('<div><span></span>&lt;script&gt;alert(true)&lt;/script&gt;<span></span></div>');
      });

      it(`does not render HTML-like strings as HTML`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part.render('<div><span></span></div>');
        expect(parent.outerHTML).to.equal('<div><span></span>&lt;div&gt;&lt;span&gt;&lt;/span&gt;&lt;/div&gt;<span></span></div>');
      });
    });

    describe('clear', () => {
      it(`removes nodes that this NodePart represents from the DOM`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part.clear();
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
        }
      });

      it(`moves nodes back into the DocumentFragment when clearing after rendering a TemplateResult`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = html`<ul><li></li></ul>`;
          part._renderTemplateResult(templateResult);
          const templateInstance = part.templateInstances.get(templateResult.template());
          expect(fragmentString(templateInstance.fragment)).to.equal('');
          expect(parent.outerHTML).to.equal('<div><span></span><ul><li></li></ul><span></span></div>');
          part.clear();
          expect(fragmentString(templateInstance.fragment)).to.equal('<ul><li></li></ul>');
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');
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
      });

      it(`renders an array of different value types`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', html`<div></div>`, document.createElement('i')];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>hello<div></div><i></i><span></span></div>');
        }
      });

      it(`renders nested arrays`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = [1, [2, 3], 4, 5];
          part._renderIterable(array);
          expect(parent.outerHTML).to.equal('<div><span></span>12345<span></span></div>');
        }
      });

      it(`correctly handles changes in templates between renders`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = [1, 2, 3];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(parent.outerHTML).to.equal('<div><span></span><p>1</p><p>2</p><p>3</p><span></span></div>');
          part._renderIterable(array.map(i => html`<i>${i}</i>`));
          expect(parent.outerHTML).to.equal('<div><span></span><i>1</i><i>2</i><i>3</i><span></span></div>');
        }
      });

      it(`correctly renders empty arrays`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          let array = [1, 2, 3];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(parent.outerHTML).to.equal('<div><span></span><p>1</p><p>2</p><p>3</p><span></span></div>');

          array = [];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(parent.outerHTML).to.equal('<div><span></span><span></span></div>');

          array = [4, 5, 6];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(parent.outerHTML).to.equal('<div><span></span><p>4</p><p>5</p><p>6</p><span></span></div>');
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
      });
    });

    describe('_renderPromise', () => {
      it(`does nothing until the promise resolves`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const promise = new Promise(() => {});
          part._renderPromise(promise);
          expect(parent.outerHTML).to.equal('<div><span></span><!--marker--><span></span></div>');
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
      });

      it(`renders the promise result once it resolves`, async () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const promise = new Promise(function(resolve) {
            setTimeout(() => resolve('string'), 10);
          });
          part._renderPromise(promise);
          expect(parent.outerHTML).to.equal('<div><span></span><!--marker--><span></span></div>');
          await promise;
          expect(parent.outerHTML).to.equal('<div><span></span>string<span></span></div>');
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
          expect(parent.outerHTML).to.equal('<div><span></span><!--marker--><span></span></div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div><span></span><!--marker--><span></span></div>');
          await secondPromise;
          expect(parent.outerHTML).to.equal('<div><span></span>good<span></span></div>');
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
          part.render('good');
          expect(parent.outerHTML).to.equal('<div><span></span>good<span></span></div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div><span></span>good<span></span></div>');
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
          part.render('intermediate');
          part._renderPromise(secondPromise);
          expect(parent.outerHTML).to.equal('<div><span></span>intermediate<span></span></div>');
          await firstPromise;
          expect(parent.outerHTML).to.equal('<div><span></span>intermediate<span></span></div>');
          await secondPromise;
          expect(parent.outerHTML).to.equal('<div><span></span>good<span></span></div>');
        }
      });

      it(`does not cause additional renders when re-rendering the same promise`, async () => {
        {
          const { node } = setupNodes();
          const part = new NodePart({ node });
          const promise = Promise.resolve('result');
          let renderCount = 0;
          let previousValue;
          let sameValue = false;
          part.render = value => {
            renderCount++;
            sameValue = value === previousValue;
            previousValue = value;
          };
          part._renderPromise(promise);
          part._renderPromise(promise);
          expect(renderCount).to.equal(0);
          expect(sameValue).to.be.false;
          await promise;
          expect(renderCount).to.equal(1);
          expect(sameValue).to.be.false;
          part._renderPromise(promise);
          part._renderPromise(promise);
          expect(renderCount).to.equal(1);
          await promise;
          expect(renderCount).to.equal(2);
          expect(sameValue).to.be.true;
          part._renderPromise(promise);
          part._renderPromise(promise);
          expect(renderCount).to.equal(2);
          await promise;
          expect(renderCount).to.equal(3);
          expect(sameValue).to.be.true;
        }
      });
    });

    describe('_renderTemplateResult', () => {
      it(`renders a template`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = html`<p></p>`;
          part._renderTemplateResult(templateResult);
          expect(parent.outerHTML).to.equal('<div><span></span><p></p><span></span></div>');
        }
      });

      it(`renders the values inside templates`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = value => html`<p>${value}</p>`;
          part._renderTemplateResult(templateResult(1));
          expect(parent.outerHTML).to.equal('<div><span></span><p>1</p><span></span></div>');
        }
      });

      it(`renders nested templates`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = value => html`<p>${value}</p>`;
          part._renderTemplateResult(templateResult(html`<i>${1}</i>`));
          expect(parent.outerHTML).to.equal('<div><span></span><p><i>1</i></p><span></span></div>');
        }
      });

      it(`renders nested templates in the root of the template`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = value => html`${value}`;
          part._renderTemplateResult(templateResult(html`<i>${1}</i>`));
          expect(parent.outerHTML).to.equal('<div><span></span><i>1</i><span></span></div>');
        }
      });

      it(`can render the same template in different parts`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = value => html`${value}`;
          const templatePartial = value => html`<i>${value}</i>`;
          part._renderTemplateResult(templateResult(templatePartial(1)));
          expect(parent.outerHTML).to.equal('<div><span></span><i>1</i><span></span></div>');
          part._renderTemplateResult(templateResult(templatePartial(2)));
          expect(parent.outerHTML).to.equal('<div><span></span><i>2</i><span></span></div>');
          const thing = setupNodes();
          const newPart = new NodePart({ node: thing.node });
          newPart._renderTemplateResult(templateResult(templatePartial(1)));
          expect(parent.outerHTML).to.equal('<div><span></span><i>2</i><span></span></div>');
          expect(thing.parent.outerHTML).to.equal('<div><span></span><i>1</i><span></span></div>');
        }
      });

      it(`can alternate between templates`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const one = html`<p></p>`;
          const two = html`<i></i>`;
          part._renderTemplateResult(one);
          expect(parent.outerHTML).to.equal('<div><span></span><p></p><span></span></div>');
          part._renderTemplateResult(two);
          expect(parent.outerHTML).to.equal('<div><span></span><i></i><span></span></div>');
          part._renderTemplateResult(one);
          expect(parent.outerHTML).to.equal('<div><span></span><p></p><span></span></div>');
          part._renderTemplateResult(two);
          expect(parent.outerHTML).to.equal('<div><span></span><i></i><span></span></div>');
        }
      });

      it(`caches the template instances`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const one = html`<p></p>`;
          const two = html`<i></i>`;
          part._renderTemplateResult(one);
          parent.querySelector('p').id = 'a';
          expect(parent.outerHTML).to.equal('<div><span></span><p id="a"></p><span></span></div>');
          part._renderTemplateResult(two);
          parent.querySelector('i').id = 'b';
          expect(parent.outerHTML).to.equal('<div><span></span><i id="b"></i><span></span></div>');
          part._renderTemplateResult(one);
          expect(parent.outerHTML).to.equal('<div><span></span><p id="a"></p><span></span></div>');
          part._renderTemplateResult(two);
          expect(parent.outerHTML).to.equal('<div><span></span><i id="b"></i><span></span></div>');
        }
      });

      it(`re-uses the template instances but replaces the values`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const one = value => html`<p>${value}</p>`;
          const two = value => html`<i>${value}</i>`;
          part._renderTemplateResult(one(1));
          parent.querySelector('p').id = 'a';
          expect(parent.outerHTML).to.equal('<div><span></span><p id="a">1</p><span></span></div>');
          part._renderTemplateResult(two(2));
          parent.querySelector('i').id = 'b';
          expect(parent.outerHTML).to.equal('<div><span></span><i id="b">2</i><span></span></div>');
          part._renderTemplateResult(one(3));
          expect(parent.outerHTML).to.equal('<div><span></span><p id="a">3</p><span></span></div>');
          part._renderTemplateResult(two(4));
          expect(parent.outerHTML).to.equal('<div><span></span><i id="b">4</i><span></span></div>');
        }
      });
    });
  });
});
