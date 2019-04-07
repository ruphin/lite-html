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

const tagRegex = /<([^\0-\x1F\x7F-\x9F "'>=/]+)/;

// Matches the name of the last attribute that is defined in the current string
const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F "'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d"']*$/;

const nodeEscapeRegex = /([>'"])/;
const closeCommentString = '-->';

// The output HTML string
let html;

// The output Part descriptions
let parts;

// The current Part that is being processed (for multi-part attributes, comments, and scoped contexts)
let currentPart;

// The current Attribute that is being parsed (for multi-part attributes)
let currentAttr;

// The content of the current tag (Everything between < and > characters) that should be included in `html`
let tagString;

// The current context to be parsed [parseText|parseComment|parseScoped|parseTag|parseAttribute]
let parse;

// The next context after parsing a complete tag [parseText|parseScoped]
let nextContext;

// The delimiter for closing the current attribute that is parsed ['|"]
let attributeDelimiter;

// The tagname of the current tag being parsed.
// parseScoped needs this to determine what tag closes the scope (`</${tag}>`)
let tag;

/**
 * Parses a string that is in a free text context (anything outside html tags).
 * It consumes tokens from the input string until it enters another
 * context (through any html opening tag).
 *
 * If the end of the string is reached, it inserts a marker for a Node part.
 *
 * If all text tokens have been consumed, it changes the parsing context
 * (comment, or regular tag). Also sets the next context based on the tag
 * that is encountered (scoped, or text).
 *
 * If a template tag is encountered, it inserts a template marker.
 *
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
      tag = match[1];
      if (tag === 'script' || tag === 'style') {
        nextContext = parseScoped;
      } else {
        if (tag === 'template') {
          html += templateMarkerNode;
        }
        nextContext = parseText;
      }
    }
    return htmlString;
  } else {
    html += htmlString + nodeMarker;
    parts.push({ type: 'node' });
    parse = parseText;
  }
};

/**
 * Parses a string that is in a comment context.
 * It consumes tokens from the input string until the comment closes.
 *
 * If the end of the string is reached, it creates a comment Part.
 *
 * If all comment tokens have been consumed, it changes the context to parsing text.
 */
const parseComment = htmlString => {
  const index = htmlString.indexOf(closeCommentString);
  if (index >= 0) {
    const commentEnd = index + 3;
    if (currentPart) {
      html += nodeMarker;
      currentPart.strings.push(htmlString.slice(0, index));
      parts.push(currentPart);
      currentPart = undefined;
    } else {
      html += htmlString.slice(0, commentEnd);
    }
    parse = parseText;
    return htmlString.slice(commentEnd);
  } else {
    if (!currentPart) {
      currentPart = { type: 'comment', strings: [] };
      htmlString = htmlString.slice(4);
    }
    currentPart.strings.push(htmlString);
  }
};

/**
 * Parses a string that is in a scoped context like inside <style> or <script> blocks.
 * It consumes tokens from the input string until the tag closes.
 *
 * If the end of the string is reached, it creates a scoped Part.
 *
 * If all tokens have been consumed, it changes the context to parsing text.
 */
const parseScoped = htmlString => {
  // Note: This strictly only allows the literal `</tag>` to close scoped tags
  const closeTag = `</${tag}>`;
  const index = htmlString.indexOf(closeTag);
  if (index >= 0) {
    const endIndex = index + closeTag.length;
    if (currentPart) {
      html += closeTag + nodeMarker;
      currentPart.strings.push(htmlString.slice(0, index));
      parts.push(currentPart);
      currentPart = undefined;
    } else {
      html += htmlString.slice(0, endIndex);
    }
    parse = parseText;
    return htmlString.slice(endIndex); // Continue parsing the next context
  } else {
    if (!currentPart) {
      currentPart = { type: 'scoped', strings: [] };
    }
    currentPart.strings.push(htmlString);
  }
};

const parseTag = htmlString => {
  let match = htmlString.match(nodeEscapeRegex);
  if (match) {
    const tagEnd = match.index + 1;
    const tagStringEnding = htmlString.slice(0, tagEnd);
    if (match[1] === `>`) {
      if (currentPart) {
        html += nodeMarker;
        parts.push(currentPart);
        currentPart = undefined;
      }
      html += tagString + tagStringEnding;
      tagString = '';
      parse = nextContext;
    } else {
      attributeDelimiter = match[1];
      tagString += tagStringEnding;
      parse = parseAttribute;
    }
    return htmlString.slice(tagEnd);
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
    } while (htmlString !== undefined); // Important; we must continue parsing when string === ''
  }
  // Only parse the last string until we hit text context
  // This is to close any remaining context surrounding the last part
  htmlString = strings[lastStringIndex];
  while (parse !== parseText) {
    htmlString = parse(htmlString);
  }
  html += htmlString;
  return { html, parts };
};
