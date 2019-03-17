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

// import { AttributeCommitter, CommentCommitter, NodePart, StyleCommitter } from './parts.js';

import { nodeMarker, templateMarkerNode } from './markers.js';

const tagRegex = /<[^\0-\x1F\x7F-\x9F "'>=/]+/;

const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F "'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d"']*$/;

const nodeEscapeRegex = /([>'"])/;
const closeCommentRegex = /-->/;
// Note: This strictly only allows the literal `</style>` to close style tags
const closeStyleRegex = /<\/style>/;

let html;
let parts;
let currentPart;
let currentAttr;
let tagString;
let parse;
let parseContext;
let attributeDelimiter;
/**
 * Parses a string that is in a free text context.
 * It consumes tokens from the input string until the context enters another
 * context (tag, comment, style). If the end of the string is reached, it
 * inserts a marker for a dynamic text part. Returns the remainder of the string
 * after all text tokens have been consumed.
 */
const parseText = htmlString => {
  const match = htmlString.match(tagRegex);
  if (match) {
    html += htmlString.slice(0, match.index);
    htmlString = htmlString.slice(match.index);
    if (htmlString.slice(0, 4) === '<!--') {
      parse = parseComment;
    } else {
      parse = parseTag;
      if (htmlString.slice(0, 6) === '<style') {
        parseContext = parseStyle;
      } else {
        if (htmlString.slice(0, 9) === '<template') {
          html += templateMarkerNode;
        }
        parseContext = parseText;
      }
    }
    return htmlString;
  } else {
    html += htmlString + nodeMarker;
    parts.push({ type: 'node' });
    parse = parseText;
    return;
  }
};
/**
 * Parses a string that is in a comment context.
 * It consumes tokens from the input string until the comment closes and returns
 * to a text context. If the end of the string is reached, it inserts a marker
 * for a dynamic comment part.
 */
const parseComment = htmlString => {
  const match = htmlString.match(closeCommentRegex);
  if (match) {
    const commentEnd = match.index + 3;
    if (currentPart) {
      html += nodeMarker;
      currentPart.strings.push(htmlString.slice(0, match.index));
      parts.push(currentPart);
      currentPart = undefined;
    } else {
      html += htmlString.slice(0, commentEnd);
    }
    return parseText(htmlString.slice(commentEnd));
  } else {
    if (!currentPart) {
      currentPart = { type: 'comment', strings: [] };
      htmlString = htmlString.slice(4);
    }
    currentPart.strings.push(htmlString);
    return;
  }
};
/**
 * Parses a string that is in a style context.
 * It consumes tokens from the input string until the style tag closes and
 * returns to a text context. If the end of the string is reached, it inserts a
 * marker for a dynamic comment part.
 */
const parseStyle = htmlString => {
  const match = htmlString.match(closeStyleRegex);
  if (match) {
    const styleEnd = match.index + 8;
    if (currentPart) {
      html += '</style>' + nodeMarker;
      currentPart.strings.push(htmlString.slice(0, match.index));
      parts.push(currentPart);
      currentPart = undefined;
      parse = parseText;
    } else {
      html += htmlString.slice(0, styleEnd);
    }
    parse = parseText;
    return htmlString.slice(styleEnd);
  } else {
    if (currentPart) {
      currentPart.strings.push(htmlString);
    } else {
      currentPart = { type: 'style', strings: [htmlString] };
    }
    return;
  }
};
const parseTag = htmlString => {
  let match = htmlString.match(nodeEscapeRegex);
  if (match) {
    const tagEnd = match.index + 1;
    if (match[1] === `>`) {
      if (currentPart) {
        html += nodeMarker;
        parts.push(currentPart);
        currentPart = undefined;
      }
      html += tagString + htmlString.slice(0, tagEnd);
      tagString = '';
      parse = parseContext;
      return htmlString.slice(tagEnd);
    } else {
      attributeDelimiter = match[1];
      parse = parseAttribute;
      tagString += htmlString.slice(0, tagEnd);
      return htmlString.slice(tagEnd);
    }
  } else {
    // Bare attribute
    match = htmlString.match(lastAttributeNameRegex);
    if (currentPart) {
      currentPart.attrs.push({ name: match[1] });
    } else {
      currentPart = { type: 'attribute', attrs: [{ name: match[1] }] };
    }
    tagString += htmlString.slice(0, match.index);
  }
};
const parseAttribute = htmlString => {
  const index = htmlString.indexOf(attributeDelimiter);
  if (index >= 0) {
    if (currentAttr) {
      currentAttr.strings.push(htmlString.slice(0, index));
      currentAttr = undefined;
    } else {
      tagString += htmlString.slice(0, index + 1);
    }
    parse = parseTag;
    return htmlString.slice(index + 1);
  } else {
    if (currentAttr) {
      currentAttr.strings.push(htmlString);
    } else {
      const match = tagString.match(lastAttributeNameRegex);
      tagString = tagString.slice(0, match.index);
      if (!currentPart) {
        currentPart = { type: 'attribute', attrs: [] };
      }
      currentAttr = { name: match[1], strings: [htmlString] };
      currentPart.attrs.push(currentAttr);
    }
  }
};

export const parseStrings = strings => {
  parts = [];
  html = '';
  tagString = '';
  parse = parseText;

  let htmlString;
  const lastStringIndex = strings.length - 1;
  for (let i = 0; i < lastStringIndex; i++) {
    htmlString = strings[i];
    do {
      htmlString = parse(htmlString);
    } while (htmlString !== undefined); // Important, we must continue when string === ''
  }
  // Only parse the last string until we hit text context;
  htmlString = strings[lastStringIndex];
  while (parse !== parseText) {
    htmlString = parse(htmlString);
  }
  html += htmlString;
  return { html, parts };
};
