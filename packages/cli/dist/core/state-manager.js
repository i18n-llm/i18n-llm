"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadState = loadState;
exports.saveState = saveState;
exports.getStateStats = getStateStats;
exports.cleanupState = cleanupState;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const STATE_FILE_ENCODING = 'utf-8';
const JSON_INDENT_SPACES = 2;
class StateValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'StateValidationError';
    }
}
function validateStateStructure(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return false;
    }
    for (const [key, entry] of Object.entries(data)) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            return false;
        }
        const typedEntry = entry;
        if (!('hash' in typedEntry) || typeof typedEntry.hash !== 'string') {
            return false;
        }
        if (!('texts' in typedEntry) || typeof typedEntry.texts !== 'object' || typedEntry.texts === null || Array.isArray(typedEntry.texts)) {
            return false;
        }
    }
    return true;
}
function parseStateFile(filePath) {
    const content = fs.readFileSync(filePath, STATE_FILE_ENCODING);
    const parsed = JSON.parse(content);
    if (!validateStateStructure(parsed)) {
        throw new StateValidationError('Invalid state file structure');
    }
    return parsed;
}
function writeStateFile(filePath, state) {
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
function loadState(statePath, options = {}) {
    const resolvedPath = path.resolve(process.cwd(), statePath);
    const logger = options.logger || {
        info: (msg) => !options.silent && console.log(msg),
        error: (msg) => !options.silent && console.error(msg)
    };
    try {
        return parseStateFile(resolvedPath);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
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
function saveState(state, statePath, options = {}) {
    const resolvedPath = path.resolve(process.cwd(), statePath);
    const logger = options.logger || {
        error: (msg) => !options.silent && console.error(msg)
    };
    try {
        writeStateFile(resolvedPath, state);
    }
    catch (error) {
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
function getStateStats(state) {
    const stats = {
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
function cleanupState(state, validKeys) {
    let removedCount = 0;
    for (const stateKey in state) {
        if (!validKeys.has(stateKey)) {
            delete state[stateKey];
            removedCount++;
        }
    }
    return removedCount;
}
