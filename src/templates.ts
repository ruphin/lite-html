import { findParts, type PartDefinition } from "./node-walker.js";
import { buildTemplate } from "./template-parser.js";
import {
  AttributePart,
  CommentPart,
  NodePart,
  type Part,
  type RenderOptions,
} from "./parts.js";

/**
 * A map that contains all the template literals we have seen before
 * It maps from a String array to a Template object
 */
const templateMap = new WeakMap<readonly string[], Template>();

/**
 * Template holds the DocumentFragment that is to be used as a prototype for instances of this template
 * When a template is to be rendered in a new location, a clone will be made from this
 */
export class Template {
  // The unique string array that this template represents
  strings: readonly string[];
  // The template element whose content can be cloned to make instances of this template
  element: HTMLTemplateElement;
  // The descriptions of the parts in this Template. Each part has a path which defines a unique location in the
  // template DOM tree, a type which defines the part type, and an optional attribute which defines the name of
  // the attribute this part represents.
  parts: PartDefinition[];

  constructor(strings: readonly string[], isSvg?: boolean) {
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
  strings: readonly string[];
  values: readonly unknown[];
  isSvg: boolean | undefined;
  _template: Template | undefined;

  constructor(
    strings: readonly string[],
    values: readonly unknown[],
    isSvg?: boolean,
  ) {
    this.strings = strings;
    this.values = values;
    this.isSvg = isSvg;
    this._template = undefined;
  }

  /**
   * A unique Template object.
   * Each evaluation of html`..` yields a new TemplateResult object, but they will have the same
   * Template object when they are the result of the same html`..` literal.
   */
  get template(): Template {
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
 */
export class TemplateInstance {
  // The unique Template object that this is an instance of
  template: Template;
  // The DocumentFragment that is a clone of the Template's prototype DocumentFragment
  // It holds the nodes of this instance until they are inserted into the DOM
  fragment: DocumentFragment;
  // The parts that render into this template instance
  parts: Part[];

  constructor(template: Template, options?: RenderOptions) {
    this.template = template;
    // Importing the nodes into the document upgrades custom elements before the parts render into them
    this.fragment = document.importNode(template.element.content, true);

    // Create new Parts based on the part definitions set on the Template
    this.parts = template.parts.map((definition) => {
      let node: Node = this.fragment;
      definition.path.forEach((nodeIndex) => {
        node = node.childNodes[nodeIndex]!;
      });
      if ("attribute" in definition) {
        return new AttributePart({
          node: node as Element,
          attribute: definition.attribute,
          options,
        });
      }
      if (definition.type === CommentPart) {
        return new CommentPart({ node: node as Comment });
      }
      return new NodePart({ node, options });
    });
  }

  /**
   * Render values into the parts of this TemplateInstance
   * There should be one value per part
   */
  render(values: readonly unknown[]): void {
    this.parts.forEach((part, index) => part.render(values[index]));
  }
}
