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
    this.template = template;
    this.fragment = template.element.content.cloneNode(true);
    this.parts = [];
    templateWalker(this.fragment, this.template.parts, (part, comment) => {
      if (part.type === 'node') {
        // DO THINGS
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
