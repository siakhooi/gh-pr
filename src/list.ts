import { getTokenOrExit } from './token.js';
import { getPullRequests } from './github.js';

interface options {
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
export function printList(options: options): void {
  const token = getTokenOrExit();
  const query: string[] = ['is:pr', 'is:open'];

  if (options.assignedToMe) query.push('assignee:@me');
  if (options.requestedMyReview) query.push('review-requested=@me');
  if (options.authoredByMe) query.push('author:@me');
  if (options.authoredByDependabot) query.push('author:app/dependabot');
  if (options.authoredByRenovate) query.push('author:app/renovate');
  if (options.notYetReviewed) query.push('review:none');
  if (options.user) query.push(`user:${options.user}`);
  if (options.repo) query.push(`repo:${options.repo}`);
  if (options.label) options.label.forEach((label) => query.push(`label:${label}`));

  getPullRequests(token, query, options.limit).then((data) => console.log(data));
}
