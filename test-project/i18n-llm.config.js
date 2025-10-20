module.exports = {
  sourceLanguage: 'en-US',
  schemaPaths: ['./i18n.schema.json','./vegeta.schema.json'],
  outputDir: './locales',
  providerConfig: {
    //model: 'gpt-4.1-mini',
      provider: 'gemini',  // ← Mude aqui
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY
  },
};
