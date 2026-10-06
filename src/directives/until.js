import { directive } from '../lib/directive.js';

const resolvedPromises = new WeakMap();

export const until = (promise, defaultContent) =>
  directive(part => {
    if (!resolvedPromises.has(promise)) {
      // The part that renders the promise reports rejections, so ignore them here to not report them twice
      promise.then(value => resolvedPromises.set(promise, value), () => {});
      part.render(defaultContent);
      part.render(promise);
    } else {
      part.render(resolvedPromises.get(promise));
    }
  });
