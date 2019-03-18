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

// import { findParts } from './node-walker.js';
// import { NodePart } from './parts.js';
import { Template } from './template.js';
/**
 * A map that contains all the template literals we have seen before
 * It maps from a String array to a Template object
 *
 * @typedef {Map.<[String], Template>}
 */
const templateMap = new Map();

/**
 * TemplateResult holds the strings and values that result from a tagged template string literal.
 * TemplateResult can find and return a unique Template object that represents its tagged template string literal.
 */
export class TemplateResult {
  constructor(strings, values) {
    this.strings = strings;
    this.values = values;
  }

  /**
   * @returns {Template}
   *   A unique Template object..
   *   Each evaluation of html`..` yields a new TemplateResult object, but they will have the same
   *   Template object when they are the result of the same html`..` literal.
   *
   */
  get template() {
    let template = templateMap.get(this.strings);
    if (!template) {
      template = this._newTemplate();
      templateMap.set(this.strings, template);
    }
    return template;
  }
  _newTemplate() {
    return new Template(this.strings);
  }
}

export class SVGTemplateResult extends TemplateResult {
  _newTemplate() {
    return new Template(this.strings, true);
  }
}
