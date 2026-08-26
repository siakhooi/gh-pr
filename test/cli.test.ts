import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  printListMock,
  performAutoReviewCommandMock,
  performAutoMergeCommandMock,
  printVersionCommandMock,
  getVersionMock,
} = vi.hoisted(() => ({
  printListMock: vi.fn(),
  performAutoReviewCommandMock: vi.fn(),
  performAutoMergeCommandMock: vi.fn(),
  printVersionCommandMock: vi.fn(),
  getVersionMock: vi.fn(() => '9.9.9'),
}));

vi.mock('../src/index.js', () => ({
  performListCommand: printListMock,
  performAutoReviewCommand: performAutoReviewCommandMock,
  performAutoMergeCommand: performAutoMergeCommandMock,
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

  it('converts auto review command options into the expected action payload', async () => {
    process.argv = [
      'node',
      'gh-pr',
      'autoreview',
      '--assigned-to-me',
      '--requested-my-review',
      '--authored-by-me',
      '--authored-by-dependabot',
      '--authored-by-renovate',
      '--not-yet-reviewed',
      '--allow-no-checks',
      '--dry-run',
      '--max-update',
      '5',
      '--max-update-per-repo',
      '2',
      '-l',
      '4',
      '-u',
      'octocat',
      '-R',
      'owner/repo',
      '--label',
      'bug',
    ];

    await import('../src/cli.js');

    expect(performAutoReviewCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({
        assignedToMe: true,
        requestedMyReview: true,
        authoredByMe: true,
        authoredByDependabot: true,
        authoredByRenovate: true,
        notYetReviewed: true,
        allowNoChecks: true,
        dryRun: true,
        maxUpdate: 5,
        maxUpdatePerRepo: 2,
        limit: 4,
        user: 'octocat',
        repo: 'owner/repo',
        label: ['bug'],
      }),
    );
  });

  it('converts auto merge command options into the expected action payload', async () => {
    process.argv = [
      'node',
      'gh-pr',
      'automerge',
      '--assigned-to-me',
      '--authored-by-me',
      '--authored-by-dependabot',
      '--authored-by-renovate',
      '--allow-no-checks',
      '--dry-run',
      '--max-update',
      '6',
      '--max-update-per-repo',
      '3',
      '-l',
      '7',
      '-u',
      'octocat',
      '-R',
      'owner/repo',
      '--label',
      'urgent',
    ];

    await import('../src/cli.js');

    expect(performAutoMergeCommandMock).toHaveBeenCalledWith(
      expect.objectContaining({
        assignedToMe: true,
        authoredByMe: true,
        authoredByDependabot: true,
        authoredByRenovate: true,
        allowNoChecks: true,
        dryRun: true,
        maxUpdate: 6,
        maxUpdatePerRepo: 3,
        limit: 7,
        user: 'octocat',
        repo: 'owner/repo',
        label: ['urgent'],
      }),
    );
  });
});
