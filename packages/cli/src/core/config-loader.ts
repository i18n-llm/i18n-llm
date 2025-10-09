import { cosmiconfigSync } from 'cosmiconfig';
import { z } from 'zod';
import path from 'path';
import { glob } from 'glob';

const configSchema = z.object({
  // --- CORREÇÃO APLICADA AQUI ---
  sourceLanguage: z.string(),
  schemaPaths: z.union([z.string(), z.array(z.string())]),
  outputDir: z.string(),
  statePath: z.string().optional().default('.i18n-llm-state.json'),
  provider: z.string().optional().default('openai'),
  providerConfig: z.object({
    model: z.string(),
  }),
});

export type I18nLLMConfig = z.infer<typeof configSchema> & {
  resolvedSchemaPaths: string[];
};

export function loadConfig(): I18nLLMConfig {
  const explorer = cosmiconfigSync('i18n-llm');
  const result = explorer.search();

  if (!result) {
    throw new Error('Configuration file not found.');
  }

  try {
    const validatedConfig = configSchema.parse(result.config);
    
    const schemaPatterns = Array.isArray(validatedConfig.schemaPaths)
      ? validatedConfig.schemaPaths
      : [validatedConfig.schemaPaths];

    const resolvedSchemaPaths = schemaPatterns.flatMap(pattern => glob.sync(pattern, { absolute: true }));

    if (resolvedSchemaPaths.length === 0) {
      throw new Error(`No schema files found for pattern(s): ${validatedConfig.schemaPaths}`);
    }

    return {
      ...validatedConfig,
      resolvedSchemaPaths,
    };
  } catch (error) {
    throw new Error(`Error loading or validating "i18n-llm.config.js": ${error}`);
  }
}
