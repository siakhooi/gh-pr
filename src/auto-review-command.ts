import { getTokenOrExit } from './token.js';
import { searchPullRequests, getPulls } from './github.js';

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
export async function performAutoReviewCommand(options: AutoReviewCommandOptions): void {
  const token = getTokenOrExit();
  const query = buildPullRequestSearchQuery(options);
  let updateCount = 0;
  const repoUpdateCountMap: Record<string, number> = {};

  searchPullRequests(token, query, options.limit).then(async (data) => {
    for (const pr of data) {
      const repo_url = pr.repo_url;
      const repo = pr.repo;
      const owner = pr.owner;
      const pull_number = pr.number;
      console.log(`PR #${pull_number}: ${pr.title}, ${owner}, ${repo}, ${repo_url}`);

      if (repoUpdateCountMap[repo_url] >= options.maxUpdatePerRepo) {
        console.log(
          `Reached max update limit of ${options.maxUpdatePerRepo} for repo ${repo_url}. Skipping further updates for this repo.`,
        );
        continue;
      }
      const pull = await getPulls(token, owner, repo, pull_number);
      console.log(`Pulls: ${pull.mergeable}, ${pull.mergeable_state}, ${pull.commit}`);
      if (!pull.mergeable || pull.mergeable_state !== 'clean') {
        console.log(`Pulls not mergeable: ${pull.mergeable}, ${pull.mergeable_state}`);
        continue;
      }

      // check if reviewed before
      // submit review

      updateCount = updateCount + 1;
      repoUpdateCountMap[repo_url] = (repoUpdateCountMap[repo_url] || 0) + 1;

      if (updateCount >= options.maxUpdate) {
        console.log(`Reached max update limit of ${options.maxUpdate}. Stopping further updates.`);
        break;
      }
    }
  });
}
