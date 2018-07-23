/**
 * @license
 * MIT License
 *
 * Copyright (c) 2017 Goffert van Gool
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const marker = Math.random()
  .toString(36)
  .substring(2);

const commentContext = Symbol('commentContext');
const nodeContext = Symbol('nodeContext');
const attributeContext = Symbol('attributeContext');
const unchangedContext = Symbol('unchangedContext');

// TODO: Create constants to compare comment contents
const commentMarker = `--><!--html-comment-${marker}--><!--`;
const nodeMarker = `<!--html-node-${marker}-->`;
const attributeMarker = `html-attribute-${marker}`;

const contextMap = new Map();
contextMap.set(commentContext, commentMarker);
contextMap.set(nodeContext, nodeMarker);
contextMap.set(attributeContext, attributeMarker);

const templateMap = new Map();

const htmlContext = htmlString => {
  const openComment = htmlString.lastIndexOf('<!--');
  const closeComment = htmlString.indexOf('-->', openComment + 1);
  const commentClosed = closeComment > -1;
  let context;
  if (openComment > -1 && !commentClosed) {
    context = commentContext;
  } else {
    const closeTag = htmlString.lastIndexOf('>', closeComment);
    const openTag = htmlString.indexOf('<', closeTag + 1);
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

const walkTree = (element, path) => {
  let parts = [];
  // Comment Node
  if (element.nodeType === 8) {
    if (element.nodeValue === commentMarker) {
      parts.push(new PartLocation(commentPart, path)); // TODO: Construct Part directly (I think)
    } else if (element.nodeValue === nodeMarker) {
      parts.push(new PartLocation(nodePart, path));
    }
    return parts;
  }

  // TODO: Detect other node types

  const children = element.childNodes;
  const length = children.length;
  for (let i = 0; i < length; i++) {
    parts = parts.concat(walkTree(children[i]), path.concat([i]));
  }
};

// TODO: Create Parts directly
class PartLocation {
  constructor(nodeType, position) {
    this.nodeType = nodeType;
    this.position = position;
  }
}

class Template {
  constructor(strings) {
    this.strings = strings;
  }

  get HTML() {
    const html = [];
    const lastStringIndex = this.strings.length - 1;
    let currentContext;
    for (let i = 0; i < lastStringIndex; i++) {
      const string = this.strings[i];
      html.push(string);
      const context = htmlContext(string);
      if ((currentContext !== commentContext || context.commentClosed) && context.context !== unchangedContext) {
        currentContext = context.context;
      }
      html.push(contextMap.get(currentContext));
    }
    html.push(this.strings[lastStringIndex]);

    return html.join('');
  }

  get element() {
    const element = document.createElement('template');
    element.innerHTML = this.HTML;
    Object.defineProperty(this, 'element', {
      get() {
        return element;
      }
    });
    return element;
  }

  get parts() {
    const template = this.element.cloneNode(true);
  }
}

class TemplateResult {
  constructor(strings, values) {
    this.strings = strings;
    this.values = values;
  }

  get template() {
    let template = templateMap.get(this.strings);
    if (!template) {
      template = new Template(this.strings);
      templateMap.set(this.strings, template);
    }
    return template;
  }
}

class TemplateInstance {
  constructor(template) {
    this.template = template;
  }

  clone() {
    const fragment = this.template.element.content.cloneNode(true);
    return fragment;
  }
  update(values) {
    // Do things with parts
  }
}

const removeNodes = (target, startNode, endNode) => {
  let node = startNode;
  if (node) {
    while (node !== endNode) {
      const nextNode = node.nextSibling;
      target.removeChild(node);
      node = nextNode;
    }
  }
};

export const html = (strings, ...values) => {
  return new TemplateResult(strings, values);
};

export const render = (templateResult, target) => {
  let instance = target.__templateInstance;
  if (!instance || instance.template !== templateResult.template) {
    instance = new TemplateInstance(templateResult.template);
    target.__templateInstance = instance;

    const fragment = instance.clone();
    removeNodes(target, target.firstChild);
    target.appendChild(fragment);
  }

  instance.update(templateResult.values);
};
