import { getTokenOrExit } from './token.js';
import {
  searchPullRequests,
  getPulls,
  getPullsReviews,
  getUsersAuthenticated,
  getChecksListForRef,
  createReviews,
} from './github.js';

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

      if (repoUpdateCountMap[repo_url] >= options.maxUpdatePerRepo) {
        console.log(
          `SKIP: ${pr.repository} Reached max update limit of ${options.maxUpdatePerRepo} for repo ${repo_url}.`,
        );
        continue;
      }
      console.log(`PR: ${owner}/${repo}/${pull_number}`);
      const pull = await getPulls(token, owner, repo, pull_number);
      const commit = pull.commit;

      // check if reviewed before
      const reviews = await getPullsReviews(token, owner, repo, pull_number);
      const myUser = await getUsersAuthenticated(token);
      const myReview = reviews.some((review) => review.user?.login === myUser.login);
      if (myReview) {
        console.log(
          `SKIP: The pull request ${owner}/${repo}/${pull_number} has been reviewed by current user ${myUser.login}`,
        );
        continue;
      }

      // check if pipeline run success
      const checks = await getChecksListForRef(token, owner, repo, commit);
      if (checks.total_count === 0) {
        console.log(`SKIP: no checks have been done.`);
        continue;
      }
      if (!checks.check_runs.every((c) => c.conclusion === 'success' && c.status === 'completed')) {
        console.log(`SKIP: not all checks success`);
        continue;
      }

      // submit review
      createReviews(token, owner, repo, pull_number);
      console.log('Auto Reviewed');

      updateCount = updateCount + 1;
      repoUpdateCountMap[repo_url] = (repoUpdateCountMap[repo_url] || 0) + 1;

      if (updateCount >= options.maxUpdate) {
        console.log(`STOP: Reached max update limit of ${options.maxUpdate}.`);
        break;
      }
    }
  });
}
