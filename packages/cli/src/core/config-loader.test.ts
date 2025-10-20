import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadConfig,
  configExists,
  getConfigInfo,
  validateConfig,
  ConfigNotFoundError,
  ConfigValidationError,
  ConfigLoadError,
  I18nLLMConfig,
} from './config-loader.js';

// Helper to ensure file is written and flushed
async function writeConfigAndWait(path: string, content: string) {
  fs.writeFileSync(path, content);
  await new Promise(resolve => setTimeout(resolve, 10));
}

const TEST_CONFIG_PATH = 'test-config.cjs';
const TEST_CONFIG_RESOLVED = path.resolve(process.cwd(), TEST_CONFIG_PATH);

describe('config-loader', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_CONFIG_RESOLVED)) {
      fs.unlinkSync(TEST_CONFIG_RESOLVED);
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_CONFIG_RESOLVED)) {
      fs.unlinkSync(TEST_CONFIG_RESOLVED);
    }
  });

  describe('loadConfig', () => {
    it('should load valid config file', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      const config = await loadConfig(TEST_CONFIG_PATH);

      expect(config.schemaFiles).toEqual(['./schema.json']);
      expect(config.outputDir).toBe('./locales');
      expect(config.sourceLanguage).toBe('en-US');
    });

    it('should throw ConfigNotFoundError when file does not exist', async () => {
      try {
        await loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown ConfigNotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigNotFoundError);
      }
    });

    it('should support schemaPaths for backward compatibility', async () => {
      const mockConfig = `
        module.exports = {
          schemaPaths: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      const config = await loadConfig(TEST_CONFIG_PATH);

      expect(config.schemaFiles).toEqual(['./schema.json']);
    });

    it('should set default values', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      const config = await loadConfig(TEST_CONFIG_PATH);

      expect(config.statePath).toBe('.i18n-llm-state.json');
      expect(config.providerConfig).toEqual({
        provider: 'openai',
        model: 'gpt-4.1-mini',
      });
    });

    it('should override defaults when provided', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US',
          statePath: './custom-state.json',
          providerConfig: {
            provider: 'anthropic',
            model: 'claude-3'
          }
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      const config = await loadConfig(TEST_CONFIG_PATH);

      expect(config.statePath).toBe('./custom-state.json');
      expect(config.providerConfig.provider).toBe('anthropic');
      expect(config.providerConfig.model).toBe('claude-3');
    });

    it('should throw ConfigValidationError when schemaFiles is missing', async () => {
      const mockConfig = `
        module.exports = {
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        await loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown ConfigValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as Error).message).toMatch(/schemaFiles.*schemaPaths/);
      }
    });

    it('should throw ConfigValidationError when schemaFiles is not an array', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: './schema.json',
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        await loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown ConfigValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as Error).message).toMatch(/array/);
      }
    });

    it('should throw ConfigValidationError when schemaFiles is empty', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: [],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        await loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        // FIX: Match the actual error message
        expect((error as Error).message).toMatch(/at least one schema file/);
      }
    });

    it('should throw ConfigValidationError when outputDir is missing', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        await loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown ConfigValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as Error).message).toMatch(/outputDir/);
      }
    });

    it('should throw ConfigValidationError when sourceLanguage is missing', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        await loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown ConfigValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as Error).message).toMatch(/sourceLanguage/);
      }
    });

    it('should accept optional persona', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US',
          persona: {
            role: 'Pirate Captain',
            tone: ['Friendly']
          }
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      const config = await loadConfig(TEST_CONFIG_PATH);

      expect(config.persona).toEqual({
        role: 'Pirate Captain',
        tone: ['Friendly'],
      });
    });

    it('should accept optional glossary', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US',
          glossary: {
            API: 'API',
            CLI: 'CLI'
          }
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      const config = await loadConfig(TEST_CONFIG_PATH);

      expect(config.glossary).toEqual({
        API: 'API',
        CLI: 'CLI',
      });
    });

    it('should throw ConfigValidationError when persona is an array', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US',
          persona: []
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        await loadConfig(TEST_CONFIG_PATH);
        throw new Error('Should have thrown ConfigValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as Error).message).toMatch(/persona.*object/);
      }
    });

    it('should throw ConfigValidationError when config is an array', async () => {
      const mockConfig = `
        module.exports = [];
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        await loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
      }
    });

    it('should throw ConfigLoadError for syntax errors in config', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json',
          // Missing closing bracket - syntax error
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        await loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown ConfigLoadError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigLoadError);
      }
    });
  });

  describe('configExists', () => {
    it('should return true when config file exists', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      expect(configExists(TEST_CONFIG_PATH)).toBe(true);
    });

    it('should return false when config file does not exist', () => {
      expect(configExists(TEST_CONFIG_PATH)).toBe(false);
    });
  });

  describe('getConfigInfo', () => {
    it('should return config information', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema1.json', './schema2.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US',
          persona: { role: 'Pirate' },
          glossary: { API: 'API' },
          providerConfig: {
            provider: 'openai',
            model: 'gpt-4'
          }
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      const info = await getConfigInfo(TEST_CONFIG_PATH);

      expect(info).toEqual({
        schemaCount: 2,
        outputDir: './locales',
        sourceLanguage: 'en-US',
        hasPersona: true,
        hasGlossary: true,
        provider: 'openai',
        model: 'gpt-4',
      });
    });

    it('should indicate when persona and glossary are missing', async () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      await writeConfigAndWait(TEST_CONFIG_RESOLVED, mockConfig);

      const info = await getConfigInfo(TEST_CONFIG_PATH);

      expect(info.hasPersona).toBe(false);
      expect(info.hasGlossary).toBe(false);
    });

    it('should throw ConfigNotFoundError when file does not exist', async () => {
      try {
        await getConfigInfo(TEST_CONFIG_PATH);
        expect.fail('Should have thrown ConfigNotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigNotFoundError);
      }
    });
  });

  describe('validateConfig', () => {
    it('should validate a valid config object', () => {
      const validConfig = {
        schemaFiles: ['./schema.json'],
        outputDir: './locales',
        sourceLanguage: 'en-US',
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('should throw ConfigValidationError for invalid config', () => {
      const invalidConfig = {
        schemaFiles: './schema.json',  // Not an array - should fail
        outputDir: './locales',
        sourceLanguage: 'en-US',
      };

      expect(() => validateConfig(invalidConfig)).toThrow(ConfigValidationError);
    });

    it('should support schemaPaths in programmatic config', () => {
      const configObj = {
        schemaPaths: ['./schema.json'],
        outputDir: './locales',
        sourceLanguage: 'en-US',
      };

      expect(() => validateConfig(configObj)).not.toThrow();
    });
  });
});
