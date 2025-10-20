import * as fs from 'fs';
import * as path from 'path';
import { PluralizedTranslation } from './llm/llm-provider.js';

const STATE_FILE_ENCODING = 'utf-8';
const JSON_INDENT_SPACES = 2;

export interface TranslationStateEntry {
  hash: string;
  texts: Record<string, string | PluralizedTranslation>;
}

export interface TranslationState {
  [stateKey: string]: TranslationStateEntry;
}

export interface StateStatistics {
  totalKeys: number;
  totalTexts: number;
  languageCounts: Record<string, number>;
}

export interface StateManagerOptions {
  silent?: boolean;
  logger?: {
    info: (message: string) => void;
    error: (message: string) => void;
  };
}

class StateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateValidationError';
  }
}

function validateStateStructure(data: unknown): data is TranslationState {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  for (const [key, entry] of Object.entries(data)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return false;
    }

    const typedEntry = entry as Record<string, unknown>;

    if (!('hash' in typedEntry) || typeof typedEntry.hash !== 'string') {
      return false;
    }

    if (!('texts' in typedEntry) || typeof typedEntry.texts !== 'object' || typedEntry.texts === null || Array.isArray(typedEntry.texts)) {
      return false;
    }
  }

  return true;
}

function parseStateFile(filePath: string): TranslationState {
  const content = fs.readFileSync(filePath, STATE_FILE_ENCODING);
  const parsed = JSON.parse(content);

  if (!validateStateStructure(parsed)) {
    throw new StateValidationError('Invalid state file structure');
  }

  return parsed;
}

function writeStateFile(filePath: string, state: TranslationState): void {
  const content = JSON.stringify(state, null, JSON_INDENT_SPACES);
  fs.writeFileSync(filePath, content, STATE_FILE_ENCODING);
}

/**
 * Loads translation state from disk.
 * 
 * @param statePath - Path to the state file (relative or absolute)
 * @param options - Optional configuration for logging behavior
 * @returns The loaded translation state, or an empty state if file doesn't exist or is invalid
 * 
 * @example
 * ```typescript
 * const state = loadState('.i18n-llm-state.json');
 * const silentState = loadState('.i18n-llm-state.json', { silent: true });
 * ```
 */
export function loadState(statePath: string, options: StateManagerOptions = {}): TranslationState {
  const resolvedPath = path.resolve(process.cwd(), statePath);
  const logger = options.logger || {
    info: (msg: string) => !options.silent && console.log(msg),
    error: (msg: string) => !options.silent && console.error(msg)
  };

  try {
    return parseStateFile(resolvedPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`  - ⚠️  Error loading state file: ${errorMessage}`);
    logger.info('  - ℹ️  Starting with empty state.');
    return {};
  }
}

/**
 * Saves translation state to disk.
 * 
 * @param state - The translation state to save
 * @param statePath - Path to the state file (relative or absolute)
 * @param options - Optional configuration for logging behavior
 * @throws Error if the file cannot be written
 * 
 * @example
 * ```typescript
 * saveState(state, '.i18n-llm-state.json');
 * saveState(state, '.i18n-llm-state.json', { silent: true });
 * ```
 */
export function saveState(
  state: TranslationState,
  statePath: string,
  options: StateManagerOptions = {}
): void {
  const resolvedPath = path.resolve(process.cwd(), statePath);
  const logger = options.logger || {
    error: (msg: string) => !options.silent && console.error(msg)
  };

  try {
    writeStateFile(resolvedPath, state);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`  - ❌ Error saving state file: ${errorMessage}`);
    throw error;
  }
}

/**
 * Calculates statistics about the translation state.
 * 
 * @param state - The translation state to analyze
 * @returns Statistics including total keys, texts, and per-language counts
 * 
 * @example
 * ```typescript
 * const stats = getStateStats(state);
 * console.log(`Total keys: ${stats.totalKeys}`);
 * console.log(`Languages: ${Object.keys(stats.languageCounts).join(', ')}`);
 * ```
 */
export function getStateStats(state: TranslationState): StateStatistics {
  const stats: StateStatistics = {
    totalKeys: 0,
    totalTexts: 0,
    languageCounts: {}
  };

  for (const entry of Object.values(state)) {
    stats.totalKeys++;

    for (const lang in entry.texts) {
      stats.totalTexts++;
      stats.languageCounts[lang] = (stats.languageCounts[lang] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Removes orphaned entries from the state that are no longer in the schema.
 * Mutates the state object in place for performance.
 * 
 * @param state - The translation state to clean (will be mutated)
 * @param validKeys - Set of state keys that should be preserved
 * @returns Number of entries removed
 * 
 * @example
 * ```typescript
 * const validKeys = new Set(['translations::user.name', 'translations::user.email']);
 * const removed = cleanupState(state, validKeys);
 * console.log(`Removed ${removed} orphaned entries`);
 * ```
 */
export function cleanupState(state: TranslationState, validKeys: Set<string>): number {
  let removedCount = 0;

  for (const stateKey in state) {
    if (!validKeys.has(stateKey)) {
      delete state[stateKey];
      removedCount++;
    }
  }

  return removedCount;
}
