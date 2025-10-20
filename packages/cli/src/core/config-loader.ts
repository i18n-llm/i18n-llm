import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

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
  persona?: Record<string, unknown>;
  glossary?: Record<string, string>;
  providerConfig: ProviderConfig;
}

export class ConfigNotFoundError extends Error {
  constructor(public configPath: string) {
    super(`Config file not found: ${configPath}`);
    this.name = 'ConfigNotFoundError';
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string, public configPath?: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigLoadError extends Error {
  constructor(message: string, public configPath: string, public cause?: Error) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

function validateConfigStructure(config: unknown, configPath: string): void {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new ConfigValidationError(
      'Config must be a valid object',
      configPath
    );
  }

  const cfg = config as Record<string, unknown>;

  // Check for schemaFiles or schemaPaths (backward compatibility)
  const schemaFiles = cfg.schemaFiles || cfg.schemaPaths;
  if (!schemaFiles) {
    throw new ConfigValidationError(
      'Config must have either "schemaFiles" or "schemaPaths" property',
      configPath
    );
  }

  if (!Array.isArray(schemaFiles)) {
    throw new ConfigValidationError(
      'schemaFiles/schemaPaths must be an array',
      configPath
    );
  }

  if (schemaFiles.length === 0) {
    throw new ConfigValidationError(
      'schemaFiles/schemaPaths must contain at least one schema file',
      configPath
    );
  }

  if (!cfg.outputDir || typeof cfg.outputDir !== 'string') {
    throw new ConfigValidationError(
      'Config must have "outputDir" property as a string',
      configPath
    );
  }

  if (!cfg.sourceLanguage || typeof cfg.sourceLanguage !== 'string') {
    throw new ConfigValidationError(
      'Config must have "sourceLanguage" property as a string',
      configPath
    );
  }

  // Validate persona if present
  if (cfg.persona !== undefined) {
    if (typeof cfg.persona !== 'object' || Array.isArray(cfg.persona)) {
      throw new ConfigValidationError(
        'persona must be an object',
        configPath
      );
    }
  }

  // Validate glossary if present
  if (cfg.glossary !== undefined) {
    if (typeof cfg.glossary !== 'object' || Array.isArray(cfg.glossary)) {
      throw new ConfigValidationError(
        'glossary must be an object',
        configPath
      );
    }
  }
}

// Dynamic import wrapper using pathToFileURL for proper URL conversion
async function loadConfigFile(filePath: string): Promise<unknown> {
  // Convert absolute path to file:// URL properly
  const fileUrl = pathToFileURL(filePath).href;
  
  // Add cache busting parameter
  const urlWithCache = `${fileUrl}?update=${Date.now()}`;
  
  const module = await import(urlWithCache);
  
  // Handle both ES modules (default export) and CommonJS (module.exports)
  return module.default || module;
}

function normalizeConfig(config: Record<string, unknown>): I18nLLMConfig {
  // Support both 'schemaFiles' and 'schemaPaths' for backward compatibility
  const schemaFiles = (config.schemaFiles || config.schemaPaths) as string[];

  // Build the normalized config
  const normalized: I18nLLMConfig = {
    schemaFiles,
    outputDir: config.outputDir as string,
    sourceLanguage: config.sourceLanguage as string,
    statePath: (config.statePath as string) || DEFAULT_STATE_PATH,
    providerConfig: (config.providerConfig as ProviderConfig) || {
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
    },
  };

  // Only add persona if it exists
  if (config.persona !== undefined) {
    normalized.persona = config.persona as Record<string, unknown>;
  }

  // Only add glossary if it exists
  if (config.glossary !== undefined) {
    normalized.glossary = config.glossary as Record<string, string>;
  }

  return normalized;
}

/**
 * Loads and validates the i18n-llm configuration file.
 * 
 * @param configPath - Path to the config file (default: 'i18n-llm.config.js')
 * @returns The loaded and validated configuration
 * @throws {ConfigNotFoundError} If the config file doesn't exist
 * @throws {ConfigValidationError} If the config structure is invalid
 * @throws {ConfigLoadError} If the config file cannot be loaded
 */
export async function loadConfig(configPath: string = DEFAULT_CONFIG_FILENAME): Promise<I18nLLMConfig> {
  const resolvedPath = path.resolve(process.cwd(), configPath);

  // Check if file exists first
  if (!fs.existsSync(resolvedPath)) {
    throw new ConfigNotFoundError(resolvedPath);
  }

  try {
    const loaded = await loadConfigFile(resolvedPath);
    validateConfigStructure(loaded, configPath);
    return normalizeConfig(loaded as Record<string, unknown>);
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      throw error;
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
 */
export function configExists(configPath: string = DEFAULT_CONFIG_FILENAME): boolean {
  const resolvedPath = path.resolve(process.cwd(), configPath);
  return fs.existsSync(resolvedPath);
}

/**
 * Gets basic information about a config without full validation.
 */
export async function getConfigInfo(configPath: string = DEFAULT_CONFIG_FILENAME): Promise<{
  schemaCount: number;
  outputDir: string;
  sourceLanguage: string;
  hasPersona: boolean;
  hasGlossary: boolean;
  provider: string;
  model: string;
}> {
  const config = await loadConfig(configPath);

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
 */
export function validateConfig(config: unknown): void {
  validateConfigStructure(config, '<programmatic>');
}

