/**
 * Example configuration for i18n-llm using OpenAI
 * 
 * To use this configuration:
 * 1. Copy this file to your project root as `i18n-llm.config.js`
 * 2. Set your OPENAI_API_KEY environment variable
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
    provider: "openai",
    
    // Recommended models:
    // - gpt-4.1-mini: Fast and cost-effective (recommended)
    // - gpt-4o: Most capable, higher cost
    // - gpt-4-turbo: Good balance of speed and quality
    // - gpt-3.5-turbo: Fastest, lowest cost
    model: "gpt-4.1-mini",
    
    // API key (recommended: use environment variable)
    apiKey: process.env.OPENAI_API_KEY,
    
    // Optional: Custom base URL (for Azure OpenAI or proxies)
    // baseURL: "https://your-custom-endpoint.com/v1",
    
    // Optional: Organization ID
    // organization: "org-xxxxxxxxxxxxx",
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

