import { directive, type Directive } from "../directive.js";
import {
  TemplateResult,
  type Template,
  type TemplateInstance,
} from "../templates.js";
import type { NodePart } from "../parts.js";

// The template instances that were rendered in each part, indexed by their Template
const instanceCaches = new WeakMap<NodePart, Map<Template, TemplateInstance>>();

/**
 * Render `value`, and keep the DOM of every template that is rendered in this part
 *
 * A part normally discards the DOM of a template when it renders something else
 * With `cache`, that DOM is kept and used again when the same template is rendered later
 */
export const cache = (value: unknown): Directive<NodePart> =>
  directive((part: NodePart) => {
    let instances = instanceCaches.get(part);
    if (!instances) {
      instances = new Map();
      instanceCaches.set(part, instances);
    }

    // If there is a cached instance of this template, put it back in the part
    // Clearing the part moves the nodes of the current instance back into its fragment
    const instance =
      value instanceof TemplateResult
        ? instances.get(value.template)
        : undefined;
    if (instance && part.instance !== instance) {
      part._renderNode(instance.fragment);
      part.instance = instance;
    }

    part.render(value);

    if (part.instance) {
      instances.set(part.instance.template, part.instance);
    }
  });
