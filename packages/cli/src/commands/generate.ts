import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { OpenAIProvider } from '../core/llm/providers/openai';

// Função para gerar hash MD5
function generateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Função para gerar hash do schema de uma chave
function generateSchemaHash(schemaValue: any, persona: any, glossary: any): string {
  const content = JSON.stringify({
    description: schemaValue.description,
    constraints: schemaValue.constraints,
    context: schemaValue.context,
    category: schemaValue.category,
    pluralization: schemaValue.pluralization,
    params: schemaValue.params,
    persona,
    glossary
  });
  return generateHash(content);
}

interface StateEntry {
  hash: string;
  schemaHash: string;
}

interface State {
  version: string;
  lastGenerated: string;
  translations: {
    [key: string]: StateEntry;
  };
}

export const generateCommand = new Command('generate')
  .description('Generate translations based on the schema')
  .option('-f, --force', 'Force regeneration of all translations, ignoring cache')
  .action(async (options) => {
    try {
      console.log('🚀 Starting translation generation...\n');

      const configPath = path.resolve(process.cwd(), 'i18n-llm.config.js');
      if (!fs.existsSync(configPath)) {
        console.error('❌ Config file not found: i18n-llm.config.js');
        process.exit(1);
      }

      const config = require(configPath);

      const apiKey = process.env.OPENAI_API_KEY || config.llm?.apiKey;
      if (!apiKey) {
        console.error('❌ OpenAI API key not found. Set OPENAI_API_KEY environment variable or add it to config.');
        process.exit(1);
      }

      const provider = new OpenAIProvider(apiKey, config.llm?.model);

      const schemaPath = path.resolve(process.cwd(), config.schemaPath || 'i18n.schema.json');
      if (!fs.existsSync(schemaPath)) {
        console.error(`❌ Schema file not found: ${schemaPath}`);
        process.exit(1);
      }

      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

      const outputDir = path.resolve(process.cwd(), config.outputDir || 'locales');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Carregar state existente
      const statePath = path.resolve(process.cwd(), '.i18n-llm-state.json');
      let state: State = {
        version: schema.version || '1.0',
        lastGenerated: new Date().toISOString(),
        translations: {}
      };

      if (fs.existsSync(statePath) && !options.force) {
        try {
          state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
          console.log('📦 Loaded existing state (incremental mode)\n');
        } catch (error) {
          console.warn('⚠️  Could not load state file, starting fresh\n');
        }
      } else if (options.force) {
        console.log('🔄 Force mode: regenerating all translations\n');
      }

      const newState: State = {
        version: schema.version || '1.0',
        lastGenerated: new Date().toISOString(),
        translations: {}
      };

      for (const targetLanguage of schema.targetLanguages || config.languages) {
        console.log(`\n🌍 Generating translations for: ${targetLanguage}`);

        const outputPath = path.resolve(outputDir, `${targetLanguage}.json`);
        
        // Carregar traduções existentes se houver
        let existingTranslations: any = {};
        if (fs.existsSync(outputPath)) {
          existingTranslations = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        }

        const translations: any = {};

        await processEntity(
          schema.entities,
          translations,
          '',
          targetLanguage,
          schema.sourceLanguage || 'en-US',
          schema.persona,
          schema.glossary,
          provider,
          state,
          newState,
          existingTranslations
        );

        fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2), 'utf-8');
        console.log(`  ✅ Saved: ${outputPath}`);
      }

      // Salvar novo state
      fs.writeFileSync(statePath, JSON.stringify(newState, null, 2), 'utf-8');
      console.log(`\n💾 State saved: ${statePath}`);
      console.log('\n✨ Translation generation complete!');

    } catch (error) {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    }
  });

async function processEntity(
  entity: any,
  output: any,
  path: string,
  targetLanguage: string,
  sourceLanguage: string,
  persona: any,
  glossary: any,
  provider: OpenAIProvider,
  oldState: State,
  newState: State,
  existingTranslations: any
): Promise<void> {
  for (const key in entity) {
    if (key.startsWith('_')) {
      continue;
    }

    const value = entity[key];
    const currentPath = path ? `${path}.${key}` : key;

    if (value.description) {
      const schemaHash = generateSchemaHash(value, persona, glossary);
      
      if (value.pluralization) {
        const existingPlural = existingTranslations[key];
        const firstPluralPath = `${currentPath}.=0`;
        const oldStateEntry = oldState.translations[firstPluralPath];
        
        // Verificar se precisa re-traduzir (verifica apenas uma vez)
        const needsTranslation = !existingPlural || 
                                 !existingPlural['=0'] ||
                                 !oldStateEntry || 
                                 oldStateEntry.schemaHash !== schemaHash;

        if (needsTranslation) {
          console.log(`  🔄 Translating: ${currentPath} (plural)`);
          
          const result = await provider.translate({
            sourceText: value.description,
            sourceLanguage,
            targetLanguage,
            persona,
            glossary,
            context: value.context,
            category: value.category,
            isPlural: true,
            params: value.params,
            constraints: value.constraints,
          });

          // Cast seguro para objeto de pluralização
          const pluralResult = result as { [key: string]: string };
          output[key] = pluralResult;
          
          // Salvar hash de cada forma plural
          for (const pk of ['=0', '=1', '>1']) {
            if (pluralResult[pk]) {
              newState.translations[`${currentPath}.${pk}`] = {
                hash: generateHash(pluralResult[pk]),
                schemaHash
              };
            }
          }
        } else {
          console.log(`  ✓ Cached: ${currentPath} (plural)`);
          output[key] = existingPlural;
          
          // Manter hash existente para todas as formas plurais
          for (const pk of ['=0', '=1', '>1']) {
            if (existingPlural[pk]) {
              newState.translations[`${currentPath}.${pk}`] = {
                hash: generateHash(existingPlural[pk]),
                schemaHash
              };
            }
          }
        }
      } else {
        const existingTranslation = existingTranslations[key];
        const oldStateEntry = oldState.translations[currentPath];
        
        const needsTranslation = !existingTranslation || 
                                 !oldStateEntry || 
                                 oldStateEntry.schemaHash !== schemaHash;

        if (needsTranslation) {
          console.log(`  🔄 Translating: ${currentPath}`);
          
          const result = await provider.translate({
            sourceText: value.description,
            sourceLanguage,
            targetLanguage,
            persona,
            glossary,
            context: value.context,
            category: value.category,
            isPlural: false,
            params: value.params,
            constraints: value.constraints,
          });

          output[key] = result;
          
          newState.translations[currentPath] = {
            hash: generateHash(result as string),
            schemaHash
          };
        } else {
          console.log(`  ✓ Cached: ${currentPath}`);
          output[key] = existingTranslation;
          
          newState.translations[currentPath] = {
            hash: generateHash(existingTranslation),
            schemaHash
          };
        }
      }
    } else {
      output[key] = {};
      await processEntity(
        value,
        output[key],
        currentPath,
        targetLanguage,
        sourceLanguage,
        persona,
        glossary,
        provider,
        oldState,
        newState,
        existingTranslations[key] || {}
      );
    }
  }
}
