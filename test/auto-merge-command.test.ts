import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performAutoMergeCommand } from '../src/auto-merge-command.js';
import { getTokenOrExit } from '../src/token.js';

const { githubClient, githubClientConstructor } = vi.hoisted(() => {
  const client = {
    searchPullRequests: vi.fn(),
    getPulls: vi.fn(),
    getPullsReviews: vi.fn(),
    getUsersAuthenticated: vi.fn(),
    getChecksListForRef: vi.fn(),
    mergePullRequest: vi.fn(),
  };

  return {
    githubClient: client,
    githubClientConstructor: vi.fn(function () {
      return client;
    }),
  };
});

vi.mock('../src/token.js', () => ({
  getTokenOrExit: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  GithubClient: githubClientConstructor,
}));

describe('performAutoMergeCommand', () => {
  const pullRequest = {
    repository: 'example/repo',
    owner: 'example',
    repo: 'repo',
    number: 12,
    repo_url: 'https://github.com/example/repo',
  };
  const options = {
    assignedToMe: false,
    authoredByMe: false,
    authoredByDependabot: false,
    authoredByRenovate: false,
    limit: 10,
    user: '',
    repo: '',
    label: [],
    allowNoChecks: false,
    dryRun: false,
    maxUpdate: 5,
    maxUpdatePerRepo: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTokenOrExit).mockReturnValue('token-123');
    githubClient.searchPullRequests.mockResolvedValue([pullRequest]);
    githubClient.getPulls.mockResolvedValue({
      commit: 'abc123',
      mergeable: true,
      mergeable_state: 'clean',
    });
    githubClient.getPullsReviews.mockResolvedValue([
      { user: { login: 'octocat' }, commit_id: 'abc123', state: 'APPROVED' },
    ]);
    githubClient.getUsersAuthenticated.mockResolvedValue({ login: 'octocat' });
    githubClient.getChecksListForRef.mockResolvedValue({
      total_count: 1,
      check_runs: [{ conclusion: 'success', status: 'completed' }],
    });
    githubClient.mergePullRequest.mockResolvedValue(undefined);
  });

  it('searches for approved PRs and merges after all checks succeed', async () => {
    performAutoMergeCommand(options);

    await vi.waitFor(() => expect(githubClient.mergePullRequest).toHaveBeenCalled());

    expect(githubClientConstructor).toHaveBeenCalledWith('token-123');
    expect(githubClient.searchPullRequests).toHaveBeenCalledWith(
      ['is:pr', 'is:open', 'review:approved'],
      10,
    );
    expect(githubClient.getPulls).toHaveBeenCalledWith('example', 'repo', 12);
    expect(githubClient.getPullsReviews).toHaveBeenCalledWith('example', 'repo', 12);
    expect(githubClient.getUsersAuthenticated).toHaveBeenCalledTimes(1);
    expect(githubClient.getChecksListForRef).toHaveBeenCalledWith('example', 'repo', 'abc123');
    expect(githubClient.mergePullRequest).toHaveBeenCalledWith('example', 'repo', 12, 'abc123');
  });

  it('does not merge in dry-run mode', async () => {
    performAutoMergeCommand({ ...options, dryRun: true });

    await vi.waitFor(() => expect(githubClient.getChecksListForRef).toHaveBeenCalled());

    expect(githubClient.mergePullRequest).not.toHaveBeenCalled();
  });

  it('skips a pull request that is not mergeable', async () => {
    githubClient.getPulls.mockResolvedValue({
      commit: 'abc123',
      mergeable: false,
      mergeable_state: 'dirty',
    });

    performAutoMergeCommand(options);

    await vi.waitFor(() => expect(githubClient.getPulls).toHaveBeenCalled());

    expect(githubClient.getPullsReviews).not.toHaveBeenCalled();
    expect(githubClient.mergePullRequest).not.toHaveBeenCalled();
  });

  it('skips a pull request whose mergeable state is not clean', async () => {
    githubClient.getPulls.mockResolvedValue({
      commit: 'abc123',
      mergeable: true,
      mergeable_state: 'blocked',
    });

    performAutoMergeCommand(options);

    await vi.waitFor(() => expect(githubClient.getPulls).toHaveBeenCalled());

    expect(githubClient.getPullsReviews).not.toHaveBeenCalled();
    expect(githubClient.mergePullRequest).not.toHaveBeenCalled();
  });

  it('skips a pull request when the user has not approved it', async () => {
    githubClient.getPullsReviews.mockResolvedValue([]);

    performAutoMergeCommand(options);

    await vi.waitFor(() => expect(githubClient.getPullsReviews).toHaveBeenCalled());

    expect(githubClient.getChecksListForRef).not.toHaveBeenCalled();
    expect(githubClient.mergePullRequest).not.toHaveBeenCalled();
  });

  it('skips when no checks have been done unless allowed', async () => {
    githubClient.getPullsReviews.mockResolvedValue([
      { user: { login: 'octocat' }, commit_id: 'abc123', state: 'APPROVED' },
    ]);
    githubClient.getChecksListForRef.mockResolvedValue({ total_count: 0, check_runs: [] });

    performAutoMergeCommand(options);

    await vi.waitFor(() => expect(githubClient.getChecksListForRef).toHaveBeenCalled());

    expect(githubClient.mergePullRequest).not.toHaveBeenCalled();
  });

  it('merges when no checks have been done and that is allowed', async () => {
    githubClient.getPullsReviews.mockResolvedValue([
      { user: { login: 'octocat' }, commit_id: 'abc123', state: 'APPROVED' },
    ]);
    githubClient.getChecksListForRef.mockResolvedValue({ total_count: 0, check_runs: [] });

    performAutoMergeCommand({ ...options, allowNoChecks: true });

    await vi.waitFor(() => expect(githubClient.mergePullRequest).toHaveBeenCalled());

    expect(githubClient.mergePullRequest).toHaveBeenCalledWith('example', 'repo', 12, 'abc123');
  });

  it('skips when not all checks have succeeded', async () => {
    githubClient.getPullsReviews.mockResolvedValue([
      { user: { login: 'octocat' }, commit_id: 'abc123', state: 'APPROVED' },
    ]);
    githubClient.getChecksListForRef.mockResolvedValue({
      total_count: 1,
      check_runs: [{ conclusion: 'failure', status: 'completed' }],
    });

    performAutoMergeCommand(options);

    await vi.waitFor(() => expect(githubClient.getChecksListForRef).toHaveBeenCalled());

    expect(githubClient.mergePullRequest).not.toHaveBeenCalled();
  });
});
