#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { generateCommand } from './commands/generate';
import { reviewCommand } from './commands/review';

const program = new Command();

program
  .name('i18n-llm')
  .description('A CLI tool to manage i18n using LLMs')
  .version('0.1.0');


program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(reviewCommand);

program.parse(process.argv);
