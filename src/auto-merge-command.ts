import { getTokenOrExit } from './token.js';
import { GithubClient } from './github.js';
import { AutoMergeCommandOptions, buildPullRequestSearchQuery } from './command-options.js';
import { UpdateContext } from './update-context.js';
import {
  noChecksHaveBeenDone,
  hasMyApprovedReviewOnCurrentCommit,
  notAllChecksSuccess,
} from './checkers.js';

export async function performAutoMergeCommand(options: AutoMergeCommandOptions): Promise<void> {
  const token = getTokenOrExit();
  const githubClient = new GithubClient(token);
  const query = buildPullRequestSearchQuery(options, true);
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
      // check if mergeable
      if (!pull.mergeable || pull.mergeable_state !== 'clean') {
        console.log(`SKIP: Pull not mergeable: ${pull.mergeable}, ${pull.mergeable_state}`);
        continue;
      }
      // check if reviewed and approved by current user
      const reviews = await githubClient.getPullsReviews(owner, repo, pull_number);
      const myUser = await githubClient.getUsersAuthenticated();
      if (hasMyApprovedReviewOnCurrentCommit(reviews, myUser.login, commit)) continue;

      // check if pipeline run success
      const checks = await githubClient.getChecksListForRef(owner, repo, commit);
      if (noChecksHaveBeenDone(checks.total_count, options.allowNoChecks)) continue;

      if (notAllChecksSuccess(checks.check_runs)) continue;

      // submit review
      if (options.dryRun) {
        console.log('Dry Run: Would auto merge');
      } else {
        await githubClient.mergePullRequest(owner, repo, pull_number, commit);
        console.log('Auto Merged');
      }
      updateContext.updateRepo(pr.repo_url);
      if (updateContext.hasExceedMaxUpdateLimit()) break;
    }
  });
}
