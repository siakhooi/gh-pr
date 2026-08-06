import { getTokenOrExit } from './token.js';
import { getPullRequests } from './github.js';

export function printList(): void {
  const token = getTokenOrExit();
  const query: string[] = [
    'is:pr',
    'is:open',
    'assignee:@me',
    'author:app/dependabot',
    'label:github_actions',
  ];
  getPullRequests(token, query).then((data) => console.log(data));
}
