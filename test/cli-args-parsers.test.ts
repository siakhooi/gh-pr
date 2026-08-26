import { describe, expect, it } from 'vitest';
import { InvalidOptionArgumentError } from 'commander';
import { collectLabels, parsePositiveNumber } from '../src/cli-args-parsers.js';

describe('parsePositiveNumber', () => {
  it('parses a positive integer', () => {
    expect(parsePositiveNumber('42')).toBe(42);
  });

  it('rejects values that are not numbers', () => {
    expect(() => parsePositiveNumber('abc')).toThrow(
      new InvalidOptionArgumentError('Not a number'),
    );
  });

  it('rejects zero and negative numbers', () => {
    expect(() => parsePositiveNumber('0')).toThrow(
      new InvalidOptionArgumentError('Must be a positive number'),
    );
    expect(() => parsePositiveNumber('-1')).toThrow(
      new InvalidOptionArgumentError('Must be a positive number'),
    );
  });
});

describe('collectLabels', () => {
  it('appends a label to the collection without mutating it', () => {
    const collection = ['bug'];

    expect(collectLabels('urgent', collection)).toEqual(['bug', 'urgent']);
    expect(collection).toEqual(['bug']);
  });
});
