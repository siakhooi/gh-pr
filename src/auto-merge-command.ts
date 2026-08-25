import { getTokenOrExit } from './token.js';
import {
  searchPullRequests,
  getPulls,
  getPullsReviews,
  getUsersAuthenticated,
  getChecksListForRef,
  mergePullRequest,
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
  let updateCount = 0;
  const repoUpdateCountMap: Record<string, number> = {};

  searchPullRequests(token, query, options.limit).then(async (data) => {
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
      const pull = await getPulls(token, owner, repo, pull_number);
      const commit = pull.commit;
      // check if mergeable
      if (!pull.mergeable || pull.mergeable_state !== 'clean') {
        console.log(`SKIP: Pull not mergeable: ${pull.mergeable}, ${pull.mergeable_state}`);
        continue;
      }
      // check if reviewed and approved by current user
      const reviews = await getPullsReviews(token, owner, repo, pull_number);
      const myUser = await getUsersAuthenticated(token);
      const myReview = reviews.some(
        (review) => review.user?.login === myUser.login && review.state === 'APPROVED',
      );
      if (!myReview) {
        console.log(`SKIP: Has not been reviewed and approved by current user ${myUser.login}`);
        continue;
      }
      // check if pipeline run success
      const checks = await getChecksListForRef(token, owner, repo, commit);
      if (checks.total_count === 0) {
        console.log(`SKIP: No checks have been done.`);
        continue;
      }
      if (!checks.check_runs.every((c) => c.conclusion === 'success' && c.status === 'completed')) {
        console.log(`SKIP: Not all checks success`);
        continue;
      }

      // submit review
      mergePullRequest(token, owner, repo, pull_number, commit);
      console.log('Auto Merged');

      updateCount = updateCount + 1;
      repoUpdateCountMap[repo_url] = (repoUpdateCountMap[repo_url] || 0) + 1;

      if (updateCount >= options.maxUpdate) {
        console.log(`STOP: Reached max update limit of ${options.maxUpdate}.`);
        break;
      }
    }
  });
}
