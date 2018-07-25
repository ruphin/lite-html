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

const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;

const marker = Math.random()
  .toString(36)
  .substring(2);

const commentContext = Symbol('commentContext');
const nodeContext = Symbol('nodeContext');
const attributeContext = Symbol('attributeContext');
const unchangedContext = Symbol('unchangedContext');

// TODO: Create constants to compare comment contents
const commentMarker = `html-comment-${marker}`;
const commentMarkerTag = `--><!--${commentMarker}--><!-- `;
const nodeMarker = `html-node-${marker}`;
const nodeMarkerTag = `<!--${nodeMarker}-->`;
const attributeMarker = `__html-attribute-${marker}`;
const attributeMarkerTag = `${attributeMarker} ${attributeMarker}`;

const contextMap = new Map();
contextMap.set(commentContext, commentMarkerTag);
contextMap.set(nodeContext, nodeMarkerTag);
contextMap.set(attributeContext, attributeMarkerTag);

const templateMap = new Map();

const isPrimitive = value => !(typeof value === 'object' || typeof value === 'function');

const htmlContext = htmlString => {
  const openComment = htmlString.lastIndexOf('<!--');
  const closeComment = htmlString.indexOf('-->', openComment + 1);
  const commentClosed = closeComment > -1;
  let context;
  if (openComment > -1 && !commentClosed) {
    context = commentContext;
  } else {
    const closeTag = htmlString.lastIndexOf('>', htmlString.length - closeComment);
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

class Part {
  constructor(path, instance) {
    this.path = path;
    this.previousValue = undefined;
  }

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }
}

class NodePart extends Part {
  set node(node) {
    this.previousNode = node;
    this.startMarker = document.createComment('');
    this.endMarker = document.createComment('');
    node.parentNode.insertBefore(this.startMarker, node);
    node.parentNode.insertBefore(this.endMarker, node);
  }
  update(value) {
    if (isPrimitive(value)) {
      // Handle primitive values
      // If the value didn't change, do nothing
      if (value === this.previousValue) {
        return;
      }
      this._setText(value);
    } else if (value instanceof TemplateResult) {
      this._setTemplateResult(value);
      // TODO: Arrays?
      // } else if (Array.isArray(value) || value[Symbol.iterator]) {
      //   this._setIterable(value);
    } else if (value instanceof Node) {
      this._setNode(value);
    } else if (value.then !== undefined) {
      this._setPromise(value);
    } else {
      // Fallback, will render the string representation
      this._setText(value);
    }

    // TODO: Add other nodes than textnodes.
  }

  _setText(text) {
    if (this.previousValue === text) {
      return;
    }
    if (this.endMarker.previousSibling.nodeType === 3) {
      this.endMarker.previousSibling.nodeValue = text;
    } else {
      this._setNode(document.createTextNode(text));
    }
  }

  _setNode(node) {
    if (this.previousNode === node) {
      return;
    }
    const parent = this.endMarker.parentNode;
    if (this.previousNode instanceof DocumentFragment) {
      while (this.endMarker.previousSibling != this.startMarker) {
        this.previousNode.appendChild(this.endMarker.previousSibling);
      }
    } else {
      while (this.endMarker.previousSibling != this.startMarker) {
        parent.removeChild(this.endMarker.previousSibling);
      }
    }

    parent.insertBefore(node, this.endMarker);
    this.previousNode = node;
  }

  _setTemplateResult(templateResult) {
    let instance = this.instance.subTemplates.get(templateResult.template);
    if (!instance) {
      instance = new TemplateInstance(templateResult.template);
      this.instance.subTemplates.set(templateResult.template, instance);
    }
    if (instance.fragment !== this.previousNode) {
      this._setNode(instance.fragment);
    }
    instance.update(templateResult.values);
  }
}

class CommentPart extends Part {
  set node(node) {
    this._node = node;
    this.nextSibling = node.nextSibling;
    this.parentNode = node.parentNode;
  }
  update(value) {
    const newNode = document.createComment(value);
    const parentNode = this._node.parentNode;
    parentNode.insertBefore(newNode, this.nextSibling);
    parentNode.removeChild(this._node);
    this._node = newNode;
  }
}

class AttributePart extends Part {
  constructor(path, attribute) {
    super(path);
    this.attribute = attribute;
  }
  update(value) {
    this.node.setAttribute(this.attribute, value);
  }
}

class Template {
  constructor(strings) {
    this.strings = strings;
    this.parts = [];
    this.element = document.createElement('template');
    this.element.innerHTML = this.HTML;
    this.createParts(this.element.content, []);
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

  createParts(node, path) {
    if (node.nodeType === 8) {
      if (node.nodeValue === commentMarker) {
        this.parts.push(new CommentPart(path));
      } else if (node.nodeValue === nodeMarker) {
        this.parts.push(new NodePart(path));
      }
      return;
    }

    // Element Node
    if (node.nodeType === 1) {
      if (node.hasAttribute(attributeMarker)) {
        node.removeAttribute(attributeMarker);

        const attributes = Array.from(node.attributes);
        const dynamicAttributes = attributes.filter(attribute => attribute.value === attributeMarker);

        for (let i = 0; i < dynamicAttributes.length; i++) {
          const attributeMatch = lastAttributeNameRegex.exec(this.strings[this.parts.length]);
          if (attributeMatch) {
            const attribute = attributeMatch[1];
            this.parts.push(new AttributePart(path, attribute));
          } else {
            throw new Error(`Invalid dynamic: ${this.strings[this.parts.length]}\${ !! }${this.strings[this.parts.length + 1]}`);
          }
        }
      }
    }

    // TODO: Attribute existence parts?

    // TODO: Template nodes?

    const children = node.childNodes;
    const length = children.length;
    for (let i = 0; i < length; i++) {
      this.createParts(children[i], path.concat([i]));
    }
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
    this.subTemplates = new Map();
    this.parts = [];
    template.parts.forEach(part => {
      const instancePart = part.clone();
      instancePart.instance = this;
      this.parts.push(instancePart);
    });
    this.fragment = template.element.content.cloneNode(true);
    this.initializeParts();
  }

  initializeParts() {
    // Attach parts to nodes in this.fragment
    this.parts.forEach(part => {
      let node = this.fragment;
      console.log(part.path);
      console.log('NODE', node);
      part.path.forEach(nodeIndex => {
        node = node.childNodes[nodeIndex];
        console.log(node);
      });
      part.node = node;
    });
  }
  update(values) {
    this.parts.map((part, index) => part.update(values[index]));
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

    removeNodes(target, target.firstChild);
    instance.update(templateResult.values);
    target.appendChild(instance.fragment);
  } else {
    instance.update(templateResult.values);
  }
};
