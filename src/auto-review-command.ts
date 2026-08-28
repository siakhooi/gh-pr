import { getTokenOrExit } from './token.js';
import { GithubClient } from './github.js';
import { AutoReviewCommandOptions, buildPullRequestSearchQuery } from './command-options.js';
import { UpdateContext } from './update-context.js';
import {
  hasMyReviewOnCurrentCommit,
  noChecksHaveBeenDone,
  notAllChecksSuccess,
} from './checkers.js';

export async function performAutoReviewCommand(options: AutoReviewCommandOptions): Promise<void> {
  const token = getTokenOrExit();
  const githubClient = new GithubClient(token);
  const query = buildPullRequestSearchQuery(options);
  const updateContext = new UpdateContext(options.maxUpdatePerRepo, options.maxUpdate);

  githubClient.searchPullRequests(query, options.limit).then(async (data) => {
    console.log(`${data.length} records retrieved.`);
    for (const pr of data) {
      console.log(`PR: ${pr.repository}/${pr.number}`);
      if (updateContext.hasExceedRepoMaxUpdateLimit(pr.repo_url)) continue;

      const pull = await githubClient.getPulls(pr.owner, pr.repo, pr.number);

      // check if reviewed before
      const reviews = await githubClient.getPullsReviews(pr.owner, pr.repo, pr.number);
      const myUser = await githubClient.getUsersAuthenticated();
      if (hasMyReviewOnCurrentCommit(reviews, myUser.login, pull.commit)) continue;

      // check if pipeline run success
      const checks = await githubClient.getChecksListForRef(pr.owner, pr.repo, pull.commit);
      if (noChecksHaveBeenDone(checks.total_count, options.allowNoChecks)) continue;

      if (notAllChecksSuccess(checks.check_runs)) continue;

      // submit review
      if (options.dryRun) {
        console.log('Dry Run: Would auto review');
      } else {
        await githubClient.createReview(pr.owner, pr.repo, pr.number);
        console.log('Auto reviewed');
      }

      updateContext.updateRepo(pr.repo_url);
      if (updateContext.hasExceedMaxUpdateLimit()) break;
    }
  });
}
