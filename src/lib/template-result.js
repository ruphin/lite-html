import { Template } from './template.js';
/**
 * A map that contains all the template literals we have seen before
 * It maps from a String array to a Template object
 *
 * @typedef {Map.<[String], Template>}
 */
const templateMap = new Map();

/**
 * TemplateResult holds the strings and values that result from a tagged template string literal.
 * TemplateResult can find and return a unique Template object that represents its tagged template string literal.
 */
export class TemplateResult {
  constructor(strings, values) {
    this.strings = strings;
    this.values = values;
  }

  /**
   * @returns {Template}
   *   A singleton Template object for this template string
   *   Each evaluation of html`..` yields a new TemplateResult object, but they will have the same
   *   Template object when they are the result of the same html`..` literal.
   */
  get template() {
    // TODO: Fix for Safari
    let template = templateMap.get(this.strings);
    if (!template) {
      template = this.__createTemplate();
      templateMap.set(this.strings, template);
    }
    return template;
  }

  __createTemplate() {
    return new Template(this.strings);
  }
}

export class SVGTemplateResult extends TemplateResult {
  __createTemplate() {
    return new Template(this.strings, true);
  }
}
