<div align="center">
  <a href="README.md">English</a> • 
  <a href="docs/pt-BR/README.md">Português (Brasil)</a>
</div>
<hr>

# i18n-llm

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg )](https://opensource.org/licenses/MIT )
[![npm version](https://badge.fury.io/js/i18n-llm.svg )](https://badge.fury.io/js/i18n-llm )

`i18n-llm` is an open-source ecosystem that automates internationalization (i18n) in your projects, leveraging the power of LLMs to generate high-quality, context-aware translations directly within your CI/CD pipeline.

Our mission is to help developers **bring the native language experience to users worldwide**, effortlessly. Say goodbye to manual translation file management and hello to a smarter, faster i18n workflow.

## ✨ Overview

The core of `i18n-llm` is a **CLI** that:
1.  Reads a **schema file (`i18n.schema.json`)** where you define your application's texts in a source language, complete with context and constraints.
2.  Automatically detects new or modified texts.
3.  Calls an LLM provider (like OpenAI) to translate these texts into your target languages.
4.  Generates the translation files (`.json`) ready to be used in your application.

This entire process can be automated with our **GitHub Action**, running on every Pull Request.

## 🚀 Getting Started

> For a fully detailed guide, check out our documentation:
> - [**Getting Started (English)**](./docs/01-getting-started.md)
> - [**Guia de Início (Português)**](./docs/pt-BR/01-getting-started.md)

### 1. Installation

Install the CLI in your project as a development dependency:

```bash
npm install --save-dev @i18n-llm/cli
```

### 2. Initialization

Run the `init` command to create the initial configuration files:

```bash
npx i18n-llm init
```

### 3. Generate Translations

After defining your texts in `i18n.schema.json`, run the `generate` command:

```bash
npx i18n-llm generate
```

The CLI will create the translation files in the specified output directory.

## 🤝 Contributing

`i18n-llm` is built by the community, for the community. We welcome contributions of all kinds, from code to documentation translations.

If you want to help translate the documentation into a new language, please read our [Translation Guide](./docs/TRANSLATING.md).

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
