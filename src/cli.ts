#!/usr/bin/env node
import { Command } from 'commander';

import { hello } from './index.js';
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
program.parse(process.argv);

console.log(hello());
