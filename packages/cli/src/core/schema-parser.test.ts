import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseSchema,
  parseSchemas,
  schemaExists,
  getSchemaInfo,
  SchemaValidationError,
  SchemaNotFoundError,
  I18nSchema,
} from './schema-parser.js';

const TEST_SCHEMA_PATH = '.test-schema.json';
const TEST_SCHEMA_RESOLVED = path.resolve(process.cwd(), TEST_SCHEMA_PATH);
const TEST_SCHEMA_PATH_2 = '.test-schema-2.json';
const TEST_SCHEMA_RESOLVED_2 = path.resolve(process.cwd(), TEST_SCHEMA_PATH_2);

describe('schema-parser', () => {
  beforeEach(() => {
    [TEST_SCHEMA_RESOLVED, TEST_SCHEMA_RESOLVED_2].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  afterEach(() => {
    [TEST_SCHEMA_RESOLVED, TEST_SCHEMA_RESOLVED_2].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  describe('parseSchema', () => {
    it('should parse valid schema file', () => {
      const mockSchema: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR', 'es-ES'],
        entities: {
          user: {
            name: {
              description: 'User name',
            },
          },
        },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(mockSchema, null, 2));

      const schema = parseSchema(TEST_SCHEMA_PATH);

      expect(schema).toEqual(mockSchema);
    });

    it('should throw SchemaNotFoundError when file does not exist', () => {
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaNotFoundError);
    });

    it('should throw SchemaValidationError for invalid JSON', () => {
      fs.writeFileSync(TEST_SCHEMA_RESOLVED, 'invalid json {');

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/Invalid JSON/);
    });

    it('should throw SchemaValidationError when sourceLanguage is missing', () => {
      const invalidSchema = {
        targetLanguages: ['pt-BR'],
        entities: { user: {} },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/sourceLanguage/);
    });

    it('should throw SchemaValidationError when targetLanguages is missing', () => {
      const invalidSchema = {
        sourceLanguage: 'en-US',
        entities: { user: {} },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/targetLanguages/);
    });

    it('should throw SchemaValidationError when targetLanguages is not an array', () => {
      const invalidSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: 'pt-BR',
        entities: { user: {} },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/array/);
    });

    it('should throw SchemaValidationError when targetLanguages is empty', () => {
      const invalidSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: [],
        entities: { user: {} },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/at least one target language/);
    });

    it('should throw SchemaValidationError when entities is missing', () => {
      const invalidSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/entities/);
    });

    it('should throw SchemaValidationError when entities is empty', () => {
      const invalidSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        entities: {},
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/at least one entity/);
    });

    it('should throw SchemaValidationError when schema is an array', () => {
      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify([]));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/JSON object/);
    });

    it('should throw SchemaValidationError when persona is an array', () => {
      const invalidSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        entities: { user: {} },
        persona: [],
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/persona.*object/);
    });

    it('should throw SchemaValidationError when glossary is an array', () => {
      const invalidSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        entities: { user: {} },
        glossary: [],
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(SchemaValidationError);
      expect(() => parseSchema(TEST_SCHEMA_PATH)).toThrow(/glossary.*object/);
    });

    it('should accept schema with optional persona', () => {
      const mockSchema: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        persona: {
          role: 'Pirate Captain',
          tone: ['Friendly'],
        },
        entities: {
          user: {
            name: { description: 'Name' },
          },
        },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(mockSchema));

      const schema = parseSchema(TEST_SCHEMA_PATH);

      expect(schema.persona).toEqual(mockSchema.persona);
    });

    it('should accept schema with optional glossary', () => {
      const mockSchema: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        glossary: {
          API: 'API',
          CLI: 'CLI',
        },
        entities: {
          user: {
            name: { description: 'Name' },
          },
        },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(mockSchema));

      const schema = parseSchema(TEST_SCHEMA_PATH);

      expect(schema.glossary).toEqual(mockSchema.glossary);
    });
  });

  describe('parseSchemas', () => {
    it('should parse multiple schema files', () => {
      const schema1: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        entities: {
          user: {
            name: { description: 'Name' },
          },
        },
      };

      const schema2: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['es-ES'],
        entities: {
          product: {
            title: { description: 'Title' },
          },
        },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(schema1));
      fs.writeFileSync(TEST_SCHEMA_RESOLVED_2, JSON.stringify(schema2));

      const schemas = parseSchemas([TEST_SCHEMA_PATH, TEST_SCHEMA_PATH_2]);

      expect(schemas).toHaveLength(2);
      expect(schemas[0]).toEqual(schema1);
      expect(schemas[1]).toEqual(schema2);
    });

    it('should throw error if any schema is invalid', () => {
      const validSchema: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        entities: {
          user: {
            name: { description: 'Name' },
          },
        },
      };

      const invalidSchema = {
        sourceLanguage: 'en-US',
        // Missing targetLanguages
        entities: { user: {} },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(validSchema));
      fs.writeFileSync(TEST_SCHEMA_RESOLVED_2, JSON.stringify(invalidSchema));

      expect(() => parseSchemas([TEST_SCHEMA_PATH, TEST_SCHEMA_PATH_2])).toThrow(
        SchemaValidationError
      );
    });

    it('should return empty array for empty input', () => {
      const schemas = parseSchemas([]);
      expect(schemas).toEqual([]);
    });
  });

  describe('schemaExists', () => {
    it('should return true when schema file exists', () => {
      const mockSchema: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        entities: {
          user: {
            name: { description: 'Name' },
          },
        },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(mockSchema));

      expect(schemaExists(TEST_SCHEMA_PATH)).toBe(true);
    });

    it('should return false when schema file does not exist', () => {
      expect(schemaExists(TEST_SCHEMA_PATH)).toBe(false);
    });
  });

  describe('getSchemaInfo', () => {
    it('should return schema information', () => {
      const mockSchema: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR', 'es-ES', 'fr-FR'],
        persona: {
          role: 'Pirate',
        },
        glossary: {
          API: 'API',
        },
        entities: {
          user: {
            name: { description: 'Name' },
            email: { description: 'Email' },
          },
          product: {
            title: { description: 'Title' },
          },
        },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(mockSchema));

      const info = getSchemaInfo(TEST_SCHEMA_PATH);

      expect(info).toEqual({
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR', 'es-ES', 'fr-FR'],
        entityCount: 2,
        hasPersona: true,
        hasGlossary: true,
      });
    });

    it('should indicate when persona and glossary are missing', () => {
      const mockSchema: I18nSchema = {
        sourceLanguage: 'en-US',
        targetLanguages: ['pt-BR'],
        entities: {
          user: {
            name: { description: 'Name' },
          },
        },
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(mockSchema));

      const info = getSchemaInfo(TEST_SCHEMA_PATH);

      expect(info.hasPersona).toBe(false);
      expect(info.hasGlossary).toBe(false);
    });

    it('should throw SchemaNotFoundError when file does not exist', () => {
      expect(() => getSchemaInfo(TEST_SCHEMA_PATH)).toThrow(SchemaNotFoundError);
    });
  });

  describe('error handling', () => {
    it('should include schema path in SchemaNotFoundError', () => {
      try {
        parseSchema(TEST_SCHEMA_PATH);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaNotFoundError);
        expect((error as SchemaNotFoundError).schemaPath).toContain(TEST_SCHEMA_PATH);
      }
    });

    it('should include schema path in SchemaValidationError', () => {
      const invalidSchema = {
        sourceLanguage: 'en-US',
        // Missing required fields
      };

      fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));

      try {
        parseSchema(TEST_SCHEMA_PATH);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SchemaValidationError);
        expect((error as SchemaValidationError).schemaPath).toBe(TEST_SCHEMA_PATH);
      }
    });
  });
});

