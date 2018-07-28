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
