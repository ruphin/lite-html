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

import { TemplateResult } from './lib/templates.js';
import { NodePart } from './lib/parts.js';

/**
 * Tagging function to tag JavaScript template string literals as HTML
 *
 * @return {TemplateResult}
 *   The strings and values of the template string wrapped in a TemplateResult object
 */
export const html = (strings, ...values) => {
  return new TemplateResult(strings, values);
};

/**
 * Render content into a target node
 *
 * @param {any} content
 *   Any content you wish to render. Usually a template string literal tagged with the `html` function
 * @param {Node} target
 *   An HTML Node that you wish to render the content into.
 *   The content will become the sole content of the target node.
 */
export const render = (content, target) => {
  // Check if the target has a NodePart that represents its content
  let part = target.__nodePart;
  if (!part) {
    // If it does not, create a new NodePart
    part = new NodePart(undefined, target);
    target.__nodePart = part;
  }
  // Task the NodePart of this target to render the content
  part.render(content);
};
