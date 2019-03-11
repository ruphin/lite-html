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

import { marker, nodeMarker, commentMarker } from './markers.js';

const tagRegex = /<[^\0-\x1F\x7F-\x9F "'>=/]+(>)?/;

const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F "'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d"']*$/;

const nodeEscapeRegex = /([>'"])/;
const closeCommentRegex = /-->/;
const closeStyleRegex = /<\/style>/;

let output;
let parts;
let commentPart;
let stylePart;
let attributePart;
let tagString;
let tagHasBinding;
let parse;

const parseText = string => {
  console.log(`PARSING TEXT | ${string} |`);
  const match = string.match(tagRegex);
  if (match) {
    // Skip parsing tags if the tag is immediately closed;
    if (match[1]) {
      output.push(string.slice(0, match.index), match[0]);
      string = string.slice(match[0].length);
      if (match[0] === '<style>') {
        parse = parseStyle;
      } else {
        parse = parseText;
      }
    } else {
      output.push(string.slice(0, match.index));
      string = string.slice(match.index);
      if (string.slice(0, 4) === `<!--`) {
        parse = parseComment;
      } else  if (string.slice(0, 6) === `<style`) {
        parse = parseTag(parseStyle);
      } else {
        parse = parseTag(parseText);
      }
    }
    return string;
  } else {
    output.push(string, nodeMarker);
    parts.push([{ part: NodePart }]);
    parse = parseText;
    return '';
  }
};

const parseComment = string => {
  console.log(`PARSING COMMENT | ${string} |`);
  const match = string.match(closeCommentRegex);
  if (match) {
    if (commentPart) {
      output.push(nodeMarker);
      commentPart.strings.push(string.slice(0, match.index));
      commentPart = undefined;
    } else {
      output.push('<!--', string.slice(0, match.index + 3));
    }
    console.log("STRING", string.slice(match.index + 3))
    return parseText(string.slice(match.index + 3));
  } else {
    if (!commentPart) {
      commentPart = { committer: CommentCommitter, strings: [] };
      parts.push([commentPart]);
    }
    commentPart.strings.push(string);
    return '';
  }
};

const parseStyle = string => {
  console.log(`PARSING STYLE | ${string} |`);
  const match = string.match(closeStyleRegex);
  if (match) {
    if (stylePart) {
      output.push('</style>', nodeMarker);
      stylePart.strings.push(string.slice(0, match.index));
      console.log("CLOSED STYLE PARSE")
      stylePart = undefined;
      parse = parseText;
    } else {
      console.log("CLOSED STYLE PARSE2")
      output.push(string.slice(0, match.index + 8));
    }
    return parseText(string.slice(match.index + 8));
  } else {
    console.log(parse)
    console.log("CLOSED STYLE PARSE3")
    if (!stylePart) {
      stylePart = { committer: StyleCommitter, strings: [] };
      parts.push([stylePart]);
    }
    stylePart.strings.push(string);
    // output.push(string, marker);
    return '';
  }
};

const parseTag = context => string => {
  console.log(`PARSING TAG | ${string} |`);
  let match = string.match(nodeEscapeRegex);
  if (match) {
    if (match[1] === `>`) {
      if (tagHasBinding) {
        output.push(nodeMarker);
        tagHasBinding = false;
      }
      output.push(...tagString, string.slice(0, match.index + 1));
      tagString = [];
      parse = context;
      return context(string.slice(match.index + 1));
    } else {
      parse = parseAttribute(context, match[1]);
      tagString.push(string.slice(0, match.index + 1));
      return string.slice(match.index + 1);
    }
  } else {
    // Bare attribute
    if (!tagHasBinding) {
      parts.push([]);
      tagHasBinding = true;
    }
    console.log("ATTRIBUTE STRING", string)
    match = string.match(lastAttributeNameRegex);
    parts[parts.length - 1].push({ part: AttributePart, attribute: match[1] });
    tagString.push(string.slice(0, match.index));
    return '';
  }
};

const parseAttribute = (context, delimiter) => string => {
  console.log(`PARSING ATTRIBUTE | ${string} |`);
  const index = string.indexOf(delimiter);
  if (index >= 0) {
    if (attributePart) {
      attributePart.strings.push(string.slice(0, index));
    } else {
      tagString.push(string.slice(0, index + 1));
    }
    attributePart = undefined;
    parse = parseTag(context);
    return string.slice(index + 1);
  } else {
    if (attributePart) {
      attributePart.strings.push(string);
    } else {
      let match = tagString[tagString.length - 1].match(lastAttributeNameRegex);
      tagString[tagString.length - 1] = tagString[tagString.length - 1].slice(0, match.index);
      if (!tagHasBinding) {
        parts.push([]);
        tagHasBinding = true;
      }
      attributePart = { committer: AttributeCommitter, name: match[1], strings: [string] };
      parts[parts.length - 1].push(attributePart);
    }
    return '';
  }
};

export const parseStrings = strings => {
  output = [];
  parts = [];
  tagString = [];
  tagHasBinding = false;
  parse = parseText;

  let string;
  const lastString = strings.length - 1;
  for (let i = 0; i < lastString; i++) {
    string = strings[i];
    do {
      string = parse(string);
    } while (string.length > 0);
  }
  // Only parse the last string until we hit text context;
  string = strings[lastString];
  while (parse !== parseText) {
    string = parse(string);
  }
  output.push(string);
  return { output, parts };
};
