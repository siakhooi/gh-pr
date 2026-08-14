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
  const octokit = new Octokit({ auto: token });
  const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number });
  // console.log(`pull data: ${JSON.stringify(data)}`);
  return {
    mergeable: data.mergeable,
    mergeable_state: data.mergeable_state,
    commit: data.head.sha,
  };
}
