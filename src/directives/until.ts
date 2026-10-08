import { directive, type Directive } from "../directive.js";
import type { NodePart } from "../parts.js";

const resolvedPromises = new WeakMap<PromiseLike<unknown>, unknown>();

/**
 * Render `defaultContent` until `promise` resolves, then render its result
 */
export const until = (
  promise: PromiseLike<unknown>,
  defaultContent?: unknown,
): Directive<NodePart> =>
  directive((part: NodePart) => {
    if (!resolvedPromises.has(promise)) {
      // The part that renders the promise reports rejections, so ignore them here to not report them twice
      promise.then(
        (value) => resolvedPromises.set(promise, value),
        () => {},
      );
      part.render(defaultContent);
      part.render(promise);
    } else {
      part.render(resolvedPromises.get(promise));
    }
  });
