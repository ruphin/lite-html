import { findParts } from './node-walker.js';
import { buildTemplate } from './template-parser.js';
/**
 * A map that contains all the template literals we have seen before
 * It maps from a String array to a Template object
 *
 * @typedef {WeakMap.<[String], Template>}
 */
const templateMap = new WeakMap();

/**
 * Template holds the DocumentFragment that is to be used as a prototype for instances of this template
 * When a template is to be rendered in a new location, a clone will be made from this
 *
 * @prop {[String]} strings
 *   The unique string array that this template represents
 * @prop {[DocumentFragment]} element
 *   The DocumentFragment that can be cloned to make instances of this template
 * @prop {[Object]} parts
 *   The descriptions of the parts in this Template. Each part has a path which defines a unique location in the
 *   template DOM tree, a type which defines the part type, and an optional attribute which defines the name of
 *   the attribute this part represents.
 */
export class Template {
  constructor(strings, isSvg) {
    this.strings = strings;
    this.element = buildTemplate(strings, isSvg);
    this.parts = findParts(strings, this.element);
  }
}

/**
 * TemplateResult holds the strings and values that result from a tagged template string literal.
 * The `isSvg` flag is set for literals tagged with `svg`, their content is parsed as SVG instead of HTML.
 * TemplateResult can find and return a unique Template object that represents its tagged template string literal.
 */
export class TemplateResult {
  constructor(strings, values, isSvg) {
    this.strings = strings;
    this.values = values;
    this.isSvg = isSvg;
    this._template = undefined;
  }

  /**
   * @returns {Template}
   *   A unique Template object..
   *   Each evaluation of html`..` yields a new TemplateResult object, but they will have the same
   *   Template object when they are the result of the same html`..` literal.
   *
   */
  get template() {
    if (this._template) {
      return this._template;
    }
    let template = templateMap.get(this.strings);
    if (!template) {
      template = new Template(this.strings, this.isSvg);
      templateMap.set(this.strings, template);
    }
    this._template = template;
    return template;
  }
}

/**
 * An instance of a template that can be rendered somewhere
 *
 * @prop {Template} template
 *   The unique Template object that this is an instance of
 * @prop {[DocumentFragment]} fragment
 *   The DocumentFragment that is a clone of the Template's prototype DocumentFragment
 *   It holds the nodes of this instance until they are inserted into the DOM
 * @prop {[AttributePart|CommentPart|NodePart|]} parts
 *   The parts that render into this template instance
 */
export class TemplateInstance {
  constructor(template) {
    this.template = template;
    // Importing the nodes into the document upgrades custom elements before the parts render into them
    this.fragment = document.importNode(template.element.content, true);

    // Create new Parts based on the part definitions set on the Template
    this.parts = template.parts.map(({ type, path, attribute }) => {
      let node = this.fragment;
      path.forEach(nodeIndex => {
        node = node.childNodes[nodeIndex];
      });
      return new type({ node, attribute });
    });
  }

  /**
   * Render values into the parts of this TemplateInstance
   *
   * @param {[any]} values
   *   An array of values to render into the parts. There should be one value per part
   */
  render(values) {
    this.parts.forEach((part, index) => part.render(values[index]));
  }
}
