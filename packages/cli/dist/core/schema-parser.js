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
exports.SchemaNotFoundError = exports.SchemaValidationError = void 0;
exports.parseSchema = parseSchema;
exports.parseSchemas = parseSchemas;
exports.schemaExists = schemaExists;
exports.getSchemaInfo = getSchemaInfo;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SCHEMA_FILE_ENCODING = 'utf-8';
class SchemaValidationError extends Error {
    constructor(message, schemaPath) {
        super(message);
        this.schemaPath = schemaPath;
        this.name = 'SchemaValidationError';
    }
}
exports.SchemaValidationError = SchemaValidationError;
class SchemaNotFoundError extends Error {
    constructor(schemaPath) {
        super(`Schema file not found: ${schemaPath}`);
        this.schemaPath = schemaPath;
        this.name = 'SchemaNotFoundError';
    }
}
exports.SchemaNotFoundError = SchemaNotFoundError;
function validateSchemaStructure(data, schemaPath) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new SchemaValidationError('Schema must be a valid JSON object', schemaPath);
    }
    const schema = data;
    if (!schema.sourceLanguage || typeof schema.sourceLanguage !== 'string') {
        throw new SchemaValidationError('Schema must have "sourceLanguage" as a string', schemaPath);
    }
    if (!schema.targetLanguages || !Array.isArray(schema.targetLanguages)) {
        throw new SchemaValidationError('Schema must have "targetLanguages" as an array', schemaPath);
    }
    if (schema.targetLanguages.length === 0) {
        throw new SchemaValidationError('Schema must have at least one target language', schemaPath);
    }
    if (!schema.targetLanguages.every((lang) => typeof lang === 'string')) {
        throw new SchemaValidationError('All target languages must be strings', schemaPath);
    }
    if (!schema.entities || typeof schema.entities !== 'object' || Array.isArray(schema.entities)) {
        throw new SchemaValidationError('Schema must have "entities" as an object', schemaPath);
    }
    if (Object.keys(schema.entities).length === 0) {
        throw new SchemaValidationError('Schema must have at least one entity', schemaPath);
    }
    if (schema.persona !== undefined && (typeof schema.persona !== 'object' || Array.isArray(schema.persona))) {
        throw new SchemaValidationError('Schema "persona" must be an object if provided', schemaPath);
    }
    if (schema.glossary !== undefined && (typeof schema.glossary !== 'object' || Array.isArray(schema.glossary))) {
        throw new SchemaValidationError('Schema "glossary" must be an object if provided', schemaPath);
    }
    return true;
}
function parseSchemaFile(filePath) {
    const content = fs.readFileSync(filePath, SCHEMA_FILE_ENCODING);
    return JSON.parse(content);
}
/**
 * Parses and validates an i18n schema file.
 *
 * @param schemaPath - Path to the schema file (relative or absolute)
 * @returns The parsed and validated schema
 * @throws {SchemaNotFoundError} If the schema file doesn't exist
 * @throws {SchemaValidationError} If the schema structure is invalid
 * @throws {SyntaxError} If the JSON is malformed
 *
 * @example
 * ```typescript
 * try {
 *   const schema = parseSchema('./i18n.schema.json');
 *   console.log(`Source: ${schema.sourceLanguage}`);
 *   console.log(`Targets: ${schema.targetLanguages.join(', ')}`);
 * } catch (error) {
 *   if (error instanceof SchemaNotFoundError) {
 *     console.error('Schema file not found');
 *   } else if (error instanceof SchemaValidationError) {
 *     console.error('Invalid schema:', error.message);
 *   }
 * }
 * ```
 */
function parseSchema(schemaPath) {
    const resolvedPath = path.resolve(process.cwd(), schemaPath);
    try {
        const parsed = parseSchemaFile(resolvedPath);
        validateSchemaStructure(parsed, schemaPath);
        return parsed;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new SchemaNotFoundError(resolvedPath);
        }
        if (error instanceof SchemaValidationError) {
            throw error;
        }
        if (error instanceof SyntaxError) {
            throw new SchemaValidationError(`Invalid JSON in schema file: ${error.message}`, schemaPath);
        }
        throw new SchemaValidationError(`Failed to parse schema: ${error instanceof Error ? error.message : String(error)}`, schemaPath);
    }
}
/**
 * Parses multiple schema files.
 *
 * @param schemaPaths - Array of paths to schema files
 * @returns Array of parsed schemas
 * @throws {SchemaNotFoundError} If any schema file doesn't exist
 * @throws {SchemaValidationError} If any schema structure is invalid
 *
 * @example
 * ```typescript
 * const schemas = parseSchemas([
 *   './i18n.schema.json',
 *   './marketing.schema.json'
 * ]);
 *
 * schemas.forEach(schema => {
 *   console.log(`Loaded schema with ${Object.keys(schema.entities).length} entities`);
 * });
 * ```
 */
function parseSchemas(schemaPaths) {
    return schemaPaths.map((schemaPath) => parseSchema(schemaPath));
}
/**
 * Validates if a schema file exists without parsing it.
 *
 * @param schemaPath - Path to the schema file (relative or absolute)
 * @returns true if the file exists, false otherwise
 *
 * @example
 * ```typescript
 * if (schemaExists('./i18n.schema.json')) {
 *   const schema = parseSchema('./i18n.schema.json');
 * } else {
 *   console.error('Schema file not found');
 * }
 * ```
 */
function schemaExists(schemaPath) {
    const resolvedPath = path.resolve(process.cwd(), schemaPath);
    return fs.existsSync(resolvedPath);
}
/**
 * Gets basic information about a schema without full validation.
 * Useful for quick checks or listing schemas.
 *
 * @param schemaPath - Path to the schema file
 * @returns Basic schema information
 * @throws {SchemaNotFoundError} If the schema file doesn't exist
 *
 * @example
 * ```typescript
 * const info = getSchemaInfo('./i18n.schema.json');
 * console.log(`${info.entityCount} entities, ${info.targetLanguages.length} languages`);
 * ```
 */
function getSchemaInfo(schemaPath) {
    const schema = parseSchema(schemaPath);
    return {
        sourceLanguage: schema.sourceLanguage,
        targetLanguages: schema.targetLanguages,
        entityCount: Object.keys(schema.entities).length,
        hasPersona: schema.persona !== undefined,
        hasGlossary: schema.glossary !== undefined,
    };
}
