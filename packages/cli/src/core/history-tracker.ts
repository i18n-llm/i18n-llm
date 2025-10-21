/**
 * History tracking for translation generations
 * Tracks provider usage, costs, and token consumption
 */
import * as fs from 'fs';

export interface GenerationRecord {
  timestamp: string;
  provider: string;
  model: string;
  keysGenerated: number;
  keysUpdated: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    input: number;
    output: number;
    total: number;
    currency: 'USD';
  };
}

export interface HistoryData {
  [language: string]: GenerationRecord[];
}

const DEFAULT_HISTORY_FILE = '.i18n-llm-history.json';

/**
 * Load history from file
 */
export function loadHistory(historyPath?: string): HistoryData {
  const filePath = historyPath || DEFAULT_HISTORY_FILE;

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Failed to load history from ${filePath}, starting fresh`);
    return {};
  }
}

/**
 * Save history to file
 */
export function saveHistory(history: HistoryData, historyPath?: string): void {
  const filePath = historyPath || DEFAULT_HISTORY_FILE;

  try {
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error(`❌ Failed to save history to ${filePath}:`, error);
  }
}

/**
 * Add a generation record to history
 */
export function addGenerationRecord(
  language: string,
  record: GenerationRecord,
  historyPath?: string
): void {
  const history = loadHistory(historyPath);

  if (!history[language]) {
    history[language] = [];
  }

  history[language].push(record);
  saveHistory(history, historyPath);
}

/**
 * Get all records for a specific language
 */
export function getLanguageHistory(
  language: string,
  historyPath?: string
): GenerationRecord[] {
  const history = loadHistory(historyPath);
  return history[language] || [];
}

/**
 * Get total cost across all languages
 */
export function getTotalCost(historyPath?: string): number {
  const history = loadHistory(historyPath);
  let total = 0;

  for (const language in history) {
    for (const record of history[language]) {
      total += record.cost.total;
    }
  }

  return total;
}

/**
 * Get cost breakdown by language
 */
export function getCostByLanguage(historyPath?: string): Record<string, number> {
  const history = loadHistory(historyPath);
  const costs: Record<string, number> = {};

  for (const language in history) {
    costs[language] = history[language].reduce(
      (sum, record) => sum + record.cost.total,
      0
    );
  }

  return costs;
}

/**
 * Get cost breakdown by date (YYYY-MM-DD)
 */
export function getCostByDate(historyPath?: string): Record<string, number> {
  const history = loadHistory(historyPath);
  const costs: Record<string, number> = {};

  for (const language in history) {
    for (const record of history[language]) {
      const date = record.timestamp.split('T')[0]; // Extract YYYY-MM-DD
      costs[date] = (costs[date] || 0) + record.cost.total;
    }
  }

  return costs;
}

/**
 * Get cost breakdown by provider
 */
export function getCostByProvider(historyPath?: string): Record<string, number> {
  const history = loadHistory(historyPath);
  const costs: Record<string, number> = {};

  for (const language in history) {
    for (const record of history[language]) {
      const key = `${record.provider}/${record.model}`;
      costs[key] = (costs[key] || 0) + record.cost.total;
    }
  }

  return costs;
}

