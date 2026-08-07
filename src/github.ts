import { Octokit } from '@octokit/rest';

export async function getPullRequests(token: string, query: string[], countPerPage: int) {
  const octokit = new Octokit({ auth: token });

  const queryString = query.join(' ');

  console.log(`queryString: ${queryString}`);
  console.log(`countPerPage: ${countPerPage}`);

  const { data } = await octokit.search.issuesAndPullRequests({
    q: queryString,
    per_page: countPerPage,
  });
  return data.items.map((item) => ({
    title: item.title,
    pr_url: item.html_url,
    repo_url: item.repository_url,
    repository: item.repository_url.split('/').slice(-2).join('/'),
    number: item.number,
    labels: item.labels.map((l) => l.name),
  }));
}
