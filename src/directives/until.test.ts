import { until } from "./until.js";
import { render, html } from "../lite-html.js";
import { innerHTML } from "../../test/helpers.js";

import { describe, it, beforeEach, expect } from "vitest";

describe("until", () => {
  let container: HTMLDivElement;
  const template = (promise: PromiseLike<unknown>, defaultContent?: unknown) =>
    html`<p>${until(promise, defaultContent)}</p>`;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders the default content until the promise resolves", async () => {
    const promise = Promise.resolve("resolved");
    render(template(promise, "loading"), container);
    expect(innerHTML(container)).to.equal("<p>loading</p>");
    await promise;
    expect(innerHTML(container)).to.equal("<p>resolved</p>");
  });

  it("renders nothing without default content", () => {
    render(template(new Promise(() => {})), container);
    expect(innerHTML(container)).to.equal("<p></p>");
  });

  it("renders templates as default content and as the result", async () => {
    const promise = Promise.resolve(html`<b>resolved</b>`);
    render(template(promise, html`<i>loading</i>`), container);
    expect(innerHTML(container)).to.equal("<p><i>loading</i></p>");
    await promise;
    expect(innerHTML(container)).to.equal("<p><b>resolved</b></p>");
  });

  it("renders the result synchronously for a promise that resolved before", async () => {
    const promise = Promise.resolve("resolved");
    render(template(promise, "loading"), container);
    await promise;
    const other = document.createElement("div");
    render(template(promise, "loading"), other);
    expect(innerHTML(other)).to.equal("<p>resolved</p>");
  });

  it("keeps rendering the result when the same promise is rendered again", async () => {
    const promise = Promise.resolve("resolved");
    render(template(promise, "loading"), container);
    await promise;
    render(template(promise, "loading"), container);
    expect(innerHTML(container)).to.equal("<p>resolved</p>");
  });

  it("renders the default content of a new promise while it is pending", async () => {
    const first = Promise.resolve("first");
    render(template(first, "loading first"), container);
    await first;
    expect(innerHTML(container)).to.equal("<p>first</p>");
    const second = new Promise(() => {});
    render(template(second, "loading second"), container);
    expect(innerHTML(container)).to.equal("<p>loading second</p>");
  });

  it("does not render the result of a promise that is no longer rendered", async () => {
    let resolve!: (value: string) => void;
    const promise = new Promise<string>((r) => (resolve = r));
    render(template(promise, "loading"), container);
    render(template(new Promise(() => {}), "other"), container);
    resolve("resolved");
    await promise;
    expect(innerHTML(container)).to.equal("<p>other</p>");
  });
});
