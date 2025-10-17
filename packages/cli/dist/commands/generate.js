"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommand = void 0;
const commander_1 = require("commander");
const config_loader_1 = require("../core/config-loader");
const schema_parser_1 = require("../core/schema-parser");
const state_manager_1 = require("../core/state-manager");
const openai_1 = require("../core/llm/providers/openai");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
function setNestedValue(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    current[path[path.length - 1]] = value;
}
function getNestedValue(obj, path) {
    let current = obj;
    for (const part of path) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        }
        else {
            return undefined;
        }
    }
    return current;
}
function getGroupKey(context, schemaIndex, language) {
    const entityContext = context?.entity || 'no-context';
    return `${language}::${schemaIndex}::${entityContext}`;
}
function extractPrefixFromSchemaPath(schemaPath) {
    const basename = path_1.default.basename(schemaPath);
    const match = basename.match(/^(.+)\.schema\.json$/);
    return match ? match[1] : 'translations';
}
function makeStateKey(prefix, entityName, keyName) {
    return `${prefix}::${entityName}.${keyName}`;
}
function parseStateKey(stateKey) {
    const match = stateKey.match(/^(.+?)::(.+?)\.(.+)$/);
    if (!match)
        return null;
    return {
        prefix: match[1],
        entityName: match[2],
        keyName: match[3],
    };
}
exports.generateCommand = new commander_1.Command('generate')
    .description('Generates translation files based on the schema.')
    .option('--force', 'Force regeneration of all keys, ignoring cache')
    .option('--debug', 'Enable debug logging for troubleshooting')
    .action(async (options) => {
    try {
        console.log('🚀 Starting translation generation process...');
        const forceRegenerate = options.force || false;
        const debugMode = options.debug || false;
        if (forceRegenerate) {
            console.log('⚠️  Force mode enabled - ignoring cache and regenerating all keys');
        }
        if (debugMode) {
            console.log('🐛 Debug mode enabled');
        }
        const config = (0, config_loader_1.loadConfig)();
        console.log('✔️ Config loaded and validated.');
        const state = (0, state_manager_1.loadState)(config.statePath);
        const provider = new openai_1.OpenAIProvider(process.env.OPENAI_API_KEY, config.providerConfig.model);
        const allSchemaData = [];
        for (const schemaPath of config.schemaFiles) {
            const resolvedPath = path_1.default.resolve(process.cwd(), schemaPath);
            const schema = (0, schema_parser_1.parseSchema)(resolvedPath);
            const prefix = extractPrefixFromSchemaPath(resolvedPath);
            allSchemaData.push({ schema, resolvedPath, prefix });
        }
        // ========================================
        // STEP 1: Clean up deleted keys from state
        // ========================================
        console.log('\n--- Step 1: State Cleanup ---');
        const allValidKeys = new Set();
        for (const { schema, prefix } of allSchemaData) {
            for (const entityName in schema.entities) {
                const entity = schema.entities[entityName];
                for (const keyName in entity) {
                    if (keyName === '_context' || keyName === 'context')
                        continue;
                    const stateKey = makeStateKey(prefix, entityName, keyName);
                    allValidKeys.add(stateKey);
                }
            }
        }
        let deletedCount = 0;
        for (const stateKey in state) {
            if (!allValidKeys.has(stateKey)) {
                if (debugMode) {
                    console.log(`  - 🗑️  Removing deleted key from state: '${stateKey}'`);
                }
                delete state[stateKey];
                deletedCount++;
            }
        }
        if (deletedCount > 0) {
            console.log(`  - 🗑️  Removed ${deletedCount} deleted key(s) from state`);
            (0, state_manager_1.saveState)(state, config.statePath);
        }
        else {
            console.log('  - ✅ No deleted keys found in state');
        }
        // ========================================
        // STEP 2: Detect missing keys in output files
        // ========================================
        console.log('\n--- Step 2: Detecting Missing Translations ---');
        const missingKeys = new Set();
        fs_1.default.mkdirSync(config.outputDir, { recursive: true });
        for (const { schema, prefix } of allSchemaData) {
            const allTargetLangs = new Set([...schema.targetLanguages, config.sourceLanguage]);
            for (const lang of allTargetLangs) {
                const langFilePath = path_1.default.join(config.outputDir, `${prefix}.${lang}.json`);
                if (!fs_1.default.existsSync(langFilePath)) {
                    if (debugMode) {
                        console.log(`  - 📄 Missing output file detected: ${path_1.default.basename(langFilePath)}`);
                    }
                    // Mark all keys for this language as missing
                    for (const entityName in schema.entities) {
                        const entity = schema.entities[entityName];
                        for (const keyName in entity) {
                            if (keyName === '_context' || keyName === 'context')
                                continue;
                            const stateKey = makeStateKey(prefix, entityName, keyName);
                            missingKeys.add(`${stateKey}::${lang}`);
                        }
                    }
                }
                else {
                    // File exists - check for missing keys within it
                    try {
                        const existingContent = JSON.parse(fs_1.default.readFileSync(langFilePath, 'utf-8'));
                        for (const entityName in schema.entities) {
                            const entity = schema.entities[entityName];
                            for (const keyName in entity) {
                                if (keyName === '_context' || keyName === 'context')
                                    continue;
                                const fullPath = `${entityName}.${keyName}`.split('.');
                                const value = getNestedValue(existingContent, fullPath);
                                if (value === undefined) {
                                    const stateKey = makeStateKey(prefix, entityName, keyName);
                                    missingKeys.add(`${stateKey}::${lang}`);
                                    if (debugMode) {
                                        console.log(`  - 🔍 Missing key in ${path_1.default.basename(langFilePath)}: ${entityName}.${keyName}`);
                                    }
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.log(`  - ⚠️  Error reading ${path_1.default.basename(langFilePath)}, will regenerate all keys`);
                        for (const entityName in schema.entities) {
                            const entity = schema.entities[entityName];
                            for (const keyName in entity) {
                                if (keyName === '_context' || keyName === 'context')
                                    continue;
                                const stateKey = makeStateKey(prefix, entityName, keyName);
                                missingKeys.add(`${stateKey}::${lang}`);
                            }
                        }
                    }
                }
            }
        }
        if (missingKeys.size > 0) {
            console.log(`  - 🔍 Found ${missingKeys.size} missing translation(s) in output files`);
        }
        else {
            console.log('  - ✅ All translations present in output files');
        }
        // ========================================
        // STEP 3: Generate texts directly in each language
        // ========================================
        console.log('\n--- Step 3: Generating Texts in All Languages ---');
        // Build generation queue grouped by language
        const generationQueue = [];
        for (let schemaIndex = 0; schemaIndex < allSchemaData.length; schemaIndex++) {
            const { schema, prefix } = allSchemaData[schemaIndex];
            const allLanguages = new Set([...schema.targetLanguages, config.sourceLanguage]);
            for (const entityName in schema.entities) {
                const entity = schema.entities[entityName];
                const entityContext = entity.context || entity._context;
                for (const keyName in entity) {
                    if (keyName === '_context' || keyName === 'context')
                        continue;
                    const keyData = entity[keyName];
                    const stateKey = makeStateKey(prefix, entityName, keyName);
                    const descHash = crypto_1.default.createHash('md5').update(keyData.description).digest('hex');
                    const existingState = state[stateKey];
                    // Initialize state if needed
                    if (!existingState) {
                        state[stateKey] = {
                            hash: descHash,
                            texts: {},
                        };
                    }
                    else if (existingState.hash !== descHash) {
                        // Hash changed - update and clear old texts
                        existingState.hash = descHash;
                        existingState.texts = {};
                    }
                    // Check each language
                    for (const targetLang of allLanguages) {
                        const keyIsMissing = missingKeys.has(`${stateKey}::${targetLang}`);
                        const textExists = state[stateKey].texts && state[stateKey].texts[targetLang];
                        const hashChanged = existingState && existingState.hash !== descHash;
                        const needsGeneration = forceRegenerate || !textExists || hashChanged || keyIsMissing;
                        if (needsGeneration) {
                            if (debugMode) {
                                const reason = forceRegenerate ? 'force' : !textExists ? 'new' : hashChanged ? 'changed' : 'missing';
                                console.log(`  - 🔄 Queuing '${entityName}.${keyName}' for ${targetLang} (reason: ${reason})`);
                            }
                            generationQueue.push({
                                stateKey,
                                entityName,
                                keyName,
                                description: keyData.description,
                                targetLanguage: targetLang,
                                context: { entity: entityContext, key: keyData.context },
                                category: keyData.category,
                                isPlural: keyData.pluralization || false,
                                params: keyData.params,
                                constraints: keyData.constraints,
                                schemaIndex,
                                prefix,
                            });
                        }
                    }
                }
            }
        }
        if (generationQueue.length === 0) {
            console.log('  - ✅ All texts are up to date.');
        }
        else {
            console.log(`  - 🔄 Found ${generationQueue.length} texts to generate...`);
            // Group items by language + schema + context for batch processing
            const groupedItems = new Map();
            for (const item of generationQueue) {
                const groupKey = getGroupKey(item.context, item.schemaIndex, item.targetLanguage);
                if (!groupedItems.has(groupKey)) {
                    groupedItems.set(groupKey, []);
                }
                groupedItems.get(groupKey).push(item);
            }
            console.log(`  - 📦 Grouped into ${groupedItems.size} batches by language + schema + context\n`);
            let batchNum = 0;
            let successCount = 0;
            for (const [groupKey, items] of groupedItems) {
                batchNum++;
                const [lang, schemaIdx, ...contextParts] = groupKey.split('::');
                const contextLabel = contextParts.join('::') === 'no-context' ? 'no-context' : `"${contextParts.join('::').substring(0, 50)}..."`;
                console.log(`  - 🔄 Batch ${batchNum}/${groupedItems.size} (${items.length} items, lang: ${lang}, context: ${contextLabel})...`);
                try {
                    const batchItems = items.map(item => ({
                        key: item.stateKey,
                        sourceText: item.description,
                        isPlural: item.isPlural,
                        maxLength: item.constraints?.maxLength,
                    }));
                    const metadata = {
                        context: items[0].context?.entity,
                        category: items[0].category,
                    };
                    const schemaData = allSchemaData[items[0].schemaIndex];
                    const persona = schemaData.schema.persona || config.persona;
                    const glossary = schemaData.schema.glossary || config.glossary;
                    // Generate directly in target language (not translation)
                    const results = await provider.translateBatch(batchItems, items[0].targetLanguage, items[0].targetLanguage, // Same language = generation mode
                    persona, glossary, metadata);
                    for (const item of items) {
                        const generated = results[item.stateKey];
                        if (generated) {
                            if (!state[item.stateKey].texts) {
                                state[item.stateKey].texts = {};
                            }
                            state[item.stateKey].texts[item.targetLanguage] = generated;
                            successCount++;
                            if (debugMode) {
                                console.log(`     - ✅ Generated '${item.entityName}.${item.keyName}' in ${item.targetLanguage}`);
                            }
                        }
                        else {
                            console.warn(`     - ⚠️  No result for '${item.entityName}.${item.keyName}' (${item.targetLanguage})`);
                        }
                    }
                    (0, state_manager_1.saveState)(state, config.statePath);
                }
                catch (error) {
                    console.error(`     - ❌ Batch failed: ${error.message}`);
                    console.log(`     - 🔄 Falling back to individual processing...`);
                    // Fallback to individual processing
                    for (const item of items) {
                        try {
                            const schemaData = allSchemaData[item.schemaIndex];
                            const persona = schemaData.schema.persona || config.persona;
                            const glossary = schemaData.schema.glossary || config.glossary;
                            const generated = await provider.translate({
                                sourceText: item.description,
                                targetLanguage: item.targetLanguage,
                                sourceLanguage: item.targetLanguage, // Same = generation mode
                                persona: persona,
                                glossary: glossary,
                                context: item.context,
                                category: item.category,
                                isPlural: item.isPlural,
                                params: item.params,
                                constraints: item.constraints,
                            });
                            if (!state[item.stateKey].texts) {
                                state[item.stateKey].texts = {};
                            }
                            state[item.stateKey].texts[item.targetLanguage] = generated;
                            successCount++;
                            console.log(`     - ✅ Generated '${item.entityName}.${item.keyName}' in ${item.targetLanguage}`);
                        }
                        catch (indivError) {
                            console.error(`     - ❌ Failed to generate '${item.entityName}.${item.keyName}' in ${item.targetLanguage}: ${indivError.message}`);
                        }
                    }
                    (0, state_manager_1.saveState)(state, config.statePath);
                }
            }
            console.log(`\n  - ✅ Step 3 complete: ${successCount}/${generationQueue.length} texts generated`);
        }
        // ========================================
        // STEP 4: Write output files
        // ========================================
        console.log('\n--- Step 4: Writing Output Files ---');
        fs_1.default.mkdirSync(config.outputDir, { recursive: true });
        for (const { schema, prefix } of allSchemaData) {
            const allTargetLangs = new Set([...schema.targetLanguages, config.sourceLanguage]);
            for (const lang of allTargetLangs) {
                const langFilePath = path_1.default.join(config.outputDir, `${prefix}.${lang}.json`);
                const langFileContent = {};
                for (const entityName in schema.entities) {
                    const entity = schema.entities[entityName];
                    for (const keyName in entity) {
                        if (keyName === '_context' || keyName === 'context')
                            continue;
                        const stateKey = makeStateKey(prefix, entityName, keyName);
                        const stateEntry = state[stateKey];
                        if (!stateEntry || !stateEntry.texts)
                            continue;
                        const textToSet = stateEntry.texts[lang];
                        if (textToSet) {
                            setNestedValue(langFileContent, `${entityName}.${keyName}`.split('.'), textToSet);
                        }
                    }
                }
                try {
                    fs_1.default.writeFileSync(langFilePath, JSON.stringify(langFileContent, null, 2));
                    console.log(`  - 💾 Wrote file: ${langFilePath}`);
                }
                catch (error) {
                    console.error(`  - ❌ Failed to write file: ${langFilePath}`, error);
                }
            }
        }
        (0, state_manager_1.saveState)(state, config.statePath);
        console.log('\n✔️ State file updated.');
        console.log('🎉 Translation generation complete!');
        console.log('\n💡 Note: Each language is now generated directly from the schema description,');
        console.log('   allowing for more culturally appropriate and natural translations.');
    }
    catch (error) {
        console.error('\n❌ An unexpected error occurred:', error);
        process.exit(1);
    }
});
