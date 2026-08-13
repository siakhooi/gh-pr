#!/usr/bin/env node
import { Command, InvalidOptionArgumentError } from 'commander';

import { performListCommand, performAutoReviewCommand } from './index.js';
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

function parsePositiveNumber(value: string): number {
  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue)) throw new InvalidOptionArgumentError('Not a number');
  if (parsedValue < 1) throw new InvalidOptionArgumentError('Must be a positive number');
  return parsedValue;
}

function collectLabels(value: string, collection: string[]): string[] {
  return collection.concat([value]);
}
program
  .command('list')
  .description('list open pull requests')
  .option('--assigned-to-me', 'Assigned to me, assignee=@me', false)
  .option('--requested-my-review', 'requested my review, review-requested=@me', false)
  .option('--authored-by-me', 'Authored by me, author:@me', false)
  .option('--authored-by-dependabot', 'Authored by dependabot, author:app/dependabot', false)
  .option('--authored-by-renovate', 'Authored by renovate, author:app/renovate', false)
  .option('--not-yet-reviewed', 'Not yet reviewed, review:none', false)
  .option(
    '-l, --limit <int>',
    'Number of Records to retrieve, positive number',
    parsePositiveNumber,
    '3',
  )
  .option('-u, --user <username>', 'User')
  .option('-R, --repo <user/repo>', 'Repo: user/repo_name')
  .option('--label <label>', 'label/topic, allow multiple', collectLabels, [])
  .action((options) => performListCommand(options));

program
  .command('autoreview')
  .description('auto review selected pull requests')
  .option('--assigned-to-me', 'Assigned to me, assignee=@me', false)
  .option('--requested-my-review', 'requested my review, review-requested=@me', false)
  .option('--authored-by-me', 'Authored by me, author:@me', false)
  .option('--authored-by-dependabot', 'Authored by dependabot, author:app/dependabot', false)
  .option('--authored-by-renovate', 'Authored by renovate, author:app/renovate', false)
  .option('--not-yet-reviewed', 'Not yet reviewed, review:none', false)
  .option(
    '-l, --limit <int>',
    'Number of Records to retrieve, positive number',
    parsePositiveNumber,
    '3',
  )
  .option('-u, --user <username>', 'User')
  .option('-R, --repo <user/repo>', 'Repo: user/repo_name')
  .option('--label <label>', 'label/topic, allow multiple', collectLabels, [])
  .option('--max-update <int>', 'Maximum Auto Review, positive number', parsePositiveNumber, '2')
  .option(
    '--max-update-per-repo <int>',
    'Maximum Auto Review per Repo, positive number',
    parsePositiveNumber,
    '1',
  )
  .action((options) => performAutoReviewCommand(options));

program.parse(process.argv);
