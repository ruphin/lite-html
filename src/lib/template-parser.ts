import { attributeMarker, commentMarker, nodeMarker } from './markers.js';
import { createMarker } from './dom.js';

// The second marker is to add a boolean attribute to the element
// This is to easily test if a node has dynamic attributes by checking against that attribute
export const attributeMarkerTag = `${attributeMarker} ${attributeMarker}`;

// The space at the end is necessary, to avoid accidentally closing comments with `<!-->`
export const commentMarkerTag = `--><!--${commentMarker}--><!-- `;

// The extra content at the end is to add a flag to an element when
// a nodeMarkerTag is inserted as an attribute due to an attribute containing `>`
export const nodeMarkerTag = `<!--${nodeMarker}-->`;

/**
 * The context a part is in. Each context has its own marker tag, so the marker tag identifies the context
 */
export type Context = typeof attributeMarkerTag | typeof commentMarkerTag | typeof nodeMarkerTag;

// A `<` only opens a tag if it is followed by one of these characters, otherwise the browser treats it as text
const tagOpen = /<[a-zA-Z/!?]/g;

/**
 * Find the context at the end of a string, given the context at its start
 */
export const parseContext = (string: string, context: Context): Context => {
  const openComment = string.lastIndexOf('<!--');
  // A comment that is open at the start of the string, or opens in it, stays open unless it is closed
  // Only look for the close when a comment is involved, most strings have none
  if ((context === commentMarkerTag || openComment > -1) && string.indexOf('-->', openComment + 1) < 0) {
    return commentMarkerTag;
  }
  // The string ends inside a tag if a tag opens after the last `>`
  const closeTag = string.lastIndexOf('>');
  tagOpen.lastIndex = closeTag + 1;
  if (tagOpen.test(string)) {
    return attributeMarkerTag;
  }
  // The string ends in a node context if a tag closes in it, otherwise the context is unchanged
  return closeTag > -1 ? nodeMarkerTag : context;
};

export const parseTemplate = (strings: readonly string[]): string => {
  let html = '';
  let context: Context = nodeMarkerTag;
  // The parts are in between the strings, so only the context at the end of each string but the last is needed
  for (const string of strings.slice(0, -1)) {
    context = parseContext(string, context);
    if (context === attributeMarkerTag && !string.endsWith('=')) {
      throw new Error('Only bare attribute parts are allowed: `<div a=${0}>`');
    }
    html += string + context;
  }
  return html + strings.at(-1);
};

export const buildTemplate = (strings: readonly string[], isSvg?: boolean): HTMLTemplateElement => {
  const template = document.createElement('template');
  const html = parseTemplate(strings);
  if (isSvg) {
    // Parse the content inside an <svg> element to create it in the SVG namespace, then remove that element again
    template.innerHTML = `<svg>${html}</svg>`;
    const svg = template.content.firstChild as SVGSVGElement;
    svg.replaceWith(...svg.childNodes);
  } else {
    template.innerHTML = html;
  }
  // A NodePart ends at the next sibling of its marker
  // If the parser left a part marker as the last node, add a comment so that part does not extend to the end of its future parent
  // This is not only the case when the template ends with a part: a trailing NUL character or stray end tag produce no node either
  const last = template.content.lastChild;
  if (last instanceof Comment && last.data === nodeMarker) {
    template.content.append(createMarker());
  }
  return template;
};
