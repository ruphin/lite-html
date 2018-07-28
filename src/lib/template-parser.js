import { attributeMarker, commentMarker, nodeMarker } from './markers.js';

// The second marker is to add a boolean attribute to the element
// This is to easily test if a node has dynamic attributes by checking against that attribute
export const attributeMarkerTag = `${attributeMarker} ${attributeMarker}`;

// The space at the end is necessary, to avoid accidentally closing comments with `<!-->`
export const commentMarkerTag = `--><!--${commentMarker}--><!-- `;
export const nodeMarkerTag = `<!--${nodeMarker}-->`;

export const attributeContext = Symbol('attributeContext');
export const commentContext = Symbol('commentContext');
export const nodeContext = Symbol('nodeContext');
export const unchangedContext = Symbol('unchangedContext');

const contextMap = new Map();
contextMap.set(attributeContext, attributeMarkerTag);
contextMap.set(commentContext, commentMarkerTag);
contextMap.set(nodeContext, nodeMarkerTag);

export const htmlContext = string => {
  const openComment = string.lastIndexOf('<!--');
  const closeComment = string.indexOf('-->', openComment + 1);
  const commentClosed = closeComment > -1;
  let type;
  if (openComment > -1 && !commentClosed) {
    type = commentContext;
  } else {
    const closeTag = string.lastIndexOf('>', string.length - closeComment);
    const openTag = string.indexOf('<', closeTag + 1);
    if (openTag > -1) {
      type = attributeContext;
    } else {
      if (closeTag > -1) {
        type = nodeContext;
      } else {
        type = unchangedContext;
      }
    }
  }
  return { commentClosed, type };
};

export const parseTemplate = strings => {
  const html = [];
  const lastStringIndex = strings.length - 1;
  let currentContext = nodeContext;
  for (let i = 0; i < lastStringIndex; i++) {
    const string = strings[i];
    const context = htmlContext(string);
    if ((currentContext !== commentContext || context.commentClosed) && context.type !== unchangedContext) {
      currentContext = context.type;
    }
    if (currentContext === attributeContext && string.slice(-1) !== '=') {
      throw new Error('Only bare attribute parts are allowed: `<div a=${0}>`');
    }
    html.push(string);
    html.push(contextMap.get(currentContext));
  }

  html.push(strings[lastStringIndex]);
  return html.join('');
};

export const buildTemplate = strings => {
  const template = document.createElement('template');
  template.innerHTML = parseTemplate(strings);
  return template;
};
