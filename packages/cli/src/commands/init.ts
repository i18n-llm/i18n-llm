import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

const configTemplate = `
module.exports = {
  provider: 'openai',
  providerConfig: {
    model: 'gpt-4o-mini',
  },
  schemaPath: './i18n.schema.json',
  outputPath: './src/locales',
};
`;

const schemaTemplate = `
{
  "sourceLanguage": "en-US",
  "targetLanguages": ["es-ES", "fr-FR"],
  "entities": {
    "common": {
      "_context": "Common texts used throughout the application.",
      "submitButton": {
        "sourceText": "Submit"
      }
    }
  }
}
`;

export const initCommand = new Command('init')
  .description('Creates initial configuration files (i18n-llm.config.js and i18n.schema.json).')
  .action(() => {
    const configPath = path.resolve(process.cwd(), 'i18n-llm.config.js');
    const schemaPath = path.resolve(process.cwd(), 'i18n.schema.json');

    if (fs.existsSync(configPath) || fs.existsSync(schemaPath)) {
      console.warn('⚠️ Configuration files already exist. No action taken.');
      return;
    }

    fs.writeFileSync(configPath, configTemplate.trim());
    console.log(`✅ Config file created at: ${configPath}`);

    fs.writeFileSync(schemaPath, schemaTemplate.trim());
    console.log(`✅ Schema file created at: ${schemaPath}`);
  });
