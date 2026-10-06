/**
 * Create an empty CommentNode that marks a boundary of a part
 */
export const createMarker = (): Comment => document.createComment('');

/**
 * Move the nodes between `before` and `after` to a new parent, or remove them if no new parent is given
 */
export const moveNodes = (before: Node, after: Node | null, newParent?: ParentNode): void => {
  let node = before.nextSibling;
  while (node && node !== after) {
    const next = node.nextSibling;
    newParent ? newParent.append(node) : node.remove();
    node = next;
  }
};
