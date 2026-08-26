import { getVersion } from './version.js';
export function printVersionCommand(): void {
  console.log(getVersion());
}
