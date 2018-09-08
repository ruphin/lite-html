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
import { CEPolyfill, ShadyPolyfill } from './polyfills.js';
/**
 * A map that contains all the template literals we have seen before
 * It maps from a String array to a Template object
 *
 * @typedef {Map.<[String], Template>}
 */
const templates = new WeakMap();
const scopedTemplates = new Map();

/**
 * Template holds the DocumentFragment that is to be used as a prototype for instances of this template
 * When a template is to be rendered in a new location, a clone will be made from this
 *
 * @prop {[String]} strings
 *   The unique string array that this template represents
 * @prop {[DocumentFragment]} element
 *   The DocumentFragment that can be cloned to make instances of this template
 * @prop {[Object]} parts
 *   The descriptions of the parts in this Template. Each part has a path which defines a unique location in the
 *   template DOM tree, a type which defines the part type, and an optional attribute which defines the name of
 *   the attribute this part represents.
 */
export class Template {
  constructor(strings, scope) {
    this.strings = strings;
    this.element = buildTemplate(strings);

    if (ShadyPolyfill && scope) {
      window.ShadyCSS.prepareTemplate(this.element, scope);
    }
    this.parts = findParts(strings, this.element);
  }
}

/**
 * TemplateResult holds the strings and values that result from a tagged template string literal.
 * TemplateResult can find and return a unique Template object that represents its tagged template string literal.
 */
export class TemplateResult {
  constructor(strings, values) {
    this.strings = strings;
    this.values = values;
    this._template = undefined;
  }

  /**
   * @returns {Template}
   *   A unique Template object..
   *   Each evaluation of html`..` yields a new TemplateResult object, but they will have the same
   *   Template object when they are the result of the same html`..` literal.
   *
   */
  template(scope) {
    let templateMap = templates;
    let template;
    if (scope) {
      templateMap = scopedTemplates.get(scope);
      if (!templateMap) {
        templateMap = new WeakMap();
      }
    }
    template = templateMap.get(this.strings);
    if (!template) {
      template = new Template(this.strings, scope);
      templateMap.set(this.strings, template);
    }
    return template;
  }
}

/**
 * An instance of a template that can be rendered somewhere
 *
 * @prop {Template} template
 *   The unique Template object that this is an instance of
 * @prop {[DocumentFragment]} fragment
 *   The DocumentFragment that is a clone of the Template's prototype DocumentFragment
 * @prop {[AttributePart|CommentPart|NodePart|]} parts
 *   The parts that render into this template instance
 */
export class TemplateInstance {
  constructor(template) {
    this.template = template;
    this.fragment = CEPolyfill ? this.template.element.content.cloneNode(true) : document.importNode(this.template.element.content, true);

    // Create new Parts based on the part definitions set on the Template
    const parts = this.template.parts.map(part => {
      let node = this.fragment;
      part.path.forEach(nodeIndex => {
        node = node.childNodes[nodeIndex];
      });
      part.node = node;
      return part;
    });

    if (CEPolyfill) {
      document.adoptNode(this.fragment);
      customElements.upgrade(this.fragment);
    }

    this.parts = parts.map(part => new part.type(part));
  }

  /**
   * Render values into the parts of this TemplateInstance
   *
   * @param {[any]} values
   *   An array of values to render into the parts. There should be one value per part
   */
  render(values) {
    this.parts.map((part, index) => part.render(values[index]));
  }
}
