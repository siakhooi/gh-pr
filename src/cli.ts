#!/usr/bin/env node
import { Command } from 'commander';

import {
  performListCommand,
  performAutoReviewCommand,
  performAutoMergeCommand,
  printVersionCommand,
} from './index.js';
import { getVersion } from './version.js';
import { collectLabels, parsePositiveNumber } from './cli-args-parsers.js';

const program = new Command();
program
  .name('gh-pr')
  .description('frequently used gh pr commands')
  .version(getVersion(), '-V, --version', 'output the current version');

program.helpCommand('help [command]', 'display help for a command');

program.addCommand(new Command('version').description('print version').action(printVersionCommand));

function createBaseCommand(name: string, description: string) {
  return new Command(name)
    .description(description)
    .option('--assigned-to-me', 'Assigned to me, assignee:@me', false)
    .option('--authored-by-me', 'Authored by me, author:@me', false)
    .option('--authored-by-dependabot', 'Authored by dependabot, author:app/dependabot', false)
    .option('--authored-by-renovate', 'Authored by renovate, author:app/renovate', false)
    .option(
      '-l, --limit <int>',
      'Number of Records to retrieve, positive number',
      parsePositiveNumber,
      '3',
    )
    .option('-u, --user <username>', 'User, user:<username>')
    .option('-R, --repo <user/repo>', 'Repo, repo:<user/repo_name>')
    .option('--label <label>', 'label/topic, allow multiple, label:<label>', collectLabels, []);
}
program.addCommand(
  createBaseCommand('list', 'list open pull requests')
    .option('--requested-my-review', 'requested my review, user-review-requested:@me', false)
    .option('--not-yet-reviewed', 'Not yet reviewed, review:none', false)
    .action((options) => performListCommand(options)),
);

program.addCommand(
  createBaseCommand('autoreview', 'auto review open pull requests')
    .option('--requested-my-review', 'requested my review, user-review-requested:@me', false)
    .option('--not-yet-reviewed', 'Not yet reviewed, review:none', false)
    .option('--allow-no-checks', 'review pull requests without any checks', false)
    .option('-n, --dry-run', 'Dry run', false)
    .option('--max-update <int>', 'Maximum Auto Review, positive number', parsePositiveNumber, '2')
    .option(
      '--max-update-per-repo <int>',
      'Maximum Auto Review per Repo, positive number',
      parsePositiveNumber,
      '1',
    )
    .action((options) => performAutoReviewCommand(options)),
);

program.addCommand(
  createBaseCommand('automerge', 'auto merge open pull requests that were approved by current user')
    .option('--allow-no-checks', 'merge pull requests without any checks', false)
    .option('-n, --dry-run', 'Dry run', false)
    .option('--max-update <int>', 'Maximum Auto Merge, positive number', parsePositiveNumber, '2')
    .option(
      '--max-update-per-repo <int>',
      'Maximum Auto Merge per Repo, positive number',
      parsePositiveNumber,
      '1',
    )
    .action((options) => performAutoMergeCommand(options)),
);

program.parse(process.argv);
