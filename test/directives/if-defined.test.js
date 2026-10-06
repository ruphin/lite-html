import { ifDefined } from '../../src/directives/if-defined.js';
import { render, html } from '../../src/lite-html.js';
import { innerHTML } from '../helpers.js';

import { describe, it, beforeEach, expect } from 'vitest';

describe('ifDefined', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('sets the attribute when the value is defined', () => {
    render(html`<p a=${ifDefined('value')}></p>`, container);
    expect(innerHTML(container)).to.equal('<p a="value"></p>');
    render(html`<p a=${ifDefined('')}></p>`, container);
    expect(innerHTML(container)).to.equal('<p a=""></p>');
  });

  it('removes the attribute when the value is undefined or null', () => {
    const template = value => html`<p a=${ifDefined(value)}></p>`;
    render(template('value'), container);
    render(template(undefined), container);
    expect(innerHTML(container)).to.equal('<p></p>');
    render(template('value'), container);
    render(template(null), container);
    expect(innerHTML(container)).to.equal('<p></p>');
  });

  it('sets the attribute again after it was removed', () => {
    const template = value => html`<p a=${ifDefined(value)}></p>`;
    render(template('value'), container);
    render(template(undefined), container);
    render(template('value'), container);
    expect(innerHTML(container)).to.equal('<p a="value"></p>');
  });

  it('does not set the attribute when the first value is undefined', () => {
    render(html`<p a=${ifDefined(undefined)}></p>`, container);
    expect(innerHTML(container)).to.equal('<p></p>');
  });

  it('renders the value as usual in other parts', () => {
    render(html`<p .prop=${ifDefined(undefined)} ?hidden=${ifDefined(undefined)}>${ifDefined(undefined)}</p>`, container);
    expect(innerHTML(container)).to.equal('<p></p>');
    expect(container.querySelector('p')).to.have.property('prop', undefined);
  });
});
