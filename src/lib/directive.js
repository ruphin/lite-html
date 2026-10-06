const directives = new WeakSet();

export const isDirective = value => directives.has(value);

export const directive = directive => {
  directives.add(directive);
  return directive;
};
