// Copyright 2017 Sidewalk Labs | apache.org/licenses/LICENSE-2.0
/**
 * This module defines a CSV loader using a specification of the expected columns and their types
 * (string, numeric, boolean). For example:
 *
 * {
 *   columns: [
 *     { name: 'id', type: ColumnType.STRING },
 *     { name: 'latitude', type: ColumnType.NUMERIC },
 *     { name: 'longitude', type: ColumnType.NUMERIC },
 *   ]
 * }
 *
 * Rows of the CSV file are parsed into objects according to the column spec.
 * Columns may appear in any order. Columns in the spec are mandatory, unless they're explicitly
 * marked as optional. Columns in the CSV file which are not in the spec are dropped.
 */

import * as fs from 'fs';
import * as _ from 'underscore';

import {parseCSV} from './csv-parser';

export enum ColumnType {
  STRING = 0,
  NUMERIC,
  BOOLEAN,
  DEFINED_BY_CALLBACK,
}

interface Column {
  name: string;
  type: ColumnType;
  optional?: boolean; // TODO: add a way to enforce column ordering for GTFS.
  destination?: string; // optional destination field name (defaults to the column name).
  callback?: (arg: string) => {}; // a user defined callback to transform the column
}

// Specification for a CSV parser.
export interface CSVSpec {
  columns: Column[]; // ordered list of columns.
  isOptional?: boolean; // set to true to allow the file to not exist.
}

interface IndexedColumn extends Column {
  number: number; // column # in the CSV header.
}

/**
 * Find an element which appears in xs at least twice, according to ===.
 * Returns null if there's no such element.
 */
export function findDuplicate<T>(xs: T[]): T {
  const seen = new Set<T>();
  for (const x of xs) {
    if (seen.has(x)) {
      return x;
    }
    seen.add(x);
  }
  return null;
}

/** Check for errors in a CSV spec. Returns an error string or null if the spec is OK. */
function findSpecError(spec: CSVSpec): string {
  const fields = spec.columns.map(c => c.destination || c.name);
  const dupe = findDuplicate(fields);
  if (dupe) {
    return `Duplicate field in CSV spec: ${dupe}`;
  }
  return null;
}

export function extractColumnMapping(
  columns: Column[],
  header: string[],
  filename?: string,
): IndexedColumn[] {
  const out = [] as IndexedColumn[];
  columns.forEach((column, i) => {
    const colNum = header.indexOf(column.name);
    if (colNum === -1) {
      if (!column.optional) {
        throw new Error(`Required column ${column.name} missing from ${header} in ${filename}.`);
      }
    } else {
      out.push(_.extend({}, column, {number: colNum}) as IndexedColumn);
    }
  });
  return out;
}

// Fills in the 'destination' field where it's absent.
function addDestinations(columns: IndexedColumn[]) {
  columns.forEach(column => {
    column.destination = column.destination || column.name;
  });
}

/** Check whether a file or directory exists. */
export function fileExists(filename: string): boolean {
  try {
    fs.accessSync(filename, fs.constants.F_OK);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Load a CSV file into an array of objects according to a spec.
 */
export function loadCSV<T>(filename: string, spec: CSVSpec): Promise<T[]> {
  const error = findSpecError(spec);
  if (error) {
    return Promise.reject(error);
  }
  if (!fileExists(filename)) {
    if (spec.isOptional) {
      return Promise.resolve([]);
    }
    return Promise.reject(`Unable to load ${filename}: file does not exist.`);
  }

  let isFirst = true;
  let columns: IndexedColumn[] = null;
  let values: T[] = [];
  return parseCSV(filename, rows => {
    if (isFirst) {
      isFirst = false;

      const header = rows[0];
      columns = extractColumnMapping(spec.columns, header, filename);
      addDestinations(columns);
      rows = rows.slice(1);
    }

    values = values.concat(
      rows.map(row => {
        const o: {[key: string]: any} = {};
        for (const column of columns) {
          if (column.type === ColumnType.STRING) {
            o[column.destination] = row[column.number];
          } else if (column.type === ColumnType.NUMERIC) {
            o[column.destination] = Number(row[column.number]);
          } else if (column.type === ColumnType.BOOLEAN) {
            o[column.destination] = row[column.number] === '1';
          } else if (column.type === ColumnType.DEFINED_BY_CALLBACK) {
            if (typeof column.callback !== 'function') {
              throw new Error(`Callback for column ${column.name} must be a function.`);
            }
            o[column.destination] = column.callback(row[column.number]);
          }
        }
        return o as T;
      }),
    );
  }).then(() => values);
}
