// Serialize a node without the empty comment nodes that mark the boundaries of parts
const withoutMarkers = (string: string) => string.replace(/<!---->/g, '');

export const innerHTML = (node: Element) => withoutMarkers(node.innerHTML);
export const outerHTML = (node: Element) => withoutMarkers(node.outerHTML);
