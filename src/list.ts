import { getTokenOrExit } from './token.js';
import { getPullRequests } from './github.js';

export function printList(): void {
  const token = getTokenOrExit();
  console.log('List of items...');
  getPullRequests(token).then((data) => console.log(data));
}
