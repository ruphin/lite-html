import { attributeMarkerTag, commentMarkerTag, nodeMarkerTag, parseContext, parseTemplate, buildTemplate } from '../../src/lib/template-parser.js';
import { attributeMarker, commentMarker, nodeMarker, failMarker } from '../../src/lib/markers.js';

import { describe, it, expect } from 'vitest';
const html = (strings: TemplateStringsArray, ..._values: unknown[]) => strings;

describe('templateParser', () => {
  describe('parseContext', () => {
    it(`detects comment contexts`, () => {
      expect(parseContext('<!--', nodeMarkerTag)).to.equal(commentMarkerTag);
      expect(parseContext('<div><!--', nodeMarkerTag)).to.equal(commentMarkerTag);
      expect(parseContext('<!-- ', nodeMarkerTag)).to.equal(commentMarkerTag);
      expect(parseContext('<!-- <div>', nodeMarkerTag)).to.equal(commentMarkerTag);
      expect(parseContext('<!-- a=', nodeMarkerTag)).to.equal(commentMarkerTag);
    });

    it(`keeps the comment context until the comment is closed`, () => {
      expect(parseContext('', commentMarkerTag)).to.equal(commentMarkerTag);
      expect(parseContext('<div>', commentMarkerTag)).to.equal(commentMarkerTag);
      expect(parseContext('<div a=', commentMarkerTag)).to.equal(commentMarkerTag);
      expect(parseContext('--> <!--', commentMarkerTag)).to.equal(commentMarkerTag);
      expect(parseContext('-->', commentMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext(' -->', commentMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<!-- -->', commentMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<!-->', commentMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('--><div a=', commentMarkerTag)).to.equal(attributeMarkerTag);
    });

    it(`keeps the context when the string does not change it`, () => {
      expect(parseContext('', nodeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext(' ', nodeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('some text', nodeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('👍', nodeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('', attributeMarkerTag)).to.equal(attributeMarkerTag);
      expect(parseContext(' b=', attributeMarkerTag)).to.equal(attributeMarkerTag);
    });

    it(`detects node contexts`, () => {
      expect(parseContext('<div>', attributeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<div> ', attributeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<div>text', attributeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<div> a=', attributeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<div>text<div></div>', attributeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<!-->', attributeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<!-- -->', attributeMarkerTag)).to.equal(nodeMarkerTag);
    });

    it(`detects attribute contexts`, () => {
      expect(parseContext('<div a=', nodeMarkerTag)).to.equal(attributeMarkerTag);
      expect(parseContext('<div a =', nodeMarkerTag)).to.equal(attributeMarkerTag);
    });

    it(`only detects attribute contexts when the '<' character opens a tag`, () => {
      expect(parseContext('1 < 2', nodeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<div>1 < 2', attributeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<div>1 <= 2', attributeMarkerTag)).to.equal(nodeMarkerTag);
      expect(parseContext('<div>1 < 2 <div a=', nodeMarkerTag)).to.equal(attributeMarkerTag);
      expect(parseContext('<div>a<b a=', nodeMarkerTag)).to.equal(attributeMarkerTag);
    });

    it(`detects a node context when an attribute contains the '>' character`, () => {
      expect(parseContext('<div a=">" b=', nodeMarkerTag)).to.equal(nodeMarkerTag);
    });
  });

  describe('parseTemplate', () => {
    it(`inserts nodeMarkerTags`, () => {
      expect(parseTemplate(html`<div>${0}</div>`)).to.equal(`<div>${nodeMarkerTag}</div>`);
      expect(parseTemplate(html`${0}`)).to.equal(`${nodeMarkerTag}`);
      expect(parseTemplate(html`a${0}`)).to.equal(`a${nodeMarkerTag}`);
      expect(parseTemplate(html`${0}a`)).to.equal(`${nodeMarkerTag}a`);
      expect(parseTemplate(html`${0}${0}`)).to.equal(`${nodeMarkerTag}${nodeMarkerTag}`);
      expect(parseTemplate(html`a${0}${0}`)).to.equal(`a${nodeMarkerTag}${nodeMarkerTag}`);
      expect(parseTemplate(html`${0}b${0}`)).to.equal(`${nodeMarkerTag}b${nodeMarkerTag}`);
      expect(parseTemplate(html`${0}${0}c`)).to.equal(`${nodeMarkerTag}${nodeMarkerTag}c`);
      expect(parseTemplate(html`a${0}b${0}c`)).to.equal(`a${nodeMarkerTag}b${nodeMarkerTag}c`);
      expect(parseTemplate(html`<!-- -->${0}`)).to.equal(`<!-- -->${nodeMarkerTag}`);
    });

    it(`inserts attributeMarkerTags`, () => {
      expect(parseTemplate(html`<div a=${0}>`)).to.equal(`<div a=${attributeMarkerTag}>`);
      expect(parseTemplate(html`<div a=${0}>`)).to.equal(`<div a=${attributeMarkerTag}>`);
      expect(parseTemplate(html`<div a=${0}></div>`)).to.equal(`<div a=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a=${0} b=${0}></div>`)).to.equal(`<div a=${attributeMarkerTag} b=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a="0" b=${0}></div>`)).to.equal(`<div a="0" b=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a=${0} b="0"></div>`)).to.equal(`<div a=${attributeMarkerTag} b="0"></div>`);
      expect(parseTemplate(html`<div a=${0} b="0" c=${0}></div>`)).to.equal(`<div a=${attributeMarkerTag} b="0" c=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a=${0} b></div>`)).to.equal(`<div a=${attributeMarkerTag} b></div>`);
      expect(parseTemplate(html`<div a b=${0}></div>`)).to.equal(`<div a b=${attributeMarkerTag}></div>`);
      expect(parseTemplate(html`<div a=">" b=${0}></div>`)).to.equal(`<div a=">" b=${nodeMarkerTag}></div>`);
    });

    it(`inserts a nodeMarkerTag when an attribute contains the '>' character`, () => {
      expect(parseTemplate(html`<div a=">" b=${0}></div>`)).to.equal(`<div a=">" b=${nodeMarkerTag}></div>`);
    });

    it(`throws an Error on incorrect attribute tag usage`, () => {
      expect(() => parseTemplate(html`<div a="${0}">`)).to.throw();
      expect(() => parseTemplate(html`<div a="a${0}">`)).to.throw();
      expect(() => parseTemplate(html`<div a="${0}a">`)).to.throw();
      expect(() => parseTemplate(html`<div ${0}>`)).to.throw();
      expect(() => parseTemplate(html`<div a= ${0}>`)).to.throw();
    });

    it(`inserts commentMarkerTags`, () => {
      expect(parseTemplate(html`<!--${0}-->`)).to.equal(`<!--${commentMarkerTag}-->`);
      expect(parseTemplate(html`<div><!--${0}--></div>`)).to.equal(`<div><!--${commentMarkerTag}--></div>`);
      expect(parseTemplate(html`<div><!--${0}-->`)).to.equal(`<div><!--${commentMarkerTag}-->`);
      expect(parseTemplate(html`a<!--${0}-->`)).to.equal(`a<!--${commentMarkerTag}-->`);
      expect(parseTemplate(html`<!--a${0}-->`)).to.equal(`<!--a${commentMarkerTag}-->`);
      expect(parseTemplate(html`<!--${0}a-->`)).to.equal(`<!--${commentMarkerTag}a-->`);
      expect(parseTemplate(html`<!--a${0}b-->`)).to.equal(`<!--a${commentMarkerTag}b-->`);
    });

    it('inserts correct tags in different part type sequences', () => {
      expect(parseTemplate(html`<div a=${0} b=${0}>${0}${0}<!--${0}${0}--></div>`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}${nodeMarkerTag}<!--${commentMarkerTag}${commentMarkerTag}--></div>`
      );
      expect(parseTemplate(html`<div a=${0} b=${0}>${0}${0}</div><!--${0}${0}-->`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}${nodeMarkerTag}</div><!--${commentMarkerTag}${commentMarkerTag}-->`
      );
      expect(parseTemplate(html`<div a=${0} b=${0}>${0}</div>${0}<!--${0}${0}-->`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}</div>${nodeMarkerTag}<!--${commentMarkerTag}${commentMarkerTag}-->`
      );
      expect(parseTemplate(html`<div a=${0} b=${0}>${0}</div><!--${0}${0}-->${0}`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}</div><!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<div a=${0} b=${0}></div><!--${0}${0}-->${0}${0}`)).to.equal(
        `<div a=${attributeMarkerTag} b=${attributeMarkerTag}></div><!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<!--${0}${0}--><div a=${0} b=${0}>${0}${0}</div>`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}--><div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}${nodeMarkerTag}</div>`
      );
      expect(parseTemplate(html`<!--${0}${0}--><div a=${0} b=${0}>${0}</div>${0}`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}--><div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}</div>${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<!--${0}${0}-->${0}<div a=${0} b=${0}>${0}</div>`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}</div>`
      );
      expect(parseTemplate(html`<!--${0}${0}--><div a=${0} b=${0}></div>${0}${0}`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}--><div a=${attributeMarkerTag} b=${attributeMarkerTag}></div>${nodeMarkerTag}${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<!--${0}${0}-->${0}${0}<div a=${0} b=${0}></div>`)).to.equal(
        `<!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}></div>`
      );
      expect(parseTemplate(html`${0}${0}<div a=${0} b=${0}><!--${0}${0}--></div>`)).to.equal(
        `${nodeMarkerTag}${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}><!--${commentMarkerTag}${commentMarkerTag}--></div>`
      );
      expect(parseTemplate(html`${0}${0}<div a=${0} b=${0}></div><!--${0}${0}-->`)).to.equal(
        `${nodeMarkerTag}${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}></div><!--${commentMarkerTag}${commentMarkerTag}-->`
      );
      expect(parseTemplate(html`${0}<div a=${0} b=${0}>${0}<!--${0}${0}--></div>`)).to.equal(
        `${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}>${nodeMarkerTag}<!--${commentMarkerTag}${commentMarkerTag}--></div>`
      );
      expect(parseTemplate(html`${0}<div a=${0} b=${0}><!--${0}${0}-->${0}</div>`)).to.equal(
        `${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}><!--${commentMarkerTag}${commentMarkerTag}-->${nodeMarkerTag}</div>`
      );
      expect(parseTemplate(html`${0}<div a=${0} b=${0}><!--${0}${0}--></div>${0}`)).to.equal(
        `${nodeMarkerTag}<div a=${attributeMarkerTag} b=${attributeMarkerTag}><!--${commentMarkerTag}${commentMarkerTag}--></div>${nodeMarkerTag}`
      );
    });
  });

  describe('parseTemplate edge cases', () => {
    it('treats empty comments as closed', () => {
      expect(parseTemplate(html`<!-->${0}`)).to.equal(`<!-->${nodeMarkerTag}`);
      expect(parseTemplate(html`<!--->${0}`)).to.equal(`<!--->${nodeMarkerTag}`);
      expect(parseTemplate(html`<!---->${0}`)).to.equal(`<!---->${nodeMarkerTag}`);
      expect(parseTemplate(html`<!-- <!-->${0}`)).to.equal(`<!-- <!-->${nodeMarkerTag}`);
      expect(parseTemplate(html`<!-- <!--->${0}`)).to.equal(`<!-- <!--->${nodeMarkerTag}`);
    });

    it('does not close comments on `-- >` or `->`', () => {
      expect(parseTemplate(html`<!-- a -- > ${0}`)).to.equal(`<!-- a -- > ${commentMarkerTag}`);
      expect(parseTemplate(html`<!-- a -> ${0}`)).to.equal(`<!-- a -> ${commentMarkerTag}`);
    });

    it('keeps the comment context across strings', () => {
      expect(parseTemplate(html`<!-- ${0} <div a=${1}> ${2} --> ${3}`)).to.equal(
        `<!-- ${commentMarkerTag} <div a=${commentMarkerTag}> ${commentMarkerTag} --> ${nodeMarkerTag}`
      );
      expect(parseTemplate(html`<!-- ${0} --> <!-- ${1}`)).to.equal(`<!-- ${commentMarkerTag} --> <!-- ${commentMarkerTag}`);
    });

    it('keeps the attribute context across strings', () => {
      expect(parseTemplate(html`<div a=${0} b="1" c=${1}></div>`)).to.equal(
        `<div a=${attributeMarkerTag} b="1" c=${attributeMarkerTag}></div>`
      );
    });

    it('treats `-->` outside a comment as text', () => {
      expect(parseTemplate(html`<div>a --> b ${0}</div>`)).to.equal(`<div>a --> b ${nodeMarkerTag}</div>`);
    });

    it('treats a `<` that does not open a tag as text', () => {
      expect(parseTemplate(html`1 < 2 ${0}`)).to.equal(`1 < 2 ${nodeMarkerTag}`);
      expect(parseTemplate(html`<div>1 < 2 <b c=${0}>`)).to.equal(`<div>1 < 2 <b c=${attributeMarkerTag}>`);
      expect(parseTemplate(html`<div a=${0}>1 < 2 ${1}`)).to.equal(`<div a=${attributeMarkerTag}>1 < 2 ${nodeMarkerTag}`);
    });

    it('recognises all tag openers', () => {
      expect(parseTemplate(html`</div a=${0}>`)).to.equal(`</div a=${attributeMarkerTag}>`);
      expect(parseTemplate(html`<!doctype a=${0}>`)).to.equal(`<!doctype a=${attributeMarkerTag}>`);
      expect(parseTemplate(html`<?xml a=${0}>`)).to.equal(`<?xml a=${attributeMarkerTag}>`);
    });
  });

  describe('buildTemplate', () => {
    it(`injects a commentNode for node parts`, () => {
      expect(buildTemplate(html`${0}`).content.firstChild!.nodeType).to.equal(8);
      expect(buildTemplate(html`<div>${0}</div>`).content.firstChild!.firstChild!.nodeType).to.equal(8);
    });

    it(`the injected commentNode for node parts contains the nodeMarker`, () => {
      expect(buildTemplate(html`${0}`).content.firstChild!.textContent).to.equal(nodeMarker);
      expect(buildTemplate(html`<div>${0}</div>`).content.firstChild!.firstChild!.textContent).to.equal(nodeMarker);
    });

    it(`injects a commentNode in between comment strings`, () => {
      expect(buildTemplate(html`<!--${0}-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!-- ${0} -->`).content.childNodes.length).to.equal(3);
    });

    it(`the injected commentNode for comment parts contains the commentMarker`, () => {
      expect(buildTemplate(html`<!--${0}-->`).content.childNodes[1].textContent).to.equal(commentMarker);
    });

    it(`adds a comment after a part at the end of the template`, () => {
      expect(buildTemplate(html`${0}`).content.lastChild!.textContent).to.equal('');
      expect(buildTemplate(html`${0}`, true).content.lastChild!.textContent).to.equal('');
      expect(buildTemplate(html`${0}a`).content.lastChild!.nodeType).to.equal(3);
      expect(buildTemplate(html`${0} `).content.lastChild!.nodeType).to.equal(3);
      expect(buildTemplate(html`${0} `).content.childNodes.length).to.equal(2);
    });

    it(`adds a comment after a part when the trailing string produces no node`, () => {
      // The NUL character is ignored by the HTML parser, stray end tags and document tags are ignored in a template
      for (const strings of [html`${0}\0`, html`${0}</div>`, html`${0}</p>`, html`${0}<!DOCTYPE html>`, html`${0}<body>`]) {
        const content = buildTemplate(strings).content;
        expect(content.childNodes.length).to.equal(2);
        expect(content.lastChild!.textContent).to.equal('');
      }
      const content = buildTemplate(html`${0}</g>`, true).content;
      expect(content.childNodes.length).to.equal(2);
      expect(content.lastChild!.textContent).to.equal('');
    });

    it(`does not create extra empty text nodes`, () => {
      expect((buildTemplate(html`<div>${0}</div>`).content.childNodes[0] as Element).childNodes.length).to.equal(1);
      expect(buildTemplate(html`${0}`).content.childNodes.length).to.equal(2);
      expect(buildTemplate(html`a${0}`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`${0}a`).content.childNodes.length).to.equal(2);
      expect(buildTemplate(html`${0}${0}`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`a${0}${0}`).content.childNodes.length).to.equal(4);
      expect(buildTemplate(html`${0}b${0}`).content.childNodes.length).to.equal(4);
      expect(buildTemplate(html`${0}${0}c`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`a${0}b${0}c`).content.childNodes.length).to.equal(5);
    });

    it(`does not break on comment-like comment content`, () => {
      expect(buildTemplate(html`<!--${0}>-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--${0}->-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--<${0}-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--<!${0}-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--<!-${0}-->`).content.childNodes.length).to.equal(3);
      expect(buildTemplate(html`<!--<!--${0}-->`).content.childNodes.length).to.equal(3);
    });

    it(`adds the failMarker attribute to nodes when an attribute contains the '>' character`, () => {
      expect((buildTemplate(html`<div a=">" b=${0}></div>`).content.childNodes[0] as Element).hasAttribute(failMarker)).to.be.true;
      expect((buildTemplate(html`<div a=">" b="${0}"></div>`).content.childNodes[0] as Element).hasAttribute(failMarker)).to.be.true;
    });

    it(`adds the attributeMarker attribute to nodes with a dynamic attribute`, () => {
      expect((buildTemplate(html`<div a=${0}></div>`).content.childNodes[0] as Element).hasAttribute(attributeMarker)).to.be.true;
      expect((buildTemplate(html`<div a="1"></div>`).content.childNodes[0] as Element).hasAttribute(attributeMarker)).to.be.false;
      expect((buildTemplate(html`<div a=${0} b=${0}></div>`).content.childNodes[0] as Element).hasAttribute(attributeMarker)).to.be.true;
      expect((buildTemplate(html`<div a="1" b=${0}></div>`).content.childNodes[0] as Element).hasAttribute(attributeMarker)).to.be.true;
    });

    it(`assigns the attributeMarker value to dynamic attributes `, () => {
      expect((buildTemplate(html`<div a=${0}></div>`).content.childNodes[0] as Element).getAttribute('a')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b="1"></div>`).content.childNodes[0] as Element).getAttribute('a')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a="1" b=${0}></div>`).content.childNodes[0] as Element).getAttribute('b')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b="1" c="1"></div>`).content.childNodes[0] as Element).getAttribute('a')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b=${0} c="1"></div>`).content.childNodes[0] as Element).getAttribute('a')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b=${0} c="1"></div>`).content.childNodes[0] as Element).getAttribute('b')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b="1" c=${0}></div>`).content.childNodes[0] as Element).getAttribute('a')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b="1" c=${0}></div>`).content.childNodes[0] as Element).getAttribute('c')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a="1" b=${0} c=${0}></div>`).content.childNodes[0] as Element).getAttribute('b')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a="1" b=${0} c=${0}></div>`).content.childNodes[0] as Element).getAttribute('c')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b=${0} c=${0}></div>`).content.childNodes[0] as Element).getAttribute('a')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b=${0} c=${0}></div>`).content.childNodes[0] as Element).getAttribute('b')).to.be.equal(attributeMarker);
      expect((buildTemplate(html`<div a=${0} b=${0} c=${0}></div>`).content.childNodes[0] as Element).getAttribute('c')).to.be.equal(attributeMarker);
    });
  });
});
