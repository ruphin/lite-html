# lite-html

---

[![NPM Latest version](https://img.shields.io/npm/v/lite-html.svg)](https://www.npmjs.com/package/lite-html)

_A modern replacement for VirtualDOM rendering engines_

---

- **Highly Flexible:** Use expressive JavaScript templates that can render anything to HTML. Set properties and event listeners directly from the template.
- **Extremely Performant:** Using the latest generation of rendering techniques, it easily outperforms contemporary VirtualDOM-based rendering as used in modern frontend frameworks.
- **Lightweight:** Under 3kB total size.
- **API Compatible with lit-html:** Can be used as a drop-in replacement for lit-html in most projects.

## Examples

#### Hello World

```javascript
const template = name => html`
  <p>Hello ${name}</p>
`;

render(template('World'), document.body);
```

#### Simple List

```javascript
const groceryList = items => html`
  <ul>
    ${items.map(
      item => html`
      <li>
        ${item.name} - ${item.quantity}
      </li>
    `
    )}
  </ul>`;

const groceries = [{ name: 'Apples', quantity: 2 }, { name: 'Oranges', quantity: 4 }];

render(groceryList(groceries), document.getElemenyById('groceryList'));
```

## Installing

With NPM

```
npm install lite-html
```

Lite-html is published as an ES module. Import it from your bundler or Node project:

```javascript
import { html, render } from 'lite-html';
```

Or load it directly from a CDN:

```javascript
import { html, render } from 'https://unpkg.com/lite-html';
```

## API

The core API consists of two components.

### render(\<any>, Node)

The `render` function will render any type of object into the content of an HTML `Node`, usually the document body, a container element, or a shadowRoot.

The first argument is the object that will be rendered. It can be one of the following:

- A `TemplateResult` (returned by the `html` tag)
- A string, number, or boolean
- An HTML DOM Node
- An Array-like object
- A Promise

Any other object is coerced to a String before being rendered.

The second argument is the `Node` that the object will be rendered into. The previous content of the `Node` will be removed.

Lite-html keeps empty comment nodes (`<!---->`) in the rendered content to remember where the interpreted values are. Do not remove them.

### html

The `html` is a [JavaScript template tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates) that allows creation of flexible templates which will be interpreted as HTML. To use the tag, prepend it to any [JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).

```javascript
const template = () => html`<p>Hello World</p>`;
```

The contents of the template will be parsed as HTML. The flexibility comes from interpreted values that can be inserted into these templates.

```javascript
const template = name => html`<p>Hello ${name}</p>`;
```

These interpreted values can in turn be any kind of object that lite-html can render, including nested templates and arrays.

A literal `<` character in the text of a template is rendered as text when it is not followed by a letter, `/`, `!`, or `?`, exactly like browsers parse HTML.

```javascript
const template = (a, b) => html`<p>${a} < ${b}</p>`;
```

Interpreted values are not allowed inside `<script>`, `<style>`, `<textarea>`, `<title>`, and nested `<template>` elements.

#### Dynamic attributes

The `html` tag can also be used to set attributes on nodes. To set an attribute, assign the value of the attribute with an interpreted value. Lite-html requires that you omit the surrounding `"` when setting attributes.

```javascript
const template = source => html`<img src=${source} />`;

// Composite attribute
const template = classString => html`<div class=${`red ${classString}`}></div>`;
```

#### Boolean attributes

You can set boolean attributes by prefixing the attribute name with `?`

```javascript
const template = secret => html`<p ?hidden=${secret}></p>`;
```

#### Properties

You can set properties on elements by prefixing an attribute name with `.`

```javascript
const template = user => html`<user-panel .user=${user}></user-panel>`;
```

#### Event handlers

You can attach event handlers by prefixing an attribute name with `@`

```javascript
const handleclick = () => {
  alert('clicked the button');
};
const template = () => html`<button @click=${handleClick}></button>`;
```

#### Security

Interpreted values in the content of a node are always rendered as text, never as HTML. Attributes, properties, and event handlers are set exactly as given. Never use untrusted input for attributes that run code or load resources (such as `href`, `src`, or `onclick`), or for properties like `.innerHTML`.

### svg

The `svg` tag works like the `html` tag, but its contents are parsed as SVG. Use it for templates that are rendered inside an `<svg>` element.

```javascript
const circle = radius => svg`<circle r=${radius}></circle>`;
const template = radius => html`<svg>${circle(radius)}</svg>`;
```

### Directives

Directives are exported alongside `html` and `render`.

```javascript
import { html, render, cache, guard, ifDefined, repeat, unsafeHTML, until, when } from 'lite-html';
```

- `cache(value)` renders `value`, and keeps the DOM of every template rendered in that position. Without `cache`, the DOM of a template is discarded when something else is rendered in its place. Use it to switch quickly between a few large templates.
- `guard(dependencies, valueFn)` renders the result of `valueFn`, and only calls it again when one of the `dependencies` changes identity.
- `ifDefined(value)` sets an attribute to `value`, or removes the attribute when `value` is `undefined` or `null`.
- `repeat(items, keyFn, template)` renders `template(item, index)` for each item. The DOM for each key returned by `keyFn` is kept and moved when items are reordered. Without `keyFn`, it renders like `items.map(template)`.
- `when(condition, trueValue, falseValue)` renders `trueValue` if `condition` is truthy, and `falseValue` otherwise.
- `until(promise, defaultContent)` renders `defaultContent` until `promise` resolves, then renders its result.
- `unsafeHTML(htmlString)` renders a string as HTML. Never use it with untrusted input.

## Why it is fast

Todo: Explain why it is fast

## Differences with lit-html

Todo: Explain what is different

## How it works

Todo: Explain all the things

## Development

Requires Node.js.

```
npm install
npm run dev         # Serve the demo with Vite
npm test            # Run the test suite once with Vitest
npm run test:watch  # Run tests in watch mode
npm run build       # Build the minified bundle served by unpkg
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright © 2026 Goffert van Gool
