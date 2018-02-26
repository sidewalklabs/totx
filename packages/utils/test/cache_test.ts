import {expect} from 'chai';

import Cache from '../cache';

describe('Cache', () => {
  function fancyAdd([a, b]: [number, number]): Promise<number> {
    const v = a + b;
    if (v === 42) {
      return Promise.resolve(null);
    }
    return Promise.resolve(v);
  }

  it('should cache values', () => {
    const cache = new Cache({fetch: fancyAdd});
    expect(cache.getFromCache([1, 2])).to.be.null;
    return cache.get([1, 2]).then(result => {
      expect(result).to.equal(3);
      expect(cache.getFromCache([1, 2])).to.equal(3);
      cache.get([1, 2]);
      expect(cache.numFetches).to.equal(1);
    });
  });

  it('should cache null values', () => {
    const cache = new Cache({fetch: fancyAdd});
    expect(cache.getFromCache([20, 22])).to.be.null;
    return cache.get([20, 22]).then(result => {
      expect(result).to.be.null;
      expect(cache.getFromCache([20, 22])).to.be.null;
      cache.get([20, 22]);
      expect(cache.numFetches).to.equal(1);
    });
  });

  it('should ignore key order when caching', () => {
    function stringRepeat({a, b}: {a: string; b: number}) {
      let str = '';
      for (let i = 0; i < b; i++) {
        str += a;
      }
      return Promise.resolve(str);
    }

    const cache = new Cache({fetch: stringRepeat});
    expect(cache.getFromCache({b: 2, a: 'foo'})).to.be.null;
    expect(cache.getFromCache({a: 'foo', b: 2})).to.be.null;
    return cache.get({a: 'foo', b: 2}).then(result => {
      expect(result).to.equal('foofoo');
      expect(cache.getFromCache({b: 2, a: 'foo'})).to.equal('foofoo');
      expect(cache.getFromCache({a: 'foo', b: 2})).to.equal('foofoo');
    });
  });

  it('should merge in-flight requests', () => {
    let lastResolve: any;
    let lastX: number;

    function fetch(x: number) {
      lastX = x;

      return new Promise<number>((resolve, reject) => {
        lastResolve = resolve;
      });
    }

    function release() {
      lastResolve(lastX * 2);
    }

    const cache = new Cache({fetch});
    expect(cache.numPendingFetches()).to.equal(0);

    const p1 = cache.get(1).then(result => {
      expect(result).to.equal(2);
      expect(cache.numFetches).to.equal(1);
      expect(cache.numPendingFetches()).to.equal(0);
    });

    const p2 = cache.get(1).then(result => {
      expect(result).to.equal(2);
      expect(cache.numFetches).to.equal(1);
      expect(cache.numPendingFetches()).to.equal(0);
    });

    expect(cache.numPendingFetches()).to.equal(1);
    setImmediate(release);
    return Promise.all([p1, p2]);
  });
});
