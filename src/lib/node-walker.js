import { attributeMarker, commentMarker, nodeMarker } from './markers.js';
import { AttributePart, CommentPart, NodePart } from './parts.js';

const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;

export const findParts = (strings, template) => {
  let parts = [];

  // Recursive depth-first tree traversal that finds nodes in the subtree of `node` that are parts.
  const recursiveIndex = (node, path) => {
    if (node.nodeType === 8) {
      if (node.nodeValue === commentMarker) {
        parts.push({ type: CommentPart, path });
      } else if (node.nodeValue === nodeMarker) {
        parts.push({ type: NodePart, path });
      }
      return;
    }

    // Element Node
    if (node.nodeType === 1) {
      // All nodes with attribute parts have the attributeMarker set as an attribute
      if (node.hasAttribute(attributeMarker)) {
        node.removeAttribute(attributeMarker);

        const attributes = Array.from(node.attributes);
        const dynamicAttributes = attributes.filter(attribute => attribute.value === attributeMarker);

        for (let i = 0; i < dynamicAttributes.length; i++) {
          const attributeMatch = lastAttributeNameRegex.exec(strings[parts.length]);
          if (attributeMatch) {
            const attribute = attributeMatch[1];
            parts.push({ type: AttributePart, path, attribute });
          } else {
            throw new Error(`Invalid part: ${strings[parts.length]}\${ !! }${strings[parts.length + 1]}`);
          }
        }
      }
    }
    const children = node.childNodes;
    const length = children.length;
    for (let i = 0; i < length; i++) {
      recursiveIndex(children[i], path.concat([i]));
    }
  };

  recursiveIndex(template.content, []);
  return parts;
};
