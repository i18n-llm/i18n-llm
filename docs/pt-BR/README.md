# i18n-llm: AI-Powered Internationalization

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

`i18n-llm` is a powerful open-source tool that leverages Large Language Models (LLMs) to automate the translation of application texts. It integrates seamlessly into your development workflow, providing a CLI and GitHub Action to manage and generate translations based on context, constraints, and your desired structure.

This tool is designed for developers who want to streamline the i18n process, reduce manual translation efforts, and ensure high-quality, context-aware translations.

## Features

- **Multi-Provider Support:** Choose from a variety of LLM providers, including:
  - **OpenAI:** `gpt-4.1-mini`, `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
  - **Gemini:** `gemini-2.5-flash`, `gemini-1.5-pro`
  - (Coming soon: Anthropic, Ollama)
- **CI/CD Integration:** Automate your translation workflow with the included CLI and upcoming GitHub Action.
- **State Management:** `i18n-llm` tracks the state of your translations to avoid redundant API calls, saving you time and money.
- **Context-Aware Translations:** Provide context and constraints in your schema to generate more accurate and relevant translations.
- **Pluralization Support:** Automatically handles pluralization rules for different languages.
- **Flexible Configuration:** Customize the tool to fit your project's needs with a simple and powerful configuration file.
- **Monorepo Support:** Designed to work seamlessly in monorepo environments.

## Getting Started

### Installation

Install `i18n-llm` as a development dependency in your project:

```bash
npm install -D i18n-llm
```

### Configuration

Create an `i18n-llm.config.js` file in the root of your project. This file defines your translation schema, output directory, and provider configuration.

Here is a basic example:

```javascript
// i18n-llm.config.js

/** @type {import('i18n-llm').I18nLLMConfig} */
module.exports = {
  schemaFiles: ["./src/i18n/en.schema.json"],
  outputDir: "./src/i18n/locales",
  sourceLanguage: "en",
  providerConfig: {
    provider: "openai", // or 'gemini'
    model: "gpt-4.1-mini",
  },
};
```

## Usage

To generate your translation files, run the `generate` command:

```bash
npx i18n-llm generate
```

This command will:

1.  Load and validate your configuration.
2.  Parse your i18n schema.
3.  Load the translation state.
4.  Generate translations for all target languages.
5.  Save the generated translations to the output directory.

### Options

- `--force`: Regenerate all translations, ignoring the current state.
- `--debug`: Enable debug logging for troubleshooting.

## Configuration

The `i18n-llm.config.js` file accepts the following options:

| Option           | Type       | Description                                                                                             | Default                |
| ---------------- | ---------- | ------------------------------------------------------------------------------------------------------- | ---------------------- |
| `schemaFiles`    | `string[]` | An array of paths to your i18n schema files.                                                            | `[]`                   |
| `outputDir`      | `string`   | The directory where the generated translation files will be saved.                                      | `"./locales"`          |
| `sourceLanguage` | `string`   | The source language of your application texts.                                                          | `"en"`                 |
| `statePath`      | `string`   | The path to the translation state file.                                                                 | `".i18n-llm-state.json"` |
| `providerConfig` | `object`   | The configuration for your chosen LLM provider. See [Provider Configuration](#provider-configuration). | `{}`                   |
| `persona`        | `object`   | (Optional) A persona to guide the LLM in generating translations with a specific tone or style.       | `undefined`            |
| `glossary`       | `object`   | (Optional) A glossary of terms to ensure consistent translations for specific words or phrases.       | `undefined`            |

## Provider Configuration

`i18n-llm` supports multiple LLM providers. You can configure your provider in the `providerConfig` section of your `i18n-llm.config.js` file.

### OpenAI

To use OpenAI, set the `provider` to `"openai"` and provide your API key and desired model.

```javascript
// i18n-llm.config.js

module.exports = {
  // ...
  providerConfig: {
    provider: "openai",
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY, // Recommended: use environment variables
  },
};
```

### Gemini

To use Gemini, set the `provider` to `"gemini"` and provide your API key and desired model.

```javascript
// i18n-llm.config.js

module.exports = {
  // ...
  providerConfig: {
    provider: "gemini",
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY, // Recommended: use environment variables
  },
};
```

## Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.