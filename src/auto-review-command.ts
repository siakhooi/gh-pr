import { getTokenOrExit } from './token.js';
import { GithubClient } from './github.js';

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
  dryRun: boolean;
  maxUpdate: number;
  maxUpdatePerRepo: number;
}

function buildPullRequestSearchQuery(options: AutoReviewCommandOptions): string[] {
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
export async function performAutoReviewCommand(options: AutoReviewCommandOptions): void {
  const token = getTokenOrExit();
  const githubClient = new GithubClient(token);
  const query = buildPullRequestSearchQuery(options);
  let updateCount = 0;
  const repoUpdateCountMap: Record<string, number> = {};

  githubClient.searchPullRequests(query, options.limit).then(async (data) => {
    console.log(`${data.length} records retrieved.`);
    for (const pr of data) {
      const repo_url = pr.repo_url;
      const repo = pr.repo;
      const owner = pr.owner;
      const pull_number = pr.number;

      console.log(`PR: ${pr.repository}/${pull_number}`);
      if (repoUpdateCountMap[repo_url] >= options.maxUpdatePerRepo) {
        console.log(`SKIP: Reached max update limit of ${options.maxUpdatePerRepo}.`);
        continue;
      }
      const pull = await githubClient.getPulls(owner, repo, pull_number);
      const commit = pull.commit;

      // check if reviewed before
      const reviews = await githubClient.getPullsReviews(owner, repo, pull_number);
      const myUser = await githubClient.getUsersAuthenticated();
      const hasMyReviewOnCurrentCommit = reviews.some(
        (review) => review.user?.login === myUser.login && review.commit_id === commit,
      );
      if (hasMyReviewOnCurrentCommit) {
        console.log(`SKIP: Has been reviewed by current user ${myUser.login}`);
        continue;
      }

      // check if pipeline run success
      const checks = await githubClient.getChecksListForRef(owner, repo, commit);
      if (checks.total_count === 0) {
        console.log(`SKIP: No checks have been done.`);
        continue;
      }
      if (!checks.check_runs.every((c) => c.conclusion === 'success' && c.status === 'completed')) {
        console.log(`SKIP: Not all checks success`);
        continue;
      }

      // submit review
      if (options.dryRun) {
        console.log('Dry Run: Would auto review');
      } else {
        await githubClient.createReview(owner, repo, pull_number);
        console.log('Auto reviewed');
      }

      updateCount = updateCount + 1;
      repoUpdateCountMap[repo_url] = (repoUpdateCountMap[repo_url] || 0) + 1;

      if (updateCount >= options.maxUpdate) {
        console.log(`STOP: Reached max update limit of ${options.maxUpdate}.`);
        break;
      }
    }
  });
}
