import { beforeEach, describe, expect, it, vi } from 'vitest';
import { printList } from '../src/list.js';
import { getTokenOrExit } from '../src/token.js';
import { getPullRequests } from '../src/github.js';

vi.mock('../src/token.js', () => ({
  getTokenOrExit: vi.fn(),
}));

vi.mock('../src/github.js', () => ({
  getPullRequests: vi.fn(),
}));

describe('printList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('builds the expected GitHub search query and logs the results', async () => {
    vi.mocked(getTokenOrExit).mockReturnValue('token-123');

    const result = [{ title: 'Fix failing tests', pr_url: 'https://example.com/pr/1' }];
    vi.mocked(getPullRequests).mockResolvedValue(result as never);

    printList({
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
      expect(getPullRequests).toHaveBeenCalledWith(
        'token-123',
        [
          'is:pr',
          'is:open',
          'assignee:@me',
          'review-requested=@me',
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

    expect(console.log).toHaveBeenCalledWith(result);
  });

  it('keeps only the default open PR query when all optional filters are off', async () => {
    vi.mocked(getTokenOrExit).mockReturnValue('token-456');
    vi.mocked(getPullRequests).mockResolvedValue([] as never);

    printList({
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
      expect(getPullRequests).toHaveBeenCalledWith('token-456', ['is:pr', 'is:open'], 5);
    });

    expect(console.log).toHaveBeenCalledWith([]);
  });
});
