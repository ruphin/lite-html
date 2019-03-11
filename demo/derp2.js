/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = Math.random()
  .toString(36)
  .slice(2)
  .padStart(10, '0');
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updateable Template that tracks the location of dynamic parts.
 */
class Template {
  constructor(result, element) {
    this.parts = [];
    this.element = element;
    const nodesToRemove = [];
    const stack = [];
    // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
    const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
    // Keeps track of the last index associated with a part. We try to delete
    // unnecessary nodes, but we never want to associate two different parts
    // to the same index. They must have a constant node between.
    let lastPartIndex = 0;
    let index = -1;
    let partIndex = 0;
    while (true) {
      const node = walker.nextNode();
      if (node === null) {
        const template = stack.pop();
        if (!template) {
          // Done traversing.
          break;
        }
        // We've exhausted the content inside a nested template element. Reset
        // the walker to the template element itself and try to walk from there.
        walker.currentNode = template;
        continue;
      }
      index++;
      if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
        if (node.hasAttributes()) {
          const attributes = node.attributes;
          const { length } = attributes;
          // Per
          // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
          // attributes are not guaranteed to be returned in document order.
          // In particular, Edge/IE can return them out of order, so we cannot
          // assume a correspondance between part index and attribute index.
          let count = 0;
          for (let i = 0; i < length; i++) {
            if (attributes[i].value.indexOf(marker) >= 0) {
              count++;
            }
          }
          while (count-- > 0) {
            // Get the template literal section leading up to the first
            // expression in this attribute
            const stringForPart = result.strings[partIndex];
            // Find the attribute name
            const name = lastAttributeNameRegex.exec(stringForPart)[2];
            // Find the corresponding attribute
            // All bound attributes have had a suffix added in
            // TemplateResult#getHTML to opt out of special attribute
            // handling. To look up the attribute value we also need to add
            // the suffix.
            const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
            const attributeValue = node.getAttribute(attributeLookupName);
            const strings = attributeValue.split(markerRegex);
            this.parts.push({ type: 'attribute', index, name, strings });
            node.removeAttribute(attributeLookupName);
            partIndex += strings.length - 1;
          }
        }
        if (node.tagName === 'TEMPLATE') {
          stack.push(node);
          walker.currentNode = node.content;
        }
      } else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
        const data = node.data;
        if (data.indexOf(marker) >= 0) {
          const parent = node.parentNode;
          const strings = data.split(markerRegex);
          const lastIndex = strings.length - 1;
          // Generate a new text node for each literal section
          // These nodes are also used as the markers for node parts
          for (let i = 0; i < lastIndex; i++) {
            parent.insertBefore(strings[i] === '' ? createMarker() : document.createTextNode(strings[i]), node);
            this.parts.push({ type: 'node', index: ++index });
          }
          // If there's no text, we must insert a comment to mark our place.
          // Else, we can trust it will stick around after cloning.
          if (strings[lastIndex] === '') {
            parent.insertBefore(createMarker(), node);
            nodesToRemove.push(node);
          } else {
            node.data = strings[lastIndex];
          }
          // We have a part for each match found
          partIndex += lastIndex;
        }
      } else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
        if (node.data === marker) {
          const parent = node.parentNode;
          // Add a new marker node to be the startNode of the Part if any of
          // the following are true:
          //  * We don't have a previousSibling
          //  * The previousSibling is already the start of a previous part
          if (node.previousSibling === null || index === lastPartIndex) {
            index++;
            parent.insertBefore(createMarker(), node);
          }
          lastPartIndex = index;
          this.parts.push({ type: 'node', index });
          // If we don't have a nextSibling, keep this node so we have an end.
          // Else, we can remove it to save future costs.
          if (node.nextSibling === null) {
            node.data = '';
          } else {
            nodesToRemove.push(node);
            index--;
          }
          partIndex++;
        } else {
          let i = -1;
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            // Comment node has a binding marker inside, make an inactive part
            // The binding won't work, but subsequent bindings will
            // TODO (justinfagnani): consider whether it's even worth it to
            // make bindings in comments work
            this.parts.push({ type: 'node', index: -1 });
          }
        }
      }
    }
    // Remove text binding nodes after the walk to not disturb the TreeWalker
    for (const n of nodesToRemove) {
      n.parentNode.removeChild(n);
    }
  }
}
export const isTemplatePartActive = part => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
export const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#attributes-0
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-character
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;
//# sourceMappingURL=template.js.map

const getHTML = strings => {
  const endIndex = strings.length - 1;
  let html = '';
  for (let i = 0; i < endIndex; i++) {
    const s = strings[i];
    // This exec() call does two things:
    // 1) Appends a suffix to the bound attribute name to opt out of special
    // attribute value parsing that IE11 and Edge do, like for style and
    // many SVG attributes. The Template class also appends the same suffix
    // when looking up attributes to create Parts.
    // 2) Adds an unquoted-attribute-safe marker for the first expression in
    // an attribute. Subsequent attribute expressions will use node markers,
    // and this is safe since attributes with multiple expressions are
    // guaranteed to be quoted.
    const match = lastAttributeNameRegex.exec(s);
    if (match) {
      // We're starting a new bound attribute.
      // Add the safe attribute suffix, and use unquoted-attribute-safe
      // marker.
      html += s.substr(0, match.index) + match[1] + match[2] + boundAttributeSuffix + match[3] + marker;
    } else {
      // We're either in a bound node, or trailing bound attribute.
      // Either way, nodeMarker is safe to use.
      html += s + nodeMarker;
    }
  }
  return html + strings[endIndex];
};

getTemplateElement = strings => {
  const template = document.createElement('template');
  template.innerHTML = getHTML(strings);
  return template;
};

export const thing = strings => {
  const result = { strings };
  return new Template(getTemplateElement(result, getTemplateElement(strings)));
};
