import crypto from 'crypto';
import { PluralizedTranslation } from './llm/llm-provider.js';

/**
 * Calculate MD5 hash of a text (string or pluralized translation)
 */
export function calculateTextHash(text: string | PluralizedTranslation): string {
  const content = typeof text === 'string' 
    ? text 
    : JSON.stringify(text, Object.keys(text).sort()); // Normalize object keys
  
  return crypto.createHash('md5').update(content, 'utf-8').digest('hex');
}

/**
 * Calculate MD5 hash of a string
 */
export function calculateStringHash(str: string): string {
  return crypto.createHash('md5').update(str, 'utf-8').digest('hex');
}

