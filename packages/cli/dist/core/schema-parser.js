"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entitySchema = exports.keySchema = void 0;
exports.parseSchema = parseSchema;
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
// --- TIPOS EXPORTADOS PARA USO EXTERNO ---
exports.keySchema = zod_1.z.object({
    description: zod_1.z.string(),
    context: zod_1.z.string().optional(),
    pluralization: zod_1.z.boolean().optional(),
    params: zod_1.z.record(zod_1.z.object({
        type: zod_1.z.string(),
        description: zod_1.z.string(),
        example: zod_1.z.any().optional(),
    })).optional(),
    constraints: zod_1.z.object({
        maxLength: zod_1.z.number().optional(),
    }).optional(),
    category: zod_1.z.string().optional(),
});
exports.entitySchema = zod_1.z.record(exports.keySchema).and(zod_1.z.object({
    _context: zod_1.z.string(),
}));
// --- NOVA ESTRUTURA DA PERSONA ---
const personaSchema = zod_1.z.object({
    role: zod_1.z.string(),
    tone: zod_1.z.array(zod_1.z.string()),
    forbidden_tones: zod_1.z.array(zod_1.z.string()).optional(),
    audience: zod_1.z.string().optional(),
    examples: zod_1.z.array(zod_1.z.object({
        input: zod_1.z.string(),
        output: zod_1.z.string(),
    })).optional(),
});
const i18nSchema = zod_1.z.object({
    $schema: zod_1.z.string().optional(),
    version: zod_1.z.literal('2.1'),
    sourceLanguage: zod_1.z.string(),
    targetLanguages: zod_1.z.array(zod_1.z.string()),
    persona: personaSchema.optional(),
    glossary: zod_1.z.record(zod_1.z.string()).optional(),
    entities: zod_1.z.record(zod_1.z.any()), // Validação manual abaixo
});
function parseSchema(filePath) {
    const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
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
                if (key === '_context')
                    continue;
                const keyValidation = exports.keySchema.safeParse(entity[key]);
                if (!keyValidation.success) {
                    throw new Error(`Validation failed for key '${key}' in entity '${entityName}'.`);
                }
            }
        }
    }
    return i18nSchema.parse(jsonData);
}
