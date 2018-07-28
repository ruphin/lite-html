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

const isPrimitive = value => !(typeof value === 'object' || typeof value === 'function');

export class NodePart {
  constructor(placeholder) {
    this.previousNode = placeholder;
    this.startMarker = document.createComment('');
    this.endMarker = document.createComment('');
    this.subTemplates = new Map();
    const parent = placeholder.parentNode;
    parent.insertBefore(this.startMarker, placeholder);
    parent.insertBefore(this.endMarker, placeholder);
    parent.removeChild(placeholder);
  }
  update(value) {
    if (isPrimitive(value)) {
      // Handle primitive values
      // If the value didn't change, do nothing
      if (value === this.previousValue) {
        return;
      }
      this._setText(value);
    } else if (value instanceof TemplateResult) {
      this._setTemplateResult(value);
    } else if (Array.isArray(value) || value[Symbol.iterator]) {
      this._setIterable(value);
    } else if (value instanceof Node) {
      this._setNode(value);
    } else if (value.then !== undefined) {
      this._setPromise(value);
    } else {
      this._setText(value);
    }
  }

  _setIterable(value) {
    const append = () => {
      const placeholder = document.createComment('');
      this.endMarker.parentNode.insertBefore(placeholder, this.endMarker);
      return new NodePart(placeholder);
    };

    this._setNode(document.createComment(''));
    value.forEach(item => {
      append().update(item);
    });
    // if (!this.previousValue || !Array.isArray(this.previousValue) || !this.previousValue[Symbol.iterator]) {

    //   // Construct a new array thing
    // } else {
    //   // Re-use array thing
    // }
  }

  _setText(text) {
    if (this.previousValue === text) {
      return;
    }
    if (this.endMarker.previousSibling.nodeType === 3 && this.endMarker.previousSibling.previousSibling === this.startMarker) {
      this.endMarker.previousSibling.textContent = text;
    } else {
      this._setNode(document.createTextNode(text));
    }
  }

  _setNode(node) {
    if (this.previousValue === node) {
      return;
    }
    const parent = this.endMarker.parentNode;
    // TODO: Fix this -  it swaps the order of nodes when swapping out document fragments
    // Need to abstract this to a 'removeNodes' function that can also be used in render();
    if (this.previousValue instanceof DocumentFragment) {
      while (this.endMarker.previousSibling != this.startMarker) {
        this.previousValue.appendChild(this.endMarker.previousSibling);
      }
    } else {
      while (this.endMarker.previousSibling != this.startMarker) {
        parent.removeChild(this.endMarker.previousSibling);
      }
    }

    parent.insertBefore(node, this.endMarker);
    this.previousValue = node;
  }

  _setTemplateResult(templateResult) {
    let instance = this.subTemplates.get(templateResult.template);
    if (!instance) {
      instance = new TemplateInstance(templateResult.template);
      this.subTemplates.set(templateResult.template, instance);
    }
    if (instance.fragment !== this.previousNode) {
      this._setNode(instance.fragment);
    }
    instance.update(templateResult.values);
  }
}

export class CommentPart {
  constructor(placeholder) {
    this.node = placeholder;
  }
  update(value) {
    this.node.textContent = value;
  }
}

export class AttributePart {
  constructor(node, attributeName) {
    this.node = node;
    switch (attributeName[0]) {
      case '.':
        this.update = this.updateProperty;
      case '?':
        this.update = this.update || this.updateBoolean;
      case '@':
        this.update = this.update || this.updateEvent;
        this.node.removeAttribute(attributeName);
        this.name = attributeName.slice(1);
        break;
      default:
        this.update = this.updateAttribute;
        this.name = attributeName;
    }
  }
  updateProperty(value) {
    this.node[this.name] = value;
  }
  updateBoolean(value) {
    value ? this.node.setAttribute(this.name, '') : this.node.removeAttribute(this.name);
  }
  updateEvent(value) {
    if (typeof value === 'function') {
      // TODO: Remember this event listener and remove it again if it changes
      this.node.addEventListener(this.name, value);
    }
  }
  updateAttribute(value) {
    this.node.setAttribute(this.name, value);
  }
}
