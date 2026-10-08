import { directive, type Directive } from "../directive.js";
import { AttributePart, noChange } from "../parts.js";

/**
 * Remove the attribute when the value is null or undefined, otherwise render the value
 * Only affects plain attributes, other parts render the value as usual
 */
export const ifDefined = (value: unknown): Directive =>
  directive((part) => {
    if (
      value == null &&
      part instanceof AttributePart &&
      part.type === "attribute"
    ) {
      part.node.removeAttribute(part.name);
      part.value = noChange;
    } else {
      part.render(value);
    }
  });
