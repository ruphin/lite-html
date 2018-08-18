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

import { IEStyleMarker, attributeMarker, commentMarker, nodeMarker, failMarker } from './markers.js';
import { AttributePart, CommentPart, NodePart } from './parts.js';

const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=$/;
const filter = [].filter;

export const findParts = (strings, template) => {
  let parts = [];

  // Recursive depth-first tree traversal that finds nodes in the subtree of `node` that are parts
  // The path is an array of incides of childNodes to get to this node
  const recursiveSearch = (node, path) => {
    // If the node is a CommentNode, check if it is a marker for a CommentPart or NodePart
    if (node.nodeType === 8) {
      if (node.nodeValue === commentMarker) {
        parts.push({ type: CommentPart, path });
      } else if (node.nodeValue === nodeMarker) {
        parts.push({ type: NodePart, path });
      }
      // If it is not a marker for a Part, it is a regular comment
    } else {
      // If the node is an ElementNode, it may contain AttributeParts
      if (node.nodeType === 1) {
        // If the node has the failMarker, the context was incorrectly recognised as a Node context
        // This happens when an attribute literal contains the '>' character
        // There is no way to fix this, so throw an error to alert the developer to fix it
        if (node.hasAttribute(failMarker)) {
          throw new Error("The '>' character is not allowed in attribute literals. Replace with '&gt;'");
        }
        // If the node has any AttributeParts, it will have the attributeMarker attribute set
        if (node.hasAttribute(attributeMarker)) {
          node.removeAttribute(attributeMarker);

          // Find the number of dynamic attributes by checking all attribute values against the attributeMarker
          let dynamicAttributes = filter.call(node.attributes, attribute => attribute.value === attributeMarker).length;

          // If the node has the 'style' attribute, test against IEStyleMarker to check if the attribute is dynamic
          if (node.getAttribute('style') === IEStyleMarker) {
            dynamicAttributes += 1;
          }

          for (let i = 0; i < dynamicAttributes; i++) {
            // Find the name of this AttributePart using the lastAttributeNameRegex on the string before this part
            const attribute = lastAttributeNameRegex.exec(strings[parts.length])[1];
            parts.push({ type: AttributePart, path, attribute });
          }
        }
      }

      // Recursively search all children of this node
      const children = node.childNodes;
      const length = children.length;
      for (let i = 0; i < length; i++) {
        recursiveSearch(children[i], path.concat([i]));
      }
    }
  };

  // Recursively search the content of the template for parts
  recursiveSearch(template.content, []);

  // If we found less parts than we should, something went wrong
  // Most likely a double attribute assignment was dropped by the HTML parser
  // Throw an error and warn the developer
  if (parts.length < strings.length - 1) {
    throw new Error("Double attribute assignments are not allowed: '<div a=${0} a=${0}>'");
  }
  return parts;
};
