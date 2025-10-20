/**
 * i18n-llm - AI-powered internationalization tool
 * Main entry point for programmatic usage
 */

// Export configuration types and functions
export {
  loadConfig,
  getDefaultConfig,
  type I18nLLMConfig,
  type ProviderConfig,
  ConfigNotFoundError,
  ConfigValidationError,
  ConfigLoadError,
} from './core/config-loader.js';

// Export schema parser
export {
  parseSchema,
  type I18nSchema,
  type Entity,
  type KeySchema,
  SchemaValidationError,
} from './core/schema-parser.js';

// Export state manager
export {
  loadState,
  saveState,
  type TranslationState,
} from './core/state-manager.js';

// Export LLM provider interfaces
export {
  type LLMProvider,
  type TranslationParams,
  type PluralizedTranslation,
  type ReviewParams,
  type ReviewResult,
  type BatchTranslationItem,
  type BatchTranslationResult,
  type BatchMetadata,
} from './core/llm/llm-provider.js';

// Export provider factory
export {
  createProviderFromConfig,
  registerProvider,
  type OpenAIConfig,
  type GeminiConfig,
} from './core/llm/provider-factory.js';

// Export provider implementations
export { OpenAIProvider, createOpenAIProvider } from './core/llm/providers/openai.js';
export { GeminiProvider, createGeminiProvider } from './core/llm/providers/gemini.js';

// Export utility functions
export {
  getLanguageName,
} from './core/llm/utils/language-utils.js';

export {
  buildSystemPrompt,
  buildPersonaPrompt,
  buildGlossaryPrompt,
  buildPluralizationRulesPrompt,
  type PersonaConfig,
  type GlossaryConfig,
} from './core/llm/utils/prompt-builder.js';

export {
  parseJSONResponse,
  cleanBatchResult,
  validateLength,
  validatePluralizedLength,
  isPluralizedTranslation,
  ResponseParsingError,
} from './core/llm/utils/response-parser.js';

