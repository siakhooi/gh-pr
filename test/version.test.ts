import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { getVersion } from '../src/version.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('getVersion', () => {
  beforeEach(() => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));
  });

  it('returns the version parsed from package.json', () => {
    expect(getVersion()).toBe('1.2.3');
  });
});
