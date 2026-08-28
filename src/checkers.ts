interface PullsReviews {
  user: {
    login: string;
  };
  commit_id: string;
  state: string;
}
export function hasMyReviewOnCurrentCommit(
  reviews: PullsReviews[],
  userLogin: string,
  commit: string,
): boolean {
  if (reviews.some((review) => review.user?.login === userLogin && review.commit_id === commit)) {
    console.log(`SKIP: Has been reviewed by current user ${userLogin}`);
    return true;
  }
  return false;
}
export function hasMyApprovedReviewOnCurrentCommit(
  reviews: PullsReviews[],
  userLogin: string,
  commit: string,
): boolean {
  if (
    reviews.some(
      (review) =>
        review.user?.login === userLogin &&
        review.state === 'APPROVED' &&
        review.commit_id === commit,
    )
  ) {
    console.log(`SKIP: Has been reviewed and approved by current user ${userLogin}`);
    return true;
  }
  return false;
}
export function noChecksHaveBeenDone(total_count: number, allowNoChecks: boolean): boolean {
  if (!allowNoChecks && total_count === 0) {
    console.log(`SKIP: No checks have been done.`);
    return true;
  }
  return false;
}

export function notAllChecksSuccess(checkRuns: { conclusion: string; status: string }[]): boolean {
  if (!checkRuns.every((c) => c.conclusion === 'success' && c.status === 'completed')) {
    console.log(`SKIP: Not all checks success`);
    return true;
  }
  return false;
}
