import { commentMarker, nodeMarker, attributeMarker } from './markers.js';
import { TemplateResult, TemplateInstance } from './templates.js';

const isPrimitive = value => !(typeof value === 'object' || typeof value === 'function');

const lastAttributeNameRegex = /[ \x09\x0a\x0c\x0d]([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)[ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*)$/;

export const findParts = (strings, template) => {
  let parts = [];

  // Recursive depth-first tree traversal that finds nodes in the subtree of `node` that are parts.
  const recursiveIndex = (node, path) => {
    if (node.nodeType === 8) {
      if (node.nodeValue === commentMarker) {
        parts.push({ type: CommentPart, path });
      } else if (node.nodeValue === nodeMarker) {
        parts.push({ type: NodePart, path });
      }
      return;
    }

    // Element Node
    if (node.nodeType === 1) {
      // All nodes with attribute parts have the attributeMarker set as an attribute
      if (node.hasAttribute(attributeMarker)) {
        node.removeAttribute(attributeMarker);

        const attributes = Array.from(node.attributes);
        const dynamicAttributes = attributes.filter(attribute => attribute.value === attributeMarker);

        for (let i = 0; i < dynamicAttributes.length; i++) {
          const attributeMatch = lastAttributeNameRegex.exec(strings[parts.length]);
          if (attributeMatch) {
            const attribute = attributeMatch[1];
            parts.push({ type: AttributePart, path, attribute });
          } else {
            throw new Error(`Invalid part: ${strings[parts.length]}\${ !! }${strings[parts.length + 1]}`);
          }
        }
      }
    }
    const children = node.childNodes;
    const length = children.length;
    for (let i = 0; i < length; i++) {
      recursiveIndex(children[i], path.concat([i]));
    }
  };

  recursiveIndex(template.content, []);
  return parts;
};

export class NodePart {
  constructor(placeholder) {
    this.previousNode = placeholder;
    this.startMarker = document.createComment('');
    this.endMarker = document.createComment('');
    this.subTemplates = new Map();
    const parent = placeholder.parentNode;
    parent.insertBefore(this.startMarker, placeholder);
    parent.insertBefore(this.endMarker, placeholder);
    parent.removeChild(placeholder);
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
    } else if (Array.isArray(value) || value[Symbol.iterator]) {
      this._setIterable(value);
    } else if (value instanceof Node) {
      this._setNode(value);
    } else if (value.then !== undefined) {
      this._setPromise(value);
    } else {
      this._setText(value);
    }
  }

  _setIterable(value) {
    const append = () => {
      const placeholder = document.createComment('');
      this.endMarker.parentNode.insertBefore(placeholder, this.endMarker);
      return new NodePart(placeholder);
    };

    this._setNode(document.createComment(''));
    value.forEach(item => {
      append().update(item);
    });
    // if (!this.previousValue || !Array.isArray(this.previousValue) || !this.previousValue[Symbol.iterator]) {

    //   // Construct a new array thing
    // } else {
    //   // Re-use array thing
    // }
  }

  _setText(text) {
    if (this.previousValue === text) {
      return;
    }
    if (this.endMarker.previousSibling.nodeType === 3 && this.endMarker.previousSibling.previousSibling === this.startMarker) {
      this.endMarker.previousSibling.textContent = text;
    } else {
      this._setNode(document.createTextNode(text));
    }
  }

  _setNode(node) {
    if (this.previousValue === node) {
      return;
    }
    const parent = this.endMarker.parentNode;
    if (this.previousValue instanceof DocumentFragment) {
      while (this.endMarker.previousSibling != this.startMarker) {
        this.previousValue.appendChild(this.endMarker.previousSibling);
      }
    } else {
      while (this.endMarker.previousSibling != this.startMarker) {
        parent.removeChild(this.endMarker.previousSibling);
      }
    }

    parent.insertBefore(node, this.endMarker);
    this.previousValue = node;
  }

  _setTemplateResult(templateResult) {
    let instance = this.subTemplates.get(templateResult.template);
    if (!instance) {
      instance = new TemplateInstance(templateResult.template);
      this.subTemplates.set(templateResult.template, instance);
    }
    if (instance.fragment !== this.previousNode) {
      this._setNode(instance.fragment);
    }
    instance.update(templateResult.values);
  }
}

export class CommentPart {
  constructor(placeholder) {
    this.node = placeholder;
  }
  update(value) {
    this.node.textContent = value;
  }
}

export class AttributePart {
  constructor(node, attributeName) {
    this.node = node;
    switch (attributeName[0]) {
      case '.':
        this.update = this.updateProperty;
      case '?':
        this.update = this.update || this.updateBoolean;
      case '@':
        this.update = this.update || this.updateEvent;
        this.node.removeAttribute(attributeName);
        this.name = attributeName.slice(1);
        break;
      default:
        this.update = this.updateAttribute;
        this.name = attributeName;
    }
  }
  updateProperty(value) {
    this.node[this.name] = value;
  }
  updateBoolean(value) {
    value ? this.node.setAttribute(this.name, '') : this.node.removeAttribute(this.name);
  }
  updateEvent(value) {
    if (typeof value === 'function') {
      // TODO: Remember this event listener and remove it again if it changes
      this.node.addEventListener(this.name, value);
    }
  }
  updateAttribute(value) {
    this.node.setAttribute(this.name, value);
  }
}
