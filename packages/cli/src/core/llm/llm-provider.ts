/**
 * Represents a pluralized translation with different forms
 */
export interface PluralizedTranslation {
  '=0': string;  // Zero items
  '=1': string;  // One item
  '>1': string;  // Multiple items (with {count} placeholder)
}

/**
 * Metadata for batch translation operations
 */
export interface BatchMetadata {
  context?: string;
  category?: string;
}

/**
 * A single item in a batch translation request
 */
export interface BatchTranslationItem {
  key: string;
  sourceText: string | PluralizedTranslation;
  isPlural: boolean;
  maxLength?: number;
}

/**
 * Result of a batch translation operation
 */
export interface BatchTranslationResult {
  [key: string]: string | PluralizedTranslation;
}

/**
 * Parameters for a single translation request
 */
export interface TranslationParams {
  sourceText: string;
  targetLanguage: string;
  sourceLanguage: string;
  persona?: any;
  glossary?: any;
  context?: any;
  category?: string;
  isPlural?: boolean;
  params?: any;
  constraints?: {
    maxLength?: number;
    [key: string]: any;
  };
}

/**
 * Parameters for review operations
 */
export interface ReviewParams {
  sourceText: string;
  translatedText: string;
  language: string;
  persona?: any;
  context?: string;
  criteria?: string[];
  constraints?: {
    maxLength?: number;
    [key: string]: any;
  };
}

/**
 * Result of a review operation
 */
export interface ReviewResult {
  score: number;
  suggestions: string[];
  approved: boolean;
}

/**
 * Base interface for LLM providers
 */
export interface LLMProvider {
  /**
   * Translates or generates a single text
   * If sourceLanguage === targetLanguage, generates text in that language
   * Otherwise, translates from source to target
   */
  translate(params: TranslationParams): Promise<string | PluralizedTranslation>;
  
  /**
   * Translates or generates multiple texts in batch
   * More efficient than calling translate() multiple times
   */
  translateBatch(
    items: BatchTranslationItem[],
    targetLanguage: string,
    sourceLanguage: string,
    persona: any,
    glossary: any,
    metadata: BatchMetadata
  ): Promise<BatchTranslationResult>;
  
  /**
   * Reviews a translation for quality
   * Optional - not all providers may implement this
   */
  review?(params: ReviewParams): Promise<ReviewResult>;
}
