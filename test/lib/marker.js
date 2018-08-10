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

import { marker, attributeMarker, commentMarker, nodeMarker, failMarker, IEStyleMarker } from '../../src/lib/markers.js';

const expect = chai.expect;

describe('markers', () => {
  describe('marker', () => {
    it('should contain only lowercase alphanumerical characters', () => {
      const alphaNumericalRegex = /^[a-z0-9]+$/;
      expect(marker.match(alphaNumericalRegex)).to.not.be.null;
    });
    it('should be at least 10 characters long', () => {
      expect(marker.length).to.be.at.least(10);
    });
  });

  describe('nodeMarker', () => {
    it(`should contain the random marker`, () => {
      expect(nodeMarker.indexOf(marker)).to.be.above(0);
    });
    it(`should contain the failMarker after a double quote, wrapped in spaces`, () => {
      expect(nodeMarker.indexOf(`" ${failMarker} `)).to.be.above(0);
    });
  });

  describe('failMarker', () => {
    it(`should contain the random marker`, () => {
      expect(nodeMarker.indexOf(marker)).to.be.above(0);
    });
  });

  describe('commentMarker', () => {
    it(`should contain the random marker`, () => {
      expect(commentMarker.indexOf(marker)).to.be.above(0);
    });
  });

  describe('attributeMarker', () => {
    it(`should be a CSS font-family definition`, () => {
      expect(attributeMarker.startsWith('font-family:')).to.be.true;
    });
    it(`should contain the random marker`, () => {
      expect(attributeMarker.indexOf(marker)).to.be.above(0);
    });
  });

  describe('IEStyleMarker', () => {
    it(`should be an IE11 font-family definition`, () => {
      const IEStyleRegex = /^font-family: [a-z0-9]+;$/;
      expect(IEStyleMarker.match(IEStyleRegex)).to.not.be.null;
    });
    it(`should contain the random marker`, () => {
      expect(attributeMarker.indexOf(marker)).to.be.above(0);
    });
  });
});
