import { NodePart, AttributeCommitter, CommentCommitter } from './parts.js';

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
    this.template = template;
    this.fragment = document.importNode(template.element.content, true);
    this.parts = [];

    template.templateWalker((markerNode, partDescription) => {
      const partType = partDescription.type;
      if (partType === 'node') {
        parts.push(new NodePart({ node: markerNode }));
      } else if (partType === 'scoped') {
        let before = markerNode.previousSibling.firstChild;
        let after = before.nextSibling;
        while (after) {
          parts.push(new NodePart({ before, after }));
          before = after;
          after = before.nextSibling;
        }
        // Remove markerNode?
      } else if (partType === 'comment') {
        const node = markerNode;
        const strings = partDescription.strings;
        const committer = new CommentCommitter({ node, strings });
        this.parts = this.parts.concat(committer.parts); // TODO: cleaner way?
      } else if (partType === 'attribute') {
        const node = markerNode.nextSiblng;

        // Remove markerNode?
      }
    });

    // Create new Parts based on the part definitions set on the Template
    // const parts = template.parts.map(part => {
    //   let node = this.fragment;
    //   part.path.forEach(nodeIndex => {
    //     node = node.childNodes[nodeIndex];
    //   });
    //   part.node = node;
    //   if (part.type === NodePart) {
    //     if (part.path.length === 1) {
    //       part.parent = parent;
    //       part.before = node.previousSibling || before;
    //       part.after = node.nextSibling || after;
    //     } else {
    //       part.parent = node.parentNode;
    //     }
    //   }
    //   return part;
    // });
    // this.parts = parts.map(part => new part.type(part));
  }

  /**
   * Render values into the parts of this TemplateInstance
   *
   * @param {[any]} values
   *   An array of values to render into the parts. There should be one value per part
   */
  render(values) {
    this.parts.map((part, index) => part.render(values[index]));
  }
}
