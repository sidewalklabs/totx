import {expect} from 'chai';

import * as chai from 'chai';
chai.config.truncateThreshold = 0;
chai.use(require('chai-roughly'));

import {doRangesOverlap, BoundingBox, Epsg3857Point, GooglePoint, LatLng} from '../';

describe('coordinates', () => {
  it('should check for overlapping ranges', () => {
    expect(doRangesOverlap([0, 5], [2, 4])).to.be.true;
    expect(doRangesOverlap([0, 3], [2, 4])).to.be.true;
    expect(doRangesOverlap([3, 5], [2, 4])).to.be.true;
    expect(doRangesOverlap([2, 4], [2, 4])).to.be.true;
    expect(doRangesOverlap([0, 2], [2, 4])).to.be.true;
    expect(doRangesOverlap([4, 4], [2, 4])).to.be.true;
    expect(doRangesOverlap([5, 6], [2, 4])).to.be.false;
    expect(doRangesOverlap([1, 2], [2.01, 4])).to.be.false;
  });

  it('should check for overlapping boxes', () => {
    const small = BoundingBox.from(GooglePoint, {minX: 10, maxX: 20, minY: 110, maxY: 120});
    const large = BoundingBox.from(GooglePoint, {minX: 10, maxX: 100, minY: 100, maxY: 200});
    expect(small.overlaps(large)).to.be.true;
  });

  it('should convert between coordinate systems', () => {
    const roundTrip = (x: any) => x.convertTo(Epsg3857Point).convertTo(GooglePoint);
    const box = BoundingBox.from(GooglePoint, {
      minX: 100,
      maxX: 110,
      minY: 120,
      maxY: 130,
    });
    expect(roundTrip(box)).to.deep.equal(box);
  });

  it('should convert lat/lng to Google and back', () => {
    const pt = new LatLng(40.751142, -73.978808);
    expect(pt.convertTo(GooglePoint).convertTo(LatLng)).to.roughly.deep.equal(pt);
  });

  it('should convert lat/lng to EPSG3857 and back', () => {
    const pt = new LatLng(40.751142, -73.978808);
    expect(pt.convertTo(Epsg3857Point).convertTo(LatLng)).to.roughly.deep.equal(pt);
  });

  it('should convert from Google to lat/lng', () => {
    expect(
      new GooglePoint(75.1972706294076, 96.0634886968227).convertTo(LatLng),
    ).to.roughly.deep.equal(new LatLng(40.91246187791743, -74.25383817739555));
  });

  it('should calculate center & zoom level', () => {
    const box = BoundingBox.fromPoints(
      new LatLng(40.66525862129156, -74.13261659375001).convertTo(GooglePoint),
      new LatLng(40.8369145924423, -73.82499940625001).convertTo(GooglePoint),
    );

    expect(box.toCenterLevel())
      .to.roughly(1e-5)
      .deep.equal({
        center: new LatLng(40.751142, -73.978808),
        zoomLevel: 13,
      });
  });

  it('should calculate headings', () => {
    const from = new LatLng(5, 40);
    expect(from.headingTo(new LatLng(5, 41))).to.be.closeTo(90, 1.0);
    expect(from.headingTo(new LatLng(5, 39))).to.be.closeTo(270, 1.0);
    expect(from.headingTo(new LatLng(6, 40))).to.be.closeTo(0, 1.0);
    expect(from.headingTo(new LatLng(4, 40))).to.be.closeTo(180, 1.0);
    expect(from.headingTo(new LatLng(6, 41))).to.be.closeTo(45, 1.0);
  });
});
