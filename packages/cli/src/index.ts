#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';
import { usageReportCommand } from './commands/usage-report.js';

const program = new Command();

program
  .name('i18n-llm')
  .description('A CLI tool to manage i18n using LLMs')
  .version('0.1.0');


program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(usageReportCommand);

program.parse(process.argv);
