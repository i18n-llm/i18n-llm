/**
 * i18n.report Command
 * Generates consumption report with cost estimates for different LLM providers
 * Prefixed with "i18n." to be excluded from CI/CD workflows
 */

import * as fs from 'fs/promises';
import { loadConfig } from '../core/config-loader.js';
import { parseSchema } from '../core/schema-parser.js';

interface ReportOptions {
  config?: string;
  format?: 'text' | 'json' | 'markdown';
  output?: string;
}

interface CostEstimate {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  totalCost: number;
}

interface ConsumptionReport {
  generatedAt: string;
  totalKeys: number;
  totalSourceWords: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  targetLanguages: string[];
  totalTranslations: number;
  costEstimates: CostEstimate[];
}

/**
 * Pricing data for different LLM providers (as of Oct 2025)
 * Prices are per 1M tokens
 */
const PRICING = {
  openai: {
    'gpt-4.1-mini': { input: 0.15, output: 0.60 },
    'gpt-4.1-nano': { input: 0.10, output: 0.40 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
  },
  gemini: {
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  },
};

/**
 * Estimates token count from text
 */
function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 0.75);
}

/**
 * Calculates cost estimate for a provider/model
 */
function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): CostEstimate | null {
  const pricing = (PRICING as any)[provider]?.[model];
  
  if (!pricing) {
    return null;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    provider,
    model,
    inputTokens,
    outputTokens,
    inputCostPer1M: pricing.input,
    outputCostPer1M: pricing.output,
    totalCost,
  };
}

/**
 * Generates consumption report
 */
async function generateReport(configPath: string): Promise<ConsumptionReport> {
  const config = await loadConfig(configPath);
  
  let totalKeys = 0;
  let totalSourceWords = 0;
  let estimatedInputTokens = 0;
  const languageSet = new Set<string>();

  // Parse all schema files
  for (const schemaFile of config.schemaFiles) {
    const schema = await parseSchema(schemaFile);
    const keys = Object.keys(schema.entities || {});
    totalKeys += keys.length;

    // Calculate source text stats
    for (const key of keys) {
      const entity = schema.entities[key];
      const sourceText = typeof entity.sourceText === 'string' ? entity.sourceText : '';
      const words = sourceText.trim().split(/\s+/).length;
      totalSourceWords += words;
      estimatedInputTokens += estimateTokens(sourceText);
    }

    // Collect target languages
    (schema.targetLanguages || []).forEach((lang: string) => languageSet.add(lang));
  }

  const targetLanguages = Array.from(languageSet);
  const totalTranslations = totalKeys * targetLanguages.length;
  
  // Estimate output tokens (assume similar length to input)
  const estimatedOutputTokens = estimatedInputTokens * targetLanguages.length;
  
  // Multiply input tokens by number of languages for total input
  const totalInputTokens = estimatedInputTokens * targetLanguages.length;

  // Calculate cost estimates for different providers
  const costEstimates: CostEstimate[] = [];
  
  // OpenAI models
  for (const [model, _] of Object.entries(PRICING.openai)) {
    const estimate = calculateCost('openai', model, totalInputTokens, estimatedOutputTokens);
    if (estimate) costEstimates.push(estimate);
  }
  
  // Gemini models
  for (const [model, _] of Object.entries(PRICING.gemini)) {
    const estimate = calculateCost('gemini', model, totalInputTokens, estimatedOutputTokens);
    if (estimate) costEstimates.push(estimate);
  }

  return {
    generatedAt: new Date().toISOString(),
    totalKeys,
    totalSourceWords,
    estimatedInputTokens: totalInputTokens,
    estimatedOutputTokens,
    targetLanguages,
    totalTranslations,
    costEstimates,
  };
}

/**
 * Formats report as text
 */
function formatAsText(report: ConsumptionReport): string {
  const lines = [
    '',
    '📊 i18n-llm Consumption Report',
    '═'.repeat(70),
    '',
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    '',
    '📝 Project Statistics',
    '─'.repeat(70),
    `Total Keys:              ${report.totalKeys}`,
    `Source Words:            ${report.totalSourceWords}`,
    `Target Languages:        ${report.targetLanguages.join(', ')}`,
    `Total Translations:      ${report.totalTranslations}`,
    '',
    '🔢 Token Estimates',
    '─'.repeat(70),
    `Estimated Input Tokens:  ${report.estimatedInputTokens.toLocaleString()}`,
    `Estimated Output Tokens: ${report.estimatedOutputTokens.toLocaleString()}`,
    '',
    '💰 Cost Estimates by Provider',
    '─'.repeat(70),
  ];

  // Sort by cost (cheapest first)
  const sorted = [...report.costEstimates].sort((a, b) => a.totalCost - b.totalCost);

  for (const estimate of sorted) {
    lines.push('');
    lines.push(`${estimate.provider.toUpperCase()} - ${estimate.model}`);
    lines.push(`  Input:  ${estimate.inputTokens.toLocaleString()} tokens × $${estimate.inputCostPer1M}/1M = $${(estimate.inputTokens / 1_000_000 * estimate.inputCostPer1M).toFixed(4)}`);
    lines.push(`  Output: ${estimate.outputTokens.toLocaleString()} tokens × $${estimate.outputCostPer1M}/1M = $${(estimate.outputTokens / 1_000_000 * estimate.outputCostPer1M).toFixed(4)}`);
    lines.push(`  Total:  $${estimate.totalCost.toFixed(4)}`);
  }

  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('');
  lines.push('💡 Notes:');
  lines.push('  • Token estimates are approximate (~0.75 tokens/word)');
  lines.push('  • Actual costs may vary based on prompt complexity');
  lines.push('  • Prices are as of October 2025 and subject to change');
  lines.push('');

  return lines.join('\n');
}

/**
 * Formats report as JSON
 */
function formatAsJSON(report: ConsumptionReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Formats report as Markdown
 */
function formatAsMarkdown(report: ConsumptionReport): string {
  const lines = [
    '# i18n-llm Consumption Report',
    '',
    `**Generated:** ${new Date(report.generatedAt).toLocaleString()}`,
    '',
    '## Project Statistics',
    '',
    `- **Total Keys:** ${report.totalKeys}`,
    `- **Source Words:** ${report.totalSourceWords}`,
    `- **Target Languages:** ${report.targetLanguages.join(', ')}`,
    `- **Total Translations:** ${report.totalTranslations}`,
    '',
    '## Token Estimates',
    '',
    `- **Estimated Input Tokens:** ${report.estimatedInputTokens.toLocaleString()}`,
    `- **Estimated Output Tokens:** ${report.estimatedOutputTokens.toLocaleString()}`,
    '',
    '## Cost Estimates by Provider',
    '',
    '| Provider | Model | Input Tokens | Output Tokens | Input Cost | Output Cost | **Total Cost** |',
    '|----------|-------|-------------:|-------------:|-----------:|------------:|---------------:|',
  ];

  // Sort by cost (cheapest first)
  const sorted = [...report.costEstimates].sort((a, b) => a.totalCost - b.totalCost);

  for (const estimate of sorted) {
    const inputCost = (estimate.inputTokens / 1_000_000 * estimate.inputCostPer1M).toFixed(4);
    const outputCost = (estimate.outputTokens / 1_000_000 * estimate.outputCostPer1M).toFixed(4);
    lines.push(`| ${estimate.provider.toUpperCase()} | ${estimate.model} | ${estimate.inputTokens.toLocaleString()} | ${estimate.outputTokens.toLocaleString()} | $${inputCost} | $${outputCost} | **$${estimate.totalCost.toFixed(4)}** |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('### Notes');
  lines.push('');
  lines.push('- Token estimates are approximate (~0.75 tokens/word)');
  lines.push('- Actual costs may vary based on prompt complexity');
  lines.push('- Prices are as of October 2025 and subject to change');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main command handler
 */
export async function reportCommand(options: ReportOptions): Promise<void> {
  try {
    const configPath = options.config || 'i18n-llm.config.js';
    const format = options.format || 'text';
    const outputPath = options.output;

    console.log(`\n🔍 Generating consumption report from: ${configPath}\n`);

    // Generate report
    const report = await generateReport(configPath);

    // Format output
    let output: string;
    if (format === 'json') {
      output = formatAsJSON(report);
    } else if (format === 'markdown') {
      output = formatAsMarkdown(report);
    } else {
      output = formatAsText(report);
    }

    // Write to file or console
    if (outputPath) {
      await fs.writeFile(outputPath, output, 'utf-8');
      console.log(`✅ Report saved to: ${outputPath}\n`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error('❌ Error generating report:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

