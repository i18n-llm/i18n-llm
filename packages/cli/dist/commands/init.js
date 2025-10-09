"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
exports.initCommand = new commander_1.Command('init')
    .description('Creates initial configuration files (i18n-llm.config.js and i18n.schema.json).')
    .action(() => {
    const configPath = path_1.default.resolve(process.cwd(), 'i18n-llm.config.js');
    const schemaPath = path_1.default.resolve(process.cwd(), 'i18n.schema.json');
    if (fs_1.default.existsSync(configPath) || fs_1.default.existsSync(schemaPath)) {
        console.warn('⚠️ Configuration files already exist. No action taken.');
        return;
    }
    fs_1.default.writeFileSync(configPath, configTemplate.trim());
    console.log(`✅ Config file created at: ${configPath}`);
    fs_1.default.writeFileSync(schemaPath, schemaTemplate.trim());
    console.log(`✅ Schema file created at: ${schemaPath}`);
});
