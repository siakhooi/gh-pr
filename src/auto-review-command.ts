import { getTokenOrExit } from './token.js';
import { GithubClient } from './github.js';
import { AutoReviewCommandOptions, buildPullRequestSearchQuery } from './command-options.js';
import { UpdateContext } from './update-context.js';

export async function performAutoReviewCommand(options: AutoReviewCommandOptions): Promise<void> {
  const token = getTokenOrExit();
  const githubClient = new GithubClient(token);
  const query = buildPullRequestSearchQuery(options);
  const updateContext = new UpdateContext(options.maxUpdatePerRepo, options.maxUpdate);

  githubClient.searchPullRequests(query, options.limit).then(async (data) => {
    console.log(`${data.length} records retrieved.`);
    for (const pr of data) {
      const repo = pr.repo;
      const owner = pr.owner;
      const pull_number = pr.number;

      console.log(`PR: ${pr.repository}/${pull_number}`);
      if (updateContext.hasExceedRepoMaxUpdateLimit(pr.repo_url)) continue;

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
      if (!options.allowNoChecks && checks.total_count === 0) {
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

      updateContext.updateRepo(pr.repo_url);
      if (updateContext.hasExceedMaxUpdateLimit()) break;
    }
  });
}
