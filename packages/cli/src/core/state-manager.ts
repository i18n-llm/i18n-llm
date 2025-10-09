import fs from 'fs';
import path from 'path';
import { PluralizedTranslation } from './llm/llm-provider';

export interface TranslationState {
  [key: string]: {
    hash: string;
    sourceText: string | PluralizedTranslation;
    translations: {
      [lang: string]: {
        hash: string;
        text: string | PluralizedTranslation;
      };
    };
  };
}

export function loadState(statePath: string): TranslationState {
  if (fs.existsSync(statePath)) {
    try {
      const fileContent = fs.readFileSync(statePath, 'utf-8');
      return JSON.parse(fileContent) as TranslationState;
    } catch (error) {
      console.warn('⚠️ Could not parse state file. Starting with a fresh state.');
      return {};
    }
  }
  return {};
}

export function saveState(state: TranslationState, statePath: string): void {
  try {
    const dir = path.dirname(statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('❌ Failed to save state file:', error);
  }
}
