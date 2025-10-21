import { Command } from 'commander';
import { loadConfig, I18nLLMConfig } from '../core/config-loader.js';
import { parseSchema, I18nSchema, Entity, KeySchema } from '../core/schema-parser.js';
import { loadState, saveState, TranslationState } from '../core/state-manager.js';
import { LLMProvider, PluralizedTranslation, TranslationParams, TokenUsage, BatchTranslationResult } from '../core/llm/llm-provider.js';
import { BatchTranslationItem, BatchMetadata } from '../core/llm/llm-provider.js';
import { createProviderFromConfig } from '../core/llm/provider-factory.js';
import { calculateCost } from '../core/pricing.js';
import { addGenerationRecord, GenerationRecord } from '../core/history-tracker.js';
import { calculateTextHash, calculateStringHash } from '../core/hash-utils.js';
// Import providers to trigger auto-registration
import '../core/llm/providers/openai.js';
import '../core/llm/providers/gemini.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function setNestedValue(obj: any, path: string[], value: any) {
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

function getNestedValue(obj: any, path: string[]): any {
  let current = obj;
  for (const part of path) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function getGroupKey(context: any, schemaIndex: number, language: string): string {
  const entityContext = context?.entity || 'no-context';
  return `${language}::${schemaIndex}::${entityContext}`;
}

function extractPrefixFromSchemaPath(schemaPath: string): string {
  const basename = path.basename(schemaPath);
  const match = basename.match(/^(.+)\.schema\.json$/);
  return match ? match[1] : 'translations';
}

function makeStateKey(prefix: string, entityName: string, keyName: string): string {
  return `${prefix}::${entityName}.${keyName}`;
}

function parseStateKey(stateKey: string): { prefix: string; entityName: string; keyName: string } | null {
  const match = stateKey.match(/^(.+?)::(.+?)\.(.+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    entityName: match[2],
    keyName: match[3],
  };
}

export const generateCommand = new Command('generate')
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

      const config: I18nLLMConfig = loadConfig();
      console.log('✔️ Config loaded and validated.');

      const state: TranslationState = loadState(config.statePath);
      
      // Create provider using Factory Pattern
      // Automatically detects provider type from config and uses appropriate API key from environment
      const provider: LLMProvider = createProviderFromConfig(config.providerConfig);
      console.log(`✔️ Using ${config.providerConfig.provider || 'openai'} provider with model ${config.providerConfig.model}`);

      const allSchemaData: { 
        schema: I18nSchema; 
        resolvedPath: string;
        prefix: string;
      }[] = [];
      
      for (const schemaPath of config.schemaFiles) {
        const resolvedPath = path.resolve(process.cwd(), schemaPath);
        const schema = parseSchema(resolvedPath);
        const prefix = extractPrefixFromSchemaPath(resolvedPath);
        allSchemaData.push({ schema, resolvedPath, prefix });
      }

      // ========================================
      // STEP 1: Clean up deleted keys from state
      // ========================================
      console.log('\n--- Step 1: State Cleanup ---');
      const allValidKeys = new Set<string>();
      for (const { schema, prefix } of allSchemaData) {
        for (const entityName in schema.entities) {
          const entity = schema.entities[entityName];
          for (const keyName in entity) {
            if (keyName === '_context' || keyName === 'context') continue;
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
        saveState(state, config.statePath);
      } else {
        console.log('  - ✅ No deleted keys found in state');
      }

      // ========================================
      // STEP 2: Detect missing keys in output files
      // ========================================
      console.log('\n--- Step 2: Detecting Missing Translations ---');
      const missingKeys = new Set<string>();
      fs.mkdirSync(config.outputDir, { recursive: true });
      
      for (const { schema, prefix } of allSchemaData) {
        const allTargetLangs = new Set([...schema.targetLanguages, config.sourceLanguage]);
        
        for (const lang of allTargetLangs) {
          const langFilePath = path.join(config.outputDir, `${prefix}.${lang}.json`);
          
          if (!fs.existsSync(langFilePath)) {
            if (debugMode) {
              console.log(`  - 📄 Missing output file detected: ${path.basename(langFilePath)}`);
            }
            // Mark all keys for this language as missing
            for (const entityName in schema.entities) {
              const entity = schema.entities[entityName];
              for (const keyName in entity) {
                if (keyName === '_context' || keyName === 'context') continue;
                const stateKey = makeStateKey(prefix, entityName, keyName);
                missingKeys.add(`${stateKey}::${lang}`);
              }
            }
          } else {
            // File exists - check for missing keys within it
            try {
              const existingContent = JSON.parse(fs.readFileSync(langFilePath, 'utf-8'));
              
              for (const entityName in schema.entities) {
                const entity = schema.entities[entityName];
                for (const keyName in entity) {
                  if (keyName === '_context' || keyName === 'context') continue;
                  
                  const fullPath = `${entityName}.${keyName}`.split('.');
                  const value = getNestedValue(existingContent, fullPath);
                  
                  if (value === undefined) {
                    const stateKey = makeStateKey(prefix, entityName, keyName);
                    missingKeys.add(`${stateKey}::${lang}`);
                    if (debugMode) {
                      console.log(`  - 🔍 Missing key in ${path.basename(langFilePath)}: ${entityName}.${keyName}`);
                    }
                  }
                }
              }
            } catch (error) {
              console.log(`  - ⚠️  Error reading ${path.basename(langFilePath)}, will regenerate all keys`);
              for (const entityName in schema.entities) {
                const entity = schema.entities[entityName];
                for (const keyName in entity) {
                  if (keyName === '_context' || keyName === 'context') continue;
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
      } else {
        console.log('  - ✅ All translations present in output files');
      }

      // ========================================
      // STEP 3: Generate texts directly in each language
      // ========================================
      console.log('\n--- Step 3: Generating Texts in All Languages ---');
      
      // Temporary cache for generated texts (not saved to state)
      const textCache: Record<string, Record<string, string | PluralizedTranslation>> = {};
      
      // Track tokens and costs per language
      type LanguageStatsType = {
        keysGenerated: number;
        keysUpdated: number;
        inputTokens: number;
        outputTokens: number;
      };
      const languageStats: { [key: string]: LanguageStatsType } = {};
      
      // Build generation queue grouped by language
      const generationQueue: Array<{
        stateKey: string;
        entityName: string;
        keyName: string;
        description: string;
        targetLanguage: string;
        context: any;
        category?: string;
        isPlural: boolean;
        params?: any;
        constraints?: any;
        schemaIndex: number;
        prefix: string;
      }> = [];

      for (let schemaIndex = 0; schemaIndex < allSchemaData.length; schemaIndex++) {
        const { schema, prefix } = allSchemaData[schemaIndex];
        const allLanguages = new Set([...schema.targetLanguages, config.sourceLanguage]);
        
        for (const entityName in schema.entities) {
          const entity = schema.entities[entityName];
          const entityContext = (entity as any).context || (entity as any)._context;

          for (const keyName in entity) {
            if (keyName === '_context' || keyName === 'context') continue;

            const keyData = entity[keyName] as KeySchema;
            const stateKey = makeStateKey(prefix, entityName, keyName);
            const descHash = crypto.createHash('md5').update(keyData.description).digest('hex');

            const existingState = state[stateKey];
            
            // Initialize state if needed
            if (!existingState) {
              state[stateKey] = {
                hash: descHash,
                textHashes: {},
              };
            } else if (existingState.hash !== descHash) {
              // Hash changed - update and clear old text hashes
              existingState.hash = descHash;
              existingState.textHashes = {};
            }

            // Check each language
            for (const targetLang of allLanguages) {
              const keyIsMissing = missingKeys.has(`${stateKey}::${targetLang}`);
              const textHashExists = state[stateKey].textHashes && state[stateKey].textHashes[targetLang];
              const hashChanged = existingState && existingState.hash !== descHash;
              const needsGeneration = forceRegenerate || !textHashExists || hashChanged || keyIsMissing;

              if (needsGeneration) {
                if (debugMode) {
                  const reason = forceRegenerate ? 'force' : !textHashExists ? 'new' : hashChanged ? 'changed' : 'missing';
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
      } else {
        console.log(`  - 🔄 Found ${generationQueue.length} texts to generate...`);

        // Group items by language + schema + context for batch processing
        const groupedItems = new Map<string, typeof generationQueue>();
        for (const item of generationQueue) {
          const groupKey = getGroupKey(item.context, item.schemaIndex, item.targetLanguage);
          if (!groupedItems.has(groupKey)) {
            groupedItems.set(groupKey, []);
          }
          groupedItems.get(groupKey)!.push(item);
        }

        console.log(`  - 📦 Grouped into ${groupedItems.size} batches by language + schema + context\n`);

        let batchNum = 0;
        let successCount = 0;

        for (const [groupKey, items] of groupedItems) {
          batchNum++;
          const [lang, schemaIdx, ...contextParts] = groupKey.split('::');
          const contextLabel = contextParts.join('::') === 'no-context' ? 'no-context' : `"${contextParts.join('::').substring(0, 50)}..."`;
          console.log(`  - 🔄 Batch ${batchNum}/${groupedItems.size} (${items.length} items, lang: ${lang}, context: ${contextLabel})...`);

          // Initialize language stats if needed
          if (!languageStats[lang]) {
            languageStats[lang] = {
              keysGenerated: 0,
              keysUpdated: 0,
              inputTokens: 0,
              outputTokens: 0,
            };
          }

          try {
            const batchItems: BatchTranslationItem[] = items.map(item => ({
              key: item.stateKey,
              sourceText: item.description,
              isPlural: item.isPlural,
              maxLength: item.constraints?.maxLength,
            }));

            const metadata: BatchMetadata = {
              context: items[0].context?.entity,
              category: items[0].category,
            };

            const schemaData = allSchemaData[items[0].schemaIndex];
            const persona = schemaData.schema.persona || config.persona;
            const glossary = schemaData.schema.glossary || config.glossary;

            // Generate directly in target language (not translation)
            const batchResult = await provider.translateBatch(
              batchItems,
              items[0].targetLanguage,
              items[0].targetLanguage,  // Same language = generation mode
              persona,
              glossary,
              metadata
            );

            // Track tokens from batch
            if (batchResult.usage && languageStats[lang]) {
              const usage: TokenUsage = batchResult.usage;
              languageStats[lang]!.inputTokens += usage.inputTokens;
              languageStats[lang]!.outputTokens += usage.outputTokens;
            }

            for (const item of items) {
              const generated: string | PluralizedTranslation | undefined = batchResult.translations[item.stateKey];
              if (generated) {
                const stateEntry = state[item.stateKey]!;
                const isNewKey = !stateEntry.textHashes || !stateEntry.textHashes[item.targetLanguage];
                
                if (!stateEntry.textHashes) {
                  stateEntry.textHashes = {};
                }
                const textHash = calculateTextHash(generated);
                stateEntry.textHashes[item.targetLanguage] = textHash;
                
                // Save to temporary cache for writing output files
                if (!textCache[item.stateKey]) {
                  textCache[item.stateKey] = {};
                }
                textCache[item.stateKey][item.targetLanguage] = generated;
                
                successCount++;
                
                // Track key stats
                if (languageStats[lang]) {
                  if (isNewKey) {
                    languageStats[lang]!.keysGenerated++;
                  } else {
                    languageStats[lang]!.keysUpdated++;
                  }
                }
                if (debugMode) {
                  console.log(`     - ✅ Generated '${item.entityName}.${item.keyName}' in ${item.targetLanguage}`);
                }
              } else {
                console.warn(`     - ⚠️  No result for '${item.entityName}.${item.keyName}' (${item.targetLanguage})`);
              }
            }

            saveState(state, config.statePath);

          } catch (error: any) {
            console.error(`     - ❌ Batch failed: ${error.message}`);
            console.log(`     - 🔄 Falling back to individual processing...`);

            // Fallback to individual processing
            for (const item of items) {
              try {
                const schemaData = allSchemaData[item.schemaIndex];
                const persona = schemaData.schema.persona || config.persona;
                const glossary = schemaData.schema.glossary || config.glossary;

                const result: { text: string | PluralizedTranslation; usage?: TokenUsage } = await provider.translate({
                  sourceText: item.description,
                  targetLanguage: item.targetLanguage,
                  sourceLanguage: item.targetLanguage,  // Same = generation mode
                  persona: persona,
                  glossary: glossary,
                  context: item.context,
                  category: item.category,
                  isPlural: item.isPlural,
                  params: item.params,
                  constraints: item.constraints,
                });

                // Track tokens from individual call
                if (result.usage && languageStats[lang]) {
                  const usage: TokenUsage = result.usage;
                  languageStats[lang]!.inputTokens += usage.inputTokens;
                  languageStats[lang]!.outputTokens += usage.outputTokens;
                }

                const stateEntry = state[item.stateKey]!;
                const isNewKey = !stateEntry.textHashes || !stateEntry.textHashes[item.targetLanguage];
                
                if (!stateEntry.textHashes) {
                  stateEntry.textHashes = {};
                }
                const textHash = calculateTextHash(result.text);
                stateEntry.textHashes[item.targetLanguage] = textHash;
                
                // Save to temporary cache for writing output files
                if (!textCache[item.stateKey]) {
                  textCache[item.stateKey] = {};
                }
                textCache[item.stateKey][item.targetLanguage] = result.text;
                
                successCount++;
                
                // Track key stats
                if (languageStats[lang]) {
                  if (isNewKey) {
                    languageStats[lang]!.keysGenerated++;
                  } else {
                    languageStats[lang]!.keysUpdated++;
                  }
                }
                
                console.log(`     - ✅ Generated '${item.entityName}.${item.keyName}' in ${item.targetLanguage}`);
              } catch (indivError: any) {
                console.error(`     - ❌ Failed to generate '${item.entityName}.${item.keyName}' in ${item.targetLanguage}: ${indivError.message}`);
              }
            }

            saveState(state, config.statePath);
          }
        }

        console.log(`\n  - ✅ Step 3 complete: ${successCount}/${generationQueue.length} texts generated`);
        
        // Save generation history with cost tracking
        console.log('\n  - 💾 Saving generation history...');
        const providerName = config.providerConfig.provider || 'openai';
        const modelName = config.providerConfig.model || 'gpt-4.1-mini';
        
        for (const [language, stats] of Object.entries(languageStats)) {
          if (stats.keysGenerated === 0 && stats.keysUpdated === 0) {
            continue; // Skip languages with no changes
          }
          
          const totalTokens = stats.inputTokens + stats.outputTokens;
          const costCalc = calculateCost(providerName, modelName, stats.inputTokens, stats.outputTokens);
          
          if (costCalc) {
            const record: GenerationRecord = {
              timestamp: new Date().toISOString(),
              provider: providerName,
              model: modelName,
              keysGenerated: stats.keysGenerated,
              keysUpdated: stats.keysUpdated,
              tokens: {
                input: stats.inputTokens,
                output: stats.outputTokens,
                total: totalTokens,
              },
              cost: {
                input: costCalc.inputCost,
                output: costCalc.outputCost,
                total: costCalc.totalCost,
                currency: 'USD',
              },
            };
            
            addGenerationRecord(language, record, config.historyPath);
            console.log(`     - 📊 ${language}: ${stats.keysGenerated} new, ${stats.keysUpdated} updated, ${totalTokens.toLocaleString()} tokens, $${costCalc.totalCost.toFixed(6)}`);
          } else {
            console.warn(`     - ⚠️  Could not calculate cost for ${providerName}/${modelName}`);
          }
        }
      }

      // ========================================
      // STEP 4: Write output files
      // ========================================
      console.log('\n--- Step 4: Writing Output Files ---');
      fs.mkdirSync(config.outputDir, { recursive: true });

      for (const { schema, prefix } of allSchemaData) {
        const allTargetLangs = new Set([...schema.targetLanguages, config.sourceLanguage]);

        for (const lang of allTargetLangs) {
          const langFilePath = path.join(config.outputDir, `${prefix}.${lang}.json`);
          
          // Load existing file to preserve translations that weren't regenerated
          let langFileContent: any = {};
          if (fs.existsSync(langFilePath)) {
            try {
              const existingContent = fs.readFileSync(langFilePath, 'utf-8');
              langFileContent = JSON.parse(existingContent);
            } catch (error) {
              console.warn(`  - ⚠️  Failed to load existing file ${langFilePath}, starting fresh`);
            }
          }

          for (const entityName in schema.entities) {
            const entity = schema.entities[entityName];

            for (const keyName in entity) {
              if (keyName === '_context' || keyName === 'context') continue;

              const stateKey = makeStateKey(prefix, entityName, keyName);
              const stateEntry = state[stateKey];

              if (!stateEntry || !stateEntry.textHashes) continue;
              if (!stateEntry.textHashes[lang]) continue;

              // Get text from cache or read from existing output file
              let textToSet: string | PluralizedTranslation | undefined;
              if (textCache[stateKey] && textCache[stateKey][lang]) {
                textToSet = textCache[stateKey][lang];
              } else {
                // Text wasn't regenerated, read from existing output file
                textToSet = getNestedValue(langFileContent, `${entityName}.${keyName}`.split('.'));
              }

              if (textToSet) {
                setNestedValue(langFileContent, `${entityName}.${keyName}`.split('.'), textToSet);
              }
            }
          }

          try {
            fs.writeFileSync(langFilePath, JSON.stringify(langFileContent, null, 2));
            console.log(`  - 💾 Wrote file: ${langFilePath}`);
          } catch (error) {
            console.error(`  - ❌ Failed to write file: ${langFilePath}`, error);
          }
        }
      }

      saveState(state, config.statePath);
      console.log('\n✔️ State file updated.');
      console.log('🎉 Translation generation complete!');
      console.log('\n💡 Note: Each language is now generated directly from the schema description,');
      console.log('   allowing for more culturally appropriate and natural translations.');

    } catch (error) {
      console.error('\n❌ An unexpected error occurred:', error);
      process.exit(1);
    }
  });

