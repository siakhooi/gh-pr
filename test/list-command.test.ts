import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performListCommand } from '../src/list-command.js';
import { getTokenOrExit } from '../src/token.js';
import { printListData } from '../src/printer.js';

const searchPullRequests = vi.fn();

vi.mock('../src/token.js', () => ({
  getTokenOrExit: vi.fn(),
}));
vi.mock('../src/github.js', () => ({
  GithubClient: vi.fn(function () {
    return {
      searchPullRequests,
    };
  }),
}));
vi.mock('../src/printer.js', () => ({
  printListData: vi.fn(),
}));

describe('performListCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds the expected GitHub search query and logs the results', async () => {
    vi.mocked(getTokenOrExit).mockReturnValue('token-123');

    const result = [{ title: 'Fix failing tests', pr_url: 'https://example.com/pr/1' }];
    vi.mocked(searchPullRequests).mockResolvedValue(result as never);

    performListCommand({
      assignedToMe: true,
      requestedMyReview: true,
      authoredByMe: true,
      authoredByDependabot: true,
      authoredByRenovate: true,
      notYetReviewed: true,
      limit: 10,
      user: 'octocat',
      repo: 'owner/repo',
      label: ['bug', 'urgent'],
    });

    await vi.waitFor(() => {
      expect(searchPullRequests).toHaveBeenCalledWith(
        [
          'is:pr',
          'is:open',
          'assignee:@me',
          'user-review-requested:@me',
          'author:@me',
          'author:app/dependabot',
          'author:app/renovate',
          'review:none',
          'user:octocat',
          'repo:owner/repo',
          'label:bug',
          'label:urgent',
        ],
        10,
      );
    });

    expect(printListData).toHaveBeenCalledWith(result);
  });

  it('keeps only the default open PR query when all optional filters are off', async () => {
    vi.mocked(getTokenOrExit).mockReturnValue('token-456');
    vi.mocked(searchPullRequests).mockResolvedValue([] as never);

    performListCommand({
      assignedToMe: false,
      requestedMyReview: false,
      authoredByMe: false,
      authoredByDependabot: false,
      authoredByRenovate: false,
      notYetReviewed: false,
      limit: 5,
      user: '',
      repo: '',
      label: [],
    });

    await vi.waitFor(() => {
      expect(searchPullRequests).toHaveBeenCalledWith(['is:pr', 'is:open'], 5);
    });

    expect(printListData).toHaveBeenCalledWith([]);
  });
});
