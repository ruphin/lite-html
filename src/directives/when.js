import { directive } from '../lib/directive.js';

export const when = (condition, trueValue, falseValue) =>
  directive(part => {
    if (condition) {
      part.render(trueValue);
    } else {
      part.render(falseValue);
    }
  });
