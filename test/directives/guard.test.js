import { guard } from '../../src/directives/guard.js';
import { render, html } from '../../src/lite-html.js';
import { innerHTML } from '../helpers.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('guard', () => {
  let container;
  let calls;
  const template = (dependencies, value) =>
    html`<p title=${guard(dependencies, () => value)}>${guard(dependencies, () => (calls++, value))}</p>`;

  beforeEach(() => {
    container = document.createElement('div');
    calls = 0;
  });

  it('renders the result of valueFn', () => {
    render(template([1], 'a'), container);
    expect(innerHTML(container)).to.equal('<p title="a">a</p>');
    expect(calls).to.equal(1);
  });

  it('does not call valueFn when the dependencies are unchanged', () => {
    const object = {};
    render(template([1, object], 'a'), container);
    render(template([1, object], 'b'), container);
    expect(innerHTML(container)).to.equal('<p title="a">a</p>');
    expect(calls).to.equal(1);
  });

  it('calls valueFn when a dependency changes identity', () => {
    render(template([1, {}], 'a'), container);
    render(template([1, {}], 'b'), container);
    expect(innerHTML(container)).to.equal('<p title="b">b</p>');
    expect(calls).to.equal(2);
  });

  it('calls valueFn when the number of dependencies changes', () => {
    render(template([1], 'a'), container);
    render(template([1, 2], 'b'), container);
    expect(innerHTML(container)).to.equal('<p title="b">b</p>');
  });

  it('is not affected by mutations of the dependencies array', () => {
    const dependencies = [1];
    render(template(dependencies, 'a'), container);
    dependencies[0] = 2;
    render(template(dependencies, 'b'), container);
    expect(innerHTML(container)).to.equal('<p title="b">b</p>');
  });
});
