import { findParts } from './node-walker.js';
import { parseTemplate } from './template-parser.js';

const templateMap = new Map();

export class Template {
  constructor(strings) {
    this.strings = strings;
    this.element = parseTemplate(strings);
    this.parts = findParts(strings, this.element);
  }
}

export class TemplateResult {
  constructor(strings, values) {
    this.strings = strings;
    this.values = values;
  }

  get template() {
    let template = templateMap.get(this.strings);
    if (!template) {
      template = new Template(this.strings);
      templateMap.set(this.strings, template);
    }
    return template;
  }
}

export class TemplateInstance {
  constructor(template) {
    this.template = template;
    this.partTemplates = new Map();
    this.fragment = template.element.content.cloneNode(true);
    this.initializeParts();
  }

  initializeParts() {
    const parts = this.template.parts.map(part => {
      let node = this.fragment;
      part.path.forEach(nodeIndex => {
        node = node.childNodes[nodeIndex];
      });
      part.node = node;
      return part;
    });
    this.parts = parts.map(part => new part.type(part.node, part.attribute));
  }

  update(values) {
    this.parts.map((part, index) => part.update(values[index]));
  }
}
