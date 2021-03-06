/**
 * @license
 * MIT License
 *
 * Copyright (c) 2018 Goffert van Gool
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { directive } from '../lib/directive.js';

const templates = {};

export const unsafeHTML = htmlString =>
  directive(part => {
    let template = templates[htmlString];
    if (!template) {
      template = document.createElement('template');
      template.innerHTML = htmlString;
      template.__templateKey = {};
      templates[htmlString] = template;
    }
    if (!part.node || part.node.__templateKey !== template.__templateKey) {
      const fragment = document.importNode(template.content, true);
      fragment.__templateKey = template.__templateKey;
      part.render(fragment);
    }
  });
