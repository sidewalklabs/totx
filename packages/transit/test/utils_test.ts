import {expect} from 'chai';

import {mixColors, parseColor, withoutDefaults} from '../src/utils';

describe('utils', () => {
  it('should withoutDefaults', () => {
    // Basic behavior
    expect(withoutDefaults({a: 12, b: 34}, {a: 12, b: 12})).to.deep.equal({b: 34});
    expect(withoutDefaults({a: 12, b: 34}, {a: 12, b: 34})).to.deep.equal({});
    expect(withoutDefaults({a: 22, b: 13}, {a: 12, b: 34})).to.deep.equal({a: 22, b: 13});

    // It should look inside arrays, e.g. exclude_routes.
    expect(
      withoutDefaults(
        {
          a: [1, 2, 3],
          b: 'foo',
        },
        {
          a: [1, 2, 3],
          b: 'bar',
        },
      ),
    ).to.deep.equal({b: 'foo'});
  });

  it('should parse colors', () => {
    expect(parseColor('#123456')).to.deep.equal({
      r: 0x12,
      g: 0x34,
      b: 0x56,
    });
    expect(parseColor('#ff7Dcc')).to.deep.equal({
      r: 0xff,
      g: 0x7d,
      b: 0xcc,
    });
  });

  it('should blend colors', () => {
    expect(mixColors('#ffffff', '#000000')).to.equal('#7f7f7f');
    expect(mixColors('#12aacc', '#000000')).to.equal('#095566');
  });
});
