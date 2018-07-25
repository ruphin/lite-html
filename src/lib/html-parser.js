import { commentMarker, nodeMarker, attributeMarker } from './markers.js';

// The space at the end is necessary, or a part followed by a '>' character becomes <!-->
const commentMarkerTag = `--><!--${commentMarker}--><!-- `;
const nodeMarkerTag = `<!--${nodeMarker}-->`;

// The second marker is to add a boolean attribute to easily check if a node has dynamic attributes
const attributeMarkerTag = `${attributeMarker} ${attributeMarker}`;

const commentContext = Symbol('commentContext');
const nodeContext = Symbol('nodeContext');
const attributeContext = Symbol('attributeContext');
const unchangedContext = Symbol('unchangedContext');

const contextMap = new Map();
contextMap.set(commentContext, commentMarkerTag);
contextMap.set(nodeContext, nodeMarkerTag);
contextMap.set(attributeContext, attributeMarkerTag);

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
  let currentContext;
  for (let i = 0; i < lastStringIndex; i++) {
    const string = strings[i];
    html.push(string);
    const context = htmlContext(string);
    if ((currentContext !== commentContext || context.commentClosed) && context.type !== unchangedContext) {
      currentContext = context.type;
    }
    html.push(contextMap.get(currentContext));
  }
  html.push(strings[lastStringIndex]);

  const template = document.createElement('template');
  template.innerHTML = html.join('');
  return template;
};
