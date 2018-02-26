// Copyright 2017 Sidewalk Labs | apache.org/licenses/LICENSE-2.0
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {extractColumnMapping, loadCSV, ColumnType} from '../csv-loader';

const {expect} = chai;
chai.use(chaiAsPromised);

describe('csv-loader', () => {
  describe('extractColumnMapping', () => {
    it('should map columns in any order', () => {
      const locationSpec = [
        {name: 'id', type: ColumnType.STRING},
        {name: 'latitude', type: ColumnType.NUMERIC},
        {name: 'longitude', type: ColumnType.NUMERIC},
      ];

      expect(extractColumnMapping(locationSpec, ['id', 'latitude', 'longitude'])).to.deep.equal([
        {number: 0, name: 'id', type: ColumnType.STRING},
        {number: 1, name: 'latitude', type: ColumnType.NUMERIC},
        {number: 2, name: 'longitude', type: ColumnType.NUMERIC},
      ]);

      expect(extractColumnMapping(locationSpec, ['id', 'longitude', 'latitude'])).to.deep.equal([
        {number: 0, name: 'id', type: ColumnType.STRING},
        {number: 2, name: 'latitude', type: ColumnType.NUMERIC},
        {number: 1, name: 'longitude', type: ColumnType.NUMERIC},
      ]);
    });

    it('should support optional columns', () => {
      const optionalCol = [
        {name: 'a', type: ColumnType.STRING},
        {name: 'b', type: ColumnType.STRING, optional: true},
      ];

      expect(extractColumnMapping(optionalCol, ['a', 'b'])).to.deep.equal([
        {number: 0, name: 'a', type: ColumnType.STRING},
        {number: 1, name: 'b', type: ColumnType.STRING, optional: true},
      ]);

      expect(extractColumnMapping(optionalCol, ['a'])).to.deep.equal([
        {number: 0, name: 'a', type: ColumnType.STRING},
      ]);

      expect(() => extractColumnMapping(optionalCol, ['b'], 'filename')).to.throw(
        /missing.*b.*filename/,
      );
    });

    it('should map columns to destination fields', () => {
      const spec = {
        columns: [
          {name: 'id', type: ColumnType.STRING},
          {name: 'latitude', type: ColumnType.NUMERIC, destination: 'lat'},
          {name: 'longitude', type: ColumnType.NUMERIC, destination: 'lng'},
        ],
      };

      return loadCSV<any>(__dirname + '/data/locations-sample.txt', spec).then(rows => {
        expect(rows).to.have.length(36);
        expect(rows[0]).to.deep.equal({
          id: '1',
          lng: -117.14584350585938,
          lat: 36.421282443649496,
        });
        expect(rows[35]).to.deep.equal({
          id: '36',
          lng: -116.75067901611328,
          lat: 36.90968592889114,
        });
      });
    });

    it('should throw on column name collisions', () =>
      expect(
        loadCSV('foo.csv', {
          columns: [
            {name: 'foo', type: ColumnType.STRING},
            {name: 'bar', type: ColumnType.STRING, destination: 'foo'},
          ],
        }),
      ).to.eventually.be.rejectedWith(/Duplicate.*foo/));
  });
});
