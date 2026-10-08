import { render, html, svg, repeat } from "./lite-html.js";
import { innerHTML } from "../test/helpers.js";

import { describe, it, beforeEach, expect } from "vitest";

describe("lite-html", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  describe("render", () => {
    it("replaces the content of the target", () => {
      container.innerHTML = "<span></span>";
      render(html`<p>${"a"}</p>`, container);
      expect(innerHTML(container)).to.equal("<p>a</p>");
      render("text", container);
      expect(innerHTML(container)).to.equal("text");
    });

    it("updates parts that are next to each other", () => {
      const template = (a: unknown, b: unknown) => html`${a}${b}`;
      render(template("a", "b"), container);
      expect(innerHTML(container)).to.equal("ab");
      render(template(html`<b></b>`, null), container);
      expect(innerHTML(container)).to.equal("<b></b>");
      render(template(null, html`<i></i>`), container);
      expect(innerHTML(container)).to.equal("<i></i>");
      render(template([1, 2], [3]), container);
      expect(innerHTML(container)).to.equal("123");
      render(template([], "b"), container);
      expect(innerHTML(container)).to.equal("b");
    });

    it("keeps the content after a nested template that ends with a part", () => {
      const template = (value: unknown) =>
        html`<p>${html`${value}`}<i></i></p>`;
      render(template("a"), container);
      expect(innerHTML(container)).to.equal("<p>a<i></i></p>");
      render(template(html`<b></b>`), container);
      expect(innerHTML(container)).to.equal("<p><b></b><i></i></p>");
      render(template([1, 2]), container);
      expect(innerHTML(container)).to.equal("<p>12<i></i></p>");
    });

    it("calls event handlers with the host option as `this`, in nested templates, lists, and repeat", () => {
      const host = {};
      const contexts: unknown[] = [];
      const handler = function (this: unknown) {
        contexts.push(this);
      };
      render(
        html`<a @click=${handler}></a>${html`<b @click=${handler}></b>`}${[html`<i @click=${handler}></i>`]}${repeat(
          [1],
          (item) => item,
          () => html`<u @click=${handler}></u>`,
        )}`,
        container,
        { host },
      );
      container
        .querySelectorAll("a, b, i, u")
        .forEach((node) => (node as HTMLElement).click());
      expect(contexts).to.have.length(4);
      expect(contexts.every((context) => context === host)).to.be.true;
    });

    it("does not leave markers in attributes", () => {
      render(
        html`<a href=${undefined} .b=${1} ?c=${false} @d=${null}></a>`,
        container,
      );
      expect(innerHTML(container)).to.equal('<a href=""></a>');
    });
  });

  describe("html", () => {
    it(`renders '<' characters that do not open a tag as text`, () => {
      render(html`<p>1 < 2 ${"a"} <= ${"b"}</p>`, container);
      expect(container.textContent).to.equal("1 < 2 a <= b");
      render(html`1 < ${2} <b title=${"c"}>${3}</b>`, container);
      expect(innerHTML(container)).to.equal('1 &lt; 2 <b title="c">3</b>');
    });
  });

  describe("svg", () => {
    it("renders elements in the SVG namespace", () => {
      const template = (radius: number) =>
        html`<svg>${svg`<circle r=${radius}></circle>`}</svg>`;
      render(template(1), container);
      expect(innerHTML(container)).to.equal(
        '<svg><circle r="1"></circle></svg>',
      );
      expect(container.querySelector("circle")!.namespaceURI).to.equal(
        "http://www.w3.org/2000/svg",
      );
      render(template(2), container);
      expect(innerHTML(container)).to.equal(
        '<svg><circle r="2"></circle></svg>',
      );
    });

    it("renders nested templates and lists", () => {
      const template = (radii: number[]) =>
        svg`<g>${radii.map((radius) => svg`<circle r=${radius}></circle>`)}</g>`;
      render(html`<svg>${template([1, 2])}</svg>`, container);
      expect(innerHTML(container)).to.equal(
        '<svg><g><circle r="1"></circle><circle r="2"></circle></g></svg>',
      );
      expect(container.querySelectorAll("circle")[1]!.namespaceURI).to.equal(
        "http://www.w3.org/2000/svg",
      );
    });
  });
});
