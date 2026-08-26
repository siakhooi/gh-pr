interface BaseCommandOptions {
  assignedToMe: boolean;
  authoredByMe: boolean;
  authoredByDependabot: boolean;
  authoredByRenovate: boolean;
  limit: number;
  user: string;
  repo: string;
  label: string[];
}
export interface ListCommandOptions extends BaseCommandOptions {
  requestedMyReview: boolean;
  notYetReviewed: boolean;
}
export interface AutoReviewCommandOptions extends BaseCommandOptions {
  requestedMyReview: boolean;
  notYetReviewed: boolean;
  allowNoChecks: boolean;
  dryRun: boolean;
  maxUpdate: number;
  maxUpdatePerRepo: number;
}
export interface AutoMergeCommandOptions extends BaseCommandOptions {
  allowNoChecks: boolean;
  dryRun: boolean;
  maxUpdate: number;
  maxUpdatePerRepo: number;
}

export function buildPullRequestSearchQuery(
  options: ListCommandOptions | AutoReviewCommandOptions | AutoMergeCommandOptions,
  withReviewApproved: boolean = false,
): string[] {
  const query: string[] = ['is:pr', 'is:open'];
  if (withReviewApproved) {
    query.push('review:approved');
  }
  const filters: Array<[boolean, string]> = [
    [options.assignedToMe, 'assignee:@me'],
    ['requestedMyReview' in options && options.requestedMyReview, 'user-review-requested:@me'],
    [options.authoredByMe, 'author:@me'],
    [options.authoredByDependabot, 'author:app/dependabot'],
    [options.authoredByRenovate, 'author:app/renovate'],
    ['notYetReviewed' in options && options.notYetReviewed, 'review:none'],
    [Boolean(options.user), `user:${options.user}`],
    [Boolean(options.repo), `repo:${options.repo}`],
  ];

  for (const [enabled, term] of filters) {
    if (enabled) query.push(term);
  }

  if (options.label && options.label.length > 0) {
    for (const label of options.label) {
      query.push(`label:${label}`);
    }
  }

  return query;
}
