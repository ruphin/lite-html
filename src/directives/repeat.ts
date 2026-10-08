import { directive, type Directive } from "../directive.js";
import { createMarker } from "../dom.js";
import { NodePart } from "../parts.js";

export type KeyFn<T> = (item: T, index: number) => unknown;
export type ItemTemplate<T> = (item: T, index: number) => unknown;

type RenderedItem = { key: unknown; itemPart: NodePart };

// The keyed item parts that were last rendered in each part
const previousItems = new WeakMap<NodePart, RenderedItem[]>();

// A Range that spans all nodes of an item part, including its boundary nodes
const itemRange = ({ beforeNode, afterNode }: NodePart): Range => {
  const range = document.createRange();
  range.setStartBefore(beforeNode);
  range.setEndAfter(afterNode!);
  return range;
};

/**
 * Render each item in an iterable with `template`
 *
 * With a `keyFn`, the DOM for each key is kept and moved when the order of items changes
 * Without a `keyFn`, this is the same as rendering `items.map(template)`
 */
export const repeat: {
  <T>(items: Iterable<T>, template: ItemTemplate<T>): Directive<NodePart>;
  <T>(
    items: Iterable<T>,
    keyFn: KeyFn<T>,
    template: ItemTemplate<T>,
  ): Directive<NodePart>;
} = <T>(
  items: Iterable<T>,
  keyFn: KeyFn<T>,
  template?: ItemTemplate<T>,
): Directive<NodePart> =>
  directive((part: NodePart) => {
    if (!template) {
      part.render(Array.from(items, keyFn));
      return;
    }

    // If this part is not rendering the items of a repeat, clear it first
    let previous = previousItems.get(part);
    if (!previous || part.node !== previous) {
      part.clear();
      part.value = part.promise = undefined;
      previous = [];
    }

    // Index the previous item parts by key, and remove any duplicate keys
    const oldParts = new Map<unknown, NodePart>();
    for (const { key, itemPart } of previous) {
      oldParts.has(key)
        ? itemRange(itemPart).deleteContents()
        : oldParts.set(key, itemPart);
    }

    const parent = part.parentNode;
    const rendered: RenderedItem[] = [];
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
        itemPart = new NodePart({ node: before, options: part.options });
      }
      itemPart.render(template(item, index++));
      rendered.push({ key, itemPart });
      next = itemPart.afterNode!.nextSibling;
    }

    // Remove the items that are no longer rendered
    oldParts.forEach((itemPart) => itemRange(itemPart).deleteContents());

    previousItems.set(part, rendered);
    part.node = rendered;
  });
