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
import { createMarker } from '../lib/dom.js';
import { NodePart } from '../lib/parts.js';

// The keyed item parts that were last rendered in each part
const previousItems = new WeakMap();

// A Range that spans all nodes of an item part, including its boundary nodes
const itemRange = ({ beforeNode, afterNode }) => {
  const range = document.createRange();
  range.setStartBefore(beforeNode);
  range.setEndAfter(afterNode);
  return range;
};

/**
 * Render each item in an iterable with `template`
 *
 * With a `keyFn`, the DOM for each key is kept and moved when the order of items changes
 * Without a `keyFn`, this is the same as rendering `items.map(template)`
 */
export const repeat = (items, keyFn, template) =>
  directive(part => {
    if (!template) {
      part.render(Array.from(items, keyFn));
      return;
    }

    // If this part is not rendering the items of a repeat, clear it first
    let previous = previousItems.get(part);
    if (part.node !== previous) {
      part.clear();
      part.value = part.promise = undefined;
      previous = [];
    }

    // Index the previous item parts by key, and remove any duplicate keys
    const oldParts = new Map();
    for (const { key, itemPart } of previous) {
      oldParts.has(key) ? itemRange(itemPart).deleteContents() : oldParts.set(key, itemPart);
    }

    const parent = part.parentNode;
    const rendered = [];
    // The node where the next item should start
    let next = part.beforeNode.nextSibling;
    let index = 0;
    for (const item of items) {
      const key = keyFn(item, index);
      let itemPart = oldParts.get(key);
      if (itemPart) {
        // Reuse the existing item part, and move it into place if needed
        oldParts.delete(key);
        if (itemPart.beforeNode !== next) {
          parent.insertBefore(itemRange(itemPart).extractContents(), next);
        }
      } else {
        // Create a new item part with its own boundary nodes
        const before = createMarker();
        parent.insertBefore(before, next);
        parent.insertBefore(createMarker(), next);
        itemPart = new NodePart({ node: before });
      }
      itemPart.render(template(item, index++));
      rendered.push({ key, itemPart });
      next = itemPart.afterNode.nextSibling;
    }

    // Remove the items that are no longer rendered
    oldParts.forEach(itemPart => itemRange(itemPart).deleteContents());

    previousItems.set(part, rendered);
    part.node = rendered;
  });
