import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadState,
  saveState,
  getStateStats,
  cleanupState,
  TranslationState,
  StateManagerOptions,
} from './state-manager';

const TEST_STATE_PATH = '.test-state.json';
const TEST_STATE_RESOLVED = path.resolve(process.cwd(), TEST_STATE_PATH);

describe('state-manager', () => {
  beforeEach(() => {
    // Clean up any existing test files
    if (fs.existsSync(TEST_STATE_RESOLVED)) {
      fs.unlinkSync(TEST_STATE_RESOLVED);
    }
  });

  afterEach(() => {
    // Clean up test files after each test
    if (fs.existsSync(TEST_STATE_RESOLVED)) {
      fs.unlinkSync(TEST_STATE_RESOLVED);
    }
  });

  describe('loadState', () => {
    it('should return empty state when file does not exist', () => {
      const state = loadState(TEST_STATE_PATH);
      expect(state).toEqual({});
    });

    it('should load valid state file', () => {
      const mockState: TranslationState = {
        'translations::user.name': {
          hash: 'abc123',
          texts: {
            'en-US': 'Full Name',
            'pt-BR': 'Nome Completo',
          },
        },
      };

      fs.writeFileSync(TEST_STATE_RESOLVED, JSON.stringify(mockState, null, 2));

      const loadedState = loadState(TEST_STATE_PATH);
      expect(loadedState).toEqual(mockState);
    });

    it('should return empty state for invalid JSON', () => {
      fs.writeFileSync(TEST_STATE_RESOLVED, 'invalid json {');

      const state = loadState(TEST_STATE_PATH, { silent: true });
      expect(state).toEqual({});
    });

    it('should return empty state for invalid structure', () => {
      const invalidState = {
        'key1': {
          // Missing 'hash' field
          texts: { 'en': 'test' },
        },
      };

      fs.writeFileSync(TEST_STATE_RESOLVED, JSON.stringify(invalidState));

      const state = loadState(TEST_STATE_PATH, { silent: true });
      expect(state).toEqual({});
    });

    it('should work in silent mode', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      loadState(TEST_STATE_PATH, { silent: true });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should use custom logger', () => {
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
      };

      loadState(TEST_STATE_PATH, { logger: mockLogger });

      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should call custom logger on error', () => {
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
      };

      fs.writeFileSync(TEST_STATE_RESOLVED, 'invalid json');

      loadState(TEST_STATE_PATH, { logger: mockLogger });

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should validate state structure with missing texts field', () => {
      const invalidState = {
        'key1': {
          hash: 'abc123',
          // Missing 'texts' field
        },
      };

      fs.writeFileSync(TEST_STATE_RESOLVED, JSON.stringify(invalidState));

      const state = loadState(TEST_STATE_PATH, { silent: true });
      expect(state).toEqual({});
    });

    it('should validate state structure with null texts', () => {
      const invalidState = {
        'key1': {
          hash: 'abc123',
          texts: null,
        },
      };

      fs.writeFileSync(TEST_STATE_RESOLVED, JSON.stringify(invalidState));

      const state = loadState(TEST_STATE_PATH, { silent: true });
      expect(state).toEqual({});
    });
  });

  describe('saveState', () => {
    it('should save state to file', () => {
      const mockState: TranslationState = {
        'translations::user.name': {
          hash: 'abc123',
          texts: {
            'en-US': 'Full Name',
            'pt-BR': 'Nome Completo',
          },
        },
      };

      saveState(mockState, TEST_STATE_PATH);

      expect(fs.existsSync(TEST_STATE_RESOLVED)).toBe(true);

      const savedContent = fs.readFileSync(TEST_STATE_RESOLVED, 'utf-8');
      const parsedState = JSON.parse(savedContent);

      expect(parsedState).toEqual(mockState);
    });

    it('should format JSON with 2 spaces indentation', () => {
      const mockState: TranslationState = {
        'key1': {
          hash: 'abc',
          texts: { 'en': 'test' },
        },
      };

      saveState(mockState, TEST_STATE_PATH);

      const savedContent = fs.readFileSync(TEST_STATE_RESOLVED, 'utf-8');

      // Check for proper indentation
      expect(savedContent).toContain('  "key1"');
      expect(savedContent).toContain('    "hash"');
    });

    it('should throw error if file cannot be written', () => {
      const mockState: TranslationState = {};
      const invalidPath = '/invalid/path/that/does/not/exist/state.json';

      expect(() => saveState(mockState, invalidPath, { silent: true })).toThrow();
    });

    it('should work in silent mode', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const mockState: TranslationState = {};

      saveState(mockState, TEST_STATE_PATH, { silent: true });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getStateStats', () => {
    it('should return zero stats for empty state', () => {
      const stats = getStateStats({});

      expect(stats).toEqual({
        totalKeys: 0,
        totalTexts: 0,
        languageCounts: {},
      });
    });

    it('should calculate stats correctly for single entry', () => {
      const state: TranslationState = {
        'key1': {
          hash: 'abc',
          texts: {
            'en-US': 'Hello',
            'pt-BR': 'Olá',
          },
        },
      };

      const stats = getStateStats(state);

      expect(stats.totalKeys).toBe(1);
      expect(stats.totalTexts).toBe(2);
      expect(stats.languageCounts).toEqual({
        'en-US': 1,
        'pt-BR': 1,
      });
    });

    it('should calculate stats correctly for multiple entries', () => {
      const state: TranslationState = {
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

      const stats = getStateStats(state);

      expect(stats.totalKeys).toBe(2);
      expect(stats.totalTexts).toBe(5);
      expect(stats.languageCounts).toEqual({
        'en-US': 2,
        'pt-BR': 2,
        'es-ES': 1,
      });
    });

    it('should handle pluralized translations', () => {
      const state: TranslationState = {
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

      const stats = getStateStats(state);

      expect(stats.totalKeys).toBe(1);
      expect(stats.totalTexts).toBe(1);
      expect(stats.languageCounts).toEqual({
        'en-US': 1,
      });
    });

    it('should handle mixed string and pluralized translations', () => {
      const state: TranslationState = {
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

      const stats = getStateStats(state);

      expect(stats.totalKeys).toBe(1);
      expect(stats.totalTexts).toBe(2);
      expect(stats.languageCounts).toEqual({
        'en-US': 1,
        'pt-BR': 1,
      });
    });
  });

  describe('cleanupState', () => {
    it('should not remove any entries when all are valid', () => {
      const state: TranslationState = {
        'key1': { hash: 'abc', texts: { 'en': 'test1' } },
        'key2': { hash: 'def', texts: { 'en': 'test2' } },
      };

      const validKeys = new Set(['key1', 'key2']);
      const removed = cleanupState(state, validKeys);

      expect(removed).toBe(0);
      expect(Object.keys(state)).toHaveLength(2);
    });

    it('should remove orphaned entries', () => {
      const state: TranslationState = {
        'key1': { hash: 'abc', texts: { 'en': 'test1' } },
        'key2': { hash: 'def', texts: { 'en': 'test2' } },
        'key3': { hash: 'ghi', texts: { 'en': 'test3' } },
      };

      const validKeys = new Set(['key1', 'key3']);
      const removed = cleanupState(state, validKeys);

      expect(removed).toBe(1);
      expect(Object.keys(state)).toHaveLength(2);
      expect(state).toHaveProperty('key1');
      expect(state).toHaveProperty('key3');
      expect(state).not.toHaveProperty('key2');
    });

    it('should remove all entries when validKeys is empty', () => {
      const state: TranslationState = {
        'key1': { hash: 'abc', texts: { 'en': 'test1' } },
        'key2': { hash: 'def', texts: { 'en': 'test2' } },
      };

      const validKeys = new Set<string>();
      const removed = cleanupState(state, validKeys);

      expect(removed).toBe(2);
      expect(Object.keys(state)).toHaveLength(0);
    });

    it('should return 0 for empty state', () => {
      const state: TranslationState = {};
      const validKeys = new Set(['key1']);
      const removed = cleanupState(state, validKeys);

      expect(removed).toBe(0);
    });

    it('should mutate state in place', () => {
      const state: TranslationState = {
        'key1': { hash: 'abc', texts: { 'en': 'test1' } },
        'key2': { hash: 'def', texts: { 'en': 'test2' } },
      };

      const originalReference = state;
      const validKeys = new Set(['key1']);

      cleanupState(state, validKeys);

      // Should be same reference (mutated in place)
      expect(state).toBe(originalReference);
      expect(Object.keys(state)).toHaveLength(1);
    });
  });

  describe('integration tests', () => {
    it('should handle full lifecycle: save -> load -> modify -> save -> load', () => {
      // Initial state
      const initialState: TranslationState = {
        'key1': { hash: 'abc', texts: { 'en': 'test1' } },
        'key2': { hash: 'def', texts: { 'en': 'test2' } },
      };

      // Save
      saveState(initialState, TEST_STATE_PATH);

      // Load
      const loadedState = loadState(TEST_STATE_PATH);
      expect(loadedState).toEqual(initialState);

      // Modify
      loadedState['key3'] = { hash: 'ghi', texts: { 'en': 'test3' } };
      delete loadedState['key1'];

      // Save again
      saveState(loadedState, TEST_STATE_PATH);

      // Load again
      const finalState = loadState(TEST_STATE_PATH);

      expect(Object.keys(finalState)).toHaveLength(2);
      expect(finalState).toHaveProperty('key2');
      expect(finalState).toHaveProperty('key3');
      expect(finalState).not.toHaveProperty('key1');
    });

    it('should handle cleanup workflow', () => {
      const state: TranslationState = {
        'translations::user.name': { hash: 'abc', texts: { 'en': 'Name' } },
        'translations::user.email': { hash: 'def', texts: { 'en': 'Email' } },
        'translations::user.phone': { hash: 'ghi', texts: { 'en': 'Phone' } },
      };

      saveState(state, TEST_STATE_PATH);

      const loadedState = loadState(TEST_STATE_PATH);

      // Simulate schema change - only name and email are valid now
      const validKeys = new Set([
        'translations::user.name',
        'translations::user.email',
      ]);

      const removed = cleanupState(loadedState, validKeys);

      expect(removed).toBe(1);

      saveState(loadedState, TEST_STATE_PATH);

      const finalState = loadState(TEST_STATE_PATH);
      expect(Object.keys(finalState)).toHaveLength(2);
    });
  });
});
