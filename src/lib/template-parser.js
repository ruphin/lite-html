/**
 * @license
 * MIT License
 *
 * Copyright (c) 2026 Goffert van Gool
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

import { attributeMarker, commentMarker, nodeMarker } from './markers.js';

// The second marker is to add a boolean attribute to the element
// This is to easily test if a node has dynamic attributes by checking against that attribute
export const attributeMarkerTag = `${attributeMarker} ${attributeMarker}`;

// The space at the end is necessary, to avoid accidentally closing comments with `<!-->`
export const commentMarkerTag = `--><!--${commentMarker}--><!-- `;

// The extra content at the end is to add a flag to an element when
// a nodeMarkerTag is inserted as an attribute due to an attribute containing `>`
export const nodeMarkerTag = `<!--${nodeMarker}-->`;

export const attributeContext = {};
export const commentContext = {};
export const nodeContext = {};
export const unchangedContext = {};

const markers = new Map([
  [attributeContext, attributeMarkerTag],
  [commentContext, commentMarkerTag],
  [nodeContext, nodeMarkerTag],
]);

// A `<` only opens a tag if it is followed by one of these characters, otherwise the browser treats it as text
const tagOpen = /<[a-zA-Z/!?]/;

export const parseContext = string => {
  const openComment = string.lastIndexOf('<!--');
  const closeComment = string.indexOf('-->', openComment + 1);
  const commentClosed = closeComment > -1;
  let context;
  if (openComment > -1 && !commentClosed) {
    context = commentContext;
  } else {
    const closeTag = string.lastIndexOf('>');
    const openTag = string.slice(closeTag + 1).search(tagOpen);
    if (openTag > -1) {
      context = attributeContext;
    } else {
      if (closeTag > -1) {
        context = nodeContext;
      } else {
        context = unchangedContext;
      }
    }
  }
  return { commentClosed, context };
};

export const parseTemplate = strings => {
  const html = [];
  const lastStringIndex = strings.length - 1;
  let currentContext = nodeContext;
  for (let i = 0; i < lastStringIndex; i++) {
    const string = strings[i];
    const { commentClosed, context } = parseContext(string);
    if ((currentContext !== commentContext || commentClosed) && context !== unchangedContext) {
      currentContext = context;
    }
    if (currentContext === attributeContext && string.slice(-1) !== '=') {
      throw new Error('Only bare attribute parts are allowed: `<div a=${0}>`');
    }
    html.push(string + markers.get(currentContext));
  }

  // A NodePart ends at the next sibling of its marker
  // If the template ends with a part, add a comment so that part does not extend to the end of its future parent
  html.push(strings[lastStringIndex] || '<!---->');
  return html.join('');
};

export const buildTemplate = (strings, isSvg) => {
  const template = document.createElement('template');
  const html = parseTemplate(strings);
  if (isSvg) {
    // Parse the content inside an <svg> element to create it in the SVG namespace, then remove that element again
    template.innerHTML = `<svg>${html}</svg>`;
    const svg = template.content.firstChild;
    svg.replaceWith(...svg.childNodes);
  } else {
    template.innerHTML = html;
  }
  return template;
};
