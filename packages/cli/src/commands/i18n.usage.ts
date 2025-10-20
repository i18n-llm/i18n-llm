/**
 * i18n.usage Command
 * Calculates token and word usage from schema files
 * Prefixed with "i18n." to be excluded from CI/CD workflows
 */

import { loadConfig } from '../core/config-loader.js';
import { parseSchema } from '../core/schema-parser.js';

interface UsageOptions {
  config?: string;
  format?: 'text' | 'json';
}

interface UsageStats {
  totalKeys: number;
  totalSourceWords: number;
  totalSourceChars: number;
  estimatedTokens: number;
  targetLanguages: string[];
  totalTranslations: number;
  estimatedTotalTokens: number;
}

/**
 * Estimates token count from text
 * Rough estimation: ~0.75 tokens per word for English
 */
function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 0.75);
}

/**
 * Calculates usage statistics from schema
 */
function calculateUsage(schema: any): UsageStats {
  const keys = Object.keys(schema.entities || {});
  const targetLanguages = schema.targetLanguages || [];
  
  let totalSourceWords = 0;
  let totalSourceChars = 0;
  let estimatedTokens = 0;

  for (const key of keys) {
    const entity = schema.entities[key];
    const sourceText = entity.sourceText || '';
    
    // Count words and characters
    const words = sourceText.trim().split(/\s+/).length;
    totalSourceWords += words;
    totalSourceChars += sourceText.length;
    
    // Estimate tokens
    estimatedTokens += estimateTokens(sourceText);
  }

  const totalTranslations = keys.length * targetLanguages.length;
  const estimatedTotalTokens = estimatedTokens * targetLanguages.length;

  return {
    totalKeys: keys.length,
    totalSourceWords,
    totalSourceChars,
    estimatedTokens,
    targetLanguages,
    totalTranslations,
    estimatedTotalTokens,
  };
}

/**
 * Formats usage stats as text
 */
function formatAsText(stats: UsageStats): string {
  const lines = [
    '',
    '📊 Usage Statistics',
    '═'.repeat(50),
    '',
    `Total Keys:              ${stats.totalKeys}`,
    `Source Words:            ${stats.totalSourceWords}`,
    `Source Characters:       ${stats.totalSourceChars}`,
    `Estimated Source Tokens: ${stats.estimatedTokens}`,
    '',
    `Target Languages:        ${stats.targetLanguages.join(', ')}`,
    `Total Translations:      ${stats.totalTranslations}`,
    '',
    `Estimated Total Tokens:  ${stats.estimatedTotalTokens}`,
    `  (includes all target languages)`,
    '',
    '═'.repeat(50),
    '',
    '💡 Note: Token estimates are approximate (~0.75 tokens/word)',
    '',
  ];
  
  return lines.join('\n');
}

/**
 * Formats usage stats as JSON
 */
function formatAsJSON(stats: UsageStats): string {
  return JSON.stringify(stats, null, 2);
}

/**
 * Main command handler
 */
export async function usageCommand(options: UsageOptions): Promise<void> {
  try {
    const configPath = options.config || 'i18n-llm.config.js';
    const format = options.format || 'text';

    console.log(`\n🔍 Analyzing schema files from: ${configPath}\n`);

    // Load configuration
    const config = await loadConfig(configPath);

    // Parse all schema files
    const allStats: UsageStats[] = [];
    
    for (const schemaFile of config.schemaFiles) {
      const schema = await parseSchema(schemaFile);
      const stats = calculateUsage(schema);
      allStats.push(stats);
    }

    // Aggregate stats
    const aggregated: UsageStats = {
      totalKeys: 0,
      totalSourceWords: 0,
      totalSourceChars: 0,
      estimatedTokens: 0,
      targetLanguages: [],
      totalTranslations: 0,
      estimatedTotalTokens: 0,
    };

    const languageSet = new Set<string>();

    for (const stats of allStats) {
      aggregated.totalKeys += stats.totalKeys;
      aggregated.totalSourceWords += stats.totalSourceWords;
      aggregated.totalSourceChars += stats.totalSourceChars;
      aggregated.estimatedTokens += stats.estimatedTokens;
      aggregated.totalTranslations += stats.totalTranslations;
      aggregated.estimatedTotalTokens += stats.estimatedTotalTokens;
      
      stats.targetLanguages.forEach(lang => languageSet.add(lang));
    }

    aggregated.targetLanguages = Array.from(languageSet);

    // Output results
    if (format === 'json') {
      console.log(formatAsJSON(aggregated));
    } else {
      console.log(formatAsText(aggregated));
    }

  } catch (error) {
    console.error('❌ Error calculating usage:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

