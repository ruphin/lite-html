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

import { AttributePart, CommentPart, NodePart, StylePart } from './parts.js';

import { marker, nodeMarker, commentMarker } from './markers.js';

const tagRegex = /<[^\0-\x1F\x7F-\x9F "'>=/]+(>)?/;

const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

const nodeEscapeRegex = /([>'"])/;
const closeCommentRegex = /-->/;
const closeStyleRegex = /<\/style>/;

export const parseStrings = strings => {
  const output = [];
  const parts = [];

  const parseText = string => {
    const match = string.match(tagRegex);
    if (match) {
      output.push(string.slice(0, match.index));
      string = string.slice(match.index);
      if (string.slice(0, 4) === `<!--`) {
        parse = parseComment;
      } else {
        parse = parseTag;
        if (string.slice(0, 6) === `<style`) {
          nextContext = parseStyle;
        } else {
          nextContext = parseText;
        }
        // Skip parsing attributes if the tag is immediately closed;
        if (match[1] === '>') {
          output.push(match[0]);
          string = string.slice(match[0].length);
          parse = nextContext;
        }
      }
      return string;
    } else {
      output.push(string, nodeMarker);
      parts.push([]);
      parts[parts.length - 1].push({ part: NodePart });
      return '';
    }
  };

  const parseComment = string => {
    const match = string.match(closeCommentRegex);
    if (match) {
      output.push(string.slice(0, match.index + 3));
      parse = parseText;
      return string.slice(match.index + 3);
    } else {
      parts.push([]);
      parts[parts.length - 1].push({ part: NodePart });
      output.push(string, commentMarker);
      return '';
    }
  };

  let styleHasBinding = false;
  const parseStyle = string => {
    const match = string.match(closeStyleRegex);
    if (match) {
      output.push(string.slice(0, match.index + 8));
      if (styleHasBinding) {
        parts[parts.length - 1].after = string;
        output.push(nodeMarker);
        styleHasBinding = false;
      }
      parse = parseText;
      return string.slice(match.index + 8);
    } else {
      if (!styleHasBinding) {
        parts.push([]);
        styleHasBinding = true;
      }
      parts[parts.length - 1].push({ part: StylePart, before: string });
      output.push(string, marker);
      return '';
    }
  };

  let nodeString = [];
  let nodeHasBinding = false;
  const parseTag = string => {
    let match = string.match(nodeEscapeRegex);
    if (match) {
      if (match[1] === `>`) {
        if (nodeHasBinding) {
          output.push(nodeMarker);
          nodeHasBinding = false;
        }
        parse = nextContext;
        output.push(...nodeString, string.slice(0, match.index + 1));
        nodeString = [];
        return string.slice(match.index + 1);
      } else {
        parse = parseAttribute(match[1]);
        nodeString.push(string.slice(0, match.index + 1));
        return string.slice(match.index + 1);
      }
    } else {
      // Bare attribute
      if (!nodeHasBinding) {
        parts.push([]);
        nodeHasBinding = true;
      }
      match = string.match(lastAttributeNameRegex);
      parts[parts.length - 1].push({ part: AttributePart, attribute: match[2] });
      nodeString.push(string.slice(0, match.index));
      return '';
    }
  };

  let attributeHasBinding = false;
  const parseAttribute = delimiter => string => {
    const index = string.indexOf(delimiter);
    if (index >= 0) {
      if (attributeHasBinding === true) {
        parts[parts.length - 1].after = string.slice(0, index);
      } else {
        nodeString.push(string.slice(0, index + 1));
      }
      attributeHasBinding = false;
      parse = parseTag;
      return string.slice(index + 1);
    } else {
      if (attributeHasBinding) {
        const partList = parts[parts.length - 1];
        parts[parts.length - 1].push({ part: AttributePart, attribute: partList[partList.length - 1].attribute, before: string });
      } else {
        let match = nodeString[nodeString.length - 1].match(lastAttributeNameRegex);
        nodeString[nodeString.length - 1] = nodeString[nodeString.length - 1].slice(0, match.index);
        if (!nodeHasBinding) {
          parts.push([]);
          nodeHasBinding = true;
        }
        parts[parts.length - 1].push({ part: AttributePart, attribute: match[2], before: string });
        attributeHasBinding = true;
      }
      return '';
    }
  };

  let parse = parseText;
  let nextContext;
  for (let i = 0; i < strings.length; i++) {
    let string = strings[i];
    do {
      string = parse(string);
    } while (string.length > 0);
  }
  // Remove the marker inserted at the end
  output.pop();
  return { output, parts };
};
