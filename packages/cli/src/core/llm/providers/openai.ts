/**
 * OpenAI LLM Provider
 * Refactored to use shared utilities and follow best practices
 */

import OpenAI from 'openai';
import {
  LLMProvider,
  PluralizedTranslation,
  TranslationParams,
  ReviewParams,
  ReviewResult,
  BatchTranslationItem,
  BatchMetadata,
  BatchTranslationResult,
} from '../llm-provider.js';
import { OpenAIConfig, registerProvider } from '../provider-factory.js';
import { getLanguageName } from '../utils/language-utils.js';
import {
  buildSystemPrompt,
  buildPersonaPrompt,
  buildGlossaryPrompt,
  buildPluralizationRulesPrompt,
  PersonaConfig,
  GlossaryConfig,
} from '../utils/prompt-builder.js';
import {
  parseJSONResponse,
  cleanBatchResult,
  validateLength,
  validatePluralizedLength,
  isPluralizedTranslation,
  ResponseParsingError,
} from '../utils/response-parser.js';

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIConfig) {
    // Validate apiKey
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config.');
    }

    // Validate model
    const model = config.model || 'gpt-4.1-mini';
    if (!model || typeof model !== 'string' || model.trim() === '') {
      throw new Error('OpenAI model is required and must be a non-empty string.');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });

    this.model = model;
  }

  /**
   * Translates or generates a single text
   */
  async translate(params: TranslationParams): Promise<string | PluralizedTranslation> {
    const {
      sourceText,
      targetLanguage,
      sourceLanguage,
      persona,
      glossary,
      context,
      isPlural,
      constraints,
    } = params;

    // Determine operation type
    const operation = sourceLanguage === targetLanguage ? 'generate' : 'translate';

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      operation,
      targetLanguage: getLanguageName(targetLanguage),
      sourceLanguage: sourceLanguage ? getLanguageName(sourceLanguage) : undefined,
      persona: persona as PersonaConfig,
      glossary: glossary as GlossaryConfig,
      context,
      isPlural,
      maxLength: constraints?.maxLength,
      includePersonaExamples: true,
    });

    // Build user prompt
    let userPrompt = '';
    if (operation === 'translate') {
      userPrompt = `Translate this text:\n\n${typeof sourceText === 'string' ? sourceText : JSON.stringify(sourceText)}`;
    } else {
      userPrompt = `Generate text based on this description:\n\n${sourceText}`;
    }

    // Call OpenAI API
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: isPlural ? { type: 'json_object' } : undefined,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse response
    if (isPlural) {
      const parsed = parseJSONResponse(content);
      if (!isPluralizedTranslation(parsed)) {
        throw new ResponseParsingError('Invalid pluralized translation format', content);
      }
      
      // Validate length
      if (!validatePluralizedLength(parsed, constraints?.maxLength)) {
        throw new ResponseParsingError(
          `Pluralized translation exceeds max length of ${constraints?.maxLength}`,
          content
        );
      }
      
      return parsed;
    } else {
      const text = content.trim();
      
      // Validate length
      if (!validateLength(text, constraints?.maxLength)) {
        throw new ResponseParsingError(
          `Translation exceeds max length of ${constraints?.maxLength} (got ${text.length} characters)`,
          content
        );
      }
      
      return text;
    }
  }

  /**
   * Translates or generates multiple texts in batch
   */
  async translateBatch(
    items: BatchTranslationItem[],
    targetLanguage: string,
    sourceLanguage: string,
    persona: any,
    glossary: any,
    metadata: BatchMetadata
  ): Promise<BatchTranslationResult> {
    if (items.length === 0) {
      return {};
    }

    // Determine operation type
    const operation = sourceLanguage === targetLanguage ? 'generate' : 'translate';

    // Build maxLength map
    const maxLengthMap: Record<string, number | undefined> = {};
    for (const item of items) {
      maxLengthMap[item.key] = item.maxLength;
    }

    // Check if any items have maxLength constraints
    const itemsWithLimits = items.filter(item => item.maxLength);
    const hasLengthConstraints = itemsWithLimits.length > 0;

    // Build system prompt
    let systemPrompt = '';
    
    if (operation === 'translate') {
      systemPrompt = `You are a professional translator. Translate from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}.\n\n`;
    } else {
      systemPrompt = `You are a professional content writer. Generate text in ${getLanguageName(targetLanguage)}.\n\n`;
    }

    // Add persona
    const personaPrompt = buildPersonaPrompt(persona as PersonaConfig, false); // Don't include examples for batch
    systemPrompt += `${personaPrompt}\n\n`;

    // Add glossary
    const glossaryPrompt = buildGlossaryPrompt(glossary as GlossaryConfig);
    if (glossaryPrompt) {
      systemPrompt += `${glossaryPrompt}\n`;
    }

    // Add context
    if (metadata.context) {
      systemPrompt += `**Context:** ${metadata.context}\n\n`;
    }

    // Add pluralization rules if needed
    const hasPlural = items.some(item => item.isPlural);
    if (hasPlural) {
      systemPrompt += `${buildPluralizationRulesPrompt()}\n`;
    }

    // Add length constraints
    if (hasLengthConstraints) {
      systemPrompt += `**Length Constraints:**\n`;
      for (const item of itemsWithLimits) {
        systemPrompt += `- "${item.key}": Maximum ${item.maxLength} characters\n`;
      }
      systemPrompt += `\n`;
    }

    // Add output format
    systemPrompt += `**Output Format:** Return a JSON object where keys are the item keys and values are the ${operation === 'translate' ? 'translated' : 'generated'} texts.\n`;
    systemPrompt += `For pluralized items, return an object with keys "=0", "=1", and ">1".\n`;
    systemPrompt += `Return ONLY valid JSON, no markdown or explanations.`;

    // Build batch input
    const batchInput: Record<string, any> = {};
    for (const item of items) {
      batchInput[item.key] = item.sourceText;
    }

    // Build user prompt
    let userPrompt = '';
    if (operation === 'translate') {
      userPrompt = `Translate these texts:\n\n${JSON.stringify(batchInput, null, 2)}`;
    } else {
      userPrompt = `Generate texts based on these descriptions:\n\n${JSON.stringify(batchInput, null, 2)}`;
    }

    // Call OpenAI API
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse and validate response
    const parsed = parseJSONResponse(content);
    const expectedKeys = items.map(item => item.key);
    
    return cleanBatchResult(parsed, expectedKeys, maxLengthMap);
  }

  /**
   * Reviews a translation for quality (optional)
   */
  async review(params: ReviewParams): Promise<ReviewResult> {
    const {
      sourceText,
      translatedText,
      language,
      persona,
      context,
      criteria,
      constraints,
    } = params;

    // Build system prompt
    let systemPrompt = `You are a professional translation reviewer for ${getLanguageName(language)}.\n\n`;
    
    if (persona) {
      systemPrompt += `${buildPersonaPrompt(persona as PersonaConfig, false)}\n\n`;
    }
    
    if (context) {
      systemPrompt += `**Context:** ${context}\n\n`;
    }
    
    if (constraints?.maxLength) {
      systemPrompt += `**Max Length:** ${constraints.maxLength} characters\n\n`;
    }
    
    systemPrompt += `**Review Criteria:**\n`;
    if (criteria && criteria.length > 0) {
      criteria.forEach(c => {
        systemPrompt += `- ${c}\n`;
      });
    } else {
      systemPrompt += `- Accuracy of translation\n`;
      systemPrompt += `- Natural fluency\n`;
      systemPrompt += `- Tone consistency\n`;
      systemPrompt += `- Grammar correctness\n`;
    }
    
    systemPrompt += `\n**Output Format:** Return a JSON object with:\n`;
    systemPrompt += `- "score": number from 0-100\n`;
    systemPrompt += `- "suggestions": array of improvement suggestions\n`;
    systemPrompt += `- "approved": boolean (true if score >= 80)\n`;

    // Build user prompt
    const userPrompt = `Review this translation:\n\nSource: ${sourceText}\n\nTranslation: ${translatedText}`;

    // Call OpenAI API
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse response
    const parsed = parseJSONResponse(content);
    
    return {
      score: parsed.score || 0,
      suggestions: parsed.suggestions || [],
      approved: parsed.approved || false,
    };
  }
}

/**
 * Factory function for creating OpenAI provider
 */
export function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}

// Auto-register provider
registerProvider('openai', (config) => createOpenAIProvider(config as OpenAIConfig));