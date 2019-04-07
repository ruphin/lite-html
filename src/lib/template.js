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

import { parseStrings } from './template-parser.js';
import { templateWalker } from './template-walker.js';
import { moveNodes } from './dom.js';
import { marker } from './markers.js';

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
  // TODO: Cleaner way to pass isSVG
  constructor(strings, isSVG) {
    const { html, parts } = parseStrings(strings);
    const templateElement = document.createElement('template');
    const walker = templateWalker(templateElement, parts);

    // If the Template is an SVG type, wrap the template with an <svg> tag during parsing
    if (isSVG) {
      templateElement.innerHTML = `<svg>${html}</svg>`;
      const content = templateElement.content;
      const svgElement = content.firstChild;
      content.removeChild(svgElement);
      moveNodes(svgElement, null, null, content);
    } else {
      templateElement.innerHTML = html;
    }

    console.log('PARSED', html);

    /**
     * Prepare the template
     *  - Insert individual TextNodes with parsed content inside scoped contexts (`<style>` and `<script>`)
     *  - Insert CommentNodes surrounding NodeParts if it is missing siblings
     */
    walker((node, part) => {
      if (part.type === 'scoped') {
        const scopedNode = node.previousSibling;
        part.strings.forEach(string => {
          scopedNode.appendChild(document.createTextNode(string));
        });
      } else if (part.type === 'node') {
        const previousSibling = node.previousSibling;
        if (!previousSibling) {
          node.parentNode.insertBefore(document.createComment(''), node);
        }
        const nextSibling = node.nextSibling;
        if (!nextSibling || nextSibling.data === marker) {
          node.parentNode.insertBefore(document.createComment(''), nextSibling);
        }
      }
    });

    this.templateWalker = walker;
    this.element = templateElement;
    this.parts = parts;

    /**
     * DEBUG
     */
    const printFragment = this.element.content.cloneNode(true);
    const printNode = document.createElement('div');
    printNode.appendChild(printFragment);
    console.log('PREPARED', printNode.innerHTML);
    console.log('PARTS', this.parts);
    /**
     * END DEBUG
     */
  }
}
