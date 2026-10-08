import { directive, type Directive } from "../directive.js";

/**
 * Render `trueValue` when `condition` is truthy, otherwise render `falseValue`
 */
export const when = (
  condition: unknown,
  trueValue: unknown,
  falseValue?: unknown,
): Directive =>
  directive((part) => {
    if (condition) {
      part.render(trueValue);
    } else {
      part.render(falseValue);
    }
  });
