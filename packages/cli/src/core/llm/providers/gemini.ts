/**
 * Google Gemini LLM Provider
 * Implementation using Google's Generative AI SDK
 */

import {
  LLMProvider,
  PluralizedTranslation,
  TranslationParams,
  ReviewParams,
  ReviewResult,
  BatchTranslationItem,
  BatchMetadata,
  BatchTranslationResult,
  TokenUsage,
} from '../llm-provider.js';
import { GeminiConfig, registerProvider } from '../provider-factory.js';
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
 * Gemini provider implementation
 * Uses Google's Generative AI API
 */
export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: GeminiConfig) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable or pass apiKey in config.');
    }

    // Validate model
    const model = config.model || 'gemini-2.5-flash';
    if (!model || typeof model !== 'string' || model.trim() === '') {
      throw new Error('Gemini model must be a non-empty string.');
    }

    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Calls Gemini API with retry logic
   */
  private async callGemini(prompt: string, systemInstruction?: string): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number; totalTokens: number } }> {
    const url = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const requestBody: any = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    // Add system instruction if provided
    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [
          {
            text: systemInstruction
          }
        ]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = await response.json() as any;
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Empty response from Gemini');
    }

    const content = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Invalid response format from Gemini');
    }

    // Extract usage metadata if available
    const usageMetadata = data.usageMetadata;
    const usage = usageMetadata ? {
      inputTokens: usageMetadata.promptTokenCount || 0,
      outputTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : undefined;

    return { text: content, usage };
  }

  /**
   * Translates or generates a single text
   */
  async translate(params: TranslationParams): Promise<{
    text: string | PluralizedTranslation;
    usage?: TokenUsage;
  }> {
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

    // Build system instruction
    const systemInstruction = buildSystemPrompt({
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

    if (isPlural) {
      userPrompt += `\n\nReturn as valid JSON with keys "=0", "=1", and ">1".`;
    }

    // Call Gemini API
    const response = await this.callGemini(userPrompt, systemInstruction);
    const content = response.text;
    const usage = response.usage;

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
      
      return { text: parsed, usage };
    } else {
      const text = content.trim();
      
      // Validate length
      if (!validateLength(text, constraints?.maxLength)) {
        throw new ResponseParsingError(
          `Translation exceeds max length of ${constraints?.maxLength} (got ${text.length} characters)`,
          content
        );
      }
      
      return { text, usage };
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
      return { translations: {} };
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

    // Build system instruction
    let systemInstruction = '';
    
    if (operation === 'translate') {
      systemInstruction = `You are a professional translator. Translate from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}.\n\n`;
    } else {
      systemInstruction = `You are a professional content writer. Generate text in ${getLanguageName(targetLanguage)}.\n\n`;
    }

    // Add persona
    const personaPrompt = buildPersonaPrompt(persona as PersonaConfig, false);
    systemInstruction += `${personaPrompt}\n\n`;

    // Add glossary
    const glossaryPrompt = buildGlossaryPrompt(glossary as GlossaryConfig);
    if (glossaryPrompt) {
      systemInstruction += `${glossaryPrompt}\n`;
    }

    // Add context
    if (metadata.context) {
      systemInstruction += `**Context:** ${metadata.context}\n\n`;
    }

    // Add pluralization rules if needed
    const hasPlural = items.some(item => item.isPlural);
    if (hasPlural) {
      systemInstruction += `${buildPluralizationRulesPrompt()}\n`;
    }

    // Add length constraints
    if (hasLengthConstraints) {
      systemInstruction += `**Length Constraints:**\n`;
      for (const item of itemsWithLimits) {
        systemInstruction += `- "${item.key}": Maximum ${item.maxLength} characters\n`;
      }
      systemInstruction += `\n`;
    }

    // Add output format
    systemInstruction += `**Output Format:** Return a JSON object where keys are the item keys and values are the ${operation === 'translate' ? 'translated' : 'generated'} texts.\n`;
    systemInstruction += `For pluralized items, return an object with keys "=0", "=1", and ">1".\n`;
    systemInstruction += `Return ONLY valid JSON, no markdown or explanations.`;

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

    // Call Gemini API
    const response = await this.callGemini(userPrompt, systemInstruction);
    const content = response.text;
    const usage = response.usage;

    // Parse and validate response
    const parsed = parseJSONResponse(content);
    const expectedKeys = items.map(item => item.key);
    const translations = cleanBatchResult(parsed, expectedKeys, maxLengthMap);
    
    return {
      translations,
      usage,
    };
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

    // Build system instruction
    let systemInstruction = `You are a professional translation reviewer for ${getLanguageName(language)}.\n\n`;
    
    if (persona) {
      systemInstruction += `${buildPersonaPrompt(persona as PersonaConfig, false)}\n\n`;
    }
    
    if (context) {
      systemInstruction += `**Context:** ${context}\n\n`;
    }
    
    if (constraints?.maxLength) {
      systemInstruction += `**Max Length:** ${constraints.maxLength} characters\n\n`;
    }
    
    systemInstruction += `**Review Criteria:**\n`;
    if (criteria && criteria.length > 0) {
      criteria.forEach(c => {
        systemInstruction += `- ${c}\n`;
      });
    } else {
      systemInstruction += `- Accuracy of translation\n`;
      systemInstruction += `- Natural fluency\n`;
      systemInstruction += `- Tone consistency\n`;
      systemInstruction += `- Grammar correctness\n`;
    }
    
    systemInstruction += `\n**Output Format:** Return a JSON object with:\n`;
    systemInstruction += `- "score": number from 0-100\n`;
    systemInstruction += `- "suggestions": array of improvement suggestions\n`;
    systemInstruction += `- "approved": boolean (true if score >= 80)\n`;
    systemInstruction += `Return ONLY valid JSON, no markdown or explanations.`;

    // Build user prompt
    const userPrompt = `Review this translation:\n\nSource: ${sourceText}\n\nTranslation: ${translatedText}`;

    // Call Gemini API
    const response = await this.callGemini(userPrompt, systemInstruction);
    const content = response.text;
    const usage = response.usage;

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
 * Factory function for creating Gemini provider
 */
export function createGeminiProvider(config: GeminiConfig): GeminiProvider {
  return new GeminiProvider(config);
}

// Auto-register provider
registerProvider('gemini', (config) => createGeminiProvider(config as GeminiConfig));

