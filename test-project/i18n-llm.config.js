module.exports = {
  sourceLanguage: 'en-US',
  //schemaPaths: ['./i18n.schema.json','./vegeta.schema.json'],
  schemaPaths: ['./vegeta.schema.json'],
  outputDir: './locales',
  providerConfig: {
    model: 'gpt-4.1-mini',
  },
};
