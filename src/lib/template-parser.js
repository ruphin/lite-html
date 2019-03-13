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

import { AttributeCommitter, CommentCommitter, NodePart, StyleCommitter } from './parts.js';

import { nodeMarker } from './markers.js';

const tagRegex = /<[^\0-\x1F\x7F-\x9F "'>=/]+(>)?/;

const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F "'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d"']*$/;

const nodeEscapeRegex = /([>'"])/;
const closeCommentRegex = /-->/;
// Note: This strictly only allows the literal `</style>` to close style tags
const closeStyleRegex = /<\/style>/;

let htmlString;
let parts;
let currentPart;
let tagString;
let tagHasBinding;
let parse;
let parseContext;

const parseText = string => {
  const match = string.match(tagRegex);
  if (match) {
    // Skip parsing tags if the tag is immediately closed;
    if (match[1]) {
      htmlString += string.slice(0, match.index) + match[0];
      string = string.slice(match[0].length + match.index);
      if (match[0] === '<style>') {
        parse = parseStyle;
      } else {
        parse = parseText;
      }
    } else {
      htmlString += string.slice(0, match.index);
      string = string.slice(match.index);
      if (string.slice(0, 4) === `<!--`) {
        parse = parseComment;
      } else {
        parse = parseTag;
        if (string.slice(0, 6) === `<style`) {
          parseContext = parseStyle;
        } else {
          parseContext = parseText;
        }
      }
    }
    return string;
  } else {
    htmlString += string + nodeMarker;
    parts.push([{ part: NodePart }]);
    parse = parseText;
    return;
  }
};

const parseComment = string => {
  const match = string.match(closeCommentRegex);
  if (match) {
    const commentEnd = match.index + 3;
    if (currentPart) {
      htmlString += nodeMarker;
      currentPart.strings.push(string.slice(0, match.index));
      currentPart = undefined;
    } else {
      htmlString += string.slice(0, commentEnd);
    }
    return parseText(string.slice(commentEnd));
  } else {
    if (!currentPart) {
      currentPart = { committer: CommentCommitter, strings: [] };
      parts.push([currentPart]);
      string = string.slice(4);
    }
    currentPart.strings.push(string);
    return;
  }
};

const parseStyle = string => {
  const match = string.match(closeStyleRegex);
  if (match) {
    const styleEnd = match.index + 8;
    if (currentPart) {
      htmlString += '</style>' + nodeMarker;
      currentPart.strings.push(string.slice(0, match.index));
      currentPart = undefined;
      parse = parseText;
    } else {
      htmlString += string.slice(0, styleEnd);
    }
    parse = parseText;
    return string.slice(styleEnd);
  } else {
    if (!currentPart) {
      currentPart = { committer: StyleCommitter, strings: [] };
      parts.push([currentPart]);
    }
    currentPart.strings.push(string);
    // output.push(string, marker);
    return;
  }
};

const parseTag = string => {
  let match = string.match(nodeEscapeRegex);
  if (match) {
    if (match[1] === `>`) {
      if (tagHasBinding) {
        htmlString += nodeMarker;
        tagHasBinding = false;
      }
      htmlString += tagString + string.slice(0, match.index + 1);
      tagString = '';
      parse = parseContext;
      return string.slice(match.index + 1);
    } else {
      parse = parseAttribute(match[1]);
      tagString += string.slice(0, match.index + 1);
      return string.slice(match.index + 1);
    }
  } else {
    // Bare attribute
    if (!tagHasBinding) {
      parts.push([]);
      tagHasBinding = true;
    }
    match = string.match(lastAttributeNameRegex);
    parts[parts.length - 1].push({ committer: AttributeCommitter, name: match[1] });
    tagString += string.slice(0, match.index);
    return;
  }
};

const parseAttribute = delimiter => string => {
  const index = string.indexOf(delimiter);
  if (index >= 0) {
    if (currentPart) {
      currentPart.strings.push(string.slice(0, index));
    } else {
      tagString += string.slice(0, index + 1);
    }
    currentPart = undefined;
    parse = parseTag;
    return string.slice(index + 1);
  } else {
    if (currentPart) {
      currentPart.strings.push(string);
    } else {
      const match = tagString.match(lastAttributeNameRegex);
      tagString = tagString.slice(0, match.index);
      if (!tagHasBinding) {
        parts.push([]);
        tagHasBinding = true;
      }
      currentPart = { committer: AttributeCommitter, name: match[1], strings: [string] };
      parts[parts.length - 1].push(currentPart);
    }
    return;
  }
};

export const parseStrings = strings => {
  htmlString = '';
  tagString = '';
  parts = [];
  tagHasBinding = false;
  parse = parseText;

  let string;
  const lastString = strings.length - 1;
  for (let i = 0; i < lastString; i++) {
    string = strings[i];
    do {
      string = parse(string);
    } while (string !== undefined); // Important, we must continue when string === ''
  }
  // Only parse the last string until we hit text context;
  string = strings[lastString];
  while (parse !== parseText) {
    string = parse(string);
  }
  htmlString += string;
  return { htmlString, parts };
};
