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
const vitest_1 = require("vitest");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const state_manager_1 = require("./state-manager");
const TEST_STATE_PATH = '.test-state.json';
const TEST_STATE_RESOLVED = path.resolve(process.cwd(), TEST_STATE_PATH);
(0, vitest_1.describe)('state-manager', () => {
    (0, vitest_1.beforeEach)(() => {
        // Clean up any existing test files
        if (fs.existsSync(TEST_STATE_RESOLVED)) {
            fs.unlinkSync(TEST_STATE_RESOLVED);
        }
    });
    (0, vitest_1.afterEach)(() => {
        // Clean up test files after each test
        if (fs.existsSync(TEST_STATE_RESOLVED)) {
            fs.unlinkSync(TEST_STATE_RESOLVED);
        }
    });
    (0, vitest_1.describe)('loadState', () => {
        (0, vitest_1.it)('should return empty state when file does not exist', () => {
            const state = (0, state_manager_1.loadState)(TEST_STATE_PATH);
            (0, vitest_1.expect)(state).toEqual({});
        });
        (0, vitest_1.it)('should load valid state file', () => {
            const mockState = {
                'translations::user.name': {
                    hash: 'abc123',
                    texts: {
                        'en-US': 'Full Name',
                        'pt-BR': 'Nome Completo',
                    },
                },
            };
            fs.writeFileSync(TEST_STATE_RESOLVED, JSON.stringify(mockState, null, 2));
            const loadedState = (0, state_manager_1.loadState)(TEST_STATE_PATH);
            (0, vitest_1.expect)(loadedState).toEqual(mockState);
        });
        (0, vitest_1.it)('should return empty state for invalid JSON', () => {
            fs.writeFileSync(TEST_STATE_RESOLVED, 'invalid json {');
            const state = (0, state_manager_1.loadState)(TEST_STATE_PATH, { silent: true });
            (0, vitest_1.expect)(state).toEqual({});
        });
        (0, vitest_1.it)('should return empty state for invalid structure', () => {
            const invalidState = {
                'key1': {
                    // Missing 'hash' field
                    texts: { 'en': 'test' },
                },
            };
            fs.writeFileSync(TEST_STATE_RESOLVED, JSON.stringify(invalidState));
            const state = (0, state_manager_1.loadState)(TEST_STATE_PATH, { silent: true });
            (0, vitest_1.expect)(state).toEqual({});
        });
        (0, vitest_1.it)('should work in silent mode', () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'log');
            (0, state_manager_1.loadState)(TEST_STATE_PATH, { silent: true });
            (0, vitest_1.expect)(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)('should use custom logger', () => {
            const mockLogger = {
                info: vitest_1.vi.fn(),
                error: vitest_1.vi.fn(),
            };
            (0, state_manager_1.loadState)(TEST_STATE_PATH, { logger: mockLogger });
            (0, vitest_1.expect)(mockLogger.info).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockLogger.error).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should call custom logger on error', () => {
            const mockLogger = {
                info: vitest_1.vi.fn(),
                error: vitest_1.vi.fn(),
            };
            fs.writeFileSync(TEST_STATE_RESOLVED, 'invalid json');
            (0, state_manager_1.loadState)(TEST_STATE_PATH, { logger: mockLogger });
            (0, vitest_1.expect)(mockLogger.error).toHaveBeenCalled();
            (0, vitest_1.expect)(mockLogger.info).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should validate state structure with missing texts field', () => {
            const invalidState = {
                'key1': {
                    hash: 'abc123',
                    // Missing 'texts' field
                },
            };
            fs.writeFileSync(TEST_STATE_RESOLVED, JSON.stringify(invalidState));
            const state = (0, state_manager_1.loadState)(TEST_STATE_PATH, { silent: true });
            (0, vitest_1.expect)(state).toEqual({});
        });
        (0, vitest_1.it)('should validate state structure with null texts', () => {
            const invalidState = {
                'key1': {
                    hash: 'abc123',
                    texts: null,
                },
            };
            fs.writeFileSync(TEST_STATE_RESOLVED, JSON.stringify(invalidState));
            const state = (0, state_manager_1.loadState)(TEST_STATE_PATH, { silent: true });
            (0, vitest_1.expect)(state).toEqual({});
        });
    });
    (0, vitest_1.describe)('saveState', () => {
        (0, vitest_1.it)('should save state to file', () => {
            const mockState = {
                'translations::user.name': {
                    hash: 'abc123',
                    texts: {
                        'en-US': 'Full Name',
                        'pt-BR': 'Nome Completo',
                    },
                },
            };
            (0, state_manager_1.saveState)(mockState, TEST_STATE_PATH);
            (0, vitest_1.expect)(fs.existsSync(TEST_STATE_RESOLVED)).toBe(true);
            const savedContent = fs.readFileSync(TEST_STATE_RESOLVED, 'utf-8');
            const parsedState = JSON.parse(savedContent);
            (0, vitest_1.expect)(parsedState).toEqual(mockState);
        });
        (0, vitest_1.it)('should format JSON with 2 spaces indentation', () => {
            const mockState = {
                'key1': {
                    hash: 'abc',
                    texts: { 'en': 'test' },
                },
            };
            (0, state_manager_1.saveState)(mockState, TEST_STATE_PATH);
            const savedContent = fs.readFileSync(TEST_STATE_RESOLVED, 'utf-8');
            // Check for proper indentation
            (0, vitest_1.expect)(savedContent).toContain('  "key1"');
            (0, vitest_1.expect)(savedContent).toContain('    "hash"');
        });
        (0, vitest_1.it)('should throw error if file cannot be written', () => {
            const mockState = {};
            const invalidPath = '/invalid/path/that/does/not/exist/state.json';
            (0, vitest_1.expect)(() => (0, state_manager_1.saveState)(mockState, invalidPath, { silent: true })).toThrow();
        });
        (0, vitest_1.it)('should work in silent mode', () => {
            const consoleSpy = vitest_1.vi.spyOn(console, 'error');
            const mockState = {};
            (0, state_manager_1.saveState)(mockState, TEST_STATE_PATH, { silent: true });
            (0, vitest_1.expect)(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
    (0, vitest_1.describe)('getStateStats', () => {
        (0, vitest_1.it)('should return zero stats for empty state', () => {
            const stats = (0, state_manager_1.getStateStats)({});
            (0, vitest_1.expect)(stats).toEqual({
                totalKeys: 0,
                totalTexts: 0,
                languageCounts: {},
            });
        });
        (0, vitest_1.it)('should calculate stats correctly for single entry', () => {
            const state = {
                'key1': {
                    hash: 'abc',
                    texts: {
                        'en-US': 'Hello',
                        'pt-BR': 'Olá',
                    },
                },
            };
            const stats = (0, state_manager_1.getStateStats)(state);
            (0, vitest_1.expect)(stats.totalKeys).toBe(1);
            (0, vitest_1.expect)(stats.totalTexts).toBe(2);
            (0, vitest_1.expect)(stats.languageCounts).toEqual({
                'en-US': 1,
                'pt-BR': 1,
            });
        });
        (0, vitest_1.it)('should calculate stats correctly for multiple entries', () => {
            const state = {
                'key1': {
                    hash: 'abc',
                    texts: {
                        'en-US': 'Hello',
                        'pt-BR': 'Olá',
                        'es-ES': 'Hola',
                    },
                },
                'key2': {
                    hash: 'def',
                    texts: {
                        'en-US': 'World',
                        'pt-BR': 'Mundo',
                    },
                },
            };
            const stats = (0, state_manager_1.getStateStats)(state);
            (0, vitest_1.expect)(stats.totalKeys).toBe(2);
            (0, vitest_1.expect)(stats.totalTexts).toBe(5);
            (0, vitest_1.expect)(stats.languageCounts).toEqual({
                'en-US': 2,
                'pt-BR': 2,
                'es-ES': 1,
            });
        });
        (0, vitest_1.it)('should handle pluralized translations', () => {
            const state = {
                'key1': {
                    hash: 'abc',
                    texts: {
                        'en-US': {
                            '=0': 'No items',
                            '=1': 'One item',
                            '>1': '{count} items',
                        },
                    },
                },
            };
            const stats = (0, state_manager_1.getStateStats)(state);
            (0, vitest_1.expect)(stats.totalKeys).toBe(1);
            (0, vitest_1.expect)(stats.totalTexts).toBe(1);
            (0, vitest_1.expect)(stats.languageCounts).toEqual({
                'en-US': 1,
            });
        });
        (0, vitest_1.it)('should handle mixed string and pluralized translations', () => {
            const state = {
                'key1': {
                    hash: 'abc',
                    texts: {
                        'en-US': 'Simple text',
                        'pt-BR': {
                            '=0': 'Nenhum item',
                            '=1': 'Um item',
                            '>1': '{count} itens',
                        },
                    },
                },
            };
            const stats = (0, state_manager_1.getStateStats)(state);
            (0, vitest_1.expect)(stats.totalKeys).toBe(1);
            (0, vitest_1.expect)(stats.totalTexts).toBe(2);
            (0, vitest_1.expect)(stats.languageCounts).toEqual({
                'en-US': 1,
                'pt-BR': 1,
            });
        });
    });
    (0, vitest_1.describe)('cleanupState', () => {
        (0, vitest_1.it)('should not remove any entries when all are valid', () => {
            const state = {
                'key1': { hash: 'abc', texts: { 'en': 'test1' } },
                'key2': { hash: 'def', texts: { 'en': 'test2' } },
            };
            const validKeys = new Set(['key1', 'key2']);
            const removed = (0, state_manager_1.cleanupState)(state, validKeys);
            (0, vitest_1.expect)(removed).toBe(0);
            (0, vitest_1.expect)(Object.keys(state)).toHaveLength(2);
        });
        (0, vitest_1.it)('should remove orphaned entries', () => {
            const state = {
                'key1': { hash: 'abc', texts: { 'en': 'test1' } },
                'key2': { hash: 'def', texts: { 'en': 'test2' } },
                'key3': { hash: 'ghi', texts: { 'en': 'test3' } },
            };
            const validKeys = new Set(['key1', 'key3']);
            const removed = (0, state_manager_1.cleanupState)(state, validKeys);
            (0, vitest_1.expect)(removed).toBe(1);
            (0, vitest_1.expect)(Object.keys(state)).toHaveLength(2);
            (0, vitest_1.expect)(state).toHaveProperty('key1');
            (0, vitest_1.expect)(state).toHaveProperty('key3');
            (0, vitest_1.expect)(state).not.toHaveProperty('key2');
        });
        (0, vitest_1.it)('should remove all entries when validKeys is empty', () => {
            const state = {
                'key1': { hash: 'abc', texts: { 'en': 'test1' } },
                'key2': { hash: 'def', texts: { 'en': 'test2' } },
            };
            const validKeys = new Set();
            const removed = (0, state_manager_1.cleanupState)(state, validKeys);
            (0, vitest_1.expect)(removed).toBe(2);
            (0, vitest_1.expect)(Object.keys(state)).toHaveLength(0);
        });
        (0, vitest_1.it)('should return 0 for empty state', () => {
            const state = {};
            const validKeys = new Set(['key1']);
            const removed = (0, state_manager_1.cleanupState)(state, validKeys);
            (0, vitest_1.expect)(removed).toBe(0);
        });
        (0, vitest_1.it)('should mutate state in place', () => {
            const state = {
                'key1': { hash: 'abc', texts: { 'en': 'test1' } },
                'key2': { hash: 'def', texts: { 'en': 'test2' } },
            };
            const originalReference = state;
            const validKeys = new Set(['key1']);
            (0, state_manager_1.cleanupState)(state, validKeys);
            // Should be same reference (mutated in place)
            (0, vitest_1.expect)(state).toBe(originalReference);
            (0, vitest_1.expect)(Object.keys(state)).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('integration tests', () => {
        (0, vitest_1.it)('should handle full lifecycle: save -> load -> modify -> save -> load', () => {
            // Initial state
            const initialState = {
                'key1': { hash: 'abc', texts: { 'en': 'test1' } },
                'key2': { hash: 'def', texts: { 'en': 'test2' } },
            };
            // Save
            (0, state_manager_1.saveState)(initialState, TEST_STATE_PATH);
            // Load
            const loadedState = (0, state_manager_1.loadState)(TEST_STATE_PATH);
            (0, vitest_1.expect)(loadedState).toEqual(initialState);
            // Modify
            loadedState['key3'] = { hash: 'ghi', texts: { 'en': 'test3' } };
            delete loadedState['key1'];
            // Save again
            (0, state_manager_1.saveState)(loadedState, TEST_STATE_PATH);
            // Load again
            const finalState = (0, state_manager_1.loadState)(TEST_STATE_PATH);
            (0, vitest_1.expect)(Object.keys(finalState)).toHaveLength(2);
            (0, vitest_1.expect)(finalState).toHaveProperty('key2');
            (0, vitest_1.expect)(finalState).toHaveProperty('key3');
            (0, vitest_1.expect)(finalState).not.toHaveProperty('key1');
        });
        (0, vitest_1.it)('should handle cleanup workflow', () => {
            const state = {
                'translations::user.name': { hash: 'abc', texts: { 'en': 'Name' } },
                'translations::user.email': { hash: 'def', texts: { 'en': 'Email' } },
                'translations::user.phone': { hash: 'ghi', texts: { 'en': 'Phone' } },
            };
            (0, state_manager_1.saveState)(state, TEST_STATE_PATH);
            const loadedState = (0, state_manager_1.loadState)(TEST_STATE_PATH);
            // Simulate schema change - only name and email are valid now
            const validKeys = new Set([
                'translations::user.name',
                'translations::user.email',
            ]);
            const removed = (0, state_manager_1.cleanupState)(loadedState, validKeys);
            (0, vitest_1.expect)(removed).toBe(1);
            (0, state_manager_1.saveState)(loadedState, TEST_STATE_PATH);
            const finalState = (0, state_manager_1.loadState)(TEST_STATE_PATH);
            (0, vitest_1.expect)(Object.keys(finalState)).toHaveLength(2);
        });
    });
});
