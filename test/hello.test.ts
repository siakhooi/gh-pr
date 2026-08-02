import { describe, expect, test } from 'vitest';
import { hello } from '../src/index.js';

describe('hello', () => {
  test("returns 'Hello, World!'", () => {
    expect(hello()).toBe('Hello, World!');
  });
});
