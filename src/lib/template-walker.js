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
// import { AttributePart, CommentPart, NodePart } from './parts.js';

// const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=$/;
// const filter = [].filter;

export const templateWalker = (templateElement, parts, callback) => {
  const walker = document.createTreeWalker(templateElement.content, 128 /* NodeFilter.SHOW_COMMENT */, null, false);
  const stack = [];
  let comment;

  parts.forEach(part => {
    while (true) {
      comment = walker.nextNode();
      if (comment === null) {
        walker.currentNode = stack.pop();
      } else if (comment.data === marker) {
        callback(part, comment);
        break;
      } else if (comment.data === templateMarker) {
        const template = comment.nextSibling;
        walker.currentNode = template.content;
        stack.push(template);
      }
    }
  });
};
