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

import { attributeMarker, commentMarker, nodeMarker } from './markers.js';

// The second marker is to add a boolean attribute to the element
// This is to easily test if a node has dynamic attributes by checking against that attribute
export const attributeMarkerTag = `${attributeMarker} ${attributeMarker}`;

// The space at the end is necessary, to avoid accidentally closing comments with `<!-->`
export const commentMarkerTag = `--><!--${commentMarker}--><!-- `;

// The extra content at the end is to add a flag to an element when
// a nodeMarkerTag is inserted as an attribute due to an attribute containing `>`
export const nodeMarkerTag = `<!--${nodeMarker}-->`;

export const attributeContext = Symbol('attributeContext');
export const commentContext = Symbol('commentContext');
export const nodeContext = Symbol('nodeContext');
export const unchangedContext = Symbol('unchangedContext');

const contextMap = new Map();
contextMap.set(attributeContext, attributeMarkerTag);
contextMap.set(commentContext, commentMarkerTag);
contextMap.set(nodeContext, nodeMarkerTag);

export const parseContext = string => {
  const openComment = string.lastIndexOf('<!--');
  const closeComment = string.indexOf('-->', openComment + 1);
  const commentClosed = closeComment > -1;
  let type;
  if (openComment > -1 && !commentClosed) {
    type = commentContext;
  } else {
    const closeTag = string.lastIndexOf('>');
    const openTag = string.indexOf('<', closeTag + 1);
    if (openTag > -1) {
      type = attributeContext;
    } else {
      if (closeTag > -1) {
        type = nodeContext;
      } else {
        type = unchangedContext;
      }
    }
  }
  return { commentClosed, type };
};

export const parseTemplate = strings => {
  const html = [];
  const lastStringIndex = strings.length - 1;
  let currentContext = nodeContext;
  for (let i = 0; i < lastStringIndex; i++) {
    const string = strings[i];
    const context = parseContext(string);
    if ((currentContext !== commentContext || context.commentClosed) && context.type !== unchangedContext) {
      currentContext = context.type;
    }
    if (currentContext === attributeContext && string.slice(-1) !== '=') {
      throw new Error('Only bare attribute parts are allowed: `<div a=${0}>`');
    }
    html.push(string);
    html.push(contextMap.get(currentContext));
  }

  html.push(strings[lastStringIndex]);
  return html.join('');
};

export const buildTemplate = strings => {
  const template = document.createElement('template');
  template.innerHTML = parseTemplate(strings);
  return template;
};
