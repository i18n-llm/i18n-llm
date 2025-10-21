import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

// Create require function for CommonJS compatibility in ES modules
const require = createRequire(import.meta.url);

const DEFAULT_CONFIG_FILENAME = 'i18n-llm.config.js';
const DEFAULT_STATE_PATH = '.i18n-llm-state.json';
const DEFAULT_PROVIDER = 'openai';
const DEFAULT_MODEL = 'gpt-4.1-mini';

export interface ProviderConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseURL?: string;
  [key: string]: unknown;
}

export interface I18nLLMConfig {
  schemaFiles: string[];
  outputDir: string;
  sourceLanguage: string;
  statePath: string;
  historyPath?: string;
  persona?: Record<string, unknown>;
  glossary?: Record<string, string>;
  providerConfig: ProviderConfig;
}

export class ConfigNotFoundError extends Error {
  constructor(public readonly configPath: string) {
    super(`Configuration file not found: ${configPath}`);
    this.name = 'ConfigNotFoundError';
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string, public readonly configPath?: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigLoadError extends Error {
  constructor(message: string, public readonly configPath: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

function validateConfigStructure(config: unknown, configPath: string): config is Partial<I18nLLMConfig> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new ConfigValidationError('Config must be a valid object', configPath);
  }

  const cfg = config as Record<string, unknown>;

  // Support both 'schemaFiles' and 'schemaPaths' for backward compatibility
  const schemaFiles = cfg.schemaFiles || cfg.schemaPaths;

  if (!schemaFiles || !Array.isArray(schemaFiles)) {
    throw new ConfigValidationError(
      'Config must have "schemaFiles" or "schemaPaths" as an array',
      configPath
    );
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

    const providerCfg = cfg.providerConfig as Record<string, unknown>;

    if (providerCfg.provider !== undefined && typeof providerCfg.provider !== 'string') {
      throw new ConfigValidationError('Config "providerConfig.provider" must be a string', configPath);
    }

    if (providerCfg.model !== undefined && typeof providerCfg.model !== 'string') {
      throw new ConfigValidationError('Config "providerConfig.model" must be a string', configPath);
    }
  }

  return true;
}

function loadConfigFile(filePath: string): unknown {
  // Clear require cache to allow config reloading
  delete require.cache[require.resolve(filePath)];
  
  const loaded = require(filePath);
  
  // Handle ES module default export
  if (loaded && typeof loaded === 'object' && '__esModule' in loaded && 'default' in loaded) {
    return loaded.default;
  }
  
  return loaded;
}

function normalizeConfig(config: Record<string, unknown>): I18nLLMConfig {
  // Support both 'schemaFiles' and 'schemaPaths' for backward compatibility
  const schemaFiles = (config.schemaFiles || config.schemaPaths) as string[];

  return {
    schemaFiles,
    outputDir: config.outputDir as string,
    sourceLanguage: config.sourceLanguage as string,
    statePath: (config.statePath as string) || DEFAULT_STATE_PATH,
    historyPath: config.historyPath as string | undefined,
    persona: config.persona as Record<string, unknown> | undefined,
    glossary: config.glossary as Record<string, string> | undefined,
    providerConfig: (config.providerConfig as ProviderConfig) || {
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
export function loadConfig(configPath: string = DEFAULT_CONFIG_FILENAME): I18nLLMConfig {
  const resolvedPath = path.resolve(process.cwd(), configPath);

  try {
    const loaded = loadConfigFile(resolvedPath);
    validateConfigStructure(loaded, configPath);
    return normalizeConfig(loaded as Record<string, unknown>);
  } catch (error) {
    const errCode = (error as NodeJS.ErrnoException).code;
    
    // Check for file not found errors
    if (errCode === 'MODULE_NOT_FOUND' || errCode === 'ENOENT') {
      throw new ConfigNotFoundError(resolvedPath);
    }

    if (error instanceof ConfigValidationError) {
      throw error;
    }

    throw new ConfigLoadError(
      `Failed to load config: ${error instanceof Error ? error.message : String(error)}`,
      configPath,
      error instanceof Error ? error : undefined
    );
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
export function configExists(configPath: string = DEFAULT_CONFIG_FILENAME): boolean {
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
export function getDefaultConfig(configPath: string = DEFAULT_CONFIG_FILENAME): {
  schemaCount: number;
  outputDir: string;
  sourceLanguage: string;
  hasPersona: boolean;
  hasGlossary: boolean;
  provider: string;
  model: string;
} {
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
export function validateConfig(config: unknown): I18nLLMConfig {
  validateConfigStructure(config, '<programmatic>');
  return normalizeConfig(config as Record<string, unknown>);
}

