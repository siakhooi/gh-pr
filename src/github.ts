import { Octokit } from '@octokit/rest';

export async function searchPullRequests(token: string, query: string[], countPerPage: int) {
  const octokit = new Octokit({ auth: token });

  const queryString = query.join(' ');

  const { data } = await octokit.search.issuesAndPullRequests({
    q: queryString,
    per_page: countPerPage,
  });
  return data.items.map((item) => {
    const [owner, repo] = item.repository_url.split('/').slice(-2);
    return {
      title: item.title,
      pr_url: item.html_url,
      repo_url: item.repository_url,
      repository: `$owner/$repo`,
      repo: repo,
      owner: owner,
      number: item.number,
      labels: item.labels.map((l) => l.name),
      updated_at: item.updated_at,
    };
  });
}
export async function getPulls(token: string, owner: string, repo: string, pull_number: number) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number });
  return {
    mergeable: data.mergeable,
    mergeable_state: data.mergeable_state,
    commit: data.head.sha,
  };
}
export async function getPullsReviews(
  token: string,
  owner: string,
  repo: string,
  pull_number: number,
) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.pulls.listReviews({ owner, repo, pull_number });
  return data;
}
export async function getUsersAuthenticated(token: string) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.users.getAuthenticated();
  return { login: data.login };
}
export async function getChecksListForRef(token: string, owner: string, repo: string, ref: string) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.checks.listForRef({ owner, repo, ref });
  return data;
}
export async function createReviews(
  token: string,
  owner: string,
  repo: string,
  pull_number: number,
) {
  const octokit = new Octokit({ auth: token });
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number,
    body: 'Automatically approved by gh-pr.',
    event: 'APPROVE',
  });
}
export async function mergePullRequest(
  token: string,
  owner: string,
  repo: string,
  pull_number: number,
  sha: string,
) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.pulls.merge({
    owner,
    repo,
    pull_number,
    sha: sha,
    merge_method: 'squash',
  });
  return data;
}
