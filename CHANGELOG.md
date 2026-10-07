# Changelog

All notable changes to lite-html are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-08

### Added

- Type declarations: the project is written in TypeScript and the package ships `.d.ts` files for the public API.

### Changed

- The package entry point is the built ES module in `dist/` instead of the raw source. The minified bundle is unchanged in purpose and is still what unpkg serves.
- The template parser is simpler and about 45% faster, and the minified build is about 100 bytes smaller gzipped. The context of a part is tracked as the marker tag that is inserted for it, and each string is parsed with the context at its start as input. The HTML it produces is identical to before.

### Fixed

- A part at the end of a template is always bounded by a comment node. Previously the comment was only added when the template literal ended with the part. A trailing NUL character, a stray end tag or a document tag produce no DOM node either, which left the part unbounded and made it clear everything to the end of its parent when it was re-rendered with a different kind of value.

## [1.0.0] - 2026-10-06

### Added

- `svg` tag for templates that are rendered inside `<svg>` elements.
- `cache` directive that keeps the DOM of templates that are no longer rendered in a part, so it can be reused when they are rendered again.
- `guard`, `ifDefined`, and `repeat` directives, following lit-html semantics.
- A `type` flag on `AttributePart`.
- Clear errors for parts inside `<script>`, `<style>`, `<textarea>`, `<title>`, and nested `<template>` elements.

### Changed

- Published as a single ES module entry point, `lite-html`, that also exports the directives. The minified bundle exports the same API.
- Every `NodePart` starts at its own marker comment that is never removed, including the root part created by `render()`. A new template instance renders its values before it is inserted into the DOM.
- A part only keeps the template instance it currently renders, so the DOM of a template is released when something else is rendered in its place. Use `cache` for the previous behaviour.
- The part itself is the event listener of an event part, so handlers can change without replacing the listener.
- Lists are bounded by comment nodes, so `normalize()` does not break them.
- A `<` that does not open a tag is treated as text, like browsers do.
- Attribute markers are removed from the rendered DOM, and `null` and `undefined` attribute values render as an empty string.
- Only values with a `then` function are treated as promises.
- `unsafeHTML` remembers the last string per part instead of caching every string forever.
- Build with Vite and test with Vitest in jsdom. Workarounds for IE11 and other old browsers are removed.
- The license notice is a single SPDX header in the entry point.

### Fixed

- Stale content when two parts are next to each other.
- Rejected promises were reported twice by `until`.
- The shared part descriptors of a `Template` were mutated by its instances.

[1.1.0]: https://github.com/ruphin/lite-html/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ruphin/lite-html/compare/v0.2.4...v1.0.0
