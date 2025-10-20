/**
 * Response parsing utilities for LLM providers
 * Shared logic for parsing and validating LLM responses
 */

import { PluralizedTranslation } from '../llm-provider.js';

/**
 * Custom error for response parsing failures
 */
export class ResponseParsingError extends Error {
  constructor(message: string, public readonly rawResponse: string) {
    super(message);
    this.name = 'ResponseParsingError';
  }
}

/**
 * Cleans translation keys by removing common prefixes added by LLMs
 * 
 * @param key - Key to clean
 * @returns Cleaned key
 */
export function cleanTranslationKey(key: string): string {
  // Remove common prefixes that LLMs might add
  return key
    .replace(/^translation_/, '')
    .replace(/^translated_/, '')
    .replace(/^text_/, '')
    .trim();
}

/**
 * Extracts JSON from a response that might contain markdown or other text
 * 
 * @param response - Raw response text
 * @returns Extracted JSON string
 */
export function extractJSON(response: string): string {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }
  
  // Try to find JSON object directly
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  // Return as-is if no JSON found
  return response.trim();
}

/**
 * Parses a JSON response from an LLM
 * 
 * @param response - Raw response text
 * @returns Parsed JSON object
 * @throws ResponseParsingError if parsing fails
 */
export function parseJSONResponse(response: string): Record<string, any> {
  try {
    const jsonStr = extractJSON(response);
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new ResponseParsingError(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`,
      response
    );
  }
}

/**
 * Validates that a response is a valid pluralized translation
 * 
 * @param obj - Object to validate
 * @returns True if valid pluralized translation
 */
export function isPluralizedTranslation(obj: any): obj is PluralizedTranslation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj['=0'] === 'string' &&
    typeof obj['=1'] === 'string' &&
    typeof obj['>1'] === 'string'
  );
}

/**
 * Validates that a text meets length constraints
 * 
 * @param text - Text to validate
 * @param maxLength - Maximum allowed length
 * @returns True if valid, false otherwise
 */
export function validateLength(text: string, maxLength: number | undefined): boolean {
  if (!maxLength) return true;
  return text.length <= maxLength;
}

/**
 * Validates a pluralized translation meets length constraints
 * 
 * @param plural - Pluralized translation to validate
 * @param maxLength - Maximum allowed length for each form
 * @returns True if all forms are valid
 */
export function validatePluralizedLength(
  plural: PluralizedTranslation,
  maxLength: number | undefined
): boolean {
  if (!maxLength) return true;
  
  return (
    validateLength(plural['=0'], maxLength) &&
    validateLength(plural['=1'], maxLength) &&
    validateLength(plural['>1'], maxLength)
  );
}

/**
 * Cleans and validates a batch translation result
 * 
 * @param result - Raw result from LLM
 * @param expectedKeys - Expected keys in the result
 * @param maxLengthMap - Map of keys to their max length constraints
 * @returns Cleaned and validated result
 * @throws ResponseParsingError if validation fails
 */
export function cleanBatchResult(
  result: Record<string, any>,
  expectedKeys: string[],
  maxLengthMap: Record<string, number | undefined>
): Record<string, string | PluralizedTranslation> {
  const cleaned: Record<string, string | PluralizedTranslation> = {};
  
  // Clean keys and validate
  for (const [rawKey, value] of Object.entries(result)) {
    const key = cleanTranslationKey(rawKey);
    
    // Check if this is a pluralized translation
    if (isPluralizedTranslation(value)) {
      const maxLength = maxLengthMap[key];
      if (!validatePluralizedLength(value, maxLength)) {
        throw new ResponseParsingError(
          `Pluralized translation for "${key}" exceeds max length of ${maxLength}`,
          JSON.stringify(result)
        );
      }
      cleaned[key] = value;
    } else if (typeof value === 'string') {
      const maxLength = maxLengthMap[key];
      if (!validateLength(value, maxLength)) {
        throw new ResponseParsingError(
          `Translation for "${key}" exceeds max length of ${maxLength} (got ${value.length} characters)`,
          JSON.stringify(result)
        );
      }
      cleaned[key] = value;
    } else {
      throw new ResponseParsingError(
        `Invalid value type for "${key}": expected string or pluralized translation`,
        JSON.stringify(result)
      );
    }
  }
  
  // Check for missing keys
  const missingKeys = expectedKeys.filter(key => !(key in cleaned));
  if (missingKeys.length > 0) {
    throw new ResponseParsingError(
      `Missing translations for keys: ${missingKeys.join(', ')}`,
      JSON.stringify(result)
    );
  }
  
  return cleaned;
}

/**
 * Strips markdown formatting from text
 * 
 * @param text - Text with potential markdown
 * @returns Plain text
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
    .replace(/\*(.+?)\*/g, '$1')      // Italic
    .replace(/`(.+?)`/g, '$1')        // Code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .trim();
}

/**
 * Normalizes whitespace in text
 * 
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/\n\s*\n/g, '\n')  // Multiple newlines to single
    .trim();
}

