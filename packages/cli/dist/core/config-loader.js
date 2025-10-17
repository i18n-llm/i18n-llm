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
exports.ConfigLoadError = exports.ConfigValidationError = exports.ConfigNotFoundError = void 0;
exports.loadConfig = loadConfig;
exports.configExists = configExists;
exports.getConfigInfo = getConfigInfo;
exports.validateConfig = validateConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_CONFIG_FILENAME = 'i18n-llm.config.js';
const DEFAULT_STATE_PATH = '.i18n-llm-state.json';
const DEFAULT_PROVIDER = 'openai';
const DEFAULT_MODEL = 'gpt-4.1-mini';
class ConfigNotFoundError extends Error {
    constructor(configPath) {
        super(`Configuration file not found: ${configPath}`);
        this.configPath = configPath;
        this.name = 'ConfigNotFoundError';
    }
}
exports.ConfigNotFoundError = ConfigNotFoundError;
class ConfigValidationError extends Error {
    constructor(message, configPath) {
        super(message);
        this.configPath = configPath;
        this.name = 'ConfigValidationError';
    }
}
exports.ConfigValidationError = ConfigValidationError;
class ConfigLoadError extends Error {
    constructor(message, configPath, cause) {
        super(message);
        this.configPath = configPath;
        this.cause = cause;
        this.name = 'ConfigLoadError';
    }
}
exports.ConfigLoadError = ConfigLoadError;
function validateConfigStructure(config, configPath) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        throw new ConfigValidationError('Config must be a valid object', configPath);
    }
    const cfg = config;
    // Support both 'schemaFiles' and 'schemaPaths' for backward compatibility
    const schemaFiles = cfg.schemaFiles || cfg.schemaPaths;
    if (!schemaFiles || !Array.isArray(schemaFiles)) {
        throw new ConfigValidationError('Config must have "schemaFiles" or "schemaPaths" as an array', configPath);
    }
    if (schemaFiles.length === 0) {
        throw new ConfigValidationError('Config must have at least one schema file', configPath);
    }
    if (!schemaFiles.every((file) => typeof file === 'string')) {
        throw new ConfigValidationError('All schema files must be strings', configPath);
    }
    if (!cfg.outputDir || typeof cfg.outputDir !== 'string') {
        throw new ConfigValidationError('Config must have "outputDir" as a string', configPath);
    }
    if (!cfg.sourceLanguage || typeof cfg.sourceLanguage !== 'string') {
        throw new ConfigValidationError('Config must have "sourceLanguage" as a string', configPath);
    }
    if (cfg.statePath !== undefined && typeof cfg.statePath !== 'string') {
        throw new ConfigValidationError('Config "statePath" must be a string if provided', configPath);
    }
    if (cfg.persona !== undefined && (typeof cfg.persona !== 'object' || Array.isArray(cfg.persona))) {
        throw new ConfigValidationError('Config "persona" must be an object if provided', configPath);
    }
    if (cfg.glossary !== undefined && (typeof cfg.glossary !== 'object' || Array.isArray(cfg.glossary))) {
        throw new ConfigValidationError('Config "glossary" must be an object if provided', configPath);
    }
    if (cfg.providerConfig !== undefined) {
        if (typeof cfg.providerConfig !== 'object' || Array.isArray(cfg.providerConfig)) {
            throw new ConfigValidationError('Config "providerConfig" must be an object if provided', configPath);
        }
        const providerCfg = cfg.providerConfig;
        if (providerCfg.provider !== undefined && typeof providerCfg.provider !== 'string') {
            throw new ConfigValidationError('Config "providerConfig.provider" must be a string', configPath);
        }
        if (providerCfg.model !== undefined && typeof providerCfg.model !== 'string') {
            throw new ConfigValidationError('Config "providerConfig.model" must be a string', configPath);
        }
    }
    return true;
}
function loadConfigFile(filePath) {
    // Clear require cache to allow config reloading
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
}
function normalizeConfig(config) {
    // Support both 'schemaFiles' and 'schemaPaths' for backward compatibility
    const schemaFiles = (config.schemaFiles || config.schemaPaths);
    return {
        schemaFiles,
        outputDir: config.outputDir,
        sourceLanguage: config.sourceLanguage,
        statePath: config.statePath || DEFAULT_STATE_PATH,
        persona: config.persona,
        glossary: config.glossary,
        providerConfig: config.providerConfig || {
            provider: DEFAULT_PROVIDER,
            model: DEFAULT_MODEL,
        },
    };
}
/**
 * Loads and validates the i18n-llm configuration file.
 *
 * @param configPath - Path to the config file (default: 'i18n-llm.config.js')
 * @returns The loaded and validated configuration
 * @throws {ConfigNotFoundError} If the config file doesn't exist
 * @throws {ConfigValidationError} If the config structure is invalid
 * @throws {ConfigLoadError} If the config file cannot be loaded
 *
 * @example
 * ```typescript
 * try {
 *   const config = loadConfig();
 *   console.log(`Output: ${config.outputDir}`);
 *   console.log(`Schemas: ${config.schemaFiles.join(', ')}`);
 * } catch (error) {
 *   if (error instanceof ConfigNotFoundError) {
 *     console.error('Config file not found');
 *   } else if (error instanceof ConfigValidationError) {
 *     console.error('Invalid config:', error.message);
 *   }
 * }
 * ```
 */
function loadConfig(configPath = DEFAULT_CONFIG_FILENAME) {
    const resolvedPath = path.resolve(process.cwd(), configPath);
    try {
        const loaded = loadConfigFile(resolvedPath);
        validateConfigStructure(loaded, configPath);
        return normalizeConfig(loaded);
    }
    catch (error) {
        const errCode = error.code;
        // Check for file not found errors
        if (errCode === 'MODULE_NOT_FOUND' || errCode === 'ENOENT') {
            throw new ConfigNotFoundError(resolvedPath);
        }
        if (error instanceof ConfigValidationError) {
            throw error;
        }
        throw new ConfigLoadError(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`, configPath, error instanceof Error ? error : undefined);
    }
}
/**
 * Checks if a config file exists without loading it.
 *
 * @param configPath - Path to the config file (default: 'i18n-llm.config.js')
 * @returns true if the file exists, false otherwise
 *
 * @example
 * ```typescript
 * if (configExists()) {
 *   const config = loadConfig();
 * } else {
 *   console.error('Config file not found');
 * }
 * ```
 */
function configExists(configPath = DEFAULT_CONFIG_FILENAME) {
    const resolvedPath = path.resolve(process.cwd(), configPath);
    return fs.existsSync(resolvedPath);
}
/**
 * Gets basic information about a config without full validation.
 * Useful for quick checks or listing configs.
 *
 * @param configPath - Path to the config file
 * @returns Basic config information
 * @throws {ConfigNotFoundError} If the config file doesn't exist
 *
 * @example
 * ```typescript
 * const info = getConfigInfo();
 * console.log(`${info.schemaCount} schemas, output: ${info.outputDir}`);
 * ```
 */
function getConfigInfo(configPath = DEFAULT_CONFIG_FILENAME) {
    const config = loadConfig(configPath);
    return {
        schemaCount: config.schemaFiles.length,
        outputDir: config.outputDir,
        sourceLanguage: config.sourceLanguage,
        hasPersona: config.persona !== undefined,
        hasGlossary: config.glossary !== undefined,
        provider: config.providerConfig.provider,
        model: config.providerConfig.model,
    };
}
/**
 * Validates a config object without loading from file.
 * Useful for testing or programmatic config creation.
 *
 * @param config - The config object to validate
 * @returns The normalized config if valid
 * @throws {ConfigValidationError} If the config structure is invalid
 *
 * @example
 * ```typescript
 * const config = {
 *   schemaFiles: ['./schema.json'],
 *   outputDir: './locales',
 *   sourceLanguage: 'en-US'
 * };
 *
 * const validated = validateConfig(config);
 * ```
 */
function validateConfig(config) {
    validateConfigStructure(config, '<programmatic>');
    return normalizeConfig(config);
}
