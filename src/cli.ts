#!/usr/bin/env node
import { Command } from 'commander';

import { printList } from './index.js';
import { getVersion } from './version.js';

const program = new Command();
program
  .name('gh-pr')
  .description('frequently used gh pr commands')
  .version(getVersion(), '-V, --version', 'output the current version');

program.helpCommand('help [command]', 'display help for a command');

program
  .command('version')
  .description('print version')
  .action(() => {
    console.log(getVersion());
  });
program
  .command('list')
  .description('list open pull requests')
  .option('--assigned-to-me', 'Assigned to me, assignee=@me', false)
  .option('--requested-my-review', 'requested my review, review-requested=@me', false)
  .option('--authored-by-me', 'Authored by me, author:@me', false)
  .option('--authored-by-dependabot', 'Authored by dependabot, author:app/dependabot', false)
  .option('--authored-by-renovate', 'Authored by renovate, author:app/renovate', false)
  .option('--not-yet-reviewed', 'Not yet reviewed, review:none', false)
  .action((options) => printList(options));
program.parse(process.argv);
