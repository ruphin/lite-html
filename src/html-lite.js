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

import { TemplateResult, TemplateInstance } from './lib/templates.js';

export const html = (strings, ...values) => {
  return new TemplateResult(strings, values);
};

export const render = (templateResult, target) => {
  let instance = target.__templateInstance;
  // TODO: Do something smart when the template is different.
  // Probably use some removeNodes function that re-appends nodes into the old fragment
  if (!instance || instance.template !== templateResult.template) {
    instance = new TemplateInstance(templateResult.template);
    target.__templateInstance = instance;

    target.innerHTML = '';
    instance.update(templateResult.values);
    target.appendChild(instance.fragment);
  } else {
    instance.update(templateResult.values);
  }
};
