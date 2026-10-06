import { directive } from '../lib/directive.js';

// The dependencies that were last rendered in each part
const previousDependencies = new WeakMap();

/**
 * Render the result of `valueFn`, but only call it again when one of the dependencies changes identity
 */
export const guard = (dependencies, valueFn) =>
  directive(part => {
    const previous = previousDependencies.get(part);
    if (!previous || previous.length !== dependencies.length || dependencies.some((value, i) => value !== previous[i])) {
      previousDependencies.set(part, [...dependencies]);
      part.render(valueFn());
    }
  });
