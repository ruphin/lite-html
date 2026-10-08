import { createMarker, moveNodes } from "./dom.js";

import { describe, it, expect } from "vitest";

describe("createMarker", () => {
  it("creates an empty comment node", () => {
    const marker = createMarker();
    expect(marker.nodeType).to.equal(Node.COMMENT_NODE);
    expect(marker.data).to.equal("");
  });

  it("creates a new node on every call", () => {
    expect(createMarker()).to.not.equal(createMarker());
  });
});

describe("moveNodes", () => {
  const setup = () => {
    const parent = document.createElement("div");
    parent.innerHTML = "<a></a><b></b><i></i><u></u>";
    const [before, , , after] = parent.children;
    return { parent, before: before!, after: after! };
  };

  it("removes the nodes between before and after", () => {
    const { parent, before, after } = setup();
    moveNodes(before, after);
    expect(parent.innerHTML).to.equal("<a></a><u></u>");
  });

  it("removes every node after before when after is null", () => {
    const { parent, before } = setup();
    moveNodes(before, null);
    expect(parent.innerHTML).to.equal("<a></a>");
  });

  it("moves the nodes to the new parent in order", () => {
    const { parent, before, after } = setup();
    const newParent = document.createDocumentFragment();
    moveNodes(before, after, newParent);
    expect(parent.innerHTML).to.equal("<a></a><u></u>");
    expect([...newParent.children].map((node) => node.localName)).to.deep.equal(
      ["b", "i"],
    );
  });

  it("does nothing when before and after are adjacent", () => {
    const parent = document.createElement("div");
    parent.innerHTML = "<a></a><u></u>";
    const [before, after] = parent.children;
    const newParent = document.createDocumentFragment();
    moveNodes(before!, after!, newParent);
    expect(parent.innerHTML).to.equal("<a></a><u></u>");
    expect(newParent.childNodes.length).to.equal(0);
  });
});
