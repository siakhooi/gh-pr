export interface ListCommandOptions {
  assignedToMe: boolean;
  requestedMyReview: boolean;
  authoredByMe: boolean;
  authoredByDependabot: boolean;
  authoredByRenovate: boolean;
  notYetReviewed: boolean;
  limit: number;
  user: string;
  repo: string;
  label: string[];
}

export interface AutoReviewCommandOptions {
  assignedToMe: boolean;
  requestedMyReview: boolean;
  authoredByMe: boolean;
  authoredByDependabot: boolean;
  authoredByRenovate: boolean;
  notYetReviewed: boolean;
  allowNoChecks: boolean;
  limit: number;
  user: string;
  repo: string;
  label: string[];
  dryRun: boolean;
  maxUpdate: number;
  maxUpdatePerRepo: number;
}

export function buildPullRequestSearchQuery(
  options: ListCommandOptions | AutoReviewCommandOptions,
): string[] {
  const query: string[] = ['is:pr', 'is:open'];
  const filters: Array<[boolean, string]> = [
    [options.assignedToMe, 'assignee:@me'],
    [options.requestedMyReview, 'user-review-requested:@me'],
    [options.authoredByMe, 'author:@me'],
    [options.authoredByDependabot, 'author:app/dependabot'],
    [options.authoredByRenovate, 'author:app/renovate'],
    [options.notYetReviewed, 'review:none'],
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
