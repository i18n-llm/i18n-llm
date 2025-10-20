/**
 * Example configuration for i18n-llm using Google Gemini
 * 
 * To use this configuration:
 * 1. Copy this file to your project root as `i18n-llm.config.js`
 * 2. Set your GEMINI_API_KEY environment variable
 *    Get your API key at: https://makersuite.google.com/app/apikey
 * 3. Adjust the paths and settings to match your project
 */

/** @type {import('i18n-llm').I18nLLMConfig} */
module.exports = {
  // Schema files define your translation structure
  schemaFiles: [
    "./src/i18n/en.schema.json",
  ],

  // Output directory for generated translation files
  outputDir: "./src/i18n/locales",

  // Source language (the language your schema is written in)
  sourceLanguage: "en",

  // Path to the state file (tracks translation status)
  statePath: ".i18n-llm-state.json",

  // Provider configuration
  providerConfig: {
    provider: "gemini",
    
    // Available models:
    // - gemini-2.5-flash: Fast and cost-effective (recommended)
    // - gemini-1.5-pro: More capable, higher cost
    model: "gemini-2.5-flash",
    
    // API key (recommended: use environment variable)
    apiKey: process.env.GEMINI_API_KEY,
  },

  // Optional: Define a persona to guide translation style
  persona: {
    name: "Professional Translator",
    description: "A professional translator with expertise in software localization",
    tone: "professional and clear",
    examples: [
      {
        input: "Click here to continue",
        output: "Clique aqui para continuar",
        language: "pt-BR",
      },
    ],
  },

  // Optional: Glossary for consistent terminology
  glossary: {
    "Sign in": "Entrar",
    "Sign out": "Sair",
    "Dashboard": "Painel",
    "Settings": "Configurações",
  },
};

