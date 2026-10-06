import { directive } from '../lib/directive.js';

// The HTML string that was last rendered in each part, and the DocumentFragment that was created for it
const previousRenders = new WeakMap();

/**
 * Render a string as HTML
 *
 * The string is only parsed again when it changes, or when the part has rendered something else in between
 */
export const unsafeHTML = htmlString =>
  directive(part => {
    const previous = previousRenders.get(part);
    if (previous?.htmlString !== htmlString || part.node !== previous.fragment) {
      const template = document.createElement('template');
      template.innerHTML = htmlString;
      const fragment = document.importNode(template.content, true);
      part.render(fragment);
      previousRenders.set(part, { htmlString, fragment });
    }
  });
