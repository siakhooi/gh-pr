import { getTokenOrExit } from './token.js';
import { getPullRequests } from './github.js';

interface options {
  assignedToMe: boolean;
  requestedMyReview: boolean;
  authoredByMe: boolean;
  authoredByDependabot: boolean;
  authoredByRenovate: boolean;
  notYetReviewed: boolean;
}
export function printList(options: options): void {
  const token = getTokenOrExit();
  const query: string[] = ['is:pr', 'is:open', 'label:github_actions'];
  if (options.assignedToMe) query.push('assignee:@me');
  if (options.requestedMyReview) query.push('review-requested=@me');
  if (options.authoredByMe) query.push('author:@me');
  if (options.authoredByDependabot) query.push('author:app/dependabot');
  if (options.authoredByRenovate) query.push('author:app/renovate');
  if (options.notYetReviewed) query.push('review:none');

  getPullRequests(token, query).then((data) => console.log(data));
}
