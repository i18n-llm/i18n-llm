import { OpenAI } from 'openai';
import { LLMProvider, PluralizedTranslation, TranslationParams, ReviewParams, ReviewResult } from '../llm-provider';
import * as fs from 'fs';
import * as path from 'path';

// Preços por 1M tokens (atualizado para gpt-4.1-mini)
const MODEL_PRICING: { [key: string]: { input: number; output: number } } = {
  'gpt-4.1-mini': { input: 0.15, output: 0.60 },
  'gpt-4.1-nano': { input: 0.10, output: 0.40 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4': { input: 30.00, output: 60.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

interface UsageRecord {
  timestamp: string;
  operation: 'translate' | 'review';
  model: string;
  language?: string;
  key?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface UsageHistory {
  records: UsageRecord[];
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

function buildPersonaPrompt(persona: TranslationParams['persona']): string {
  if (!persona) return 'Standard professional and clear.';
  
  let prompt = `**Role:** Act as a ${persona.role}.\n`;
  prompt += `**Tone & Style:**\n- Use the following tones: ${persona.tone.join(', ')}.\n`;
  if (persona.forbidden_tones?.length) {
    prompt += `- NEVER use these tones: ${persona.forbidden_tones.join(', ')}.\n`;
  }
  if (persona.audience) {
    prompt += `- The target audience is: ${persona.audience}.\n`;
  }
  if (persona.examples?.length) {
    prompt += `**Examples (Learn from these):**\n`;
    persona.examples.forEach(ex => {
      prompt += `- Input: "${ex.input}" -> Output: "${ex.output}"\n`;
    });
  }
  return prompt;
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private usagePath: string;

  constructor(apiKey: string, model: string = 'gpt-4.1-mini') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.usagePath = path.resolve(process.cwd(), '.i18n-llm-usage.json');
  }

  private cleanTranslationKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanTranslationKeys(item));
    }
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      let cleanedKey = key.trim();
      cleanedKey = cleanedKey.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      cleaned[cleanedKey] = this.cleanTranslationKeys(value);
    }
    
    return cleaned;
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[this.model] || MODEL_PRICING['gpt-4.1-mini'];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
  }

  private saveUsage(record: UsageRecord): void {
    try {
      let history: UsageHistory = {
        records: [],
        totals: {
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
        }
      };

      // Carregar histórico existente
      if (fs.existsSync(this.usagePath)) {
        history = JSON.parse(fs.readFileSync(this.usagePath, 'utf-8'));
      }

      // Adicionar novo registro
      history.records.push(record);

      // Atualizar totais
      history.totals.requests++;
      history.totals.inputTokens += record.inputTokens;
      history.totals.outputTokens += record.outputTokens;
      history.totals.totalTokens += record.totalTokens;
      history.totals.estimatedCost += record.estimatedCost;

      // Salvar
      fs.writeFileSync(this.usagePath, JSON.stringify(history, null, 2), 'utf-8');
    } catch (error) {
      console.warn('⚠️  Could not save usage data:', error);
    }
  }

  async translate(params: TranslationParams): Promise<string | PluralizedTranslation> {
    const {
      sourceText,
      sourceLanguage,
      targetLanguage,
      persona,
      glossary,
      context,
      category,
      isPlural,
      params: textParams,
      constraints,
    } = params;

    const isGenerationTask = sourceLanguage === targetLanguage;
    let systemPrompt: string;
    let userMessage: string;

    const pluralizationInstruction = isPlural
      ? `The output MUST be a JSON object with three keys: "=0" (for zero), "=1" (for singular), and ">1" (for plural, use the placeholder '{count}'). DO NOT add any spaces or special characters before the keys.`
      : `The output MUST be a JSON object with a single key: "translatedText".`;

    const personaPrompt = buildPersonaPrompt(persona);

    if (isGenerationTask) {
      systemPrompt = `
        You are an expert creative writer for software interfaces. Your task is to generate contextually appropriate text based on a description, strictly following the persona provided.
        
        ${personaPrompt}

        **Rules:**
        1.  **Input:** You will receive a JSON object with a 'description' of the text to generate.
        2.  **Task:** Generate creative text in the specified language ('targetLanguage') that matches the description and persona.
        3.  **Output Format:** ${pluralizationInstruction}
        4.  **Final Output:** Only output the final JSON object. Do not include any other text, explanations, or markdown.
      `;
      userMessage = JSON.stringify({
        task: `Generate creative text in ${targetLanguage} based on the following description.`,
        description: sourceText,
        context,
        category,
        isPlural,
        params: textParams,
        constraints,
      });
    } else {
      systemPrompt = `
        You are an expert localization assistant. Your task is to translate text for software interfaces, strictly following the persona provided.
        
        ${personaPrompt}

        **Rules:**
        1.  **Input:** You will receive a JSON object with the 'sourceText' to translate.
        2.  **Task:** Translate the 'sourceText' from '${sourceLanguage}' to '${targetLanguage}', maintaining the persona and tone.
        3.  **Output Format:** ${pluralizationInstruction}
        4.  **Glossary:** Strictly adhere to the glossary. Do not translate these terms.
             ${glossary ? JSON.stringify(glossary) : 'None.'}
        5.  **Parameters:** If the text includes parameters (like '{count}'), preserve them exactly in the final translation.
        6.  **Final Output:** Only output the final JSON object. Do not include any other text, explanations, or markdown.
      `;
      userMessage = JSON.stringify({
        task: `Translate the following sourceText from ${sourceLanguage} to ${targetLanguage}.`,
        sourceText: sourceText,
        context,
        category,
        isPlural,
        params: textParams,
        constraints,
      });
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('API returned empty content.');
      }

      // Capturar usage
      const usage = response.usage;
      if (usage) {
        const cost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens);
        const record: UsageRecord = {
          timestamp: new Date().toISOString(),
          operation: 'translate',
          model: this.model,
          language: targetLanguage,
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          estimatedCost: cost,
        };
        this.saveUsage(record);
        console.log(`     💰 Cost: $${cost.toFixed(4)} (${usage.total_tokens} tokens)`);
      }

      let jsonResponse = JSON.parse(content);
      jsonResponse = this.cleanTranslationKeys(jsonResponse);

      if (isPlural) {
        if (jsonResponse.other) {
          delete jsonResponse.other;
        }
        return jsonResponse as PluralizedTranslation;
      } else {
        return jsonResponse.translatedText as string;
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to get translation from OpenAI.');
    }
  }

  async review(params: ReviewParams): Promise<ReviewResult> {
    const { sourceText, translatedText, language, persona, constraints } = params;

    const personaPrompt = buildPersonaPrompt(persona);

    const systemPrompt = `
      You are a meticulous Localization Quality Assurance Manager with a deep understanding of how to instruct LLMs. Your task is to analyze a translation and provide feedback, including suggestions for improving the source schema.

      ${personaPrompt}

      **Rules:**
      1.  **Input:** You will receive a JSON object with the source text, the translated text, the language, and any constraints.
      2.  **Analysis:** You must evaluate the translation based on the following criteria:
          *   \`isToneConsistent\`: (boolean) Does the translation's tone strictly match the persona defined above?
          *   \`isGrammaticallyCorrect\`: (boolean) Is the translation grammatically correct and natural-sounding in '${language}'?
          *   \`obeysLengthConstraint\`: (boolean) Is the translation's length compliant? The max length is ${constraints?.maxLength || 'not defined'}. If not defined, this is true.
      3.  **Comment:** Provide a brief, helpful comment (max 15 words) ONLY if one or more criteria fail. If all criteria pass, the comment MUST be an empty string.
      4.  **Schema Suggestion (Crucial Task):**
          *   If the translation fails for any reason (tone, grammar, length), analyze the root cause.
          *   Provide a concrete suggestion on how to improve the original \`i18n.schema.json\` to prevent this failure in the future.
          *   Examples: "Add 'maxLength: 20' to the constraints.", "Add 'Corporate' to forbidden_tones.", "Add a new example to the persona: { input: '...', output: '...' } to better illustrate the desired slang."
          *   If the translation is perfect, this suggestion MUST be an empty string.
      5.  **Output Format:** Your final output MUST be a JSON object with five keys: \`isToneConsistent\`, \`isGrammaticallyCorrect\`, \`obeysLengthConstraint\`, \`comment\`, and \`schemaSuggestion\`.
      6.  **Final Output:** Only output the final JSON object. Do not include any other text, explanations, or markdown.
    `;

    const userMessage = JSON.stringify({
      sourceText,
      translatedText,
      language,
      constraints,
    });

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('API returned empty content.');
      }

      // Capturar usage
      const usage = response.usage;
      if (usage) {
        const cost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens);
        const record: UsageRecord = {
          timestamp: new Date().toISOString(),
          operation: 'review',
          model: this.model,
          language,
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          estimatedCost: cost,
        };
        this.saveUsage(record);
        console.log(`     💰 Cost: $${cost.toFixed(4)} (${usage.total_tokens} tokens)`);
      }

      return JSON.parse(content) as ReviewResult;
    } catch (error) {
      console.error('Error calling OpenAI API for review:', error);
      throw new Error('Failed to get review from OpenAI.');
    }
  }
}
