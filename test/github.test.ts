import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GithubClient } from '../src/github.js';

const mocks = vi.hoisted(() => ({
  issuesAndPullRequests: vi.fn(),
  pullsGet: vi.fn(),
  listReviews: vi.fn(),
  getAuthenticated: vi.fn(),
  listForRef: vi.fn(),
  createReview: vi.fn(),
  merge: vi.fn(),
  Octokit: vi.fn(),
}));

vi.mock('@octokit/rest', () => ({
  Octokit: mocks.Octokit,
}));

describe('GithubClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.Octokit.mockImplementation(function () {
      return {
        search: { issuesAndPullRequests: mocks.issuesAndPullRequests },
        rest: {
          pulls: {
            get: mocks.pullsGet,
            listReviews: mocks.listReviews,
            createReview: mocks.createReview,
            merge: mocks.merge,
          },
          users: { getAuthenticated: mocks.getAuthenticated },
          checks: { listForRef: mocks.listForRef },
        },
      };
    });
  });

  it('creates an authenticated Octokit client', () => {
    new GithubClient('token-123');

    expect(mocks.Octokit).toHaveBeenCalledWith({ auth: 'token-123' });
  });

  it('searches pull requests and maps the results', async () => {
    mocks.issuesAndPullRequests.mockResolvedValue({
      data: {
        items: [
          {
            title: 'Fix tests',
            html_url: 'https://github.com/owner/repo/pull/7',
            repository_url: 'https://api.github.com/repos/owner/repo',
            number: 7,
            labels: [{ name: 'bug' }],
            updated_at: '2026-08-25T00:00:00Z',
          },
        ],
      },
    });

    const result = await new GithubClient('token').searchPullRequests(['is:pr', 'is:open'], 10);

    expect(mocks.issuesAndPullRequests).toHaveBeenCalledWith({ q: 'is:pr is:open', per_page: 10 });
    expect(result).toEqual([
      {
        title: 'Fix tests',
        pr_url: 'https://github.com/owner/repo/pull/7',
        repo_url: 'https://api.github.com/repos/owner/repo',
        repository: 'owner/repo',
        repo: 'repo',
        owner: 'owner',
        number: 7,
        labels: ['bug'],
        updated_at: '2026-08-25T00:00:00Z',
      },
    ]);
  });

  it('delegates pull request, review, user, and checks operations', async () => {
    mocks.pullsGet.mockResolvedValue({
      data: { mergeable: true, mergeable_state: 'clean', head: { sha: 'abc' } },
    });
    mocks.listReviews.mockResolvedValue({ data: [{ id: 1 }] });
    mocks.getAuthenticated.mockResolvedValue({ data: { login: 'octocat' } });
    mocks.listForRef.mockResolvedValue({ data: { check_runs: [] } });
    mocks.merge.mockResolvedValue({ data: { merged: true } });

    const client = new GithubClient('token');

    await expect(client.getPulls('owner', 'repo', 7)).resolves.toEqual({
      mergeable: true,
      mergeable_state: 'clean',
      commit: 'abc',
    });
    await expect(client.getPullsReviews('owner', 'repo', 7)).resolves.toEqual([{ id: 1 }]);
    await expect(client.getUsersAuthenticated()).resolves.toEqual({ login: 'octocat' });
    await expect(client.getChecksListForRef('owner', 'repo', 'abc')).resolves.toEqual({
      check_runs: [],
    });
    await expect(client.mergePullRequest('owner', 'repo', 7, 'abc')).resolves.toEqual({
      merged: true,
    });

    expect(mocks.pullsGet).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo', pull_number: 7 });
    expect(mocks.listReviews).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 7,
    });
    expect(mocks.getAuthenticated).toHaveBeenCalledWith();
    expect(mocks.listForRef).toHaveBeenCalledWith({ owner: 'owner', repo: 'repo', ref: 'abc' });
    expect(mocks.merge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 7,
      sha: 'abc',
      merge_method: 'squash',
    });
  });

  it('creates an approval review', async () => {
    const client = new GithubClient('token');

    await client.createReview('owner', 'repo', 7);

    expect(mocks.createReview).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 7,
      body: 'Automatically approved by gh-pr.',
      event: 'APPROVE',
    });
  });
});
