/**
 * i18n.costs Command
 * Analyzes historical cost data from .i18n-llm-history.json
 * Provides summaries by total, date, language, and provider
 */

import {
  getCostByDate,
  getCostByLanguage,
  getCostByProvider,
  getTotalCost,
  loadHistory,
} from '../core/history-tracker.js';

interface CostsOptions {
  history?: string;
  format?: 'text' | 'json';
}

interface CostsSummary {
  totalCost: number;
  totalGenerations: number;
  totalKeys: number;
  totalTokens: number;
  byLanguage: Record<string, number>;
  byDate: Record<string, number>;
  byProvider: Record<string, number>;
  currency: 'USD';
}

/**
 * Generate costs summary from history
 */
function generateCostsSummary(historyPath?: string): CostsSummary {
  const history = loadHistory(historyPath);

  let totalGenerations = 0;
  let totalKeys = 0;
  let totalTokens = 0;

  for (const language in history) {
    for (const record of history[language]) {
      totalGenerations++;
      totalKeys += record.keysGenerated + record.keysUpdated;
      totalTokens += record.tokens.total;
    }
  }

  return {
    totalCost: getTotalCost(historyPath),
    totalGenerations,
    totalKeys,
    totalTokens,
    byLanguage: getCostByLanguage(historyPath),
    byDate: getCostByDate(historyPath),
    byProvider: getCostByProvider(historyPath),
    currency: 'USD',
  };
}

/**
 * Format summary as text
 */
function formatAsText(summary: CostsSummary): string {
  const lines = [
    '',
    '💰 i18n-llm Cost Analysis',
    '═'.repeat(70),
    '',
    '📊 Overall Statistics',
    '─'.repeat(70),
    `Total Cost:        $${summary.totalCost.toFixed(6)} ${summary.currency}`,
    `Total Generations: ${summary.totalGenerations}`,
    `Total Keys:        ${summary.totalKeys}`,
    `Total Tokens:      ${summary.totalTokens.toLocaleString()}`,
    '',
    '🌍 Cost by Language',
    '─'.repeat(70),
  ];

  const sortedLanguages = Object.entries(summary.byLanguage)
    .sort(([, a], [, b]) => b - a);

  for (const [language, cost] of sortedLanguages) {
    lines.push(`  ${language.padEnd(15)} $${cost.toFixed(6)}`);
  }

  lines.push('');
  lines.push('📅 Cost by Date');
  lines.push('─'.repeat(70));

  const sortedDates = Object.entries(summary.byDate)
    .sort(([a], [b]) => b.localeCompare(a));

  for (const [date, cost] of sortedDates) {
    lines.push(`  ${date}  $${cost.toFixed(6)}`);
  }

  lines.push('');
  lines.push('🤖 Cost by Provider/Model');
  lines.push('─'.repeat(70));

  const sortedProviders = Object.entries(summary.byProvider)
    .sort(([, a], [, b]) => b - a);

  for (const [provider, cost] of sortedProviders) {
    lines.push(`  ${provider.padEnd(30)} $${cost.toFixed(6)}`);
  }

  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('');

  return lines.join('\n');
}

/**
 * Format summary as JSON
 */
function formatAsJSON(summary: CostsSummary): string {
  return JSON.stringify(summary, null, 2);
}

/**
 * Main command handler
 */
export function costsCommand(options: CostsOptions): void {
  try {
    const historyPath = options.history;
    const format = options.format || 'text';

    console.log(`\n🔍 Analyzing cost history from: ${historyPath || '.i18n-llm-history.json'}\n`);

    const summary = generateCostsSummary(historyPath);

    if (summary.totalGenerations === 0) {
      console.log('ℹ️  No generation history found. Run `i18n-llm generate` first.\n');
      return;
    }

    // Output results
    if (format === 'json') {
      console.log(formatAsJSON(summary));
    } else {
      console.log(formatAsText(summary));
    }

  } catch (error) {
    console.error('❌ Error analyzing costs:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

