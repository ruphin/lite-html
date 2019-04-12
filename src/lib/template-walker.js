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

import { marker, templateMarker } from './markers.js';
const walker = document.createTreeWalker(document, 128 /* NodeFilter.SHOW_COMMENT */, null, false);

export const templateWalker = (templateElement, parts) => handler => {
  const stack = [];
  let commentNode;
  walker.currentNode = templateElement.content;

  parts.forEach(part => {
    // This while(true) looks scary, but we are guaranteed to break or throw an Error eventually
    while (true) {
      commentNode = walker.nextNode();
      if (commentNode === null) {
        walker.currentNode = stack.pop();
      } else if (commentNode.data === marker) {
        handler(commentNode, part);
        break;
      } else if (commentNode.data === templateMarker) {
        const template = commentNode.nextSibling;
        walker.currentNode = template.content;
        stack.push(template);
      }
    }
  });
};
