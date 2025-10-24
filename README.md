# i18n-llm

**AI-powered internationalization (i18n) tool that generates high-quality, context-aware translations using Large Language Models**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![npm version](https://img.shields.io/npm/v/i18n-llm.svg)](https://www.npmjs.com/package/i18n-llm)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

---

## Why i18n-llm?

Traditional translation tools force you to choose between **quality**, **cost**, and **control**. With i18n-llm, you get all three.

### The Problem with Current Solutions

**Manual Translation**
- ❌ Expensive and slow
- ❌ Requires hiring translators for each language
- ❌ Hard to maintain consistency across updates

**SaaS Translation Platforms**
- ❌ Vendor lock-in and monthly fees
- ❌ Your sensitive data passes through third-party servers
- ❌ Significant markup on LLM costs (often 10-50x)
- ❌ Limited control over translation quality

**Generic LLM APIs**
- ❌ No built-in i18n workflow
- ❌ Manual prompt engineering required
- ❌ No state management or caching
- ❌ Difficult to maintain consistency

### The i18n-llm Solution

i18n-llm is an **open-source CLI tool** that combines the power of modern LLMs with developer-friendly workflows:

✅ **Brand Voice Consistency** - Define a persona (tone, style, character) for culturally-adapted translations
✅ **Privacy First** - Your data goes directly from your machine to your LLM provider (OpenAI, Gemini, etc.)
✅ **Cost Effective** - Pay only LLM API costs, no platform markup (save 80-95% vs SaaS)
✅ **Full Control** - Open source, extensible, works with any LLM provider
✅ **Developer Friendly** - Schema-driven, CI/CD ready, smart caching
✅ **Context Aware** - Provide context, constraints, and pluralization rules
✅ **Cost Transparent** - Built-in usage tracking and cost reporting

---

## Key Features

### 🎭 Brand Voice with Persona (Unique!)

**The killer feature that sets i18n-llm apart:** Define a persona to ensure translations match your brand's voice and personality.

```json
{
  "persona": {
    "role": "A witty and slightly sarcastic Pirate Captain",
    "tone": ["Friendly", "Informal", "Humorous", "Uses pirate slang"],
    "forbidden_tones": ["Corporate", "Formal", "Dry"],
    "audience": "Software developers who enjoy a bit of fun.",
    "examples": [
      { "input": "Submit", "output": "Hoist the sails" },
      { "input": "An unexpected error occurred.", "output": "Shiver me timbers! We've hit a squall." }
    ]
  }
}
```

The LLM doesn't just translate—it **transcreates** your content to match the persona while adapting to each target culture. This means:

- 🎭 **Consistent brand voice** across all languages
- 🌍 **Culturally adapted** (the LLM adjusts the persona for each culture)
- 🎨 **Tone control** (specify what you want and what to avoid)
- 📝 **Example-driven** (provide concrete examples for fine-tuning)

### 🎯 Schema-Driven Translations

Define your translations in JSON schemas (v2 format) with rich context:

```json
{
  "version": "2.1",
  "sourceLanguage": "en-US",
  "targetLanguages": ["es-ES", "fr-FR", "pt-BR"],
  "entities": {
    "user_info": {
      "_context": "A form with user information fields.",
      "name": {
        "description": "The user's full name.",
        "constraints": { "maxLength": 255 },
        "category": "form_label"
      }
    }
  }
}
```

### 🚀 Smart State Management

- **Automatic caching** - Only translates new or changed texts
- **Hash-based tracking** - Detects content changes automatically
- **Minimal storage** - Stores only hashes, not full translations
- **Incremental updates** - Add new languages without retranslating everything

### 💰 Cost Tracking & Reporting

**Before translation** - Estimate costs:
```bash
$ npx i18n-llm i18n.usage
📊 Total Keys: 150
📊 Estimated Tokens: 4,500
```

**After translation** - Track actual usage:
```bash
$ npx i18n-llm i18n.costs
💰 Total Cost: $0.0138 USD
📊 By Language:
  es:     $0.0045
  fr:     $0.0046
  pt-BR:  $0.0047
```

### 🔌 Multi-Provider Support

Works with multiple LLM providers out of the box:

- **OpenAI** (GPT-4, GPT-4 Turbo, GPT-3.5)
- **Google Gemini** (Gemini 1.5 Flash, Gemini 1.5 Pro)
- **Extensible** - Easy to add custom providers

### ⚡ Batch Processing

Efficient batch translation with automatic fallback:

- Translates multiple keys in a single API call
- Automatic retry with individual translation on batch failures
- Configurable batch sizes for optimal performance

### 🎨 Pluralization Support

Handle complex plural forms with ease. Just flag a key as requiring pluralization, and the LLM generates the appropriate forms:

**In your schema:**
```json
{
  "welcomeMessage": {
    "description": "A welcome message with the number of new messages.",
    "pluralization": true,
    "params": {
      "count": { "type": "number", "description": "Number of messages" }
    }
  }
}
```

**Generated output (with Pirate persona):**
```json
{
  "welcomeMessage": {
    "=0": "No new messages in yer inbox, matey!",
    "=1": "Ahoy! Ye have 1 new message, captain!",
    ">1": "Ahoy! Ye have {count} new messages, matey!"
  }
}
```

---

## Installation

```bash
npm install -D i18n-llm
```

---

## Quick Start

### 1. Create Configuration

Create `i18n-llm.config.js` in your project root:

```javascript
export default {
  schemaFiles: ["./i18n/schema.json"],
  outputDir: "./i18n/locales",
  sourceLanguage: "en",
  providerConfig: {
    provider: "openai",
    model: "gpt-4.1-mini",
    // API key from environment variable (recommended)
  },
};
```

### 2. Set API Key

```bash
# For OpenAI
export OPENAI_API_KEY="your-api-key"

# For Gemini
export GEMINI_API_KEY="your-api-key"
```

### 3. Create Schema

Create `i18n/schema.json`:

```json
{
  "targetLanguages": ["es", "fr", "pt-BR"],
  "entities": {
    "common": {
      "hello": {
        "sourceText": "Hello, World!",
        "context": "Standard greeting"
      }
    }
  }
}
```

### 4. Generate Translations

```bash
npx i18n-llm generate
```

Output files will be created in `i18n/locales/`:
- `es.json`
- `fr.json`
- `pt-BR.json`

---

## Commands

### `generate`

Generate translation files from schema:

```bash
npx i18n-llm generate [options]
```

**Options:**
- `--config <path>` - Custom config file (default: `i18n-llm.config.js`)
- `--force` - Regenerate all translations, ignoring cache
- `--debug` - Enable debug logging

### `i18n.usage`

Calculate estimated token usage before translation:

```bash
npx i18n-llm i18n.usage [options]
```

**Options:**
- `--config <path>` - Custom config file
- `--format <format>` - Output format: `text` or `json`

### `i18n.costs`

Analyze historical cost data from past generations:

```bash
npx i18n-llm i18n.costs [options]
```

**Options:**
- `--config <path>` - Custom config file
- `--history <path>` - Custom history file path
- `--format <format>` - Output format: `text` or `json`

---

## Configuration

### Full Configuration Example

```javascript
export default {
  // Required: Schema files to process
  schemaFiles: ["./i18n/schema.json"],

  // Required: Output directory for translations
  outputDir: "./i18n/locales",

  // Required: Source language code
  sourceLanguage: "en",

  // Optional: Custom state file path (default: .i18n-llm-state.json)
  statePath: ".i18n-llm-state.json",

  // Optional: Custom history file path (default: .i18n-history.json)
  historyPath: ".i18n-llm-history.json",

  // Required: LLM provider configuration
  providerConfig: {
    provider: "openai", // or "gemini"
    model: "gpt-4.1-mini",

    // Optional: API key (recommended to use environment variable)
    apiKey: process.env.OPENAI_API_KEY,

    // Optional: Custom base URL (for proxies or custom endpoints)
    baseURL: "https://api.openai.com/v1",

    // Optional: Request timeout in milliseconds
    timeout: 30000,
  },
};
```

### Environment Variables

**OpenAI:**
```bash
export OPENAI_API_KEY="sk-..."
```

**Gemini:**
```bash
export GEMINI_API_KEY="..."
```

---

## Schema Format

### Basic Structure

```json
{
  "targetLanguages": ["es", "fr", "pt-BR"],
  "entities": {
    "category": {
      "key": {
        "sourceText": "Text to translate",
        "context": "Context for translator",
        "maxLength": 50,
        "params": {
          "param1": "Description"
        }
      }
    }
  }
}
```

### Fields

**`targetLanguages`** (required)
Array of language codes to translate to (e.g., `["es", "fr", "pt-BR"]`)

**`entities`** (required)
Nested object structure organizing your translations

**`sourceText`** (required)
The text to translate (string or pluralization object)

**`context`** (optional but recommended)
Description to help LLM understand usage and tone

**`maxLength`** (optional)
Maximum character length for translation (useful for UI constraints)

**`params`** (optional)
Description of placeholder variables (e.g., `{name}`, `{count}`)

**`isPlural`** (optional)
Set to `true` for pluralization support

### Pluralization Example

```json
{
  "items_count": {
    "sourceText": {
      "zero": "No items",
      "one": "One item",
      "other": "{count} items"
    },
    "isPlural": true,
    "context": "Shopping cart item counter",
    "params": {
      "count": "Number of items"
    }
  }
}
```

---

## Comparison with Alternatives

| Feature | i18n-llm | Lingo.dev | Phrase | Crowdin |
|---------|----------|-----------|--------|---------|
| **Cost** | LLM API only (~$0.01/1K words) | $49-299/mo | $25-99/mo | $40-350/mo |
| **Privacy** | ✅ Direct to LLM | ⚠️ Third-party | ⚠️ Third-party | ⚠️ Third-party |
| **Open Source** | ✅ MIT License | ❌ Proprietary | ❌ Proprietary | ❌ Proprietary |
| **Vendor Lock-in** | ✅ None | ❌ Yes | ❌ Yes | ❌ Yes |
| **LLM Choice** | ✅ Any provider | ⚠️ Limited | ❌ No | ❌ No |
| **CI/CD Ready** | ✅ CLI tool | ✅ API | ✅ API | ✅ API |
| **Cost Tracking** | ✅ Built-in | ⚠️ Platform only | ⚠️ Platform only | ⚠️ Platform only |
| **Context Support** | ✅ Rich schemas | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Use Cases

### 🚀 Startups & Indie Developers

**Problem:** Need to support multiple languages but can't afford expensive translation services.

**Solution:** Pay only for LLM API calls (~$0.01 per 1,000 words). A typical small app with 500 strings × 5 languages costs less than $1 to translate.

### 🏢 Enterprise with Privacy Requirements

**Problem:** Cannot send proprietary content to third-party SaaS platforms due to compliance (GDPR, HIPAA, etc.).

**Solution:** Your data goes directly from your infrastructure to your LLM provider. No intermediaries, full audit trail.

### 🔄 Continuous Localization

**Problem:** Frequent updates require constant retranslation, making SaaS platforms expensive.

**Solution:** Smart caching only translates changed content. Add new features without retranslating everything.

### 🌍 Open Source Projects

**Problem:** Need community-friendly localization without vendor lock-in.

**Solution:** MIT licensed, runs in CI/CD, contributors can add languages easily.

---

## Roadmap

### ✅ Completed

- [x] OpenAI and Gemini provider support
- [x] Schema-driven translation workflow
- [x] Smart state management with hashing
- [x] Batch translation with fallback
- [x] Pluralization support
- [x] Cost tracking and reporting
- [x] Usage estimation tools

### 🚧 In Progress

- [ ] Additional LLM providers (Anthropic Claude, Azure OpenAI)
- [ ] Translation memory and glossary support
- [ ] Quality assurance and validation tools
- [ ] Web UI for schema management

### 📋 Planned

- [ ] Multi-file schema support
- [ ] Git integration for change detection
- [ ] Translation review workflow
- [ ] IDE plugins (VS Code, IntelliJ)
- [ ] SDKs for other languages (Java, C#, Python)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/i18n-llm/i18n-llm.git
cd i18n-llm

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run build:watch
```

---

## FAQ

### How much does it cost?

You only pay for LLM API calls. Typical costs:

- **Gemini 2.5 Flash:** ~$0.0001 per 1K words
- **GPT-4.1 Mini:** ~$0.0002 per 1K words
- **GPT-4o:** ~$0.003 per 1K words

Example: 1,000 strings × 10 languages = 10,000 words ≈ **$0.002 with Gemini** or **$0.02 with GPT-4 Mini**

### Is my data secure?

Yes. Your data goes directly from your machine to your chosen LLM provider. i18n-llm doesn't send data to any third-party servers.

### Can I use my own LLM?

Yes! The provider system is extensible. You can add custom providers for self-hosted models or other APIs.

### Does it work offline?

No, it requires internet access to call LLM APIs. However, you can use a local LLM by implementing a custom provider.

### How does caching work?

i18n-llm uses MD5 hashes of source text to detect changes. Only new or modified texts are translated. This saves both time and money.

### Can I review translations before deploying?

Yes. Generated files are standard JSON that you can review, edit, and commit to version control before deployment.

### What about translation quality?

LLM-based translation quality is generally excellent, especially with context. For critical content, we recommend:
1. Provide detailed context in schemas
2. Review generated translations
3. Use higher-quality models (GPT-4o) for important content

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## Documentation

Explore our comprehensive documentation to get the most out of i18n-llm:

- 📚 **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 5 minutes
- 📖 **[Schema Guide](./docs/SCHEMA_GUIDE.md)** - Master the schema format with detailed examples
- 🔧 **[Commands Reference](./docs/COMMANDS.md)** - Complete CLI command documentation
- 🔄 **[CI/CD Integration](./docs/CICD.md)** - Automate translations with GitHub Actions
- 🤖 **[Providers Guide](./docs/PROVIDERS.md)** - Configure OpenAI, Gemini, and custom providers
- 💡 **[Advanced Examples](./docs/EXAMPLES.md)** - Real-world usage patterns and best practices
- ⚙️ **[Configuration Guide](./docs/CONFIGURATION.md)** - Detailed configuration options

---

## Support

- 🐛 **Issues:** [GitHub Issues](https://github.com/i18n-llm/i18n-llm/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/i18n-llm/i18n-llm/discussions)
- 📧 **Email:** i18n-llm@proton.me

---

## Acknowledgments

Built with ❤️ by developers who believe in open source, privacy, and developer freedom.

---

