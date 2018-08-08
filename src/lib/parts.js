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

import { TemplateResult, TemplateInstance } from './templates.js';

export const isPrimitive = value => value == null || !(typeof value === 'object' || typeof value === 'function');
export const isArray = nonPrimitive => Array.isArray(nonPrimitive) || nonPrimitive[Symbol.iterator];

export const noChange = {};

export class NodePart {
  // node OR parent _must_ be defined
  // If a node is defined, this NodePart represents the position of that node in the tree
  // If a only a parent is defined, this NodePart represents the entire content of the parent
  constructor({ node, parent }) {
    this.iterableFragment = document.createDocumentFragment();
    this.iterableParts = [];
    this.node = node;
    this.previousValue = undefined;

    this.parentNode = node && !(node.parentNode instanceof DocumentFragment) ? node.parentNode : parent;
    this.beforeNode = node && node.previousSibling;
    this.afterNode = node && node.nextSibling;

    this.templateInstances = new Map();
  }

  render(value) {
    if (value === noChange) {
      return;
    }
    if (isPrimitive(value)) {
      this._renderPrimitive(value);
    } else if (value instanceof TemplateResult) {
      this._renderTemplateResult(value);
    } else if (isArray(value)) {
      this._renderIterable(value);
    } else if (value instanceof Node) {
      this._renderNode(value);
    } else if (value.then !== undefined) {
      this._renderPromise(value);
    } else {
      this._renderPrimitive(String(value));
      this.previousValue = String(value);
    }
    // TODO: something smart
    this.previousValue = value;
  }

  /**
   * Render a primitive value in this part
   *
   * Primitive values are rendered as textContent of a TextNode
   */
  _renderPrimitive(primitive) {
    // If the previous value is equal to the primitive, do nothing
    if (this.previousValue === primitive) {
      return;
    }
    // If the node is a TextNode, replace the content of that node
    // Otherwise, create a new TextNode with the primitive value as content
    if (this.node && this.node.nodeType === 3) {
      this.node.textContent = primitive;
    } else {
      this._renderNode(document.createTextNode(primitive));
    }
  }

  /**
   * Render a TemplateResult in this part
   *
   * Checks if this template has already been rendered in this part before.
   * If so, it re-use that TemplateInstance
   * If not, it create a new TemplateInstance
   */
  _renderTemplateResult(templateResult) {
    let instance = this.templateInstances.get(templateResult.template);
    if (!instance) {
      instance = new TemplateInstance(templateResult.template, this.parentNode);
      this.templateInstances.set(templateResult.template, instance);
    }
    if (instance.fragment !== this.node) {
      this.clear();
      this.parentNode.insertBefore(instance.fragment, this.afterNode);
      this.node = instance.fragment;
    }
    instance.render(templateResult.values);
  }

  /**
   * Render an iterable in this part
   *
   * Creates a part for each item in the iterable
   * Render each iterable value in a part
   */
  _renderIterable(iterable) {
    if (this.previousNode !== this.iterableFragment) {
      this.clear();
    }

    this.parentNode.insertBefore(this.iterableFragment, this.afterNode);

    while (this.iterableParts.length < iterable.length) {
      const node = document.createComment('');
      const delimiter = document.createTextNode('');
      this.parentNode.insertBefore(delimiter, this.afterNode);
      this.parentNode.insertBefore(node, delimiter);
      this.iterableParts.push(new NodePart({ node, parent: this.parentNode }));
    }

    this.iterableParts.forEach((part, index) => {
      if (iterable[index] === undefined) {
        part.clear();
      } else {
        part.render(iterable[index]);
      }
    });
    this.previousNode = this.iterableFragment;
  }

  /**
   * Render a DOM node in this part
   */
  _renderNode(node) {
    // If node is already the current content node, do nothing
    if (this.node === node) {
      return;
    }
    this.parentNode.insertBefore(node, this.afterNode);
    this.node = node;
  }

  /**
   * Render the result of a promise in this part
   */
  _renderPromise(promise) {
    // If we rendered this Promise already, do nothing
    // TODO: Account for rendering promise -> other -> promise
    if (this.previousValue === promise || this.previousPromise === promise) {
      return;
    }
    this.clear();
    this.previousPromise = promise;
    // When the promise resolves, render the value of that promise
    promise.then(value => {
      // If the part rendered another value in the meantime, abandon the promise
      if (this.previousValue !== value) {
        return;
      }
      this.render(value);
    });
  }

  /**
   * Clear out the content of this NodePart
   *
   * If the current content is part of a DocumentFragment (it is the result of a TemplateResult or an Array)
   * The current content is moved back into that fragment to be used again if the same fragment is rendered
   * Otherwise, the current content is removed from the DOM permanently
   */
  clear() {
    let nodeToRemove = (this.beforeNode && this.beforeNode.nextSibling) || this.parentNode.childNodes[0];
    let nextNode;
    if (this.node instanceof DocumentFragment) {
      while (nodeToRemove != this.afterNode) {
        nextNode = nodeToRemove.nextSibling;
        this.node.appendChild(nodeToRemove);
        nodeToRemove = nextNode;
      }
    } else {
      while (nodeToRemove != this.afterNode) {
        nextNode = nodeToRemove.nextSibling;
        this.parentNode.removeChild(nodeToRemove);
        nodeToRemove = nextNode;
      }
    }
    this.node = undefined;
    this.previousValue = undefined;
  }
}

export class CommentPart {
  constructor({ node }) {
    this.node = node;
  }

  render(value) {
    this.node.textContent = value;
  }
}

export class AttributePart {
  constructor({ node, attribute }) {
    this.node = node;
    switch (attribute[0]) {
      case '.':
        this.render = this._renderProperty;
      case '?':
        this.render = this.render || this._renderBoolean;
      case '@':
        this.render = this.render || this._renderEvent;
        this.node.removeAttribute(attribute);
        this.name = attribute.slice(1);
        break;
      default:
        this.render = this._renderAttribute;
        this.name = attribute;
    }
  }

  _renderProperty(value) {
    this.node[this.name] = value;
  }

  _renderBoolean(boolean) {
    boolean ? this.node.setAttribute(this.name, '') : this.node.removeAttribute(this.name);
  }

  _renderEvent(listener) {
    if (this._currentEventListener === listener) {
      return;
    }
    this.node.removeEventListener(this.name, this._currentEventListener);
    this.node.addEventListener(this.name, listener);
    this._currentEventListener = listener;
  }

  _renderAttribute(string) {
    this.node.setAttribute(this.name, string);
  }
}
