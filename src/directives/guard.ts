import { directive, type Directive } from "../directive.js";
import type { Part } from "../parts.js";

// The dependencies that were last rendered in each part
const previousDependencies = new WeakMap<Part, readonly unknown[]>();

/**
 * Render the result of `valueFn`, but only call it again when one of the dependencies changes identity
 */
export const guard = (
  dependencies: readonly unknown[],
  valueFn: () => unknown,
): Directive =>
  directive((part) => {
    const previous = previousDependencies.get(part);
    if (
      !previous ||
      previous.length !== dependencies.length ||
      dependencies.some((value, i) => value !== previous[i])
    ) {
      previousDependencies.set(part, [...dependencies]);
      part.render(valueFn());
    }
  });
