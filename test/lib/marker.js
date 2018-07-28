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

import { marker, attributeMarker, commentMarker, nodeMarker } from '/src/lib/markers.js';

const expect = chai.expect;

describe('markers', () => {
  const alphaNumericalRegex = /^[a-z0-9]+$/;
  const alphaNumericalAndDashRegex = /^[a-z0-9\-]+$/;

  describe('marker', () => {
    it('should contain only lowercase alphanumerical characters', () => {
      expect(marker.match(alphaNumericalRegex)).to.not.be.null;
    });
    it('should be at least 8 characters long', () => {
      expect(marker.length >= 8).to.be.true;
    });
  });

  describe('nodeMarker', () => {
    it(`should start with 'node-'`, () => {
      expect(nodeMarker.substring(0, 5)).to.be.equal('node-');
    });
    it(`should only contain lowercase alphanumerical characters and '-'`, () => {
      expect(nodeMarker.match(alphaNumericalAndDashRegex)).to.not.be.null;
    });
  });

  describe('commentMarker', () => {
    it(`should start with 'comment-'`, () => {
      expect(commentMarker.substring(0, 8)).to.be.equal('comment-');
    });
    it(`should only contain lowercase alphanumerical characters and '-'`, () => {
      expect(commentMarker.match(alphaNumericalAndDashRegex)).to.not.be.null;
    });
  });

  describe('attributeMarker', () => {
    it(`should start with 'attribute-'`, () => {
      expect(attributeMarker.substring(0, 10)).to.be.equal('attribute-');
    });
    it(`should only contain lowercase alphanumerical characters and '-'`, () => {
      expect(attributeMarker.match(alphaNumericalAndDashRegex)).to.not.be.null;
    });
  });
});
