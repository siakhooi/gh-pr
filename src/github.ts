import { Octokit } from '@octokit/rest';

export async function getPullRequests(token: string, query: string[]) {
  const octokit = new Octokit({ auth: token });

  const queryString = query.join(' ');
  const { data } = await octokit.search.issuesAndPullRequests({
    q: queryString,
    per_page: 2,
  });
  return data.items.map((item) => ({
    title: item.title,
    pr_url: item.html_url,
    repo_url: item.repository_url,
    repository: item.repository_url.split('/').slice(-2).join('/'),
    number: item.number,
  }));
}
