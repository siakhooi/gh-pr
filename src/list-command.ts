import { getTokenOrExit } from './token.js';
import { GithubClient } from './github.js';
import { printListData } from './printer.js';
import { ListCommandOptions, buildPullRequestSearchQuery } from './command-options.js';

export async function performListCommand(options: ListCommandOptions): Promise<void> {
  const token = getTokenOrExit();
  const githubClient = new GithubClient(token);
  const query = buildPullRequestSearchQuery(options);

  githubClient.searchPullRequests(query, options.limit).then((data) => printListData(data));
}
