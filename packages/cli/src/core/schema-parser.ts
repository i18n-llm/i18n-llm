import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// --- TIPOS EXPORTADOS PARA USO EXTERNO ---
export const keySchema = z.object({
  description: z.string(),
  context: z.string().optional(),
  pluralization: z.boolean().optional(),
  params: z.record(z.object({
    type: z.string(),
    description: z.string(),
    example: z.any().optional(),
  })).optional(),
  constraints: z.object({
    maxLength: z.number().optional(),
  }).optional(),
  category: z.string().optional(),
});
export type KeySchema = z.infer<typeof keySchema>;

export const entitySchema = z.record(keySchema).and(z.object({
  _context: z.string(),
}));
export type Entity = z.infer<typeof entitySchema>;

// --- NOVA ESTRUTURA DA PERSONA ---
const personaSchema = z.object({
  role: z.string(),
  tone: z.array(z.string()),
  forbidden_tones: z.array(z.string()).optional(),
  audience: z.string().optional(),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).optional(),
});

const i18nSchema = z.object({
  $schema: z.string().optional(),
  version: z.literal('2.1'),
  sourceLanguage: z.string(),
  targetLanguages: z.array(z.string()),
  persona: personaSchema.optional(),
  glossary: z.record(z.string()).optional(),
  entities: z.record(z.any()), // Validação manual abaixo
});
export type I18nSchema = z.infer<typeof i18nSchema>;

export function parseSchema(filePath: string): I18nSchema {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(fileContent);

  // Validação manual da entidade para permitir a estrutura flexível
  if (jsonData.entities) {
    for (const entityName in jsonData.entities) {
      const entity = jsonData.entities[entityName];
      if (typeof entity !== 'object' || entity === null) {
        throw new Error(`Validation failed: Entity '${entityName}' is not an object.`);
      }
      if (typeof entity._context !== 'string') {
        throw new Error(`Validation failed: Entity '${entityName}' is missing a string '_context'.`);
      }
      for (const key in entity) {
        if (key === '_context') continue;
        const keyValidation = keySchema.safeParse(entity[key]);
        if (!keyValidation.success) {
          throw new Error(`Validation failed for key '${key}' in entity '${entityName}'.`);
        }
      }
    }
  }

  return i18nSchema.parse(jsonData);
}
