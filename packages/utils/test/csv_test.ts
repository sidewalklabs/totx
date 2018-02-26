// Copyright 2017 Sidewalk Labs | apache.org/licenses/LICENSE-2.0
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as tmp from 'tmp';

import {parseCSV, parseLine} from '../csv-parser';
import {dedent} from '../index';

chai.use(chaiAsPromised);

const {assert, expect} = chai;

function writeTempFile(contents: string): string {
  const result = tmp.fileSync();
  fs.writeSync(result.fd, contents);
  fs.closeSync(result.fd);
  return result.name;
}

describe('parseCSV', () => {
  const collectRows = (filename: string, config?: any) => {
    let allRows: string[][] = [];
    return parseCSV(
      filename,
      rows => {
        allRows = allRows.concat(rows);
      },
      config,
    ).then(() => allRows);
  };

  it('should parse a small file', () =>
    collectRows(__dirname + '/data/frequencies.txt').then(rows => {
      assert.equal(rows.length, 12);
      assert.deepEqual(rows[0], ['trip_id', 'start_time', 'end_time', 'headway_secs']);
      assert.deepEqual(rows[11], ['CITY2', '19:00:00', '22:00:00', '1800']);
    }));

  it('should parse a small file with multiple chunks', () =>
    collectRows(__dirname + '/data/frequencies.txt', {chunkSize: 100}).then(rows => {
      assert.equal(rows.length, 12);
      assert.deepEqual(rows[0], ['trip_id', 'start_time', 'end_time', 'headway_secs']);
      assert.deepEqual(rows[11], ['CITY2', '19:00:00', '22:00:00', '1800']);
    }));

  it('should parse a file with multiple chunks', () =>
    collectRows(__dirname + '/data/stop_times.txt', {chunkSize: 100}).then(rows => {
      assert.equal(rows.length, 29);
      assert.deepEqual(rows[0], [
        'trip_id',
        'arrival_time',
        'departure_time',
        'stop_id',
        'stop_sequence',
        'stop_headsign',
        'pickup_type',
        'drop_off_time',
        'shape_dist_traveled',
      ]);
      assert.deepEqual(rows[28], ['AAMV4', '16:00:00', '16:00:00', 'BEATTY_AIRPORT', '2']);
    }));

  it('should parse quoted text', () => {
    expect(parseLine('a,b,c')).to.deep.equal(['a', 'b', 'c']);
    expect(parseLine('a,"b,c"')).to.deep.equal(['a', 'b,c']);
    expect(parseLine('"a,b",c')).to.deep.equal(['a,b', 'c']);
    expect(parseLine('a""b')).to.deep.equal(['a"b']);
    expect(parseLine('"a,""b"')).to.deep.equal(['a,"b']);
    expect(parseLine('Avenue "D" stop')).to.deep.equal(['Avenue D stop']);
  });

  it('should parse quoted values', () => {
    const filename = writeTempFile(dedent`
        a,b,c
        foo,"bar,baz",quux
        `);
    expect(collectRows(filename)).to.eventually.deep.equal([
      ['a', 'b', 'c'],
      ['foo', 'bar,baz', 'quux'],
    ]);
  });
});
