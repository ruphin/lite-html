import { parseStrings } from './template-parser.js';
import { templateWalker } from './template-walker.js';
import { marker } from './markers.js';
import { moveNodes } from './dom.js';

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
  constructor(strings, svg) {
    const { html, parts } = parseStrings(strings);
    this.element = document.createElement('template');
    this.parts = parts;
    if (svg) {
      this.element.innerHTML = `<svg>${html}</svg>`;
      const content = this.element.content;
      const svgElement = content.firstChild;
      content.removeChild(svgElement);
      moveNodes(svgElement, null, null, content);
    } else {
      this.element.innerHTML = html;
    }
    console.log('PARSED', html);
    prepareTemplate(this.element, this.parts);

    const printFragment = this.element.content.cloneNode(true);
    const printNode = document.createElement('div');
    printNode.appendChild(printFragment);
    console.log('PREPARED', printNode.innerHTML);
    console.log('PARTS', this.parts);
  }
}

const prepareTemplate = (templateElement, parts) => {
  templateWalker(templateElement, parts, (part, comment) => {
    if (part.type === 'style') {
      const styleNode = comment.previousSibling;
      part.strings.forEach(string => {
        styleNode.appendChild(document.createTextNode(string));
      });
    }
    if (part.type === 'node') {
      const previousSibling = comment.previousSibling;
      if (!previousSibling) {
        comment.parentNode.insertBefore(document.createComment(''), comment);
      }
      const nextSibling = comment.nextSibling;
      if (!nextSibling || nextSibling.data === marker) {
        comment.parentNode.insertBefore(document.createComment(''), nextSibling);
      }
    }
  });
};
