import {expect} from 'chai';

import {withoutDefaults} from '../src/utils';

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
});
