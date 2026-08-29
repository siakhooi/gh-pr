import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  doesNotHaveMyApprovedReviewOnCurrentCommit,
  hasMyReviewOnCurrentCommit,
  noChecksHaveBeenDone,
  notAllChecksSuccess,
  pullNotMergeable,
} from '../src/checkers.js';

const review = (overrides: Record<string, unknown> = {}) => ({
  user: { login: 'octocat' },
  commit_id: 'abc123',
  state: 'CHANGES_REQUESTED',
  ...overrides,
});

describe('checkers', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

  beforeEach(() => {
    log.mockClear();
  });

  describe('hasMyReviewOnCurrentCommit', () => {
    it('returns true and logs when the user reviewed the current commit', () => {
      expect(hasMyReviewOnCurrentCommit([review()], 'octocat', 'abc123')).toBe(true);

      expect(log).toHaveBeenCalledWith('SKIP: Has been reviewed by current user octocat');
    });

    it('returns false when the user or commit does not match', () => {
      expect(hasMyReviewOnCurrentCommit([review()], 'hubot', 'abc123')).toBe(false);
      expect(hasMyReviewOnCurrentCommit([review()], 'octocat', 'def456')).toBe(false);
      expect(log).not.toHaveBeenCalled();
    });
  });

  describe('doesNotHaveMyApprovedReviewOnCurrentCommit', () => {
    it('returns true and logs when the user does not have an approved review on the current commit', () => {
      expect(doesNotHaveMyApprovedReviewOnCurrentCommit([review()], 'octocat', 'abc123')).toBe(
        true,
      );
      expect(log).toHaveBeenCalledWith(
        'SKIP: Does not have approved review from current user octocat',
      );
    });

    it('returns false when the user has an approved review on the current commit', () => {
      expect(
        doesNotHaveMyApprovedReviewOnCurrentCommit(
          [review({ state: 'APPROVED' })],
          'octocat',
          'abc123',
        ),
      ).toBe(false);
      expect(log).not.toHaveBeenCalled();
    });

    it('returns true for different user or old commit even with approved review', () => {
      log.mockClear();
      expect(
        doesNotHaveMyApprovedReviewOnCurrentCommit(
          [review({ state: 'APPROVED' })],
          'hubot',
          'abc123',
        ),
      ).toBe(true);
      expect(log).toHaveBeenCalledWith(
        'SKIP: Does not have approved review from current user hubot',
      );

      log.mockClear();
      expect(
        doesNotHaveMyApprovedReviewOnCurrentCommit(
          [review({ state: 'APPROVED' })],
          'octocat',
          'def456',
        ),
      ).toBe(true);
      expect(log).toHaveBeenCalledWith(
        'SKIP: Does not have approved review from current user octocat',
      );
    });
  });

  describe('pullNotMergeable', () => {
    it('returns false for a mergeable pull with a clean state', () => {
      expect(pullNotMergeable({ mergeable: true, mergeable_state: 'clean' })).toBe(false);
      expect(log).not.toHaveBeenCalled();
    });

    it('returns true and logs when the pull is not mergeable', () => {
      expect(pullNotMergeable({ mergeable: false, mergeable_state: 'dirty' })).toBe(true);

      expect(log).toHaveBeenCalledWith('SKIP: Pull not mergeable: false, dirty');
    });

    it('returns true and logs when the mergeable state is not clean', () => {
      expect(pullNotMergeable({ mergeable: true, mergeable_state: 'blocked' })).toBe(true);

      expect(log).toHaveBeenCalledWith('SKIP: Pull not mergeable: true, blocked');
    });

    it('returns true and logs when mergeability is unknown', () => {
      expect(pullNotMergeable({ mergeable: null, mergeable_state: 'clean' })).toBe(true);

      expect(log).toHaveBeenCalledWith('SKIP: Pull not mergeable: null, clean');
    });
  });

  describe('noChecksHaveBeenDone', () => {
    it('returns true and logs when checks are missing and missing checks are not allowed', () => {
      expect(noChecksHaveBeenDone(0, false)).toBe(true);

      expect(log).toHaveBeenCalledWith('SKIP: No checks have been done.');
    });

    it('returns false when checks exist or missing checks are allowed', () => {
      expect(noChecksHaveBeenDone(1, false)).toBe(false);
      expect(noChecksHaveBeenDone(0, true)).toBe(false);
      expect(log).not.toHaveBeenCalled();
    });
  });

  describe('notAllChecksSuccess', () => {
    it('returns false when every check completed successfully', () => {
      expect(
        notAllChecksSuccess([
          { conclusion: 'success', status: 'completed' },
          { conclusion: 'success', status: 'completed' },
        ]),
      ).toBe(false);
      expect(log).not.toHaveBeenCalled();
    });

    it('returns true and logs when any check is incomplete or unsuccessful', () => {
      expect(notAllChecksSuccess([{ conclusion: 'failure', status: 'completed' }])).toBe(true);
      expect(log).toHaveBeenCalledWith('SKIP: Not all checks success');

      log.mockClear();
      expect(notAllChecksSuccess([{ conclusion: 'success', status: 'in_progress' }])).toBe(true);
      expect(log).toHaveBeenCalledWith('SKIP: Not all checks success');
    });

    it('returns false for an empty check-run list', () => {
      expect(notAllChecksSuccess([])).toBe(false);
      expect(log).not.toHaveBeenCalled();
    });
  });
});
