import { getTokenOrExit } from './token.js';

export function printList(): void {
  const token = getTokenOrExit();
  console.log('List of items...');
  console.debug(`token: ${token}`);
}
