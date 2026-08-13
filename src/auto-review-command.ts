import { getTokenOrExit } from './token.js';
import { searchPullRequests } from './github.js';

interface AutoReviewCommandOptions {
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
  maxUpdate: number;
  maxUpdatePerRepo: number;
}

function buildPullRequestSearchQuery(options: AutoReviewCommandOptions): string[] {
  const query: string[] = ['is:pr', 'is:open'];
  const filters: Array<[boolean, string]> = [
    [options.assignedToMe, 'assignee:@me'],
    [options.requestedMyReview, 'review-requested=@me'],
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
export function performAutoReviewCommand(options: AutoReviewCommandOptions): void {
  const token = getTokenOrExit();
  const query = buildPullRequestSearchQuery(options);
  let updateCount = 0;
  const repoUpdateCountMap: Record<string, number> = {};

  searchPullRequests(token, query, options.limit).then((data) => {
    for (const pr of data) {
      const repo = pr.repo_url;
      console.log(`PR #${pr.number}: ${pr.title}`);
      console.log(`repo: ${repo}`);

      if (repoUpdateCountMap[repo] >= options.maxUpdatePerRepo) {
        console.log(
          `Reached max update limit of ${options.maxUpdatePerRepo} for repo ${repo}. Skipping further updates for this repo.`,
        );
        continue;
      }

      // check mergeable
      // check if reviewed before
      // submit review

      updateCount = updateCount + 1;
      repoUpdateCountMap[repo] = (repoUpdateCountMap[repo] || 0) + 1;

      if (updateCount >= options.maxUpdate) {
        console.log(`Reached max update limit of ${options.maxUpdate}. Stopping further updates.`);
        break;
      }
    }
  });
}
