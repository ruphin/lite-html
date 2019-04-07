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

    template.templateWalker((node, part) => {
      // TODO: create parts here
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
