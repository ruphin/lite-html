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

import { TemplateResult } from './template-result.js';
import { TemplateInstance } from './template-instance.js';
import { moveNodes, createTextNode } from './dom.js';
import { isDirective } from './directive.js';

export const isPrimitive = value => value === null || !(typeof value === 'object' || typeof value === 'function');
export const isIterable = nonPrimitive => Array.isArray(nonPrimitive) || !!onPrimitive[Symbol.iterator];

// A flag that signals that no render should happen
export const noChange = {};

// A node type for empty parts
const emptyNode = {};

// A node type for NodeParts that contain an iterable
const iterableNode = {};

export class NodePart {
  // // node OR before and after _must_ be defined
  // // If node is defined, this NodePart represents the position of that node in the tree
  // // If before and after are defined, this NodePart represents the content between those nodes
  // constructor({ node, before, after }) {
  //   this.node = node || emptyNode;
  //   this.value = noChange;
  //   this.beforeNode = before || node.previousSibling;
  //   this.afterNode = after || node.nextSibling;
  // }

  appendIntoNode(container) {
    this.beforeNode = container.appendChild(createTextNode());
    this.afterNode = container.appendChild(createTextNode());
  }

  insertAfterNode(beforeNode) {
    this.beforeNode = beforeNode;
    this.afterNode = beforeNode.nextSibling;
  }

  get parentNode() {
    return this.beforeNode.parentNode;
  }

  setValue(value) {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }
    const value = this._pendingValue;
    if (value === noChange) {
      return;
    }
    if (isPrimitive(value)) {
      if (value !== this.value) {
        this._renderText(value);
      }
    } else if (value instanceof TemplateResult) {
      this._renderTemplateResult(value);
    } else if (isIterable(value)) {
      this._renderIterable(value);
    } else if (value instanceof Node) {
      this._renderNode(value);
    } else if (value === nothing) {
      this.value = value;
      this.clear();
    } else {
      // Fallback, will render the string representation
      this._renderText(String(value));
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
      if (this.node && this.node.nodeType === 3) {
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
        after = createTextNode();
        parent.insertBefore(after, this.afterNode);
        part = new NodePart();
        part.insertAfterNode(before);
        this.iterableParts.push(part);
        before = after;
      }
      part.setValue(value);
      part.commit();
      index++;
    }
    if (index === 0) {
      moveNodes(parent, this.beforeNode, this.afterNode);
    } else if (index < this.iterableParts.length) {
      const lastPart = this.iterableParts[index - 1];
      moveNodes(parent, lastPart.afterNode, this.afterNode);
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

export class CommentCommitter {
  constructor({ node, strings }) {
    const parts = [];
    const partCount = strings.length - 1;
    this.node = node;
    this.strings = strings;
    this.parts = parts;
    this.dirty = false;
    for (let i = 0; i < partCount; i++) {
      parts[i] = new CommentPart(this);
    }
  }

  commit() {
    if (this.dirty) {
      let result = '';
      const { node, strings, parts } = this;
      const partCount = parts.length;
      for (let i = 0; i < partCount; i++) {
        result += strings[i];
        result += parts[i].value;
      }
      result += strings[partCount];
      node.textContent = result;
      this.dirty = false;
    }
  }
}

// The node in the CommentPart constructor must be a CommentNode
export class CommentPart {
  constructor(committer) {
    this.committer = committer;
  }

  setValue(value) {
    if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
      if (isDirective(value)) {
        value(this);
      } else {
        this.value = value;
        this.committer.dirty = true;
      }
    }
  }

  commit() {
    this.committer.commit();
  }
}

export class AttributeCommitter {
  constructor({ node, name, strings }) {
    const parts = [];
    this.node = node;
    this.name = name;
    this.strings = strings;
    this.parts = parts;
    if (strings) {
      const partCount = strings.length - 1;
      for (let i = 0; i < partCount; i++) {
        parts[i] = new AttributePart(this);
      }
    } else {
      parts[0] = new AttributePart(this);
    }
    switch (name[0]) {
      case '.':
        this._render = this._renderProperty;
      case '?':
        this._render = this._render || this._renderBoolean;
      case '@':
        this._render = this._render || this._renderEvent;
        this.name = name.slice(1);
        break;
      default:
        this._render = this._renderAttribute;
        this.name = name;
    }
  }

  commit() {
    let result;
    const { strings, parts } = this;
    if (strings) {
      const partCount = parts.length;
      result = '';
      for (let i = 0; i < partCount; i++) {
        result += strings[i] + parts[i].value;
      }
      result += strings[partCount];
    } else {
      result = parts[0].value;
    }
    this._render(result);
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

// TODO: multi-part attribute parts
export class AttributePart {
  constructor(committer) {
    this.committer = committer;
  }

  setValue(value) {
    if (value !== noChange && !(isPrimitive(value) && value === this.value)) {
      if (isDirective(value)) {
        value(this);
      } else {
        this.value = value;
        this.committer.dirty = true;
      }
    }
  }

  commit() {
    this.committer.commit();
  }
}
