import * as request from 'request';

const HHMMSS_REGEX = /([ 0-9]?\d):(\d\d):(\d\d)/;

export async function requestPromise<T>(
  options: request.CoreOptions & request.UrlOptions,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

/**
 * Convert an 'HH:MM:SS' string to seconds since midnight.
 * Throws on invalid input.
 */
export function parseTime(time: string): number {
  const m = HHMMSS_REGEX.exec(time);
  if (!m) {
    throw new Error(`Invalid time: ${time}`);
  }
  const [, hours, minutes, seconds] = m;
  return Number(seconds) + 60 * (Number(minutes) + 60 * Number(hours));
}
