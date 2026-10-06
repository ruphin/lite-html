/**
 * @license
 * MIT License
 *
 * Copyright (c) 2026 Goffert van Gool
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { directive } from '../lib/directive.js';
import { TemplateResult } from '../lib/templates.js';

// The template instances that were rendered in each part, indexed by their Template
const instanceCaches = new WeakMap();

/**
 * Render `value`, and keep the DOM of every template that is rendered in this part
 *
 * A part normally discards the DOM of a template when it renders something else
 * With `cache`, that DOM is kept and used again when the same template is rendered later
 */
export const cache = value =>
  directive(part => {
    let instances = instanceCaches.get(part);
    if (!instances) {
      instances = new Map();
      instanceCaches.set(part, instances);
    }

    // If there is a cached instance of this template, put it back in the part
    // Clearing the part moves the nodes of the current instance back into its fragment
    const instance = value instanceof TemplateResult && instances.get(value.template);
    if (instance && part.instance !== instance) {
      part._renderNode(instance.fragment);
      part.instance = instance;
    }

    part.render(value);

    if (part.instance) {
      instances.set(part.instance.template, part.instance);
    }
  });
