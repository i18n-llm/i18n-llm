#!/usr/bin/env node

/**
 * i18n-llm CLI Entry Point
 * Main command-line interface for the i18n-llm tool
 */

import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { usageCommand } from './commands/i18n.usage.js';
import { reportCommand } from './commands/i18n.report.js';
import { costsCommand } from './commands/i18n.costs.js';

const program = new Command();

program
  .name('i18n-llm')
  .description('AI-powered i18n translation tool using LLMs')
  .version('1.0.0');

// Add the generate command (it's already a Command object)
program.addCommand(generateCommand);

// Usage calculation command (prefixed with i18n. to exclude from CI/CD)
program
  .command('i18n.usage')
  .description('Calculate token/word usage from schema files')
  .option('--config <path>', 'Path to config file', 'i18n-llm.config.js')
  .option('--format <format>', 'Output format (text|json)', 'text')
  .action(usageCommand);

// Consumption report command (prefixed with i18n. to exclude from CI/CD)
program
  .command('i18n.report')
  .description('Generate consumption report with cost estimates')
  .option('--config <path>', 'Path to config file', 'i18n-llm.config.js')
  .option('--format <format>', 'Output format (text|json|markdown)', 'text')
  .option('--output <path>', 'Output file path (optional)')
  .action(reportCommand);

// Cost analysis command (prefixed with i18n. to exclude from CI/CD)
program
  .command('i18n.costs')
  .description('Analyze historical cost data from generation history')
  .option('--history <path>', 'Path to history file', '.i18n-history.json')
  .option('--format <format>', 'Output format (text|json)', 'text')
  .action(costsCommand);

program.parse(process.argv);

