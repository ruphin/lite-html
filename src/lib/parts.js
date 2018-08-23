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
import { moveNodes } from './dom.js';

export const isSerializable = value => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
export const isIterable = nonPrimitive => Array.isArray(nonPrimitive) || nonPrimitive[Symbol.iterator];

// A flag that signals that no render should happen
export const noChange = {};

// A node type for empty parts
const emptyNode = {};

// A node type for NodeParts that contain an iterable
const iterableNode = {};

export class NodePart {
  // node OR parent _must_ be defined
  // If a node is defined, this NodePart represents the position of that node in the tree
  // If a only a parent is defined, this NodePart represents the content of the parent
  constructor({ node, parent, before, after }) {
    this.node = node || emptyNode;
    this.value = noChange;

    this.parentNode = parent || (node && node.parentNode);
    this.beforeNode = before || (node && node.previousSibling);
    this.afterNode = after || (node && node.nextSibling);
  }

  render(value) {
    if (value === noChange) {
      return;
    }
    if (value == null) {
      this.clear();
    } else if (isSerializable(value)) {
      this._renderText(value);
    } else if (value instanceof TemplateResult) {
      this._renderTemplateResult(value);
    } else if (isIterable(value)) {
      this._renderIterable(value);
    } else if (value instanceof Node) {
      this._renderNode(value);
    } else if (value.then !== undefined) {
      this._renderPromise(value);
    } else {
      value = String(value);
      this._renderText(value);
    }
    this.value = value;
  }

  /**
   * Render a serializable value in this part
   *
   * Strings, Numbers, and Booleans are serializable
   * Serializable values are rendered as textContent of a TextNode
   */
  _renderText(serializable) {
    // If the text is not equal to the previously rendered value
    if (this.value !== serializable) {
      // If the node is a TextNode, replace the content of that node
      // Otherwise, create a new TextNode with the primitive value as content
      if (this.node.nodeType === 3) {
        this.node.textContent = serializable;
      } else {
        this._renderNode(document.createTextNode(serializable));
      }
    }
  }

  /**
   * Render a TemplateResult in this part
   *
   * Checks if this template has already been rendered in this part before.
   * If so, re-use that TemplateInstance
   * If not, create a new TemplateInstance
   */
  _renderTemplateResult(templateResult) {
    this.templateInstances = this.templateInstances || new Map();
    let instance = this.templateInstances.get(templateResult.template);
    if (!instance) {
      instance = new TemplateInstance(templateResult.template, this.parentNode, this.beforeNode, this.afterNode);
      this.templateInstances.set(templateResult.template, instance);
    }
    if (this.node !== instance.fragment) {
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
    if (this.node !== iterableNode) {
      this.clear();
      this.node = iterableNode;
      if (!this.iterableParts) {
        this.iterableParts = [];
      } else {
        this.iterableParts.length = 0;
      }
    }

    let index = 0;
    let before = this.afterNode ? this.afterNode.previousSibling : this.parentNode.lastChild;
    let after;
    const parent = this.parentNode;
    for (const value of iterable) {
      let part = this.iterableParts[index];
      if (part === undefined) {
        after = document.createTextNode('');
        this.parentNode.insertBefore(after, this.afterNode);
        part = new NodePart({ before, after, parent });
        this.iterableParts.push(part);
        before = after;
      }
      part.render(value);
      index++;
    }
    if (index === 0) {
      moveNodes(this.parentNode, this.beforeNode, this.afterNode);
    } else if (index < this.iterableParts.length) {
      const lastPart = this.iterableParts[index - 1];
      moveNodes(this.parentNode, lastPart.afterNode, this.afterNode);
    }
    this.iterableParts.length = index;
  }

  /**
   * Render a DOM node in this part
   */
  _renderNode(node) {
    // If we are not already rendering this node
    if (this.node !== node) {
      this.clear();
      this.parentNode.insertBefore(node, this.afterNode);
      this.node = node;
    }
  }

  /**
   * Render the result of a promise in this part
   */
  _renderPromise(promise) {
    // If the promise is not the last value or promise
    if (this.value !== promise && this.promise !== promise) {
      this.clear();
      this.promise = promise;
      this.value = promise;
      // When the promise resolves, render the result of that promise
      promise.then(value => {
        // Render the promise result only if the last rendered value was the promise
        if (this.value === promise) {
          this.render(value);
        }
      });
    }
  }

  /**
   * Clear out the content of this NodePart
   *
   * If the current node is part of a DocumentFragment (this NodePart rendered a TemplateResult)
   * The current content is moved back into that fragment to be used again if the same fragment is rendered
   * Otherwise, the current content is removed from the DOM permanently
   */
  clear() {
    moveNodes(this.parentNode, this.beforeNode, this.afterNode, this.node instanceof DocumentFragment && this.node);
    this.node = emptyNode;
  }
}

// The node in the CommentPart constructor must be a CommentNode
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
    if (this.value !== !!boolean) {
      boolean ? this.node.setAttribute(this.name, '') : this.node.removeAttribute(this.name);
      this.value = !!boolean;
    }
  }

  _renderEvent(listener) {
    if (this.value !== listener) {
      this.node.removeEventListener(this.name, this.value);
      this.node.addEventListener(this.name, listener);
      this.value = listener;
    }
  }

  _renderAttribute(string) {
    if (this.value !== string) {
      this.node.setAttribute(this.name, string);
      this.value = string;
    }
  }
}
