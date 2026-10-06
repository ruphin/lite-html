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

import { noChange, isSerializable, isIterable, AttributePart, CommentPart, NodePart } from '../../src/lib/parts.js';
import { TemplateResult } from '../../src/lib/templates.js';
import { when } from '../../src/directives/when.js';
import { directive } from '../../src/lib/directive.js';
import { outerHTML } from '../helpers.js';

const html = (strings, ...values) => new TemplateResult(strings, values);
const fragmentString = documentFragment => [].map.call(documentFragment.childNodes, node => node.outerHTML).join('');

import { describe, it, expect } from 'vitest';

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

    it(`sets the type and uses the correct render function`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: 'a' });
      expect(part.type).to.equal('attribute');
      expect(part._render === part._renderAttribute).to.be.true;
      part = new AttributePart({ node, attribute: '.a' });
      expect(part.type).to.equal('property');
      expect(part._render === part._renderProperty).to.be.true;
      part = new AttributePart({ node, attribute: '?a' });
      expect(part.type).to.equal('boolean');
      expect(part._render === part._renderBoolean).to.be.true;
      part = new AttributePart({ node, attribute: '@a' });
      expect(part.type).to.equal('event');
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

    it(`renders null and undefined attributes as an empty string`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: 'a' });
      part.render(undefined);
      expect(node.getAttribute('a')).to.equal('');
      part.render('one');
      part.render(null);
      expect(node.getAttribute('a')).to.equal('');
    });

    it(`does not render attributes when the first value is 'noChange'`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: 'a' });
      part.render(noChange);
      expect(node.hasAttribute('a')).to.be.false;
    });

    it(`calls event handlers with the node as 'this'`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '@click' });
      let context;
      part.render(function() {
        context = this;
      });
      node.click();
      expect(context === node).to.be.true;
    });

    it(`renders objects with a 'handleEvent' method as event handlers`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '@click' });
      let counter = 0;
      part.render({ handleEvent: () => counter++ });
      node.click();
      expect(counter).to.equal(1);
    });

    it(`does nothing when an event fires without an event handler`, () => {
      const node = document.createElement('div');
      let part = new AttributePart({ node, attribute: '@click' });
      part.render(undefined);
      expect(() => node.click()).to.not.throw();
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

    // A NodePart that represents all content of its parent, like the part that `render` creates
    let setupRoot = () => {
      const parent = document.createElement('div');
      const node = document.createComment('');
      parent.appendChild(node);
      return { node, parent };
    };

    it(`remembers the marker node that its content starts after`, () => {
      const { node, after } = setupNodes();
      const part = new NodePart({ node });
      expect(part.beforeNode === node).to.be.true;
      expect(part.afterNode === after).to.be.true;
    });

    it(`finds the parent node again when the marker node moves`, () => {
      const { node } = setupNodes();
      const part = new NodePart({ node });
      const newParent = document.createElement('div');
      newParent.appendChild(node);
      expect(part.parentNode === newParent).to.be.true;
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
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->true<span></span></div>');
        part.render(when(false, 'true', 'false'));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->false<span></span></div>');
      });

      it(`does nothing when rendering 'noChange'`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part.render('test');
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->test<span></span></div>');
        part.render(noChange);
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->test<span></span></div>');
      });

      it(`does not change a TextNode that was rendered as a node`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        const text = document.createTextNode('node');
        part.render(text);
        part.render('string');
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->string<span></span></div>');
        expect(text.data).to.equal('node');
      });

      it(`re-uses the TextNode when rendering strings in succession`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part.render('one');
        const text = node.nextSibling;
        part.render('two');
        expect(node.nextSibling === text).to.be.true;
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->two<span></span></div>');
      });

      it(`renders objects with a 'then' property that are not promises as strings`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part.render({ then: true });
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->[object Object]<span></span></div>');
      });

      it(`resists XSS attacks`, () => {
        const { node, parent } = setupRoot();
        const part = new NodePart({ node });
        part.render('<script>alert(true)</script>');
        expect(outerHTML(parent)).to.equal('<div>&lt;script&gt;alert(true)&lt;/script&gt;</div>');
      });

      it(`does not render HTML-like strings as HTML`, () => {
        const { node, parent } = setupRoot();
        const part = new NodePart({ node });
        part.render('<div><span></span></div>');
        expect(outerHTML(parent)).to.equal('<div>&lt;div&gt;&lt;span&gt;&lt;/span&gt;&lt;/div&gt;</div>');
      });
    });

    describe('clear', () => {
      it(`removes nodes that this NodePart represents from the DOM`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part.clear();
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          part.clear();
          expect(outerHTML(parent)).to.equal('<div></div>');
        }
      });

      it(`moves nodes back into the DocumentFragment when clearing after rendering a TemplateResult`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = html`<ul><li></li></ul>`;
          part._renderTemplateResult(templateResult);

          const templateInstance = part.instance;
          expect(fragmentString(templateInstance.fragment)).to.equal('');
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><ul><li></li></ul><span></span></div>');
          part.clear();
          expect(fragmentString(templateInstance.fragment)).to.equal('<ul><li></li></ul>');
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const templateResult = html`<ul><li></li></ul>`;
          part._renderTemplateResult(templateResult);

          const templateInstance = part.instance;
          expect(fragmentString(templateInstance.fragment)).to.equal('');
          expect(outerHTML(parent)).to.equal('<div><ul><li></li></ul></div>');
          part.clear();
          expect(fragmentString(templateInstance.fragment)).to.equal('<ul><li></li></ul>');
          expect(outerHTML(parent)).to.equal('<div></div>');
        }
      });
    });

    describe('_renderText', () => {
      it(`renders strings`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part._renderText('one');
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->one<span></span></div>');
          part._renderText('two');
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->two<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          part._renderText('one');
          expect(outerHTML(parent)).to.equal('<div>one</div>');
          part._renderText('two');
          expect(outerHTML(parent)).to.equal('<div>two</div>');
        }
      });

      it(`renders numbers as strings`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part._renderText(1);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->1<span></span></div>');
          part._renderText(2);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->2<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          part._renderText(1);
          expect(outerHTML(parent)).to.equal('<div>1</div>');
          part._renderText(2);
          expect(outerHTML(parent)).to.equal('<div>2</div>');
        }
      });

      it(`renders booleans as strings in the node`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          part._renderText(true);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->true<span></span></div>');
          part._renderText(false);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->false<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          part._renderText(true);
          expect(outerHTML(parent)).to.equal('<div>true</div>');
          part._renderText(false);
          expect(outerHTML(parent)).to.equal('<div>false</div>');
        }
      });

      it(`renders different types in succession`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        part._renderText('string');
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->string<span></span></div>');
        part._renderText(1);
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->1<span></span></div>');
        part._renderText(true);
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->true<span></span></div>');
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
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><div node="1"></div><span></span></div>');
          const nodeTwo = document.createElement('div');
          nodeTwo.setAttribute('node', 2);
          part._renderNode(nodeTwo);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><div node="2"></div><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const nodeOne = document.createElement('div');
          nodeOne.setAttribute('node', 1);
          part._renderNode(nodeOne);
          expect(outerHTML(parent)).to.equal('<div><div node="1"></div></div>');
          const nodeTwo = document.createElement('div');
          nodeTwo.setAttribute('node', 2);
          part._renderNode(nodeTwo);
          expect(outerHTML(parent)).to.equal('<div><div node="2"></div></div>');
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
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->hello1true<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div>hello1true</div>');
        }
      });

      it(`renders an array of different value types`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', html`<div></div>`, document.createElement('i')];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->hello<div></div><i></i><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const array = ['hello', html`<div></div>`, document.createElement('i')];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div>hello<div></div><i></i></div>');
        }
      });

      it(`renders nested arrays`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = [1, [2, 3], 4, 5];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->12345<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const array = [1, [2, 3], 4, 5];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div>12345</div>');
        }
      });

      it(`correctly handles changes in templates between renders`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = [1, 2, 3];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>1</p><p>2</p><p>3</p><span></span></div>');
          part._renderIterable(array.map(i => html`<i>${i}</i>`));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><i>1</i><i>2</i><i>3</i><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const array = [1, 2, 3];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(outerHTML(parent)).to.equal('<div><p>1</p><p>2</p><p>3</p></div>');
          part._renderIterable(array.map(i => html`<i>${i}</i>`));
          expect(outerHTML(parent)).to.equal('<div><i>1</i><i>2</i><i>3</i></div>');
        }
      });

      it(`correctly renders empty arrays`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          let array = [1, 2, 3];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>1</p><p>2</p><p>3</p><span></span></div>');

          array = [];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><span></span></div>');

          array = [4, 5, 6];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>4</p><p>5</p><p>6</p><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          let array = [1, 2, 3];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(outerHTML(parent)).to.equal('<div><p>1</p><p>2</p><p>3</p></div>');

          array = [];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(outerHTML(parent)).to.equal('<div></div>');

          array = [4, 5, 6];
          part._renderIterable(array.map(i => html`<p>${i}</p>`));
          expect(outerHTML(parent)).to.equal('<div><p>4</p><p>5</p><p>6</p></div>');
        }
      });

      it(`renders additions to the array in subsequent renders`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', 1];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->hello1<span></span></div>');
          array.unshift(true);
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->truehello1<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const array = ['hello', 1];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div>hello1</div>');
          array.unshift(true);
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div>truehello1</div>');
        }
      });

      it(`removes elements when the array shrinks`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->hello1true<span></span></div>');
          array.pop();
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->hello1<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div>hello1true</div>');
          array.pop();
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div>hello1</div>');
        }
      });

      it(`does not break when the parent is normalized`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        const template = array => array.map(i => html`<p>${i}</p>`);
        part.render(template([1, 2]));
        parent.normalize();
        part.render(template([1]));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>1</p><span></span></div>');
        part.render(template([1, 2, 3]));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>1</p><p>2</p><p>3</p><span></span></div>');
      });

      it(`does not break when rendering another thing in between arrays`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->hello1true<span></span></div>');
          part._renderText('string');
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->string<span></span></div>');
          part._renderIterable([1, 2, 3, 4, 5]);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->12345<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const array = ['hello', 1, true];
          part._renderIterable(array);
          expect(outerHTML(parent)).to.equal('<div>hello1true</div>');
          part._renderText('string');
          expect(outerHTML(parent)).to.equal('<div>string</div>');
          part._renderIterable([1, 2]);
          expect(outerHTML(parent)).to.equal('<div>12</div>');
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
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const promise = new Promise(() => {});
          part._renderPromise(promise);
          expect(outerHTML(parent)).to.equal('<div></div>');
        }
      });

      it(`renders a promise that is already resolved`, async () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const promise = Promise.resolve('string');
          part._renderPromise(promise);
          await promise;
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->string<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const promise = Promise.resolve('string');
          part._renderPromise(promise);
          await promise;
          expect(outerHTML(parent)).to.equal('<div>string</div>');
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
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><span></span></div>');
          await promise;
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->string<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const promise = new Promise(function(resolve) {
            setTimeout(() => resolve('string'), 10);
          });
          part._renderPromise(promise);
          expect(outerHTML(parent)).to.equal('<div></div>');
          await promise;
          expect(outerHTML(parent)).to.equal('<div>string</div>');
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
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><span></span></div>');
          await firstPromise;
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><span></span></div>');
          await secondPromise;
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->good<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const firstPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('bad'), 10);
          });
          const secondPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('good'), 20);
          });
          part._renderPromise(firstPromise);
          part._renderPromise(secondPromise);
          expect(outerHTML(parent)).to.equal('<div></div>');
          await firstPromise;
          expect(outerHTML(parent)).to.equal('<div></div>');
          await secondPromise;
          expect(outerHTML(parent)).to.equal('<div>good</div>');
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
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->good<span></span></div>');
          await firstPromise;
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->good<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const firstPromise = new Promise(function(resolve) {
            setTimeout(() => resolve('bad'), 10);
          });
          part._renderPromise(firstPromise);
          part.render('good');
          expect(outerHTML(parent)).to.equal('<div>good</div>');
          await firstPromise;
          expect(outerHTML(parent)).to.equal('<div>good</div>');
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
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->intermediate<span></span></div>');
          await firstPromise;
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->intermediate<span></span></div>');
          await secondPromise;
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker-->good<span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
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
          expect(outerHTML(parent)).to.equal('<div>intermediate</div>');
          await firstPromise;
          expect(outerHTML(parent)).to.equal('<div>intermediate</div>');
          await secondPromise;
          expect(outerHTML(parent)).to.equal('<div>good</div>');
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
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p></p><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const templateResult = html`<p></p>`;
          part._renderTemplateResult(templateResult);
          expect(outerHTML(parent)).to.equal('<div><p></p></div>');
        }
      });

      it(`renders the values inside templates`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = value => html`<p>${value}</p>`;
          part._renderTemplateResult(templateResult(1));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>1</p><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const templateResult = value => html`<p>${value}</p>`;
          part._renderTemplateResult(templateResult(1));
          expect(outerHTML(parent)).to.equal('<div><p>1</p></div>');
        }
      });

      it(`renders nested templates`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = value => html`<p>${value}</p>`;
          part._renderTemplateResult(templateResult(html`<i>${1}</i>`));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p><i>1</i></p><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const templateResult = value => html`<p>${value}</p>`;
          part._renderTemplateResult(templateResult(html`<i>${1}</i>`));
          expect(outerHTML(parent)).to.equal('<div><p><i>1</i></p></div>');
        }
      });

      it(`renders nested templates in the root of the template`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = value => html`${value}`;
          part._renderTemplateResult(templateResult(html`<i>${1}</i>`));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><i>1</i><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const templateResult = value => html`${value}`;
          part._renderTemplateResult(templateResult(html`<i>${1}</i>`));
          expect(outerHTML(parent)).to.equal('<div><i>1</i></div>');
        }
      });

      it(`can render the same template in different parts`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const templateResult = value => html`${value}`;
          const templatePartial = value => html`<i>${value}</i>`;
          part._renderTemplateResult(templateResult(templatePartial(1)));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><i>1</i><span></span></div>');
          part._renderTemplateResult(templateResult(templatePartial(2)));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><i>2</i><span></span></div>');
          const thing = setupNodes();
          const newPart = new NodePart({ node: thing.node });
          newPart._renderTemplateResult(templateResult(templatePartial(1)));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><i>2</i><span></span></div>');
          expect(outerHTML(thing.parent)).to.equal('<div><span></span><!--marker--><i>1</i><span></span></div>');
        }
      });

      it(`can alternate between templates`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const one = html`<p></p>`;
          const two = html`<i></i>`;
          part._renderTemplateResult(one);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p></p><span></span></div>');
          part._renderTemplateResult(two);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><i></i><span></span></div>');
          part._renderTemplateResult(one);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p></p><span></span></div>');
          part._renderTemplateResult(two);
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><i></i><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const one = html`<p></p>`;
          const two = html`<i></i>`;
          part._renderTemplateResult(one);
          expect(outerHTML(parent)).to.equal('<div><p></p></div>');
          part._renderTemplateResult(two);
          expect(outerHTML(parent)).to.equal('<div><i></i></div>');
          part._renderTemplateResult(one);
          expect(outerHTML(parent)).to.equal('<div><p></p></div>');
          part._renderTemplateResult(two);
          expect(outerHTML(parent)).to.equal('<div><i></i></div>');
        }
      });

      it(`re-uses the template instance when rendering the same template again`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const template = value => html`<p>${value}</p>`;
          part._renderTemplateResult(template(1));
          parent.querySelector('p').id = 'a';
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p id="a">1</p><span></span></div>');
          part._renderTemplateResult(template(2));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p id="a">2</p><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const template = value => html`<p>${value}</p>`;
          part._renderTemplateResult(template(1));
          parent.querySelector('p').id = 'a';
          expect(outerHTML(parent)).to.equal('<div><p id="a">1</p></div>');
          part._renderTemplateResult(template(2));
          expect(outerHTML(parent)).to.equal('<div><p id="a">2</p></div>');
        }
      });

      it(`does not keep the template instances that are no longer rendered`, () => {
        {
          const { node, parent } = setupNodes();
          const part = new NodePart({ node });
          const one = value => html`<p>${value}</p>`;
          const two = value => html`<i>${value}</i>`;
          part._renderTemplateResult(one(1));
          parent.querySelector('p').id = 'a';
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p id="a">1</p><span></span></div>');
          part._renderTemplateResult(two(2));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><i>2</i><span></span></div>');
          part._renderTemplateResult(one(3));
          expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>3</p><span></span></div>');
        }
        {
          const { node, parent } = setupRoot();
          const part = new NodePart({ node });
          const one = value => html`<p>${value}</p>`;
          const two = value => html`<i>${value}</i>`;
          part._renderTemplateResult(one(1));
          parent.querySelector('p').id = 'a';
          expect(outerHTML(parent)).to.equal('<div><p id="a">1</p></div>');
          part._renderTemplateResult(two(2));
          expect(outerHTML(parent)).to.equal('<div><i>2</i></div>');
          part._renderTemplateResult(one(3));
          expect(outerHTML(parent)).to.equal('<div><p>3</p></div>');
        }
      });

      it(`releases the template instance and the item parts when the part is cleared`, () => {
        const { node } = setupNodes();
        const part = new NodePart({ node });
        part.render(html`<p></p>`);
        expect(part.instance).to.not.be.undefined;
        part.render('text');
        expect(part.instance).to.be.undefined;
        part.render([1, 2]);
        expect(part.iterableParts.length).to.equal(2);
        part.render('text');
        expect(part.iterableParts).to.be.undefined;
      });

      it(`renders the values before the template is inserted`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        let rootNode;
        const probe = part => {
          rootNode = part.node.getRootNode();
        };
        part.render(html`<p><i a=${directive(probe)}></i></p>`);
        expect(rootNode instanceof DocumentFragment).to.be.true;
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p><i></i></p><span></span></div>');
      });

      it(`correctly clears parts that are next to each other`, () => {
        const { node, parent } = setupNodes();
        const part = new NodePart({ node });
        const template = (a, b) => html`<p>${a}${b}</p>${a}${b}`;
        part.render(template('a', 'b'));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>ab</p>ab<span></span></div>');
        part.render(template('a', null));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>a</p>a<span></span></div>');
        part.render(template(html`<b></b>`, html`<i></i>`));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p><b></b><i></i></p><b></b><i></i><span></span></div>');
        part.render(template(null, [1, 2]));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>12</p>12<span></span></div>');
        part.render(template('a', []));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p>a</p>a<span></span></div>');
        part.render(template(null, null));
        expect(outerHTML(parent)).to.equal('<div><span></span><!--marker--><p></p><span></span></div>');
      });
    });
  });
});
