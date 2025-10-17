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
const config_loader_1 = require("./config-loader");
const TEST_CONFIG_PATH = 'test-config.js';
const TEST_CONFIG_RESOLVED = path.resolve(process.cwd(), TEST_CONFIG_PATH);
(0, vitest_1.describe)('config-loader', () => {
    (0, vitest_1.beforeEach)(() => {
        if (fs.existsSync(TEST_CONFIG_RESOLVED)) {
            fs.unlinkSync(TEST_CONFIG_RESOLVED);
        }
        // Clear require cache
        delete require.cache[TEST_CONFIG_RESOLVED];
    });
    (0, vitest_1.afterEach)(() => {
        if (fs.existsSync(TEST_CONFIG_RESOLVED)) {
            fs.unlinkSync(TEST_CONFIG_RESOLVED);
        }
        delete require.cache[TEST_CONFIG_RESOLVED];
    });
    (0, vitest_1.describe)('loadConfig', () => {
        (0, vitest_1.it)('should load valid config file', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            const config = (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(config.schemaFiles).toEqual(['./schema.json']);
            (0, vitest_1.expect)(config.outputDir).toBe('./locales');
            (0, vitest_1.expect)(config.sourceLanguage).toBe('en-US');
        });
        (0, vitest_1.it)('should throw ConfigNotFoundError when file does not exist', () => {
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(config_loader_1.ConfigNotFoundError);
        });
        (0, vitest_1.it)('should support schemaPaths for backward compatibility', () => {
            const mockConfig = `
        module.exports = {
          schemaPaths: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            const config = (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(config.schemaFiles).toEqual(['./schema.json']);
        });
        (0, vitest_1.it)('should set default values', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            const config = (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(config.statePath).toBe('.i18n-llm-state.json');
            (0, vitest_1.expect)(config.providerConfig).toEqual({
                provider: 'openai',
                model: 'gpt-4.1-mini',
            });
        });
        (0, vitest_1.it)('should override defaults when provided', () => {
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
            const config = (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(config.statePath).toBe('./custom-state.json');
            (0, vitest_1.expect)(config.providerConfig.provider).toBe('anthropic');
            (0, vitest_1.expect)(config.providerConfig.model).toBe('claude-3');
        });
        (0, vitest_1.it)('should throw ConfigValidationError when schemaFiles is missing', () => {
            const mockConfig = `
        module.exports = {
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(config_loader_1.ConfigValidationError);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(/schemaFiles.*schemaPaths/);
        });
        (0, vitest_1.it)('should throw ConfigValidationError when schemaFiles is not an array', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: './schema.json',
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(config_loader_1.ConfigValidationError);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(/array/);
        });
        (0, vitest_1.it)('should throw ConfigValidationError when schemaFiles is empty', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: [],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            try {
                (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
                vitest_1.expect.fail('Should have thrown');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(config_loader_1.ConfigValidationError);
                (0, vitest_1.expect)(error.message).toMatch(/at least one schema file/);
            }
        });
        (0, vitest_1.it)('should throw ConfigValidationError when outputDir is missing', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(config_loader_1.ConfigValidationError);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(/outputDir/);
        });
        (0, vitest_1.it)('should throw ConfigValidationError when sourceLanguage is missing', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(config_loader_1.ConfigValidationError);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(/sourceLanguage/);
        });
        (0, vitest_1.it)('should accept optional persona', () => {
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
            const config = (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(config.persona).toEqual({
                role: 'Pirate Captain',
                tone: ['Friendly'],
            });
        });
        (0, vitest_1.it)('should accept optional glossary', () => {
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
            const config = (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(config.glossary).toEqual({
                API: 'API',
                CLI: 'CLI',
            });
        });
        (0, vitest_1.it)('should throw ConfigValidationError when persona is an array', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US',
          persona: []
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(config_loader_1.ConfigValidationError);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(/persona.*object/);
        });
        (0, vitest_1.it)('should throw ConfigValidationError when config is an array', () => {
            const mockConfig = `
        module.exports = [];
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            try {
                (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
                vitest_1.expect.fail('Should have thrown');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(config_loader_1.ConfigValidationError);
                (0, vitest_1.expect)(error.message).toMatch(/valid object/);
            }
        });
        (0, vitest_1.it)('should throw ConfigLoadError for syntax errors in config', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json',
          // Missing closing bracket - syntax error
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            (0, vitest_1.expect)(() => (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH)).toThrow(config_loader_1.ConfigLoadError);
        });
    });
    (0, vitest_1.describe)('configExists', () => {
        (0, vitest_1.it)('should return true when config file exists', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            (0, vitest_1.expect)((0, config_loader_1.configExists)(TEST_CONFIG_PATH)).toBe(true);
        });
        (0, vitest_1.it)('should return false when config file does not exist', () => {
            (0, vitest_1.expect)((0, config_loader_1.configExists)(TEST_CONFIG_PATH)).toBe(false);
        });
    });
    (0, vitest_1.describe)('getConfigInfo', () => {
        (0, vitest_1.it)('should return config information', () => {
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
            const info = (0, config_loader_1.getConfigInfo)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(info).toEqual({
                schemaCount: 2,
                outputDir: './locales',
                sourceLanguage: 'en-US',
                hasPersona: true,
                hasGlossary: true,
                provider: 'openai',
                model: 'gpt-4',
            });
        });
        (0, vitest_1.it)('should indicate when persona and glossary are missing', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            const info = (0, config_loader_1.getConfigInfo)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(info.hasPersona).toBe(false);
            (0, vitest_1.expect)(info.hasGlossary).toBe(false);
        });
        (0, vitest_1.it)('should throw ConfigNotFoundError when file does not exist', () => {
            (0, vitest_1.expect)(() => (0, config_loader_1.getConfigInfo)(TEST_CONFIG_PATH)).toThrow(config_loader_1.ConfigNotFoundError);
        });
    });
    (0, vitest_1.describe)('validateConfig', () => {
        (0, vitest_1.it)('should validate and normalize valid config object', () => {
            const configObj = {
                schemaFiles: ['./schema.json'],
                outputDir: './locales',
                sourceLanguage: 'en-US',
            };
            const validated = (0, config_loader_1.validateConfig)(configObj);
            (0, vitest_1.expect)(validated.schemaFiles).toEqual(['./schema.json']);
            (0, vitest_1.expect)(validated.outputDir).toBe('./locales');
            (0, vitest_1.expect)(validated.sourceLanguage).toBe('en-US');
            (0, vitest_1.expect)(validated.statePath).toBe('.i18n-llm-state.json');
        });
        (0, vitest_1.it)('should throw ConfigValidationError for invalid config object', () => {
            const invalidConfig = {
                schemaFiles: './schema.json', // Should be array
                outputDir: './locales',
                sourceLanguage: 'en-US',
            };
            (0, vitest_1.expect)(() => (0, config_loader_1.validateConfig)(invalidConfig)).toThrow(config_loader_1.ConfigValidationError);
        });
        (0, vitest_1.it)('should support schemaPaths in programmatic config', () => {
            const configObj = {
                schemaPaths: ['./schema.json'],
                outputDir: './locales',
                sourceLanguage: 'en-US',
            };
            const validated = (0, config_loader_1.validateConfig)(configObj);
            (0, vitest_1.expect)(validated.schemaFiles).toEqual(['./schema.json']);
        });
    });
    (0, vitest_1.describe)('error handling', () => {
        (0, vitest_1.it)('should include config path in ConfigNotFoundError', () => {
            try {
                (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
                vitest_1.expect.fail('Should have thrown');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(config_loader_1.ConfigNotFoundError);
                (0, vitest_1.expect)(error.configPath).toContain(TEST_CONFIG_PATH);
            }
        });
        (0, vitest_1.it)('should include config path in ConfigValidationError', () => {
            const mockConfig = `
        module.exports = {
          schemaFiles: ['./schema.json'],
          // Missing required fields
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig);
            try {
                (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
                vitest_1.expect.fail('Should have thrown');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(config_loader_1.ConfigValidationError);
                (0, vitest_1.expect)(error.configPath).toBe(TEST_CONFIG_PATH);
            }
        });
    });
    (0, vitest_1.describe)('config reloading', () => {
        (0, vitest_1.it)('should reload config when file changes', () => {
            const mockConfig1 = `
        module.exports = {
          schemaFiles: ['./schema1.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig1);
            const config1 = (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(config1.schemaFiles).toEqual(['./schema1.json']);
            // Modify config
            const mockConfig2 = `
        module.exports = {
          schemaFiles: ['./schema2.json'],
          outputDir: './locales',
          sourceLanguage: 'en-US'
        };
      `;
            fs.writeFileSync(TEST_CONFIG_RESOLVED, mockConfig2);
            const config2 = (0, config_loader_1.loadConfig)(TEST_CONFIG_PATH);
            (0, vitest_1.expect)(config2.schemaFiles).toEqual(['./schema2.json']);
        });
    });
});
