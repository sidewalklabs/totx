// Copyright 2017 Sidewalk Labs | apache.org/licenses/LICENSE-2.0
import * as fs from 'fs';

const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024;

export interface Options {
  chunkSize?: number;
  lineDelimiter?: string;
  encoding?: string; // defaults to UTF-8.
}

function detectDelimiter(text: string) {
  for (const delim of ['\r\n', '\r', '\n']) {
    if (text.indexOf(delim) >= 0) {
      return delim;
    }
  }
  return null;
}

export function parseLine(line: string) {
  // Easy case: no quotes.
  if (line.indexOf('"') === -1) {
    return line.split(',');
  }

  // Harder case: some fields may be quoted.
  // Commas may appear in quotes.
  // Two quotes in a row ("") mean a single quote, even inside quotes.
  const fields = [] as string[];
  let inQuotes = false;
  let text = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const nc = line[i + 1];
    if (c === '"' && nc !== '"') {
      inQuotes = !inQuotes;
    } else if (c === '"' && nc === '"') {
      text += c;
      i += 1;
    } else if (c === ',' && !inQuotes) {
      fields.push(text);
      text = '';
    } else {
      text += c;
    }
  }
  if (text) fields.push(text);
  return fields;
}

/**
 * Parse a CSV file in chunks, calling the callback with the complete rows found in those chunks.
 *
 * This provides a good balance between pulling the entire file into memory (which may not be
 * possible) and firing a callback on every line (which may be a performance bottlenck).
 */
export function parseCSV(
  filename: string,
  callback: (rows: string[][]) => any,
  options?: Options,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    options = options || {};
    const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    const encoding = options.encoding || 'utf8';
    let delim = options.lineDelimiter;
    const buffer = new Buffer(chunkSize);

    let leftovers = '';
    let isRejected = false;

    fs.open(filename, 'r', (openErr, fid) => {
      if (openErr) {
        isRejected = true;
        reject(openErr);
        return;
      }

      const processChunk = (data: string, isLast: boolean) => {
        const combinedData = leftovers + data;
        if (!delim) {
          delim = detectDelimiter(combinedData);
          if (!delim) {
            leftovers = combinedData;
            return;
          }
        }

        let lines = combinedData.split(delim);
        if (!isLast) {
          leftovers = lines[lines.length - 1];
          lines = lines.slice(0, -1);
        } else if (lines[lines.length - 1] === '') {
          // ignore trailing newlines
          lines = lines.slice(0, -1);
        }
        if (lines.length) {
          callback(lines.map(parseLine));
        }
      };

      const readNextChunk = () => {
        fs.read(fid, buffer, 0, chunkSize, null, (readErr, nread) => {
          if (readErr) {
            isRejected = true;
            reject(readErr);
            return;
          }

          if (nread === 0) {
            // done reading file, do any necessary finalization steps

            fs.close(fid, closeErr => {
              if (closeErr) {
                isRejected = true;
                reject(closeErr);
              }
            });
            if (leftovers) {
              processChunk('', true);
            }
            resolve();
            return;
          }

          let data: Buffer;
          let isLast = false;
          if (nread < chunkSize) {
            data = buffer.slice(0, nread);
            isLast = true;
          } else {
            data = buffer;
          }

          const str = data.toString(encoding);
          processChunk(str, isLast);

          if (!isRejected) {
            if (isLast) {
              resolve();
            } else {
              setImmediate(readNextChunk);
            }
          }
        });
      };

      readNextChunk();
    });
  });
}
