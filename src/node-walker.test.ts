import { buildTemplate } from "./template-parser.js";
import { findParts, type PartDefinition } from "./node-walker.js";
import { AttributePart, CommentPart, NodePart } from "./parts.js";

import { describe, it, expect } from "vitest";
const html = (strings: TemplateStringsArray, ..._values: unknown[]) => strings;
// The attribute name of a part definition, if it is an AttributePart
const attributeOf = (part: PartDefinition) =>
  "attribute" in part ? part.attribute : undefined;

describe("nodeWalker", () => {
  describe("findParts", () => {
    it(`Correctly detects part types`, () => {
      const strings = html`<!--${0}--><div a=${1}>${2}</div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0]!.type).to.equal(CommentPart);
      expect(parts[1]!.type).to.equal(AttributePart);
      expect(parts[2]!.type).to.equal(NodePart);
    });

    it(`Returns the correct path for node parts`, () => {
      const strings = html`<div>${0}<div>${0}</div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0]!.path).to.deep.equal([0, 0]);
      expect(parts[1]!.path).to.deep.equal([0, 1, 0]);
    });

    it(`Considers text nodes in paths`, () => {
      const strings = html`<div> ${0} <div> ${0}</div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0]!.path).to.deep.equal([0, 1]);
      expect(parts[1]!.path).to.deep.equal([0, 3, 1]);
    });

    it(`Considers comment nodes in paths`, () => {
      const strings = html`<div><!-- -->${0}<!-- --><div><!-- -->${0}</div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0]!.path).to.deep.equal([0, 1]);
      expect(parts[1]!.path).to.deep.equal([0, 3, 1]);
    });

    it(`Returns the correct path for attribute parts`, () => {
      const strings = html`<div a=${0}><div></div><div a=${0}></div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0]!.path).to.deep.equal([0]);
      expect(parts[1]!.path).to.deep.equal([0, 1]);
    });

    it(`Returns the correct path for attribute parts`, () => {
      const strings = html`<div a=${0}><div></div><div a=${0}></div></div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(parts[0]!.path).to.deep.equal([0]);
      expect(parts[1]!.path).to.deep.equal([0, 1]);
    });

    it(`Preserves original attribute names`, () => {
      const strings = html`
        <div
          a=${0}
          a-b=${1}
          👍=${2}
          (a)=${3}
          [a]=${4}
          a$=${5}
          $a=${6}>
        </div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(attributeOf(parts[0]!)).to.equal("a");
      expect(attributeOf(parts[1]!)).to.equal("a-b");
      expect(attributeOf(parts[2]!)).to.equal("👍");
      expect(attributeOf(parts[3]!)).to.equal("(a)");
      expect(attributeOf(parts[4]!)).to.equal("[a]");
      expect(attributeOf(parts[5]!)).to.equal("a$");
      expect(attributeOf(parts[6]!)).to.equal("$a");
    });

    it(`Preserves prefixes in the attribute name`, () => {
      const strings = html`
        <div
          .a=${0}
          ?a=${1}
          @a=${2}>
        </div>`;
      const template = buildTemplate(strings);
      const parts = findParts(strings, template);
      expect(attributeOf(parts[0]!)).to.equal(".a");
      expect(attributeOf(parts[1]!)).to.equal("?a");
      expect(attributeOf(parts[2]!)).to.equal("@a");
    });

    it(`throws an Error when an attribute contains the '>' character`, () => {
      let strings = html`
        <div
          a=">"
          b=${0}>
        </div>`;
      let template = buildTemplate(strings);
      expect(() => findParts(strings, template)).to.throw();

      strings = html`
        <div
          a=">"
          b="${0}">
        </div>`;
      template = buildTemplate(strings);
      expect(() => findParts(strings, template)).to.throw();
    });

    it(`removes the dynamic attributes from the template`, () => {
      const strings = html`<div a=${0} .b=${1} c="2"></div>`;
      const template = buildTemplate(strings);
      findParts(strings, template);
      expect(template.innerHTML).to.equal('<div c="2"></div>');
    });

    it(`throws an Error when a part is inside an element that does not contain HTML`, () => {
      const elements = {
        textarea: html`<textarea>${0}</textarea>`,
        title: html`<title>${0}</title>`,
        style: html`<style>p { color: ${0} }</style>`,
        script: html`<script>${0}</script>`,
        template: html`<template><p>${0}</p></template>`,
      };
      Object.entries(elements).forEach(([element, strings]) => {
        const template = buildTemplate(strings);
        expect(() => findParts(strings, template)).to.throw(
          `Parts are not allowed inside <${element}> elements`,
        );
      });

      const strings = html`<textarea a=${0}></textarea><template a=${0}></template>`;
      const template = buildTemplate(strings);
      expect(() => findParts(strings, template)).to.not.throw();
    });

    it(`throws an Error when attributes are assigned to more than once`, () => {
      let strings = html`
        <div
          a=${0}
          a=${1}>
        </div>`;
      let template = buildTemplate(strings);
      expect(() => findParts(strings, template)).to.throw();

      strings = html`
        <div
          a="0"
          a=${1}>
        </div>`;
      template = buildTemplate(strings);
      expect(() => findParts(strings, template)).to.throw();

      // We cannot detect this case, but it does not break rendering
      // The only side-effect is that the static assignment to the variable is ignored
      strings = html`
        <div
          a=${0}
          a="1">
        </div>`;
      template = buildTemplate(strings);
      expect(() => findParts(strings, template)).to.not.throw();
    });

    it(`does not break on the 'style' attribute`, () => {
      {
        const strings = html`<div style=${""}></div>`;
        const template = buildTemplate(strings);
        const parts = findParts(strings, template);
        expect(attributeOf(parts[0]!)).to.equal("style");
      }
      {
        const strings = html`<div a=${0} style=${""} b=${1}></div>`;
        const template = buildTemplate(strings);
        const parts = findParts(strings, template);
        expect(attributeOf(parts[0]!)).to.equal("a");
        expect(attributeOf(parts[1]!)).to.equal("style");
        expect(attributeOf(parts[2]!)).to.equal("b");
      }
      {
        const strings = html`<div a=${0} style='' b=${1}></div>`;
        const template = buildTemplate(strings);
        const parts = findParts(strings, template);
        expect(attributeOf(parts[0]!)).to.equal("a");
        expect(attributeOf(parts[1]!)).to.equal("b");
      }
      {
        const strings = html`<div a='' a=${0} style=''></div>`;
        const template = buildTemplate(strings);
        expect(() => findParts(strings, template)).to.throw();
      }
      {
        const strings = html`<div a='' a=${0} style=''>style=${0}</div>`;
        const template = buildTemplate(strings);
        expect(() => findParts(strings, template)).to.throw();
      }
      {
        const strings = html`<div a='' a=${0} style=${""}></div>`;
        const template = buildTemplate(strings);
        expect(() => findParts(strings, template)).to.throw();
      }
      {
        const strings = html`<div a='' a=${0} style=${""}>style=${0}</div>`;
        const template = buildTemplate(strings);
        expect(() => findParts(strings, template)).to.throw();
      }
    });
  });
});
