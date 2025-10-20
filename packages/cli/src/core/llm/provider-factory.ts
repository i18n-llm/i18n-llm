/**
 * Factory for creating LLM provider instances
 * Implements the Factory Pattern for provider instantiation
 */

import { LLMProvider } from './llm-provider.js';

/**
 * Supported LLM provider types
 */
export type ProviderType = 'openai' | 'gemini' | 'anthropic' | 'ollama';

/**
 * Configuration for OpenAI provider
 */
export interface OpenAIConfig {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  organization?: string;
}

/**
 * Configuration for Gemini provider
 */
export interface GeminiConfig {
  apiKey?: string;
  model?: string;
}

/**
 * Configuration for Anthropic provider
 */
export interface AnthropicConfig {
  apiKey?: string;
  model?: string;
}

/**
 * Configuration for Ollama provider (local)
 */
export interface OllamaConfig {
  baseURL?: string;
  model?: string;
}

/**
 * Union type for all provider configurations
 */
export type ProviderConfig = OpenAIConfig | GeminiConfig | AnthropicConfig | OllamaConfig;

/**
 * Custom error for provider creation failures
 */
export class ProviderCreationError extends Error {
  constructor(
    message: string,
    public readonly providerType: ProviderType,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ProviderCreationError';
  }
}

/**
 * Registry of provider constructors
 * Allows dynamic loading of providers without circular dependencies
 */
type ProviderConstructor = (config: ProviderConfig) => LLMProvider;

const providerRegistry = new Map<ProviderType, ProviderConstructor>();

/**
 * Registers a provider constructor
 * 
 * @param type - Provider type
 * @param constructor - Constructor function
 * 
 * @example
 * ```typescript
 * registerProvider('openai', (config) => new OpenAIProvider(config));
 * ```
 */
export function registerProvider(type: ProviderType, constructor: ProviderConstructor): void {
  providerRegistry.set(type, constructor);
}

/**
 * Creates an LLM provider instance based on type and configuration
 * 
 * @param type - Type of provider to create
 * @param config - Provider-specific configuration
 * @returns Configured LLM provider instance
 * @throws ProviderCreationError if provider type is not supported or creation fails
 * 
 * @example
 * ```typescript
 * // Create OpenAI provider
 * const openai = createProvider('openai', {
 *   apiKey: process.env.OPENAI_API_KEY,
 *   model: 'gpt-4.1-mini'
 * });
 * 
 * // Create Gemini provider
 * const gemini = createProvider('gemini', {
 *   apiKey: process.env.GEMINI_API_KEY,
 *   model: 'gemini-2.5-flash'
 * });
 * ```
 */
export function createProvider(type: ProviderType, config: ProviderConfig): LLMProvider {
  const constructor = providerRegistry.get(type);
  
  if (!constructor) {
    throw new ProviderCreationError(
      `Unsupported provider type: ${type}. Supported types: ${Array.from(providerRegistry.keys()).join(', ')}`,
      type
    );
  }
  
  try {
    return constructor(config);
  } catch (error) {
    throw new ProviderCreationError(
      `Failed to create ${type} provider: ${error instanceof Error ? error.message : String(error)}`,
      type,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Gets list of registered provider types
 * 
 * @returns Array of supported provider types
 */
export function getSupportedProviders(): ProviderType[] {
  return Array.from(providerRegistry.keys());
}

/**
 * Checks if a provider type is supported
 * 
 * @param type - Provider type to check
 * @returns True if provider is registered
 */
export function isProviderSupported(type: string): type is ProviderType {
  return providerRegistry.has(type as ProviderType);
}

/**
 * Auto-detects provider type from configuration
 * Useful when config has a 'provider' field
 * 
 * @param config - Configuration object with optional provider field
 * @returns Detected provider type or default
 */
export function detectProviderType(config: any): ProviderType {
  if (config.provider && isProviderSupported(config.provider)) {
    return config.provider as ProviderType;
  }
  
  // Default to OpenAI for backward compatibility
  return 'openai';
}

/**
 * Creates a provider from a generic configuration object
 * Automatically detects provider type and extracts relevant config
 * 
 * @param config - Generic configuration object
 * @returns Configured LLM provider instance
 * 
 * @example
 * ```typescript
 * const provider = createProviderFromConfig({
 *   provider: 'gemini',
 *   apiKey: process.env.GEMINI_API_KEY,
 *   model: 'gemini-2.5-flash'
 * });
 * ```
 */
export function createProviderFromConfig(config: any): LLMProvider {
  const type = detectProviderType(config);
  
  // Extract provider-specific config
  const providerConfig: ProviderConfig = {
    apiKey: config.apiKey || process.env[`${type.toUpperCase()}_API_KEY`],
    model: config.model,
    ...(type === 'openai' && {
      baseURL: config.baseURL,
      organization: config.organization,
    }),
    ...(type === 'ollama' && {
      baseURL: config.baseURL || 'http://localhost:11434',
    }),
  };
  
  return createProvider(type, providerConfig);
}

