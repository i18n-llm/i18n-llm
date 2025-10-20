/**
 * Language utilities for LLM providers
 * Shared across all providers
 */

/**
 * Map of language codes to human-readable names
 * Used to provide clear instructions to LLMs
 */
const LANGUAGE_NAMES: Record<string, string> = {
  // English
  'en': 'English',
  'en-US': 'American English',
  'en-GB': 'British English',
  'en-AU': 'Australian English',
  'en-CA': 'Canadian English',
  
  // Portuguese
  'pt': 'Portuguese',
  'pt-BR': 'Brazilian Portuguese',
  'pt-PT': 'European Portuguese',
  
  // Spanish
  'es': 'Spanish',
  'es-ES': 'European Spanish',
  'es-MX': 'Mexican Spanish',
  'es-AR': 'Argentinian Spanish',
  'es-CO': 'Colombian Spanish',
  'es-CL': 'Chilean Spanish',
  
  // French
  'fr': 'French',
  'fr-FR': 'French',
  'fr-CA': 'Canadian French',
  'fr-BE': 'Belgian French',
  'fr-CH': 'Swiss French',
  
  // German
  'de': 'German',
  'de-DE': 'German',
  'de-AT': 'Austrian German',
  'de-CH': 'Swiss German',
  
  // Italian
  'it': 'Italian',
  'it-IT': 'Italian',
  'it-CH': 'Swiss Italian',
  
  // Asian languages
  'ja': 'Japanese',
  'ja-JP': 'Japanese',
  'ko': 'Korean',
  'ko-KR': 'Korean',
  'zh': 'Chinese',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  'zh-HK': 'Hong Kong Chinese',
  
  // Other European
  'ru': 'Russian',
  'ru-RU': 'Russian',
  'nl': 'Dutch',
  'nl-NL': 'Dutch',
  'nl-BE': 'Belgian Dutch',
  'pl': 'Polish',
  'pl-PL': 'Polish',
  'sv': 'Swedish',
  'sv-SE': 'Swedish',
  'no': 'Norwegian',
  'no-NO': 'Norwegian',
  'da': 'Danish',
  'da-DK': 'Danish',
  'fi': 'Finnish',
  'fi-FI': 'Finnish',
  
  // Middle East & South Asia
  'ar': 'Arabic',
  'ar-SA': 'Saudi Arabic',
  'ar-EG': 'Egyptian Arabic',
  'ar-AE': 'UAE Arabic',
  'he': 'Hebrew',
  'he-IL': 'Hebrew',
  'hi': 'Hindi',
  'hi-IN': 'Hindi',
  'ur': 'Urdu',
  'ur-PK': 'Urdu',
  'fa': 'Persian',
  'fa-IR': 'Persian',
  
  // Southeast Asia
  'th': 'Thai',
  'th-TH': 'Thai',
  'vi': 'Vietnamese',
  'vi-VN': 'Vietnamese',
  'id': 'Indonesian',
  'id-ID': 'Indonesian',
  'ms': 'Malay',
  'ms-MY': 'Malay',
};

/**
 * Converts a language code to a human-readable name
 * 
 * @param code - Language code (e.g., 'pt-BR', 'en-US')
 * @returns Human-readable language name (e.g., 'Brazilian Portuguese')
 * 
 * @example
 * ```typescript
 * getLanguageName('pt-BR'); // 'Brazilian Portuguese'
 * getLanguageName('en-US'); // 'American English'
 * getLanguageName('unknown'); // 'unknown'
 * ```
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}

/**
 * Checks if a language code is supported
 * 
 * @param code - Language code to check
 * @returns True if the language is in our mapping
 */
export function isLanguageSupported(code: string): boolean {
  return code in LANGUAGE_NAMES;
}

/**
 * Gets all supported language codes
 * 
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_NAMES);
}

/**
 * Gets language family from code
 * 
 * @param code - Language code
 * @returns Base language code (e.g., 'pt' from 'pt-BR')
 */
export function getLanguageFamily(code: string): string {
  return code.split('-')[0];
}

