# lite-html

---

[![Build Status](https://api.travis-ci.org/ruphin/lite-html.svg?branch=master)](https://travis-ci.org/ruphin/lite-html)
[![NPM Latest version](https://img.shields.io/npm/v/lite-html.svg)](https://www.npmjs.com/package/lite-html)
[![Code Style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

_A modern replacement for VirtualDOM rendering engines_

---

- **Highly Flexible:** Use expressive JavaScript templates that can render anything to HTML. Set properties and event listeners directly from the template.
- **Extremely Performant:** Using the latest generation of rendering techniques, it easily outperforms contemporary VirtualDOM-based rendering as used in modern frontend frameworks.
- **Lightweight:** ~2kb total size.
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

Lite-html exposes an API through ES6 Modules. You can use it from CDN, or from your local `node_modules` folder after installing.

```javascript
// From CDN
import { html, render } from 'https://unpkg.com/lite-html';

// From node_modules
import { html, render } from './node_modules/lite-html/lite-html.js';
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

## Why it is fast

Todo: Explain why it is fast

## Differences with lit-html

Todo: Explain what is different

## How it works

Todo: Explain all the things

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright © 2018-present, Goffert van Gool
