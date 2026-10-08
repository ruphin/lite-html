import { directive, isDirective } from "./directive.js";
import type { Part } from "./parts.js";

import { describe, it, expect } from "vitest";

describe("directive", () => {
  it("returns the function it is given", () => {
    const fn = (part: Part) => part.render("value");
    expect(directive(fn)).to.equal(fn);
  });

  it("marks the function as a directive", () => {
    const fn = (part: Part) => part.render("value");
    expect(isDirective(fn)).to.be.false;
    directive(fn);
    expect(isDirective(fn)).to.be.true;
  });
});

describe("isDirective", () => {
  it("is false for functions that are not directives", () => {
    expect(isDirective(() => {})).to.be.false;
    expect(isDirective(function () {})).to.be.false;
  });

  it("is false for values that are not functions", () => {
    expect(isDirective(undefined)).to.be.false;
    expect(isDirective(null)).to.be.false;
    expect(isDirective("directive")).to.be.false;
    expect(isDirective({})).to.be.false;
  });
});
