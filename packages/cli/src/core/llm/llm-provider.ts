import { z } from 'zod';

export type PluralizedTranslation = {
  '=0': string;
  '=1': string;
  '>1': string;
  [key: string]: string;
};

export interface Persona {
  role: string;
  tone: string[];
  forbidden_tones?: string[];
  audience?: string;
  examples?: {
    input: string;
    output: string;
  }[];
}

export interface TranslationParams {
  // --- CORREÇÃO APLICADA AQUI ---
  // Renomeado para 'sourceText' para clareza e tipo corrigido.
  sourceText: string | PluralizedTranslation;
  sourceLanguage: string;
  targetLanguage: string;
  isPlural: boolean;
  persona?: Persona;
  glossary?: Record<string, string>;
  context?: {
    entity: string;
    key?: string;
  };
  category?: string;
  params?: Record<string, { type: string; description: string; example?: any }>;
  constraints?: {
    maxLength?: number;
  };
}

export interface ReviewParams {
  sourceText: string | PluralizedTranslation;
  translatedText: string | PluralizedTranslation;
  language: string;
  persona?: Persona;
  constraints?: {
    maxLength?: number;
  };
}

export interface ReviewResult {
  isToneConsistent: boolean;
  isGrammaticallyCorrect: boolean;
  obeysLengthConstraint: boolean;
  comment: string;
  schemaSuggestion: string;
}

export interface LLMProvider {
  translate(params: TranslationParams): Promise<string | PluralizedTranslation>;
  review(params: ReviewParams): Promise<ReviewResult>;
}
