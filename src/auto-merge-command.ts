import { getTokenOrExit } from './token.js';
import {
  searchPullRequests,
  //   getPulls,
  //   getPullsReviews,
  //   getUsersAuthenticated,
  //   getChecksListForRef,
  //   createReviews,
} from './github.js';
interface AutoMergeCommandOptions {
  assignedToMe: boolean;
  authoredByMe: boolean;
  authoredByDependabot: boolean;
  authoredByRenovate: boolean;
  limit: number;
  user: string;
  repo: string;
  label: string[];
  maxUpdate: number;
  maxUpdatePerRepo: number;
}
function buildPullRequestSearchQuery(options: AutoMergeCommandOptions): string[] {
  const query: string[] = ['is:pr', 'is:open', 'review:approved'];
  const filters: Array<[boolean, string]> = [
    [options.assignedToMe, 'assignee:@me'],
    [options.authoredByMe, 'author:@me'],
    [options.authoredByDependabot, 'author:app/dependabot'],
    [options.authoredByRenovate, 'author:app/renovate'],
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
export async function performAutoMergeCommand(options: AutoMergeCommandOptions): void {
  const token = getTokenOrExit();
  const query = buildPullRequestSearchQuery(options);
  //   let updateCount = 0;
  //   const repoUpdateCountMap: Record<string, number> = {};

  searchPullRequests(token, query, options.limit).then(async (data) => {
    console.log(JSON.stringify(data));
  });
}
