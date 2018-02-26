import {expect} from 'chai';

import {buildUrl, dedent, fixRelativePath, promiseObject, reversed, sortByTuple} from '../';

describe('utils', () => {
  it('should dedent', () => {
    expect(
      dedent`
    hello
    world
    `,
    ).to.equal('\nhello\nworld\n');

    const x = 'hello';
    expect(
      dedent`
          ${x}
          world
          `,
    ).to.equal('\nhello\nworld\n');
  });

  it('should fix relative paths', () => {
    expect(fixRelativePath('saved-query/1', '/index.html')).to.equal('saved-query/1');
    expect(fixRelativePath('/saved-query/1', '/index.html')).to.equal('/saved-query/1');
    expect(fixRelativePath('saved-query/1', '/view/123')).to.equal('../saved-query/1');
    expect(fixRelativePath('/saved-query/1', '/view/123')).to.equal('/saved-query/1');
    expect(fixRelativePath('saved-query/1', '/base/view/123')).to.equal('../saved-query/1');
    expect(fixRelativePath('/saved-query/1', '/base/view/123')).to.equal('/saved-query/1');
  });

  it('should reverse lists', () => {
    expect(reversed([1, 2, 3])).to.deep.equal([3, 2, 1]);
    expect(reversed([])).to.deep.equal([]);
    const x = ['a', 'b'];
    expect(reversed(x)).to.deep.equal(['b', 'a']);
    expect(x).to.deep.equal(['a', 'b']);
  });
});

describe('buildUrl', () => {
  it('should return correct url with param', () => {
    const params = {foo: 1, bar: '', zero: 0, a_null: null as any};
    const base = 'http://example.com';
    expect(buildUrl(base, params)).equal('http://example.com?foo=1&bar=&zero=0');
  });
});

describe('tuple sort', () => {
  it('should sort a list', () => {
    const xs = [1, 2, 3, 4];
    const ys = sortByTuple(xs, x => [x === 2 ? 1 : 0, x % 2]);
    expect(xs).to.not.equal(ys); // ensure it makes a copy.
    expect(ys).to.deep.equal([
      4, // [0, 0],
      1, // [0, 1]
      3, // [0, 1],
      2, // [1, 0]
    ]);
  });

  it('should be a stable sort', () => {
    expect(sortByTuple([4, 3, 2, 1], v => [0])).to.deep.equal([4, 3, 2, 1]);
  });
});

describe('promiseObject', () => {
  it('should await an object of promises', async () => {
    const {a, b} = await promiseObject({a: Promise.resolve(1), b: Promise.resolve('b')});
    expect(a).to.equal(1);
    expect(b).to.equal('b');
  });
});
