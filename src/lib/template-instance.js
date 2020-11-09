import { NodePart, AttributeCommitter, CommentCommitter } from './parts.js';
import { templateWalker } from './template-walker.js';

/**
 * An instance of a template that can be rendered somewhere
 *
 * @prop {Template} template
 *   The unique Template object that this is an instance of
 * @prop {[DocumentFragment]} fragment
 *   The DocumentFragment that is a clone of the Template's prototype DocumentFragment
 * @prop {[AttributePart|CommentPart|NodePart]} parts
 *   The parts that render into this template instance
 */
export class TemplateInstance {
  constructor(template) {
    const parts = [];
    const fragment = document.importNode(template.element.content, true);
    const walker = templateWalker(fragment, template.parts);
    this.parts = parts;
    this.template = template;
    this.fragment = fragment;
    window.weirdFragment = fragment;

    walker((markerNode, partDescription) => {
      const partType = partDescription.type;
      if (partType === 'node') {
        const part = new NodePart();
        const beforeNode = markerNode.previousSibling;
        markerNode.parentNode.removeChild(markerNode);
        part.insertAfterNode(beforeNode);
        parts.push(part);
      } else if (partType === 'scoped') {
        let before = markerNode.previousSibling.firstChild;
        let after = before.nextSibling;
        while (after) {
          const part = new NodePart();
          part.insertAfterNode(before);
          parts.push(part);
          before = after;
          after = after.nextSibling;
        }
        markerNode.parentNode.removeChild(markerNode);
      } else if (partType === 'comment') {
        const node = markerNode;
        const strings = partDescription.strings;
        const committer = new CommentCommitter({ node, strings });
        parts.push(...committer.parts);
      } else if (partType === 'attribute') {
        const node = markerNode.nextSibling;
        partDescription.attrs.forEach(attribute => {
          const committer = new AttributeCommitter({ node, ...attribute });
          parts.push(...committer.parts);
        });
        markerNode.parentNode.removeChild(markerNode);
      }
    });
  }

  /**
   * Render values into the parts of this TemplateInstance
   *
   * @param {[any]} values
   *   An array of values to render into the parts. There should be one value per part
   */
  render(values) {
    this.parts.map((part, index) => part.setValue(values[index]));
    this.parts.map(part => part.commit());
  }
}
