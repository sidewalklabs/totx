import * as stream from 'stream';

/** A transformer that outputs its input. */
export class IdentityTransform extends stream.Transform {
  _transform(chunk: any, encoding: any, callback: any) {
    callback(null, chunk);
  }
}

/** Emit a supplied array to a readable stream one item at a time. */
export function listToReadStream<T>(
  input: T[],
  objectMode?: boolean,
  errorAfter?: number,
): NodeJS.ReadableStream {
  const transformStream = new IdentityTransform({objectMode});
  const remaining = input.slice();
  let i = 0;
  const pushMore = () => {
    if (errorAfter === i) {
      transformStream.emit('error', new Error('Something went wrong!'));
    }
    if (!remaining.length) {
      transformStream.end();
      return;
    }
    transformStream.push(remaining.shift());
    ++i;
    setImmediate(pushMore);
  };
  setImmediate(pushMore);
  return transformStream;
}

/**
 * Emit a supplied string to a readable stream in chunkSize characters per tick.
 * The stream will output the string as UTF-8 byte buffers, since that's what you normally get.
 */
export function stringToReadStream(input: string, chunkSize: number): NodeJS.ReadableStream {
  const buffers: Buffer[] = [];
  while (input.length) {
    buffers.push(new Buffer(input.slice(0, chunkSize)));
    input = input.slice(chunkSize);
  }
  return listToReadStream(buffers);
}

/** Read a streams data into an array and return it in a promise. */
export function streamToPromise<T>(inStream: NodeJS.ReadableStream): Promise<T[]> {
  const outItems: T[] = [];
  return new Promise<T[]>((resolve, reject) => {
    inStream
      .on('data', (item: T) => outItems.push(item))
      .on('end', () => resolve(outItems))
      .on('error', reject);
  });
}
