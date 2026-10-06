// Serialize a node without the empty comment nodes that mark the boundaries of parts
const withoutMarkers = string => string.replace(/<!---->/g, '');

export const innerHTML = node => withoutMarkers(node.innerHTML);
export const outerHTML = node => withoutMarkers(node.outerHTML);
