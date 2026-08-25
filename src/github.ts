import { Octokit } from '@octokit/rest';

export class GithubClient {
  private octokit: Octokit;
  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }
  public async searchPullRequests(query: string[], countPerPage: number) {
    const queryString = query.join(' ');

    const { data } = await this.octokit.search.issuesAndPullRequests({
      q: queryString,
      per_page: countPerPage,
    });
    return data.items.map((item) => {
      const [owner, repo] = item.repository_url.split('/').slice(-2);
      return {
        title: item.title,
        pr_url: item.html_url,
        repo_url: item.repository_url,
        repository: `${owner}/${repo}`,
        repo: repo,
        owner: owner,
        number: item.number,
        labels: item.labels.map((l) => l.name),
        updated_at: item.updated_at,
      };
    });
  }
  public async getPulls(owner: string, repo: string, pull_number: number) {
    const { data } = await this.octokit.rest.pulls.get({ owner, repo, pull_number });
    return {
      mergeable: data.mergeable,
      mergeable_state: data.mergeable_state,
      commit: data.head.sha,
    };
  }
  public async getPullsReviews(owner: string, repo: string, pull_number: number) {
    const { data } = await this.octokit.rest.pulls.listReviews({ owner, repo, pull_number });
    return data;
  }
  public async getUsersAuthenticated() {
    const { data } = await this.octokit.rest.users.getAuthenticated();
    return { login: data.login };
  }
  public async getChecksListForRef(owner: string, repo: string, ref: string) {
    const { data } = await this.octokit.rest.checks.listForRef({ owner, repo, ref });
    return data;
  }
  public async createReview(owner: string, repo: string, pull_number: number) {
    await this.octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number,
      body: 'Automatically approved by gh-pr.',
      event: 'APPROVE',
    });
  }
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
