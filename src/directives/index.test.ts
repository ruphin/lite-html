import * as directives from "./index.js";
import { cache } from "./cache.js";
import { guard } from "./guard.js";
import { ifDefined } from "./if-defined.js";
import { repeat } from "./repeat.js";
import { unsafeHTML } from "./unsafe-html.js";
import { until } from "./until.js";
import { when } from "./when.js";

import { describe, it, expect } from "vitest";

describe("directives", () => {
  it("exports every directive", () => {
    expect({ ...directives }).to.deep.equal({
      cache,
      guard,
      ifDefined,
      repeat,
      unsafeHTML,
      until,
      when,
    });
  });
});
