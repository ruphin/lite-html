import { Template, TemplateResult, TemplateInstance } from '../../src/lib/templates.js';
import { findParts } from '../../src/lib/node-walker.js';
import { buildTemplate } from '../../src/lib/template-parser.js';
import { AttributePart, CommentPart, NodePart } from '../../src/lib/parts.js';

import { describe, it, expect } from 'vitest';
const html = (strings, ...values) => new TemplateResult(strings, values);
const htmlStrings = strings => strings;

describe('templates', () => {
  describe('TemplateResult', () => {
    it(`stores the strings and values`, () => {
      const strings = ['<div>', '</div>'];
      const values = [0];
      const templateResultFromArrays = new TemplateResult(strings, values);
      expect(templateResultFromArrays.strings).to.deep.equal(strings);
      expect(templateResultFromArrays.values).to.deep.equal(values);
      const templateResult = html`<div>${0}</div>`;
      expect(templateResult.strings).to.deep.equal(strings);
      expect(templateResult.values).to.deep.equal(values);
    });

    it(`holds a template`, () => {
      const templateResult = html``;
      expect(templateResult.template instanceof Template).to.be.true;
    });

    it(`lazily loads the template`, () => {
      const templateResult = html``;
      expect(templateResult._template).to.be.undefined;
      expect(templateResult.template instanceof Template).to.be.true;
      expect(templateResult._template instanceof Template).to.be.true;
    });

    it(`returns the same template from different TemplateResults create with the same literal`, () => {
      const template = () => html``;
      const templateResultOne = template();
      const templateResultTwo = template();
      expect(templateResultOne).to.not.equal(templateResultTwo);
      expect(templateResultOne.template).to.equal(templateResultTwo.template);
    });
  });

  describe('Template', () => {
    it(`stores the strings that constructed the template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const template = new Template(strings);
      expect(template.strings).to.deep.equal(strings);
    });

    it(`constructs a template element that holds a DOM template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const template = new Template(strings);
      expect(template.element instanceof HTMLTemplateElement).to.be.true;
    });

    it(`computes the parts for the template`, () => {
      const strings = htmlStrings`<div>${0}</div>`;
      const templateElement = buildTemplate(strings);
      const template = new Template(strings);
      expect(template.parts).to.deep.equal(findParts(strings, templateElement));
    });
  });

  const fragmentString = documentFragment => [].map.call(documentFragment.childNodes, node => node.outerHTML).join('');

  describe('TemplateInstance', () => {
    it(`clones the template document fragment from the source Template`, () => {
      const template = html`<div>${0}</div>`.template;
      const instance = new TemplateInstance(template);
      expect(fragmentString(template.element.content)).to.equal(fragmentString(instance.fragment));

      instance.fragment.appendChild(document.createElement('div'));
      expect(fragmentString(template.element.content)).to.not.equal(fragmentString(instance.fragment));
    });

    it(`constructs Part instances according to the definitions from the Template`, () => {
      const template = html`
        <div id=parent0>
          ${0}
          <div id=parent1>
            ${1}
            ${2}
          </div>
          <div id=parent3>
            ${3}
          </div>
        </div>
        ${4}
        <div id=node5 a=${5}>
          <div id=node6 .a=${6} ?b=${7}>
            <!-- ${8} -->
          <div>
        </div>
        `.template;
      const instance = new TemplateInstance(template);

      expect(instance.parts.length).to.equal(9);

      expect(instance.parts[0] instanceof NodePart).to.be.true;
      expect(instance.parts[0].parentNode.id).to.equal('parent0');
      expect(instance.parts[1] instanceof NodePart).to.be.true;
      expect(instance.parts[1].parentNode.id).to.equal('parent1');
      expect(instance.parts[2] instanceof NodePart).to.be.true;
      expect(instance.parts[2].parentNode.id).to.equal('parent1');
      expect(instance.parts[3] instanceof NodePart).to.be.true;
      expect(instance.parts[3].parentNode.id).to.equal('parent3');
      expect(instance.parts[4] instanceof NodePart).to.be.true;
      expect(instance.parts[4].parentNode).to.equal(instance.fragment);
      expect(instance.parts[5] instanceof AttributePart).to.be.true;
      expect(instance.parts[5].node.id).to.equal('node5');
      expect(instance.parts[6] instanceof AttributePart).to.be.true;
      expect(instance.parts[6].node.id).to.equal('node6');
      expect(instance.parts[6].node.parentNode.id).to.equal('node5');
      expect(instance.parts[7] instanceof AttributePart).to.be.true;
      expect(instance.parts[7].node.id).to.equal('node6');
      expect(instance.parts[8] instanceof CommentPart).to.be.true;
      expect(instance.parts[8].node.parentNode.id).to.equal('node6');
    });

    it(`removes the markers of the parts from the nodes`, () => {
      const instance = new TemplateInstance(html`<div a=${0} .b=${1} ?c=${2} @d=${3}>${4}</div>`.template);
      expect(fragmentString(instance.fragment)).to.equal('<div><!----></div>');
    });

    it(`creates the nodes of svg templates in the SVG namespace`, () => {
      const svg = (strings, ...values) => new TemplateResult(strings, values, true);
      const instance = new TemplateInstance(svg`<circle r=${0}></circle>${1}`.template);
      expect(instance.fragment.childNodes.length).to.equal(3);
      expect(instance.fragment.firstChild.localName).to.equal('circle');
      expect(instance.fragment.firstChild.namespaceURI).to.equal('http://www.w3.org/2000/svg');
      expect(instance.parts.length).to.equal(2);
    });

    it(`calls 'render' on the parts with the correct values`, () => {
      const template = html`${3}${3}${3}`.template;
      const instance = new TemplateInstance(template);
      instance.parts.forEach(part => (part.render = value => (part.__renderCalledWith = value)));
      instance.render([0, 1, 2]);
      expect(instance.parts.every((part, index) => part.__renderCalledWith === index)).to.be.true;
    });
  });
});
