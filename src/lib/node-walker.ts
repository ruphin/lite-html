import { marker, attributeMarker, commentMarker, nodeMarker, failMarker } from './markers.js';
import { AttributePart, CommentPart, NodePart } from './parts.js';

/**
 * The description of a part in a Template
 *
 * The path is the list of childNodes indices that leads from the template content to the node of the part
 * AttributeParts also have the name of the attribute they represent, including any prefix
 */
export type PartDefinition =
  | { type: typeof NodePart; path: number[] }
  | { type: typeof CommentPart; path: number[] }
  | { type: typeof AttributePart; path: number[]; attribute: string };

const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=$/;

export const findParts = (strings: readonly string[], template: HTMLTemplateElement): PartDefinition[] => {
  const parts: PartDefinition[] = [];

  // Markers that were not parsed as HTML can not become parts, so throw an error to alert the developer
  const failOnMarker = (content: string, element: Element | null) => {
    if (content.includes(marker)) {
      throw new Error(`Parts are not allowed inside <${element?.localName}> elements`);
    }
  };

  // Recursive depth-first tree traversal that finds nodes in the subtree of `node` that are parts
  // The path is an array of incides of childNodes to get to this node
  const recursiveSearch = (node: Node, path: number[]) => {
    // If the node is a CommentNode, check if it is a marker for a CommentPart or NodePart
    if (node instanceof Comment) {
      if (node.data === commentMarker) {
        parts.push({ type: CommentPart, path });
      } else if (node.data === nodeMarker) {
        // The NodePart only needs the position of this comment, so empty it to keep the rendered DOM clean
        node.data = '';
        parts.push({ type: NodePart, path });
      }
      // If it is not a marker for a Part, it is a regular comment
    } else if (node instanceof Text) {
      // The content of elements like <style>, <script>, and <textarea> is parsed as a single TextNode
      failOnMarker(node.data, node.parentElement);
    } else {
      // If the node is an ElementNode, it may contain AttributeParts
      if (node instanceof Element) {
        // If the node has the failMarker, the context was incorrectly recognised as a Node context
        // This happens when an attribute literal contains the '>' character
        // There is no way to fix this, so throw an error to alert the developer to fix it
        if (node.hasAttribute(failMarker)) {
          throw new Error("The '>' character is not allowed in attribute literals. Replace with '&gt;'");
        }
        // The content of a nested <template> is not part of its childNodes, so it is not searched for parts
        if (node.localName === 'template') {
          failOnMarker(node.innerHTML, node);
        }
        // If the node has any AttributeParts, it will have the attributeMarker attribute set
        if (node.hasAttribute(attributeMarker)) {
          node.removeAttribute(attributeMarker);

          // Find the dynamic attributes by checking all attribute values against the attributeMarker
          const dynamicAttributes = [...node.attributes].filter(attribute => attribute.value === attributeMarker);

          for (const dynamicAttribute of dynamicAttributes) {
            // The AttributePart renders the real attribute, so remove the marker from the template
            node.removeAttributeNode(dynamicAttribute);
            // Find the name of this AttributePart using the lastAttributeNameRegex on the string before this part
            const attribute = lastAttributeNameRegex.exec(strings[parts.length])![1];
            parts.push({ type: AttributePart, path, attribute });
          }
        }
      }

      // Recursively search all children of this node
      const children = node.childNodes;
      const length = children.length;
      for (let i = 0; i < length; i++) {
        recursiveSearch(children[i], [...path, i]);
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
