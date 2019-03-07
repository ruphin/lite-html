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

const htmlStrings = s => s;
const input = htmlStrings`
<div>
  <style type=${1}>
    div {
      color: ${'red'};
      font-weight: ${'bold'};
    }
  </style>
  <style>
    /* <!-- ${1} --> */
  </style>
  Text <span thing attr = ${1}></span>
  <div font="fine" color='"red ${1} blue ${1} yellow' name=bob hue='cyan${1}'> More ${1}Text</div>
  ${1}<!-- Things${1} More things${1} --> After${1} <!----> Text
</div>`;

const NodePart = class NodePart {};
const AttributePart = class AttributePart {};
const StylePart = class StylePart {};
const CommentPart = class CommentPart {};

const marker = `$lit$`;
const nodeMarker = `<!--${marker}-->`;
const commentMarker = `-->${nodeMarker}<!--`;

const nodeRegex = /<[^\0-\x1F\x7F-\x9F "'>=/]+/;

const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

const nodeEscapeRegex = /([>'"])/;
const closeCommentRegex = /-->/;
const closeStyleRegex = /<\/style>/;

const output = [];
const parts = [];
let partIndex = -1;
let count = 0;

const nodeContext = string => {
  const match = string.match(nodeRegex);
  if (match) {
    output.push(string.slice(0, match.index));
    string = string.slice(match.index);
    if (string.slice(0, 4) === `<!--`) {
      context = commentContext;
    } else {
      context = attributeContext;
      if (string.slice(0, 6) === `<style`) {
        nextContext = styleContext;
      } else {
        nextContext = nodeContext;
      }
    }
    return string;
  } else {
    output.push(string, nodeMarker);
    parts.push({ part: NodePart, index: ++partIndex });
    return '';
  }
};

const commentContext = string => {
  const match = string.match(closeCommentRegex);
  if (match) {
    output.push(string.slice(0, match.index + 3));
    context = nodeContext;
    return string.slice(match.index + 3);
  } else {
    parts.push({ part: CommentPart, index: ++partIndex });
    output.push(string, commentMarker);
    return '';
  }
};

let styleHasBinding = false;
const styleContext = string => {
  const match = string.match(closeStyleRegex);
  if (match) {
    output.push(string.slice(0, match.index + 8));
    if (styleHasBinding) {
      parts[parts.length - 1].after = string;
      output.push(nodeMarker);
      styleHasBinding = false;
    }
    context = nodeContext;
    return string.slice(match.index + 8);
  } else {
    if (!styleHasBinding) {
      partIndex++;
      styleHasBinding = true;
    }
    parts.push({ part: StylePart, index: partIndex, before: string });
    output.push(string, marker);
    return '';
  }
};

let nodeString = [];
let nodeHasBinding = false;
let attributeDelimiter;
const attributeContext = string => {
  let match = string.match(nodeEscapeRegex);
  if (match) {
    if (match[1] === `>`) {
      if (nodeHasBinding) {
        output.push(nodeMarker);
        nodeHasBinding = false;
      }
      context = nextContext;
      output.push(nodeString.join(''), string.slice(0, match.index + 1));
      nodeString = [];
      return string.slice(match.index + 1);
    } else {
      attributeDelimiter = match[1];
      context = attributeStringContext;
      nodeString.push(string.slice(0, match.index + 1));
      return string.slice(match.index + 1);
    }
  } else {
    // Bare attribute
    if (!nodeHasBinding) {
      partIndex++;
      nodeHasBinding = true;
    }
    match = string.match(lastAttributeNameRegex);
    parts.push({ part: AttributePart, index: partIndex, attribute: match[2] });
    nodeString.push(string.slice(0, match.index));
    return '';
  }
};

let attributeHasBinding = false;
const attributeStringContext = string => {
  const index = string.indexOf(attributeDelimiter);
  if (index >= 0) {
    if (attributeHasBinding === true) {
      parts[parts.length - 1].after = string.slice(0, index);
    } else {
      nodeString.push(string.slice(0, index + 1));
    }
    attributeHasBinding = false;
    context = attributeContext;
    return string.slice(index + 1);
  } else {
    if (attributeHasBinding) {
      parts.push({ type: attributeContext, index: partIndex, attribute: parts[parts.length - 1].attribute, before: string });
    } else {
      let match = nodeString[nodeString.length - 1].match(lastAttributeNameRegex);
      nodeString[nodeString.length - 1] = nodeString[nodeString.length - 1].slice(0, match.index);
      if (!nodeHasBinding) {
        partIndex++;
        nodeHasBinding = true;
      }
      parts.push({ type: attributeContext, index: partIndex, attribute: match[2], before: string });
      attributeHasBinding = true;
    }
    return '';
  }
};

let context = nodeContext;
let nextContext;

const endIndex = input.length - 1;
for (let i = 0; i < endIndex; i++) {
  let string = input[i];
  do {
    string = context(string);
  } while (string.length > 0);
}

output.push(input[endIndex]);

const template = document.createElement('template');
template.innerHTML = output.join('');

const fragment = template.content.cloneNode(true);

const walker = document.createTreeWalker(fragment, 128 /* NodeFilter.SHOW_COMMENT */, null, false);

document.getElementById('tree').innerText = output.join('');
console.log(parts);
