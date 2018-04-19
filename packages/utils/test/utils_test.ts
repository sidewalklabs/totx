import {expect} from 'chai';

import {memoizeLast} from '..';

describe('utils', () => {
  it('should memoize the last call', () => {
    let numCalls = 0;
    const fn = (args: {x: number}) => {
      numCalls++;
      return args.x;
    };
    const wrappedFn = memoizeLast(fn);

    expect(wrappedFn({x: 12})).to.equal(12);
    expect(numCalls).to.equal(1);
    expect(wrappedFn({x: 12})).to.equal(12);
    expect(numCalls).to.equal(1);
    expect(wrappedFn({x: 37})).to.equal(37);
    expect(numCalls).to.equal(2);
    expect(wrappedFn({x: 12})).to.equal(12);
    expect(numCalls).to.equal(3);
  });
});
