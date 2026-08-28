import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performAutoReviewCommand } from '../src/auto-review-command.js';
import { getTokenOrExit } from '../src/token.js';

const { githubClient, githubClientConstructor } = vi.hoisted(() => {
  const client = {
    searchPullRequests: vi.fn(),
    getPulls: vi.fn(),
    getPullsReviews: vi.fn(),
    getUsersAuthenticated: vi.fn(),
    getChecksListForRef: vi.fn(),
    createReview: vi.fn(),
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

describe('performAutoReviewCommand', () => {
  const pullRequest = {
    repository: 'example/repo',
    owner: 'example',
    repo: 'repo',
    number: 12,
    repo_url: 'https://github.com/example/repo',
  };
  const options = {
    assignedToMe: false,
    requestedMyReview: true,
    authoredByMe: false,
    authoredByDependabot: false,
    authoredByRenovate: false,
    notYetReviewed: false,
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
    githubClient.getPulls.mockResolvedValue({ commit: 'abc123' });
    githubClient.getPullsReviews.mockResolvedValue([]);
    githubClient.getUsersAuthenticated.mockResolvedValue({ login: 'octocat' });
    githubClient.getChecksListForRef.mockResolvedValue({
      total_count: 1,
      check_runs: [{ conclusion: 'success', status: 'completed' }],
    });
    githubClient.createReview.mockResolvedValue(undefined);
  });

  it('searches with the expected query and creates a review after successful checks', async () => {
    performAutoReviewCommand(options);

    await vi.waitFor(() => expect(githubClient.createReview).toHaveBeenCalled());

    expect(githubClientConstructor).toHaveBeenCalledWith('token-123');
    expect(githubClient.searchPullRequests).toHaveBeenCalledWith(
      ['is:pr', 'is:open', 'user-review-requested:@me'],
      10,
    );
    expect(githubClient.getPulls).toHaveBeenCalledWith('example', 'repo', 12);
    expect(githubClient.getPullsReviews).toHaveBeenCalledWith('example', 'repo', 12);
    expect(githubClient.getUsersAuthenticated).toHaveBeenCalledTimes(1);
    expect(githubClient.getChecksListForRef).toHaveBeenCalledWith('example', 'repo', 'abc123');
    expect(githubClient.createReview).toHaveBeenCalledWith('example', 'repo', 12);
  });

  it('does not create a review in dry-run mode', async () => {
    githubClient.searchPullRequests.mockResolvedValue([pullRequest]);

    performAutoReviewCommand({ ...options, dryRun: true });

    await vi.waitFor(() => expect(githubClient.getChecksListForRef).toHaveBeenCalled());

    expect(githubClient.createReview).not.toHaveBeenCalled();
  });

  it('skips a pull request already reviewed on the current commit', async () => {
    githubClient.getPullsReviews.mockResolvedValue([
      { user: { login: 'octocat' }, commit_id: 'abc123', state: 'COMMENTED' },
    ]);

    performAutoReviewCommand(options);

    await vi.waitFor(() => expect(githubClient.getPullsReviews).toHaveBeenCalled());

    expect(githubClient.getChecksListForRef).not.toHaveBeenCalled();
    expect(githubClient.createReview).not.toHaveBeenCalled();
  });

  it('skips when no checks have been done', async () => {
    githubClient.getChecksListForRef.mockResolvedValue({ total_count: 0, check_runs: [] });

    performAutoReviewCommand(options);

    await vi.waitFor(() => expect(githubClient.getChecksListForRef).toHaveBeenCalled());

    expect(githubClient.createReview).not.toHaveBeenCalled();
  });

  it('skips when not all checks have succeeded', async () => {
    githubClient.getChecksListForRef.mockResolvedValue({
      total_count: 1,
      check_runs: [{ conclusion: 'failure', status: 'completed' }],
    });

    performAutoReviewCommand(options);

    await vi.waitFor(() => expect(githubClient.getChecksListForRef).toHaveBeenCalled());

    expect(githubClient.createReview).not.toHaveBeenCalled();
  });
});
