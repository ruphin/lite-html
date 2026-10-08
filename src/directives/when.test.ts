import { when } from "./when.js";
import { render, html } from "../lite-html.js";
import { innerHTML } from "../../test/helpers.js";

import { describe, it, beforeEach, expect } from "vitest";

describe("when", () => {
  let container: HTMLDivElement;
  const template = (condition: unknown, falseValue?: unknown) =>
    html`<p title=${when(condition, "yes", falseValue)}>${when(condition, "yes", falseValue)}</p>`;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders the true value when the condition is truthy", () => {
    render(template(true, "no"), container);
    expect(innerHTML(container)).to.equal('<p title="yes">yes</p>');
  });

  it("renders the false value when the condition is falsy", () => {
    render(template(false, "no"), container);
    expect(innerHTML(container)).to.equal('<p title="no">no</p>');
  });

  it("renders nothing when the condition is falsy and there is no false value", () => {
    render(template(false), container);
    expect(innerHTML(container)).to.equal('<p title=""></p>');
  });

  it("uses the truthiness of the condition", () => {
    for (const condition of [1, "text", {}, []]) {
      render(template(condition, "no"), container);
      expect(innerHTML(container)).to.equal('<p title="yes">yes</p>');
    }
    for (const condition of [0, "", null, undefined, NaN]) {
      render(template(condition, "no"), container);
      expect(innerHTML(container)).to.equal('<p title="no">no</p>');
    }
  });

  it("renders templates as values", () => {
    render(when(true, html`<i>yes</i>`, html`<b>no</b>`), container);
    expect(innerHTML(container)).to.equal("<i>yes</i>");
    render(when(false, html`<i>yes</i>`, html`<b>no</b>`), container);
    expect(innerHTML(container)).to.equal("<b>no</b>");
  });
});
