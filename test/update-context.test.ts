import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateContext } from '../src/update-context.js';

describe('UpdateContext', () => {
  const repoUrl = 'https://github.com/example/repo';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not exceed either limit before any updates', () => {
    const context = new UpdateContext(2, 3);

    expect(context.hasExceedRepoMaxUpdateLimit(repoUrl)).toBe(false);
    expect(context.hasExceedMaxUpdateLimit()).toBe(false);
  });

  it('tracks updates independently for each repository', () => {
    const context = new UpdateContext(2, 10);

    context.updateRepo(repoUrl);
    context.updateRepo(repoUrl);

    expect(context.hasExceedRepoMaxUpdateLimit(repoUrl)).toBe(true);
    expect(context.hasExceedRepoMaxUpdateLimit('https://github.com/example/other')).toBe(false);
  });

  it('exceeds the global limit after the configured number of updates', () => {
    const context = new UpdateContext(10, 2);

    context.updateRepo(repoUrl);
    expect(context.hasExceedMaxUpdateLimit()).toBe(false);

    context.updateRepo('https://github.com/example/other');
    expect(context.hasExceedMaxUpdateLimit()).toBe(true);
  });

  it('logs when a repository limit is reached', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const context = new UpdateContext(1, 10);

    context.updateRepo(repoUrl);

    expect(context.hasExceedRepoMaxUpdateLimit(repoUrl)).toBe(true);
    expect(log).toHaveBeenCalledWith('SKIP: Reached max update limit of 1.');
  });

  it('logs when the global limit is reached', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const context = new UpdateContext(10, 1);

    context.updateRepo(repoUrl);

    expect(context.hasExceedMaxUpdateLimit()).toBe(true);
    expect(log).toHaveBeenCalledWith('STOP: Reached max update limit of 1.');
  });
});
