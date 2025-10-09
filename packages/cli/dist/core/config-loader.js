"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const cosmiconfig_1 = require("cosmiconfig");
const zod_1 = require("zod");
const glob_1 = require("glob");
const configSchema = zod_1.z.object({
    // --- CORREÇÃO APLICADA AQUI ---
    sourceLanguage: zod_1.z.string(),
    schemaPaths: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]),
    outputDir: zod_1.z.string(),
    statePath: zod_1.z.string().optional().default('.i18n-llm-state.json'),
    provider: zod_1.z.string().optional().default('openai'),
    providerConfig: zod_1.z.object({
        model: zod_1.z.string(),
    }),
});
function loadConfig() {
    const explorer = (0, cosmiconfig_1.cosmiconfigSync)('i18n-llm');
    const result = explorer.search();
    if (!result) {
        throw new Error('Configuration file not found.');
    }
    try {
        const validatedConfig = configSchema.parse(result.config);
        const schemaPatterns = Array.isArray(validatedConfig.schemaPaths)
            ? validatedConfig.schemaPaths
            : [validatedConfig.schemaPaths];
        const resolvedSchemaPaths = schemaPatterns.flatMap(pattern => glob_1.glob.sync(pattern, { absolute: true }));
        if (resolvedSchemaPaths.length === 0) {
            throw new Error(`No schema files found for pattern(s): ${validatedConfig.schemaPaths}`);
        }
        return {
            ...validatedConfig,
            resolvedSchemaPaths,
        };
    }
    catch (error) {
        throw new Error(`Error loading or validating "i18n-llm.config.js": ${error}`);
    }
}
