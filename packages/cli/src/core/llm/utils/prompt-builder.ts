/**
 * Prompt building utilities for LLM providers
 * Shared logic for constructing prompts across different providers
 */

import { PluralizedTranslation } from '../llm-provider.js';

export interface PersonaConfig {
  role?: string;
  tone?: string;
  audience?: string;
  examples?: Array<{ input: string; output: string }>;
}

export interface GlossaryConfig {
  [term: string]: string;
}

/**
 * Builds a persona prompt section from persona configuration
 * 
 * @param persona - Persona configuration
 * @param includeExamples - Whether to include examples in the prompt
 * @returns Formatted persona prompt
 */
export function buildPersonaPrompt(persona: PersonaConfig | undefined, includeExamples: boolean = true): string {
  if (!persona) {
    return 'Standard professional and clear.';
  }
  
  let prompt = '';
  
  if (persona.role) {
    prompt += `**Role:** Act as a ${persona.role}.\n`;
  }
  
  if (persona.tone) {
    prompt += `**Tone:** ${persona.tone}.\n`;
  }
  
  if (persona.audience) {
    prompt += `**Audience:** ${persona.audience}.\n`;
  }
  
  if (includeExamples && persona.examples && persona.examples.length > 0) {
    prompt += `**Examples:**\n`;
    persona.examples.forEach((ex: any) => {
      prompt += `- Input: "${ex.input}" → Output: "${ex.output}"\n`;
    });
  }
  
  return prompt || 'Standard professional and clear.';
}

/**
 * Builds a glossary prompt section from glossary configuration
 * 
 * @param glossary - Glossary configuration
 * @returns Formatted glossary prompt
 */
export function buildGlossaryPrompt(glossary: GlossaryConfig | undefined): string {
  if (!glossary || Object.keys(glossary).length === 0) {
    return '';
  }
  
  let prompt = '**Glossary (preserve these terms exactly):**\n';
  
  for (const [term, translation] of Object.entries(glossary)) {
    prompt += `- "${term}" → "${translation}"\n`;
  }
  
  return prompt;
}

/**
 * Builds a context prompt section
 * 
 * @param context - Context description
 * @returns Formatted context prompt
 */
export function buildContextPrompt(context: string | undefined): string {
  if (!context) {
    return '';
  }
  
  return `**Context:** ${context}\n`;
}

/**
 * Builds a constraints prompt section
 * 
 * @param maxLength - Maximum length constraint
 * @param otherConstraints - Other constraints
 * @returns Formatted constraints prompt
 */
export function buildConstraintsPrompt(
  maxLength?: number,
  otherConstraints?: Record<string, any>
): string {
  const constraints: string[] = [];
  
  if (maxLength) {
    constraints.push(`Maximum ${maxLength} characters`);
  }
  
  if (otherConstraints) {
    for (const [key, value] of Object.entries(otherConstraints)) {
      if (key !== 'maxLength') {
        constraints.push(`${key}: ${value}`);
      }
    }
  }
  
  if (constraints.length === 0) {
    return '';
  }
  
  return `**Constraints:** ${constraints.join(', ')}\n`;
}

/**
 * Builds pluralization rules prompt
 * 
 * @returns Formatted pluralization rules
 */
export function buildPluralizationRulesPrompt(): string {
  return `**Pluralization Rules:**
- "=0": Exactly zero items (e.g., "No messages")
- "=1": Exactly one item (e.g., "1 message")
- ">1": More than one item, use {count} placeholder (e.g., "{count} messages")
`;
}

/**
 * Formats a pluralized translation for display in prompts
 * 
 * @param plural - Pluralized translation object
 * @returns Formatted string representation
 */
export function formatPluralizedText(plural: PluralizedTranslation): string {
  return `{ "=0": "${plural['=0']}", "=1": "${plural['=1']}", ">1": "${plural['>1']}" }`;
}

/**
 * Builds a complete system prompt for translation/generation
 * 
 * @param options - Prompt building options
 * @returns Complete system prompt
 */
export interface SystemPromptOptions {
  operation: 'translate' | 'generate';
  targetLanguage: string;
  sourceLanguage?: string;
  persona?: PersonaConfig;
  glossary?: GlossaryConfig;
  context?: string;
  isPlural?: boolean;
  maxLength?: number;
  includePersonaExamples?: boolean;
}

export function buildSystemPrompt(options: SystemPromptOptions): string {
  const {
    operation,
    targetLanguage,
    sourceLanguage,
    persona,
    glossary,
    context,
    isPlural,
    maxLength,
    includePersonaExamples = true,
  } = options;
  
  let prompt = '';
  
  // Operation description
  if (operation === 'translate') {
    prompt += `You are a professional translator. Translate from ${sourceLanguage} to ${targetLanguage}.\n\n`;
  } else {
    prompt += `You are a professional content writer. Generate text in ${targetLanguage}.\n\n`;
  }
  
  // Persona
  const personaPrompt = buildPersonaPrompt(persona, includePersonaExamples);
  if (personaPrompt) {
    prompt += `${personaPrompt}\n`;
  }
  
  // Glossary
  const glossaryPrompt = buildGlossaryPrompt(glossary);
  if (glossaryPrompt) {
    prompt += `${glossaryPrompt}\n`;
  }
  
  // Context
  const contextPrompt = buildContextPrompt(context);
  if (contextPrompt) {
    prompt += `${contextPrompt}\n`;
  }
  
  // Pluralization
  if (isPlural) {
    prompt += `${buildPluralizationRulesPrompt()}\n`;
  }
  
  // Constraints
  const constraintsPrompt = buildConstraintsPrompt(maxLength);
  if (constraintsPrompt) {
    prompt += `${constraintsPrompt}\n`;
  }
  
  // Output format
  prompt += `\n**Output:** Return ONLY the ${operation === 'translate' ? 'translated' : 'generated'} text, nothing else.`;
  
  if (isPlural) {
    prompt += ` Return as valid JSON with keys "=0", "=1", and ">1".`;
  }
  
  return prompt.trim();
}

