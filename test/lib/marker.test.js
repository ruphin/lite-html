import { marker, attributeMarker, commentMarker, nodeMarker, failMarker } from '../../src/lib/markers.js';

import { describe, it, expect } from 'vitest';

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
    it(`should contain the random marker`, () => {
      expect(attributeMarker.indexOf(marker)).to.be.above(0);
    });
  });
});
