import { TemplateResult, TemplateInstance } from './templates.js';
import { createMarker, moveNodes } from './dom.js';
import { isDirective } from './directive.js';

export type Serializable = string | number | boolean;

export const isSerializable = (value: unknown): value is Serializable =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
export const isIterable = (nonPrimitive: unknown): nonPrimitive is Iterable<unknown> =>
  typeof (nonPrimitive as Iterable<unknown>)[Symbol.iterator] === 'function';

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown>).then === 'function';

// A flag that signals that no render should happen
export const noChange = {};

// A node type for empty parts
const emptyNode = {};

// A node type for NodeParts that contain an iterable
const iterableNode = {};

export class NodePart {
  // The node that is currently rendered, or an object that identifies what kind of content is rendered
  node: object;
  // The value that was last rendered
  value: unknown;
  // The node is a marker, and this NodePart represents the content between that marker and its next sibling
  // These two nodes are never removed by the part. If the marker has no next sibling, the content extends to the end of the parent
  beforeNode: Node;
  afterNode: Node | null;
  // The TemplateInstance that is rendered in this part, if the last value was a TemplateResult
  instance: TemplateInstance | undefined;
  // The parts that render the items of the iterable, if the last value was an iterable
  iterableParts: NodePart[] | undefined;
  // The promise whose result is awaited, if the last value was a promise
  promise: PromiseLike<unknown> | undefined;

  constructor({ node }: { node: Node }) {
    this.node = emptyNode;
    this.value = noChange;

    this.beforeNode = node;
    this.afterNode = node.nextSibling;
  }

  // The parent is found through the marker, because the marker moves from a DocumentFragment
  // into the DOM when the template that contains this part is rendered
  get parentNode(): ParentNode {
    return this.beforeNode.parentNode!;
  }

  render(value: unknown): void {
    if (isDirective(value)) {
      value(this);
    } else if (value !== noChange) {
      if (value == null) {
        this.clear();
      } else if (isSerializable(value)) {
        this._renderText(value);
      } else if (value instanceof TemplateResult) {
        this._renderTemplateResult(value);
      } else if (isIterable(value)) {
        this._renderIterable(value);
      } else if (value instanceof Node) {
        this._renderNode(value);
      } else if (isPromiseLike(value)) {
        this._renderPromise(value);
        // Return here because we do not want to set `this.value` with the promise
        return;
      } else {
        value = String(value);
        this._renderText(value as string);
      }
      this.promise = undefined;
      this.value = value;
    }
  }

  /**
   * Render a serializable value in this part
   *
   * Strings, Numbers, and Booleans are serializable
   * Serializable values are rendered as textContent of a TextNode
   */
  _renderText(serializable: Serializable): void {
    // If the text is not equal to the previously rendered value
    if (this.value !== serializable) {
      // If the previous value was also serializable, replace the content of the TextNode we created for it
      // Otherwise, create a new TextNode with the primitive value as content
      if (isSerializable(this.value)) {
        (this.node as Text).data = String(serializable);
      } else {
        this._renderNode(document.createTextNode(String(serializable)));
      }
    }
  }

  /**
   * Render a TemplateResult in this part
   *
   * Checks if this part is currently rendering an instance of this template.
   * If so, re-use that TemplateInstance
   * If not, create a new TemplateInstance
   */
  _renderTemplateResult(templateResult: TemplateResult): void {
    if (this.instance?.template === templateResult.template) {
      this.instance.render(templateResult.values);
    } else {
      const instance = new TemplateInstance(templateResult.template);
      // Render the values before inserting the fragment, so the new content is added to the DOM in one go
      instance.render(templateResult.values);
      this._renderNode(instance.fragment);
      this.instance = instance;
    }
  }

  /**
   * Render an iterable in this part
   *
   * Creates a part for each item in the iterable
   * Render each iterable value in a part
   */
  _renderIterable(iterable: Iterable<unknown>): void {
    let iterableParts = this.iterableParts;
    if (this.node !== iterableNode || !iterableParts) {
      this.clear();
      this.node = iterableNode;
      iterableParts = this.iterableParts = [];
    }

    let index = 0;
    // The marker of the next new part: the marker of this part, or the node that ends the last existing part
    let marker = this.afterNode ? this.afterNode.previousSibling! : this.parentNode.lastChild!;
    for (const value of iterable) {
      let part = iterableParts[index];
      if (part === undefined) {
        // Insert the node that ends the new part before creating it, that node is also the marker of the next part
        const after = createMarker();
        this.parentNode.insertBefore(after, this.afterNode);
        part = new NodePart({ node: marker });
        iterableParts.push(part);
        marker = after;
      }
      part.render(value);
      index++;
    }
    if (index === 0) {
      moveNodes(this.beforeNode, this.afterNode);
    } else if (index < iterableParts.length) {
      const lastPart = iterableParts[index - 1];
      moveNodes(lastPart.afterNode!, this.afterNode);
    }
    iterableParts.length = index;
  }

  /**
   * Render a DOM node in this part
   */
  _renderNode(node: Node): void {
    // If we are not already rendering this node
    if (this.node !== node) {
      this.clear();
      this.parentNode.insertBefore(node, this.afterNode);
      this.node = node;
    }
  }

  /**
   * Render the result of a promise in this part
   */
  _renderPromise(promise: PromiseLike<unknown>): void {
    if (this.promise !== promise) {
      this.promise = promise;
      // When the promise resolves, render the result of that promise
      promise.then(value => {
        // Render the promise result only if the last rendered value was the promise
        if (this.promise === promise) {
          this.promise = undefined;
          this.render(value);
        }
      });
    }
  }

  /**
   * Clear out the content of this NodePart
   *
   * If the current node is a DocumentFragment (this NodePart rendered a TemplateResult)
   * The current content is moved back into that fragment to be used again if the same fragment is rendered
   * Otherwise, the current content is removed from the DOM permanently
   */
  clear(): void {
    moveNodes(this.beforeNode, this.afterNode, this.node instanceof DocumentFragment ? this.node : undefined);
    this.node = emptyNode;
    // Release the TemplateInstance and the item parts that were rendered in this part
    this.instance = this.iterableParts = undefined;
  }
}

export class CommentPart {
  node: Comment;

  constructor({ node }: { node: Comment }) {
    this.node = node;
  }

  render(value: unknown): void {
    this.node.textContent = value == null ? '' : String(value);
  }
}

export type AttributePartType = 'attribute' | 'property' | 'boolean' | 'event';

// An event listener is a function, or an object with a `handleEvent` method
type EventHandler = ((this: Element, event: Event) => void) | { handleEvent?: (event: Event) => void };

export class AttributePart {
  node: Element;
  value: unknown;
  type: AttributePartType;
  // The name of the attribute, property, or event, without the prefix
  name: string;
  _render: (value: unknown) => void;

  constructor({ node, attribute }: { node: Element; attribute: string }) {
    this.node = node;
    this.value = noChange;
    switch (attribute[0]) {
      case '.':
        this.type = 'property';
        this._render = this._renderProperty;
        break;
      case '?':
        this.type = 'boolean';
        this._render = this._renderBoolean;
        break;
      case '@':
        this.type = 'event';
        this._render = this._renderEvent;
        break;
      default:
        this.type = 'attribute';
        this._render = this._renderAttribute;
    }
    // Prefixed attributes are not real attributes, the name is the part after the prefix
    this.name = this.type === 'attribute' ? attribute : attribute.slice(1);
    // The part itself is the event listener, so the handler can change without replacing the listener
    if (this.type === 'event') {
      this.node.addEventListener(this.name, this);
    }
  }

  render(value: unknown): void {
    if (isDirective(value)) {
      value(this);
    } else if (value !== noChange) {
      this._render(value);
    }
  }

  _renderProperty(value: unknown): void {
    (this.node as unknown as Record<string, unknown>)[this.name] = value;
  }

  _renderBoolean(boolean: unknown): void {
    if (this.value !== !!boolean) {
      boolean ? this.node.setAttribute(this.name, '') : this.node.removeAttribute(this.name);
      this.value = !!boolean;
    }
  }

  _renderEvent(listener: unknown): void {
    this.value = listener;
  }

  /**
   * Called by the browser when the event of an event part fires
   *
   * The listener is either a function, or an object with a `handleEvent` method
   */
  handleEvent(event: Event): void {
    const listener = this.value as EventHandler | null | undefined;
    if (typeof listener === 'function') {
      listener.call(this.node, event);
    } else {
      listener?.handleEvent?.(event);
    }
  }

  _renderAttribute(value: unknown): void {
    if (this.value !== value) {
      this.node.setAttribute(this.name, String(value ?? ''));
      this.value = value;
    }
  }
}

export type Part = NodePart | CommentPart | AttributePart;
