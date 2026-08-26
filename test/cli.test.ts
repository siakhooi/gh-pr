import { beforeEach, describe, expect, it, vi } from 'vitest';

const { printListMock, printVersionCommandMock, getVersionMock } = vi.hoisted(() => ({
  printListMock: vi.fn(),
  printVersionCommandMock: vi.fn(),
  getVersionMock: vi.fn(() => '9.9.9'),
}));

vi.mock('../src/index.js', () => ({
  performListCommand: printListMock,
  printVersionCommand: printVersionCommandMock,
}));

vi.mock('../src/version.js', () => ({
  getVersion: getVersionMock,
}));

describe('cli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.argv = ['node', 'gh-pr'];
  });

  it('converts list command options into the expected query payload', async () => {
    process.argv = [
      'node',
      'gh-pr',
      'list',
      '--assigned-to-me',
      '--requested-my-review',
      '--authored-by-me',
      '--authored-by-dependabot',
      '--authored-by-renovate',
      '--not-yet-reviewed',
      '-l',
      '4',
      '-u',
      'octocat',
      '-R',
      'owner/repo',
      '--label',
      'bug',
      '--label',
      'urgent',
    ];

    await import('../src/cli.js');

    expect(printListMock).toHaveBeenCalledTimes(1);
    expect(printListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        assignedToMe: true,
        requestedMyReview: true,
        authoredByMe: true,
        authoredByDependabot: true,
        authoredByRenovate: true,
        notYetReviewed: true,
        limit: 4,
        user: 'octocat',
        repo: 'owner/repo',
        label: ['bug', 'urgent'],
      }),
    );
  });

  it('rejects invalid numeric limits before calling the list action', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit:${code ?? 0}`);
    });
    const stderrWriteSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    process.argv = ['node', 'gh-pr', 'list', '--limit', 'abc'];

    await expect(import('../src/cli.js')).rejects.toThrow('process.exit:1');
    expect(printListMock).not.toHaveBeenCalled();

    exitSpy.mockRestore();
    stderrWriteSpy.mockRestore();
  });
});
