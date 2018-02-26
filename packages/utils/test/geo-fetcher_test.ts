import {expect} from 'chai';

import {BoundingBox, GooglePoint} from '../../coordinates';
import GeoFetcher from '../geo-fetcher';

function nextTickPromise(): Promise<void> {
  return new Promise<void>(resolve => process.nextTick(resolve));
}

class FakeFetcher extends GeoFetcher<{n: number}, number> {
  lastFetchKey: {n: number};
  lastFetchBBox: BoundingBox<GooglePoint> | null;
  lastFetched: number | null;
  loading: boolean = false;

  runFetch: (n: number | null) => void;

  constructor() {
    super({
      fetch: (bbox, key) => {
        this.lastFetchKey = key;
        this.lastFetchBBox = bbox;
        return new Promise<number>(resolve => (this.runFetch = resolve));
      },
      onFetch: out => (this.lastFetched = out),
      onError: error => console.error(error),
    });
  }
}

describe('GeoFetcher', () => {
  it('Works properly', async () => {
    const fetcher = new FakeFetcher();
    fetcher.setBounds(new BoundingBox(GooglePoint, 0, 0, 1, 1));
    expect(fetcher.lastFetchKey).to.equal(null);
    expect(fetcher.lastFetchBBox).to.deep.equal(
      new BoundingBox(GooglePoint, -0.25, -0.25, 1.25, 1.25),
    );

    fetcher.runFetch(123);
    await nextTickPromise();
    expect(fetcher.lastFetched).to.equal(123);
  });

  it('Queues requests if one is already ongoing', async () => {
    const fetcher = new FakeFetcher();
    fetcher.setBounds(new BoundingBox(GooglePoint, 0, 0, 1, 1));
    fetcher.runFetch(123);
    await nextTickPromise();

    expect(fetcher.lastFetched).to.equal(123);
    fetcher.setKey({n: 456});
    fetcher.setKey({n: 567});
    fetcher.setKey({n: 678});
    expect(fetcher.lastFetchKey.n).to.equal(456);

    fetcher.runFetch(234);
    await nextTickPromise();
    expect(fetcher.lastFetchKey.n).to.equal(678);

    fetcher.runFetch(345);
    await nextTickPromise();
    expect(fetcher.lastFetched).to.equal(345);
  });

  it('Only reruns requests if the bounding box moves sufficiently', async () => {
    const fetcher = new FakeFetcher();
    fetcher.setBounds(new BoundingBox(GooglePoint, 0, 0, 1, 1));
    fetcher.runFetch(123);
    await nextTickPromise();

    fetcher.setBounds(new BoundingBox(GooglePoint, 0.1, 0.1, 1.1, 1.1));

    fetcher.setBounds(new BoundingBox(GooglePoint, 0.5, 0.5, 1.5, 1.5));
  });

  it('Handles skipped requests', async () => {
    const fetcher = new FakeFetcher();
    fetcher.setBounds(new BoundingBox(GooglePoint, 0, 0, 1, 1));
    fetcher.runFetch(null);
    await nextTickPromise();

    fetcher.setBounds(new BoundingBox(GooglePoint, 0.1, 0.1, 0.9, 0.9));
  });
});
