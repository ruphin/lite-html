import { directive } from '../lib/directive.js';
import { noChange } from '../lib/parts.js';

/**
 * Remove the attribute when the value is null or undefined, otherwise render the value
 * Only affects plain attributes, other parts render the value as usual
 */
export const ifDefined = value =>
  directive(part => {
    if (value == null && part.type === 'attribute') {
      part.node.removeAttribute(part.name);
      part.value = noChange;
    } else {
      part.render(value);
    }
  });
