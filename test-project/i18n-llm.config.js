module.exports = {
  sourceLanguage: 'en-US',
  schemaPaths: ['./pirate.schema.json', './vegeta.schema.json'],
  outputDir: './locales',
  providerConfig: {
    //model: 'gpt-4.1-mini',
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY
  },
};
