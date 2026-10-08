import type { Part } from "./parts.js";

/**
 * A directive is a function that is called with the part it is rendered in, instead of being rendered as a value
 */
export type Directive<P extends Part = Part> = (part: P) => void;

const directives = new WeakSet<object>();

export const isDirective = (value: unknown): value is Directive =>
  typeof value === "function" && directives.has(value);

export const directive = <P extends Part>(
  directive: Directive<P>,
): Directive<P> => {
  directives.add(directive);
  return directive;
};
