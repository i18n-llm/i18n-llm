"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schema_parser_1 = require("./schema-parser");
const TEST_SCHEMA_PATH = '.test-schema.json';
const TEST_SCHEMA_RESOLVED = path.resolve(process.cwd(), TEST_SCHEMA_PATH);
const TEST_SCHEMA_PATH_2 = '.test-schema-2.json';
const TEST_SCHEMA_RESOLVED_2 = path.resolve(process.cwd(), TEST_SCHEMA_PATH_2);
(0, vitest_1.describe)('schema-parser', () => {
    (0, vitest_1.beforeEach)(() => {
        [TEST_SCHEMA_RESOLVED, TEST_SCHEMA_RESOLVED_2].forEach((file) => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    });
    (0, vitest_1.afterEach)(() => {
        [TEST_SCHEMA_RESOLVED, TEST_SCHEMA_RESOLVED_2].forEach((file) => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    });
    (0, vitest_1.describe)('parseSchema', () => {
        (0, vitest_1.it)('should parse valid schema file', () => {
            const mockSchema = {
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
            const schema = (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH);
            (0, vitest_1.expect)(schema).toEqual(mockSchema);
        });
        (0, vitest_1.it)('should throw SchemaNotFoundError when file does not exist', () => {
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaNotFoundError);
        });
        (0, vitest_1.it)('should throw SchemaValidationError for invalid JSON', () => {
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, 'invalid json {');
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/Invalid JSON/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when sourceLanguage is missing', () => {
            const invalidSchema = {
                targetLanguages: ['pt-BR'],
                entities: { user: {} },
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/sourceLanguage/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when targetLanguages is missing', () => {
            const invalidSchema = {
                sourceLanguage: 'en-US',
                entities: { user: {} },
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/targetLanguages/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when targetLanguages is not an array', () => {
            const invalidSchema = {
                sourceLanguage: 'en-US',
                targetLanguages: 'pt-BR',
                entities: { user: {} },
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/array/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when targetLanguages is empty', () => {
            const invalidSchema = {
                sourceLanguage: 'en-US',
                targetLanguages: [],
                entities: { user: {} },
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/at least one target language/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when entities is missing', () => {
            const invalidSchema = {
                sourceLanguage: 'en-US',
                targetLanguages: ['pt-BR'],
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/entities/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when entities is empty', () => {
            const invalidSchema = {
                sourceLanguage: 'en-US',
                targetLanguages: ['pt-BR'],
                entities: {},
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/at least one entity/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when schema is an array', () => {
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify([]));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/JSON object/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when persona is an array', () => {
            const invalidSchema = {
                sourceLanguage: 'en-US',
                targetLanguages: ['pt-BR'],
                entities: { user: {} },
                persona: [],
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/persona.*object/);
        });
        (0, vitest_1.it)('should throw SchemaValidationError when glossary is an array', () => {
            const invalidSchema = {
                sourceLanguage: 'en-US',
                targetLanguages: ['pt-BR'],
                entities: { user: {} },
                glossary: [],
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaValidationError);
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH)).toThrow(/glossary.*object/);
        });
        (0, vitest_1.it)('should accept schema with optional persona', () => {
            const mockSchema = {
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
            const schema = (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH);
            (0, vitest_1.expect)(schema.persona).toEqual(mockSchema.persona);
        });
        (0, vitest_1.it)('should accept schema with optional glossary', () => {
            const mockSchema = {
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
            const schema = (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH);
            (0, vitest_1.expect)(schema.glossary).toEqual(mockSchema.glossary);
        });
    });
    (0, vitest_1.describe)('parseSchemas', () => {
        (0, vitest_1.it)('should parse multiple schema files', () => {
            const schema1 = {
                sourceLanguage: 'en-US',
                targetLanguages: ['pt-BR'],
                entities: {
                    user: {
                        name: { description: 'Name' },
                    },
                },
            };
            const schema2 = {
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
            const schemas = (0, schema_parser_1.parseSchemas)([TEST_SCHEMA_PATH, TEST_SCHEMA_PATH_2]);
            (0, vitest_1.expect)(schemas).toHaveLength(2);
            (0, vitest_1.expect)(schemas[0]).toEqual(schema1);
            (0, vitest_1.expect)(schemas[1]).toEqual(schema2);
        });
        (0, vitest_1.it)('should throw error if any schema is invalid', () => {
            const validSchema = {
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
            (0, vitest_1.expect)(() => (0, schema_parser_1.parseSchemas)([TEST_SCHEMA_PATH, TEST_SCHEMA_PATH_2])).toThrow(schema_parser_1.SchemaValidationError);
        });
        (0, vitest_1.it)('should return empty array for empty input', () => {
            const schemas = (0, schema_parser_1.parseSchemas)([]);
            (0, vitest_1.expect)(schemas).toEqual([]);
        });
    });
    (0, vitest_1.describe)('schemaExists', () => {
        (0, vitest_1.it)('should return true when schema file exists', () => {
            const mockSchema = {
                sourceLanguage: 'en-US',
                targetLanguages: ['pt-BR'],
                entities: {
                    user: {
                        name: { description: 'Name' },
                    },
                },
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(mockSchema));
            (0, vitest_1.expect)((0, schema_parser_1.schemaExists)(TEST_SCHEMA_PATH)).toBe(true);
        });
        (0, vitest_1.it)('should return false when schema file does not exist', () => {
            (0, vitest_1.expect)((0, schema_parser_1.schemaExists)(TEST_SCHEMA_PATH)).toBe(false);
        });
    });
    (0, vitest_1.describe)('getSchemaInfo', () => {
        (0, vitest_1.it)('should return schema information', () => {
            const mockSchema = {
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
            const info = (0, schema_parser_1.getSchemaInfo)(TEST_SCHEMA_PATH);
            (0, vitest_1.expect)(info).toEqual({
                sourceLanguage: 'en-US',
                targetLanguages: ['pt-BR', 'es-ES', 'fr-FR'],
                entityCount: 2,
                hasPersona: true,
                hasGlossary: true,
            });
        });
        (0, vitest_1.it)('should indicate when persona and glossary are missing', () => {
            const mockSchema = {
                sourceLanguage: 'en-US',
                targetLanguages: ['pt-BR'],
                entities: {
                    user: {
                        name: { description: 'Name' },
                    },
                },
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(mockSchema));
            const info = (0, schema_parser_1.getSchemaInfo)(TEST_SCHEMA_PATH);
            (0, vitest_1.expect)(info.hasPersona).toBe(false);
            (0, vitest_1.expect)(info.hasGlossary).toBe(false);
        });
        (0, vitest_1.it)('should throw SchemaNotFoundError when file does not exist', () => {
            (0, vitest_1.expect)(() => (0, schema_parser_1.getSchemaInfo)(TEST_SCHEMA_PATH)).toThrow(schema_parser_1.SchemaNotFoundError);
        });
    });
    (0, vitest_1.describe)('error handling', () => {
        (0, vitest_1.it)('should include schema path in SchemaNotFoundError', () => {
            try {
                (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH);
                vitest_1.expect.fail('Should have thrown');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(schema_parser_1.SchemaNotFoundError);
                (0, vitest_1.expect)(error.schemaPath).toContain(TEST_SCHEMA_PATH);
            }
        });
        (0, vitest_1.it)('should include schema path in SchemaValidationError', () => {
            const invalidSchema = {
                sourceLanguage: 'en-US',
                // Missing required fields
            };
            fs.writeFileSync(TEST_SCHEMA_RESOLVED, JSON.stringify(invalidSchema));
            try {
                (0, schema_parser_1.parseSchema)(TEST_SCHEMA_PATH);
                vitest_1.expect.fail('Should have thrown');
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeInstanceOf(schema_parser_1.SchemaValidationError);
                (0, vitest_1.expect)(error.schemaPath).toBe(TEST_SCHEMA_PATH);
            }
        });
    });
});
