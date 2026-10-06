# lite-html

---

[![NPM Latest version](https://img.shields.io/npm/v/lite-html.svg)](https://www.npmjs.com/package/lite-html)

_A modern replacement for VirtualDOM rendering engines_

---

- **Highly Flexible:** Use expressive JavaScript templates that can render anything to HTML. Set properties and event listeners directly from the template.
- **Extremely Performant:** Using the latest generation of rendering techniques, it easily outperforms contemporary VirtualDOM-based rendering as used in modern frontend frameworks.
- **Lightweight:** Under 3kB minified and gzipped.
- **API Compatible with lit-html:** Can be used as a drop-in replacement for lit-html in most projects.

## Examples

### Hello World

```javascript
const template = (name) => html`<p>Hello ${name}</p>`;

render(template('World'), document.body);
```

### Simple List

```javascript
const groceryList = (items) => html`
  <ul>
    ${items.map((item) => html`<li>${item.name} - ${item.quantity}</li>`)}
  </ul>
`;

const groceries = [
  { name: 'Apples', quantity: 2 },
  { name: 'Oranges', quantity: 4 },
];

render(groceryList(groceries), document.getElementById('groceryList'));
```

## Installing

Install it with npm:

```
npm install lite-html
```

Lite-html is published as an ES module. Import it from your bundler or Node project:

```javascript
import { html, render } from 'lite-html';
```

Or load it dynamically for live debugging:

```javascript
const { html, render } = await import('https://unpkg.com/lite-html');
```

## API

The core API consists of functions that create templates, and a `render` function that renders templates into the DOM.

- [`html`](#html) and [`svg`](#svg) create templates.
- [`render`](#rendervalue-target) renders a template, or any other renderable value, into a DOM node.

### Renderable values

Lite-html can render more than templates. Each of the following values can be passed to `render`, or used as an interpreted value in the content of a template:

- Templates
- Strings, numbers, and booleans
- `null` and `undefined`
- DOM nodes
- Arrays and other iterables
- Promises

Any other value is converted to a string. [Directives](#directives) are special values that change how something is rendered.

#### Templates

A template describes a piece of HTML or SVG, with interpreted values for the parts that can change. Templates are the building blocks of everything you render, and they can be nested inside other templates. They are created with the [`html`](#html) and [`svg`](#svg) tags.

#### Strings, numbers, and booleans

These are rendered as text. They are never parsed as HTML. A boolean is rendered as the text `true` or `false`.

#### null and undefined

These render nothing.

#### DOM nodes

A DOM node is inserted as it is. A node can only be in one place in the document, so a node that is already in the document is moved. For a `DocumentFragment`, its child nodes are inserted.

#### Arrays and other iterables

Each item is rendered in order. An item can be any renderable value, including a template or another array.

When the list is rendered again, items are matched by position: the first item updates the DOM of the previous first item, and so on. Use the `repeat` directive with a key function to keep the DOM of each item when the order of the list changes.

#### Promises

The content stays as it is until the promise resolves, then the resolved value is rendered. Use the `until` directive to show placeholder content while the promise is pending.

#### Other values

Any other value is converted to a string with `String()` and rendered as text.

### html

`html` is a [JavaScript template tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) that creates a template. To use the tag, prepend it to any [JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).

```javascript
const template = () => html`<p>Hello World</p>`;
```

The contents of the template are parsed as HTML. Templates become dynamic through the interpreted values that can be inserted into them.

```javascript
const template = (name) => html`<p>Hello ${name}</p>`;
```

An interpreted value in the content of an element can be any [renderable value](#renderable-values), including nested templates and arrays.

Interpreted values are not allowed inside `<script>`, `<style>`, `<textarea>`, `<title>`, and nested `<template>` elements.

#### Attributes

To set an attribute, assign it an interpreted value. The interpreted value must be the complete value of the attribute, without surrounding `"` or other text.

```javascript
const image = (source) => html`<img src=${source} />`;

// Build a composite value in JavaScript
const box = (color) => html`<div class=${`box ${color}`}></div>`;
```

An attribute that is set to `null` or `undefined` becomes an empty attribute. Use the `ifDefined` directive to remove the attribute instead.

#### Boolean attributes

You can set boolean attributes by prefixing the attribute name with `?`. The attribute is added when the value is truthy, and removed otherwise.

```javascript
const template = (secret) => html`<p ?hidden=${secret}></p>`;
```

#### Properties

You can set properties on elements by prefixing an attribute name with `.`

```javascript
const template = (user) => html`<user-panel .user=${user}></user-panel>`;
```

#### Event handlers

You can attach event handlers by prefixing an attribute name with `@`

```javascript
const handleClick = (event) => {
  alert('clicked the button');
};
const template = () => html`<button @click=${handleClick}></button>`;
```

#### Security

Strings in the content of an element are always rendered as text, never as HTML. Attributes, properties, and event handlers are set exactly as given. Never use untrusted input for attributes that run code or load resources (such as `href`, `src`, or `onclick`), or for properties like `.innerHTML`.

### svg

The `svg` tag works like the `html` tag, but its contents are parsed as SVG. Use it for templates that are rendered inside an `<svg>` element.

```javascript
const circle = (radius) => svg`<circle r=${radius}></circle>`;
const template = (radius) => html`<svg>${circle(radius)}</svg>`;
```

### render(value, target)

The `render` function renders a value into a target `Node`, usually the document body, a container element, or a shadow root. The value is usually a template, but it can be any [renderable value](#renderable-values).

The first time something is rendered into a target, the existing content of the target is removed. Rendering into the same target again updates the content that is already there.

```javascript
const template = (name) => html`<p>Hello ${name}</p>`;

render(template('World'), document.body);

// The same template is rendered again, so only the name is updated
render(template('Everyone'), document.body);
```

Lite-html keeps empty comment nodes (`<!---->`) in the rendered content to remember where the interpreted values are. Do not remove them.

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

## Comparison with lit-html

Lite-html has the same core API as lit-html, but it aims to be more lightweight and easier to understand. To get there, it is slightly more opinionated and focuses on what most projects need. The most notable differences are:

- **No multi-part attributes:** An attribute must be set with a single interpreted value, without quotes or other text around it. Build the complete value in JavaScript instead.

  ```javascript
  // Not supported, this throws an error
  html`<div class="red ${name}"></div>`;

  // Use a single interpreted value instead
  html`<div class=${`red ${name}`}></div>`;
  ```

- **Focused on common use cases:** Features that few projects need, such as Trusted Types, are not included.

## Development

Requires Node.js 20 or later. The source is written in TypeScript.

```
npm install
npm run dev         # Serve the demo with Vite
npm test            # Run the test suite once with Vitest
npm run test:watch  # Run tests in watch mode
npm run typecheck   # Type-check the source, tests, and demo
npm run build       # Build the ES module, the minified bundle served by unpkg, and the type declarations
```

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright © 2026 Goffert van Gool
