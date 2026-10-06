import { attributeMarker, commentMarker, nodeMarker } from './markers.js';

// The second marker is to add a boolean attribute to the element
// This is to easily test if a node has dynamic attributes by checking against that attribute
export const attributeMarkerTag = `${attributeMarker} ${attributeMarker}`;

// The space at the end is necessary, to avoid accidentally closing comments with `<!-->`
export const commentMarkerTag = `--><!--${commentMarker}--><!-- `;

// The extra content at the end is to add a flag to an element when
// a nodeMarkerTag is inserted as an attribute due to an attribute containing `>`
export const nodeMarkerTag = `<!--${nodeMarker}-->`;

export const attributeContext = Symbol('attribute');
export const commentContext = Symbol('comment');
export const nodeContext = Symbol('node');
export const unchangedContext = Symbol('unchanged');

/**
 * The context a part is in: the context of the string that precedes it, or the context of the previous part
 * if that string does not change it
 */
export type MarkerContext = typeof attributeContext | typeof commentContext | typeof nodeContext;
export type Context = MarkerContext | typeof unchangedContext;

const markers: Record<MarkerContext, string> = {
  [attributeContext]: attributeMarkerTag,
  [commentContext]: commentMarkerTag,
  [nodeContext]: nodeMarkerTag,
};

// A `<` only opens a tag if it is followed by one of these characters, otherwise the browser treats it as text
const tagOpen = /<[a-zA-Z/!?]/;

export const parseContext = (string: string): { commentClosed: boolean; context: Context } => {
  const openComment = string.lastIndexOf('<!--');
  const closeComment = string.indexOf('-->', openComment + 1);
  const commentClosed = closeComment > -1;
  let context: Context;
  if (openComment > -1 && !commentClosed) {
    context = commentContext;
  } else {
    const closeTag = string.lastIndexOf('>');
    const openTag = string.slice(closeTag + 1).search(tagOpen);
    if (openTag > -1) {
      context = attributeContext;
    } else {
      if (closeTag > -1) {
        context = nodeContext;
      } else {
        context = unchangedContext;
      }
    }
  }
  return { commentClosed, context };
};

export const parseTemplate = (strings: readonly string[]): string => {
  const html: string[] = [];
  const lastStringIndex = strings.length - 1;
  let currentContext: MarkerContext = nodeContext;
  for (let i = 0; i < lastStringIndex; i++) {
    const string = strings[i];
    const { commentClosed, context } = parseContext(string);
    if ((currentContext !== commentContext || commentClosed) && context !== unchangedContext) {
      currentContext = context;
    }
    if (currentContext === attributeContext && string.slice(-1) !== '=') {
      throw new Error('Only bare attribute parts are allowed: `<div a=${0}>`');
    }
    html.push(string + markers[currentContext]);
  }

  // A NodePart ends at the next sibling of its marker
  // If the template ends with a part, add a comment so that part does not extend to the end of its future parent
  html.push(strings[lastStringIndex] || '<!---->');
  return html.join('');
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
  return template;
};
