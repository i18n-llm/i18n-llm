import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadConfig,
  configExists,
  getDefaultConfig,
  validateConfig,
  ConfigNotFoundError,
  ConfigValidationError,
  ConfigLoadError,
  I18nLLMConfig,
} from './config-loader.js';

const TEST_CONFIG_PATH = 'test-config.cjs';
const TEST_CONFIG_RESOLVED = path.resolve(process.cwd(), TEST_CONFIG_PATH);

describe('config-loader', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_CONFIG_RESOLVED)) {
      fs.unlinkSync(TEST_CONFIG_RESOLVED);
    }
    // Clear require cache
    delete require.cache[TEST_CONFIG_RESOLVED];
  });

  afterEach(() => {
    if (fs.existsSync(TEST_CONFIG_RESOLVED)) {
      fs.unlinkSync(TEST_CONFIG_RESOLVED);
    }
    delete require.cache[TEST_CONFIG_RESOLVED];
  });

  describe('loadConfig', () => {
    it('should load valid config file', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      const config = loadConfig(TEST_CONFIG_PATH);

      expect(config.schemaFiles).toEqual(['./schema.json']);
      expect(config.outputDir).toBe('./locales');
      expect(config.sourceLanguage).toBe('en-US');
    });

    it('should throw ConfigNotFoundError when file does not exist', () => {
      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(ConfigNotFoundError);
    });

    it('should support schemaPaths for backward compatibility', () => {
      const mockConfig = `
        module.exports = {
          schemaPaths: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      const config = loadConfig(TEST_CONFIG_PATH);

      expect(config.schemaFiles).toEqual(['./schema.json']);
    });

    it('should set default values', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      const config = loadConfig(TEST_CONFIG_PATH);

      expect(config.statePath).toBe('.i18n-llm-state.json');
      expect(config.providerConfig).toEqual({
        provider: 'openai',
        model: 'gpt-4.1-mini',
      });
    });

    it('should override defaults when provided', () => {
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

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      const config = loadConfig(TEST_CONFIG_PATH);

      expect(config.statePath).toBe('./custom-state.json');
      expect(config.providerConfig.provider).toBe('anthropic');
      expect(config.providerConfig.model).toBe('claude-3');
    });

    it('should throw ConfigValidationError when schemaFiles is missing', () => {
      const mockConfig = `
        module.exports = {
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(ConfigValidationError);
      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(/schemaFiles.*schemaPaths/);
    });

    it('should throw ConfigValidationError when schemaFiles is not an array', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: './schema.json',
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(ConfigValidationError);
      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(/array/);
    });

    it('should throw ConfigValidationError when schemaFiles is empty', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: [],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as Error).message).toMatch(/at least one schema file/);
      }
    });

    it('should throw ConfigValidationError when outputDir is missing', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(ConfigValidationError);
      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(/outputDir/);
    });

    it('should throw ConfigValidationError when sourceLanguage is missing', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(ConfigValidationError);
      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(/sourceLanguage/);
    });

    it('should accept optional persona', () => {
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

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      const config = loadConfig(TEST_CONFIG_PATH);

      expect(config.persona).toEqual({
        role: 'Pirate Captain',
        tone: ['Friendly'],
      });
    });

    it('should accept optional glossary', () => {
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

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      const config = loadConfig(TEST_CONFIG_PATH);

      expect(config.glossary).toEqual({
        API: 'API',
        CLI: 'CLI',
      });
    });

    it('should throw ConfigValidationError when persona is an array', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US',
          persona: []
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(ConfigValidationError);
      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(/persona.*object/);
    });

    it('should throw ConfigValidationError when config is an array', () => {
      const mockConfig = `
        module.exports = [];
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as Error).message).toMatch(/valid object/);
      }
    });

    it('should throw ConfigLoadError for syntax errors in config', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json',
          // Missing closing bracket - syntax error
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      expect(() => loadConfig(TEST_CONFIG_PATH)).toThrow(ConfigLoadError);
    });
  });

  describe('configExists', () => {
    it('should return true when config file exists', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      expect(configExists(TEST_CONFIG_PATH)).toBe(true);
    });

    it('should return false when config file does not exist', () => {
      expect(configExists(TEST_CONFIG_PATH)).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return config information', () => {
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

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      const info = getDefaultConfig(TEST_CONFIG_PATH);

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

    it('should indicate when persona and glossary are missing', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      const info = getDefaultConfig(TEST_CONFIG_PATH);

      expect(info.hasPersona).toBe(false);
      expect(info.hasGlossary).toBe(false);
    });

    it('should throw ConfigNotFoundError when file does not exist', () => {
      expect(() => getDefaultConfig(TEST_CONFIG_PATH)).toThrow(ConfigNotFoundError);
    });
  });

  describe('validateConfig', () => {
    it('should validate and normalize valid config object', () => {
      const configObj = {
        schemaFiles: ['./schema.json'],
        outputDir: './locales',
        sourceLanguage: 'en-US',
      };

      const validated = validateConfig(configObj);

      expect(validated.schemaFiles).toEqual(['./schema.json']);
      expect(validated.outputDir).toBe('./locales');
      expect(validated.sourceLanguage).toBe('en-US');
      expect(validated.statePath).toBe('.i18n-llm-state.json');
    });

    it('should throw ConfigValidationError for invalid config object', () => {
      const invalidConfig = {
        schemaFiles: './schema.json', // Should be array
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

      const validated = validateConfig(configObj);

      expect(validated.schemaFiles).toEqual(['./schema.json']);
    });
  });

  describe('error handling', () => {
    it('should include config path in ConfigNotFoundError', () => {
      try {
        loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigNotFoundError);
        expect((error as ConfigNotFoundError).configPath).toContain(TEST_CONFIG_PATH);
      }
    });

    it('should include config path in ConfigValidationError', () => {
      const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          // Missing required fields
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);

      try {
        loadConfig(TEST_CONFIG_PATH);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).configPath).toBe(TEST_CONFIG_PATH);
      }
    });
  });

  describe('config reloading', () => {
    it('should reload config when file changes', () => {
      // Note: ES module imports are cached differently than CommonJS require()
      // Dynamic import() caching makes it difficult to test config reloading
      // In practice, users restart the process when config changes
      const mockConfig1 = `
        module.exports = {
          schemaFiles: ['./schema1.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig1);
      const config1 = loadConfig(TEST_CONFIG_PATH);
      expect(config1.schemaFiles).toEqual(['./schema1.json']);

      // Modify config
      const mockConfig2 = `
        module.exports = {
          schemaFiles: ['./schema2.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;

      fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig2);
      const config2 = loadConfig(TEST_CONFIG_PATH);
      expect(config2.schemaFiles).toEqual(['./schema2.json']);
    });
  });
});
