/**
 * @license
 * Copyright (c) 2026 Goffert van Gool
 * SPDX-License-Identifier: MIT
 */

import { TemplateResult } from "./templates.js";
import { NodePart, type RenderOptions } from "./parts.js";
import { createMarker } from "./dom.js";

export { noChange } from "./parts.js";
export type {
  Part,
  NodePart,
  AttributePart,
  CommentPart,
  RenderOptions,
} from "./parts.js";
export type { TemplateResult } from "./templates.js";
export type { Directive } from "./directive.js";
export * from "./directives/index.js";

// A lookup map for NodeParts that represent the content of a render target
const nodeParts = new WeakMap<ParentNode, NodePart>();

/**
 * Tagging function to tag JavaScript template string literals as HTML
 *
 * Returns the strings and values of the template string wrapped in a TemplateResult object
 */
export const html = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult => {
  return new TemplateResult(strings, values);
};

/**
 * Tagging function to tag JavaScript template string literals as SVG
 * Use this for templates that are rendered inside an `<svg>` element
 *
 * Returns the strings and values of the template string wrapped in a TemplateResult object
 */
export const svg = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult => {
  return new TemplateResult(strings, values, true);
};

/**
 * Render content into a target node
 *
 * @param content
 *   Any content you wish to render. Usually a template string literal tagged with the `html` function
 * @param target
 *   An HTML Node that you wish to render the content into.
 *   The content will become the sole content of the target node.
 * @param options
 *   Options for the render. `host` is the object that event handlers are called with as `this`.
 *   The options are kept from the first render into a target.
 */
export const render = (
  content: unknown,
  target: ParentNode,
  options?: RenderOptions,
): void => {
  // Check if the target has a NodePart that represents its content
  let part = nodeParts.get(target);
  if (!part) {
    // If it does not, create a new NodePart
    // The part needs a marker to render after, and that marker replaces the previous content of the target
    const node = createMarker();
    target.replaceChildren(node);
    part = new NodePart({ node, options });
    nodeParts.set(target, part);
  }

  // Task the NodePart of this target to render the content
  part.render(content);
};
