import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getTokenOrExit } from '../src/token.js';

describe('getTokenOrExit', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('token is defined', () => {
    vi.mock('process', () => ({
      env: { GITHUB_TOKEN: 'ABC' },
    }));
    expect(getTokenOrExit(), 'ABC');
  });
  it('token is not defined', () => {
    delete process.env.GITHUB_TOKEN;

    const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => getTokenOrExit()).toThrow('process.exit called');

    expect(errorMock).toHaveBeenCalledWith('Error: GITHUB_TOKEN environment variable is not set.');

    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
