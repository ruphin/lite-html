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

import { findParts } from './node-walker.js';
import { buildTemplate } from './template-parser.js';

const templateMap = new Map();

export class Template {
  constructor(strings) {
    this.strings = strings;
    this.element = buildTemplate(strings);
    this.parts = findParts(strings, this.element);
  }
}

export class TemplateResult {
  constructor(strings, values) {
    this.strings = strings;
    this.values = values;
    this._template = undefined;
  }

  get template() {
    if (this._template) {
      return this._template;
    }
    let template = templateMap.get(this.strings);
    if (!template) {
      template = new Template(this.strings);
      templateMap.set(this.strings, template);
    }
    this._template = template;
    return template;
  }
}

export class TemplateInstance {
  constructor(template) {
    this.template = template;
    // this.partTemplates = new Map();
    this.fragment = template.element.content.cloneNode(true);
    this.initializeParts();
  }

  initializeParts() {
    const parts = this.template.parts.map(part => {
      let node = this.fragment;
      part.path.forEach(nodeIndex => {
        node = node.childNodes[nodeIndex];
      });
      part.node = node;
      return part;
    });
    this.parts = parts.map(part => new part.type(part.node, part.attribute));
  }

  adopt(oldParent, newParent) {
    this.parts.filter(part => part.parentNode === undefined || part.parentNode === oldParent).forEach(part => {
      part.parentNode = newParent;
    });
  }

  render(values) {
    this.parts.map((part, index) => part.render(values[index]));
  }
}
